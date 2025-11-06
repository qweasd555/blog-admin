import { supabase } from '../lib/supabase.js'

async function diagnoseDatabase() {
  console.log('🔍 开始数据库诊断...\n')
  
  // 1. 测试基本连接
  console.log('1. 测试基本连接...')
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.log('❌ 认证连接失败:', error.message)
    } else {
      console.log('✅ 认证连接成功')
    }
  } catch (err) {
    console.log('❌ 认证连接异常:', err.message)
  }

  // 2. 测试数据库查询权限
  console.log('\n2. 测试数据库查询权限...')
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1)
    if (error) {
      console.log('❌ profiles 表查询失败:', error.message)
    } else {
      console.log('✅ profiles 表查询成功，数据条数:', data?.length || 0)
    }
  } catch (err) {
    console.log('❌ profiles 表查询异常:', err.message)
  }

  // 3. 检查所有可能的表
  console.log('\n3. 检查所有可能的表结构...')
  const tables = ['profiles', 'users', 'user', 'posts', 'articles', 'comments', 'comment']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      if (error) {
        console.log(`❌ ${table} 表: ${error.message}`)
      } else {
        console.log(`✅ ${table} 表: 存在，数据条数: ${data?.length || 0}`)
        if (data && data.length > 0) {
          console.log(`   表结构: ${Object.keys(data[0]).join(', ')}`)
        }
      }
    } catch (err) {
      console.log(`❌ ${table} 表查询异常: ${err.message}`)
    }
  }

  // 4. 检查 RLS 策略
  console.log('\n4. 检查 RLS 策略...')
  try {
    const { data, error } = await supabase.rpc('get_rls_policies')
    if (error) {
      console.log('❌ RLS 策略检查失败:', error.message)
    } else {
      console.log('✅ RLS 策略检查成功')
    }
  } catch (err) {
    console.log('❌ RLS 策略检查异常:', err.message)
  }

  console.log('\n🔧 诊断完成')
}

// 运行诊断
diagnoseDatabase().catch(console.error)