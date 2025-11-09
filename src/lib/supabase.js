import { createClient } from '@supabase/supabase-js'

// 从环境变量获取配置 - 使用博客项目的有效配置
const supabaseUrl = 'https://qghxnulnxxtvaqupoxeo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHhudWxueHh0dmFxdXBveGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMzcwMzAsImV4cCI6MjA3NjYxMzAzMH0._RahoiQh9FBFhcvirKqvm4SDZ2dlK7rfZSCC02ZbSXM'

// 验证环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 环境变量未配置，请检查 .env 文件')
  console.log('当前配置:', {
    url: supabaseUrl,
    key: supabaseAnonKey ? '已配置' : '未配置'
  })
}

// 使用单例模式避免重复创建客户端
let supabaseInstance = null
let supabaseAdminInstance = null

// 创建共享的认证配置，避免重复实例
const authOptions = {
  persistSession: true,
  autoRefreshToken: true,
  storageKey: 'supabase.auth.token'
}

// 创建普通权限的 Supabase 客户端（单例模式）
if (!supabaseInstance) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: authOptions,
    global: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })
}

export const supabase = supabaseInstance

// 创建高权限的 Supabase 客户端（单例模式）
// 由于service_role密钥未配置，暂时使用普通权限
if (!supabaseAdminInstance) {
  supabaseAdminInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // 禁用持久化避免冲突
      autoRefreshToken: false,
      storageKey: 'supabase.admin.token'
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })
}

export const supabaseAdmin = supabaseAdminInstance || supabaseInstance

// 详细的连接测试
export const testConnection = async () => {
  console.log('🔍 开始测试Supabase连接...')
  console.log('环境变量检查:')
  console.log('  - URL:', import.meta.env.VITE_SUPABASE_URL ? '已配置' : '未配置')
  console.log('  - Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? `已配置 (${import.meta.env.VITE_SUPABASE_ANON_KEY.length}字符)` : '未配置')
  
  try {
    // 先测试基础连接
    console.log('📡 测试基础连接...')
    const { data, error } = await supabase.from('posts').select('id').limit(1)
    
    if (error) {
      console.error('❌ Supabase 连接错误详情:')
      console.error('  - 错误类型:', error.name)
      console.error('  - 错误消息:', error.message)
      console.error('  - 错误代码:', error.code)
      console.error('  - 错误详情:', error.details)
      console.error('  - 错误提示:', error.hint)
      
      // 根据错误类型提供具体建议
      if (error.message.includes('Invalid API key')) {
        console.error('💡 建议: 请检查Supabase项目设置中的API密钥是否正确，或重新生成密钥')
      } else if (error.message.includes('JWT')) {
        console.error('💡 建议: 密钥可能已过期，请重新生成API密钥')
      } else if (error.message.includes('Failed to fetch')) {
        console.error('💡 建议: 网络连接问题，请检查URL是否正确')
      }
      
      return { success: false, error: error }
    }
    
    console.log('✅ Supabase 连接成功')
    console.log('📊 测试数据:', data)
    return { success: true, data: data }
  } catch (error) {
    console.error('⚠️ Supabase 连接异常:', error)
    return { success: false, error: error }
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