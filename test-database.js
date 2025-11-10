// 数据库连接测试脚本 - 修正版
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// 读取.env文件
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        envVars[key.trim()] = value.trim()
      }
    })
    
    return envVars
  }
  return {}
}

const env = loadEnv()

// 从环境变量获取配置
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://qghxnulnxxtvaqupoxeo.supabase.co'
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHhudWxueHh0dmFxdXBveGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMzcwMzAsImV4cCI6MjA3NjYxMzAzMH0._RahoiQh9FBFhcvirKqvm4SDZ2dlK7rfZSCC02ZbSXM'
const supabaseServiceRoleKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHhudWxueHh0dmFxdXBveGVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTAzNzAzMCwiZXhwIjoyMDc2NjEzMDMwfQ.sPtCIEOcftn-B9Z_vbAHsZ5VfxhD2yXShZzf3uf7toM'

// 创建客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

async function testDatabase() {
  console.log('🚀 开始测试数据库连接和权限...\n')
  console.log('📊 配置信息:')
  console.log('  - URL:', supabaseUrl)
  console.log('  - Anon Key:', supabaseAnonKey ? '已配置' : '未配置')
  console.log('  - Service Role Key:', supabaseServiceRoleKey ? '已配置' : '未配置')
  console.log('')

  // 测试基础连接
  console.log('1️⃣ 测试基础连接...')
  try {
    const { data, error } = await supabase.from('posts').select('id').limit(1)
    
    if (error) {
      console.log('❌ 基础连接测试失败:', error)
      return
    }
    console.log('✅ 基础连接测试成功')
  } catch (err) {
    console.log('❌ 基础连接测试异常:', err)
    return
  }
  console.log('')

  // 测试评论表查询
  console.log('2️⃣ 测试评论表查询...')
  try {
    const { data: comments, error } = await supabase
      .from('post_comments')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log('❌ 评论表查询失败:', error)
    } else {
      console.log(`✅ 评论表查询成功，找到 ${comments?.length || 0} 条评论`)
      if (comments && comments.length > 0) {
        console.log('评论数据样例:', comments[0])
      }
    }
  } catch (err) {
    console.log('❌ 评论表查询异常:', err)
  }
  console.log('')

  // 测试删除权限
  console.log('3️⃣ 测试删除权限...')
  try {
    // 先尝试查询现有评论
    const { data: existingComments } = await supabase
      .from('post_comments')
      .select('id')
      .limit(1)
    
    if (existingComments && existingComments.length > 0) {
      const commentId = existingComments[0].id
      console.log(`🔍 找到评论 ID: ${commentId}`)
      
      // 尝试使用普通权限删除
      const { error: deleteError } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
      
      if (deleteError) {
        console.log('❌ 普通权限删除失败:', deleteError)
        
        // 尝试使用管理员权限
        console.log('🔄 尝试使用管理员权限删除...')
        const { error: adminDeleteError } = await supabaseAdmin
          .from('post_comments')
          .delete()
          .eq('id', commentId)
        
        if (adminDeleteError) {
          console.log('❌ 管理员权限删除也失败:', adminDeleteError)
          console.log('💡 可能是RLS策略问题，需要检查数据库权限设置')
        } else {
          console.log('✅ 管理员权限删除成功，权限正常')
        }
      } else {
        console.log('✅ 普通权限删除成功，权限正常')
      }
    } else {
      console.log('ℹ️ 未找到评论数据，跳过删除测试')
    }
  } catch (err) {
    console.log('❌ 删除权限测试异常:', err)
  }

  console.log('\n🎯 测试完成')
  console.log('💡 如果删除权限测试失败，可能是以下原因：')
  console.log('   - RLS（行级安全）策略阻止了删除操作')
  console.log('   - 数据库用户权限不足')
  console.log('   - 数据库表结构存在问题')
}

testDatabase().catch(console.error)