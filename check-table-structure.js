// 检查posts表结构
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qghxnulnxxtvaqupoxeo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHhudWxueHh0dmFxdXBveGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMzcwMzAsImV4cCI6MjA3NjYxMzAzMH0._RahoiQh9FBFhcvirKqvm4SDZ2dlK7rfZSCC02ZbSXM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTableStructure() {
  console.log('🔍 检查posts表结构...')
  
  try {
    // 获取posts表的几条记录
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .limit(3)
    
    if (error) {
      console.error('❌ 查询失败:', error)
      return
    }
    
    if (!data || data.length === 0) {
      console.log('ℹ️ posts表为空')
      return
    }
    
    console.log('📊 表结构示例:')
    data.forEach((post, index) => {
      console.log(`\n--- 记录 ${index + 1} ---`)
      console.log('所有字段:', Object.keys(post))
      console.log('数据示例:', JSON.stringify(post, null, 2))
    })
    
  } catch (error) {
    console.error('❌ 检查失败:', error)
  }
}

checkTableStructure()