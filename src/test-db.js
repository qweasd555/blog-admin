// 测试数据库连接和表结构
import { supabase } from '@/lib/supabase'

async function testDatabase() {
  console.log('开始测试数据库连接...')
  
  try {
    // 测试连接
    const { data, error } = await supabase.from('profiles').select('*').limit(1)
    
    if (error) {
      console.error('profiles表查询失败:', error.message)
      
      // 测试其他可能的表名
      const tables = ['users', 'posts', 'comments', 'profiles']
      
      for (const table of tables) {
        const { data: testData, error: testError } = await supabase.from(table).select('*').limit(1)
        if (!testError) {
          console.log(`✅ 找到表: ${table}`)
        } else {
          console.log(`❌ 表不存在: ${table}`)
        }
      }
    } else {
      console.log('✅ profiles表连接成功')
    }
    
  } catch (err) {
    console.error('数据库连接失败:', err)
  }
}

testDatabase()