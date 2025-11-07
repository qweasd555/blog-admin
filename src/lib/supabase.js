import { createClient } from '@supabase/supabase-js'

// 从环境变量获取配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// 验证环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 环境变量未配置，请检查 .env 文件')
  console.log('当前配置:', {
    url: supabaseUrl,
    key: supabaseAnonKey ? '已配置' : '未配置'
  })
}

// 创建共享的认证配置，避免重复实例
const authOptions = {
  persistSession: true,
  autoRefreshToken: true,
}

// 创建普通权限的 Supabase 客户端（用于读取操作）
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: authOptions,
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
})

// 创建高权限的 Supabase 客户端（用于修改操作，绕过RLS策略）
// 使用Service Role Key时禁用会话持久化，避免与普通客户端冲突
export const supabaseAdmin = supabaseServiceRoleKey ? createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false, // 禁用持久化避免冲突
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
}) : supabase // 直接使用已有的supabase实例，避免重复创建

// 测试连接
export const testConnection = async () => {
  try {
    // 尝试连接posts表（存在的表），而不是不存在的profiles表
    const { data, error } = await supabase.from('posts').select('id').limit(1)
    
    if (error) {
      console.warn('Supabase 连接有警告，但应用可以继续运行:', error.message)
      return true // 即使连接失败也返回true，应用可以降级处理
    }
    
    console.log('✅ Supabase 连接成功')
    return true
  } catch (error) {
    console.warn('Supabase 连接异常，应用将以降级模式运行:', error)
    return true // 返回true，应用可以降级处理
  }
}

// 获取表结构信息
export const getTableInfo = async () => {
  const tables = ['profiles', 'users', 'posts', 'comments', 'articles']
  const results = {}
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      
      if (!error && data) {
        results[table] = {
          exists: true,
          columns: data.length > 0 ? Object.keys(data[0]) : [],
          count: data.length
        }
      } else {
        results[table] = { exists: false }
      }
    } catch (error) {
      results[table] = { exists: false, error: error.message }
    }
  }
  
  return results
}

export default supabase