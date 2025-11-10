/**
 * 智能数据服务 - 提供Supabase失败时的降级处理
 * 当Supabase不可用时，自动使用本地存储和示例数据
 */

import { supabase, supabaseAdmin } from '@/lib/supabase'

// 本地存储的键名
const STORAGE_KEYS = {
  POSTS: 'blog_admin_posts',
  COMMENTS: 'blog_admin_comments', 
  USERS: 'blog_admin_users',
  LAST_SYNC: 'blog_admin_last_sync',
  TABLE_MAP: 'blog_admin_table_map'
}

// 表名映射与候选
const TABLE_ALIASES = {
  posts: ['posts', 'articles', 'post'],
  comments: ['post_comments', 'comments', 'comment'],
  // 强制优先使用 user_profiles，移除 profiles 以避免 404
  users: ['user_profiles', 'users', 'user']
}

// 零探测请求：为特定逻辑表设置“硬映射”，完全跳过别名尝试
const HARD_TABLE_MAP = {
  users: 'user_profiles',
  comments: 'post_comments'
}

// 轻量缓存：首次命中后缓存逻辑表→物理表，后续直接使用
const getCachedTableMap = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TABLE_MAP)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const setCachedTableMap = (map) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TABLE_MAP, JSON.stringify(map))
  } catch {}
}

let tableMapCache = getCachedTableMap()

// 默认示例数据
const DEFAULT_DATA = {
  posts: [
    {
      id: 'demo-1',
      title: '欢迎使用博客管理系统',
      content: '这是一个演示文章，用于展示系统功能',
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'demo-2', 
      title: '如何配置数据库连接',
      content: '本文介绍如何配置Supabase数据库连接',
      status: 'published',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  comments: [
    {
      id: 'comment-1',
      post_id: 'demo-1',
      content: '这个系统很好用！',
      author: '匿名用户',
      created_at: new Date().toISOString()
    },
    {
      id: 'comment-2',
      post_id: 'demo-1', 
      content: '期待更多功能',
      author: '测试用户',
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  users: [
    {
      id: 'user-1',
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      created_at: new Date().toISOString()
    }
  ]
}

// 检查Supabase连接状态
let isSupabaseConnected = false
let connectionTested = false

/**
 * 测试Supabase连接状态
 */
export const testSupabaseConnection = async () => {
  if (connectionTested) return isSupabaseConnected
  
  try {
    console.log('🔍 正在测试Supabase连接...')
    
    // 设置超时控制
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('连接超时')), 5000)
    )
    
    // 使用更稳妥的策略判断“在线”：
    // 1) 优先使用管理客户端，避免 RLS 影响
    // 2) 扩大表名探测范围，覆盖 README 中的所有可能表名
    // 3) 将“网络/鉴权错误”判为离线，其它（如表不存在/权限受限）判为在线（后续用降级数据）
    const tryTables = [
      'posts', 'articles', 'post',
      'comments', 'comment',
      'profiles', 'users', 'user',
      'user_profiles', 'post_comments'
    ]
    let connectionSuccess = false
    
    for (const tableName of tryTables) {
      try {
        console.log(`📡 尝试连接表 ${tableName}...`)
        const connectionPromise = supabaseAdmin.from(tableName).select('id').limit(1)
        const { error } = await Promise.race([connectionPromise, timeoutPromise])
        
        if (!error) {
          connectionSuccess = true
          console.log(`✅ 通过表 ${tableName} 连接成功`)
          break
        }

        // 非空错误时，判断是否为“可视为在线”的错误类型（表不存在/权限受限等）
        const msg = (error?.message || '').toLowerCase()
        const isNetworkOrAuth =
          msg.includes('failed to fetch') ||
          msg.includes('invalid api key') ||
          msg.includes('jwt') ||
          msg.includes('timeout')
        if (!isNetworkOrAuth) {
          // 服务可达但表/权限不匹配，视为在线（后续用降级数据）
          connectionSuccess = true
          console.log(`✅ 服务可达，但表/权限问题：${tableName} -> ${error.message}`)
          break
        }
      } catch (tableError) {
        console.log(`⚠️ 表 ${tableName} 连接失败:`, tableError.message)
      }
    }
    
    if (connectionSuccess) {
      console.log('✅ Supabase连接正常')
      isSupabaseConnected = true
      
      // 更新最后一次同步时间
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString())
    } else {
      console.warn('⚠️ 所有表连接测试失败')
      isSupabaseConnected = false
    }
    
  } catch (error) {
    console.warn('⚠️ Supabase连接异常:', error.message)
    isSupabaseConnected = false
  }
  
  connectionTested = true
  return isSupabaseConnected
}

/**
 * 获取本地存储的数据
 */
const getLocalData = (key) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.warn('读取本地数据失败:', error)
    return null
  }
}

/**
 * 保存数据到本地存储
 */
const saveLocalData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.warn('保存本地数据失败:', error)
  }
}

/**
 * 智能数据获取 - 优先使用Supabase，失败时使用本地数据
 */
export const smartFetch = async (table, options = {}) => {
  const { 
    select = '*', 
    where = {}, 
    order = {}, 
    limit = 100,
    fallbackData = null 
  } = options
  
  // 先测试连接状态
  const isConnected = await testSupabaseConnection()
  
  if (isConnected) {
    try {
      console.log(`📡 从Supabase获取 ${table} 数据...`)
      
      // 解析真实表名（按候选逐个尝试）
      const hardMapped = HARD_TABLE_MAP[table]
      const candidates = hardMapped
        ? [hardMapped] // 硬映射：零探测
        : (tableMapCache[table] ? [tableMapCache[table]] : (TABLE_ALIASES[table] || [table]))
      let lastError = null
      for (const candidate of candidates) {
        try {
          let query = supabaseAdmin.from(candidate).select(select)
          
          // 应用查询条件
          Object.keys(where).forEach(key => {
            query = query.eq(key, where[key])
          })
          
          // 应用排序
          if (order.column && order.direction) {
            query = query.order(order.column, { ascending: order.direction === 'asc' })
          }
          
          // 应用限制
          if (limit) {
            query = query.limit(limit)
          }
          
          const { data, error } = await query
          if (!error && data) {
            // 命中后写入缓存映射
            if (tableMapCache[table] !== candidate) {
              tableMapCache[table] = candidate
              setCachedTableMap(tableMapCache)
            }
            // 保存到本地存储作为缓存（使用逻辑表名的key）
            saveLocalData(`blog_admin_${table}`, data)
            return { data, error: null, source: 'supabase' }
          }
          
          lastError = error || new Error('获取数据失败')
        } catch (innerErr) {
          lastError = innerErr
        }
      }
      
      throw lastError || new Error('获取数据失败')
      
    } catch (error) {
      console.warn(`⚠️ 从Supabase获取 ${table} 失败:`, error.message)
      // 仅在网络/鉴权类错误时标记为离线，表不存在或权限问题不改动在线状态
      const msg = (error?.message || '').toLowerCase()
      const isNetworkOrAuth =
        msg.includes('failed to fetch') ||
        msg.includes('invalid api key') ||
        msg.includes('jwt') ||
        msg.includes('timeout')
      if (isNetworkOrAuth) {
        isSupabaseConnected = false
      }
    }
  }
  
  // 降级处理：使用本地数据
  console.log(`📱 使用本地数据获取 ${table}...`)
  
  // 1. 先尝试从本地存储获取
  const localData = getLocalData(`blog_admin_${table}`)
  if (localData) {
    return { data: localData, error: null, source: 'local_storage' }
  }
  
  // 2. 使用默认示例数据
  const defaultData = DEFAULT_DATA[table] || fallbackData
  if (defaultData) {
    return { data: defaultData, error: null, source: 'default' }
  }
  
  // 3. 返回空数据
  return { data: [], error: new Error('无可用数据'), source: 'none' }
}

/**
 * 智能数据计数
 */
export const smartCount = async (table) => {
  const { data, source } = await smartFetch(table, { 
    select: '*', 
    limit: 1000 
  })
  
  return { 
    count: data ? data.length : 0, 
    source,
    error: null 
  }
}

/**
 * 获取统计数据
 */
export const getStats = async () => {
  const [postsResult, commentsResult, usersResult] = await Promise.all([
    smartCount('posts'),
    smartCount('comments'),
    smartCount('users')
  ])
  
  // 计算今日注册（尽最大努力，失败则为 0）
  let todayUsers = 0
  try {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const usersFetch = await smartFetch('users', { select: 'created_at', limit: 1000 })
    todayUsers = (usersFetch.data || []).filter(u => {
      const created = new Date(u.created_at || 0)
      return created >= startOfToday
    }).length
  } catch {
    todayUsers = 0
  }

  return {
    totalPosts: postsResult.count,
    totalComments: commentsResult.count,
    totalUsers: usersResult.count,
    todayUsers,
    dataSource: {
      posts: postsResult.source,
      comments: commentsResult.source,
      users: usersResult.source
    }
  }
}

/**
 * 获取最近活动
 */
export const getRecentActivities = async () => {
  const postsResult = await smartFetch('posts', {
    order: { column: 'created_at', direction: 'desc' },
    limit: 5
  })
  
  const commentsResult = await smartFetch('comments', {
    order: { column: 'created_at', direction: 'desc' },
    limit: 5
  })
  
  const activities = []
  
  // 处理文章活动
  if (postsResult.data) {
    postsResult.data.forEach(post => {
      activities.push({
        type: '文章',
        description: `文章 "${post.title || '无标题'}" 发布`,
        time: new Date(post.created_at || new Date()).toLocaleString('zh-CN'),
        source: postsResult.source
      })
    })
  }
  
  // 处理评论活动
  if (commentsResult.data) {
    commentsResult.data.forEach(comment => {
      activities.push({
        type: '评论',
        description: `用户发表了新评论`,
        time: new Date(comment.created_at || new Date()).toLocaleString('zh-CN'),
        source: commentsResult.source
      })
    })
  }
  
  // 如果没有数据，添加默认活动
  if (activities.length === 0) {
    activities.push({
      type: '系统',
      description: '系统初始化完成',
      time: new Date().toLocaleString('zh-CN'),
      source: 'default'
    })
  }
  
  // 按时间排序并限制数量
  return activities
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 4)
}

/**
 * 检查系统状态
 */
export const getSystemStatus = () => {
  return {
    supabase: isSupabaseConnected,
    lastSync: localStorage.getItem(STORAGE_KEYS.LAST_SYNC),
    timestamp: new Date().toISOString()
  }
}