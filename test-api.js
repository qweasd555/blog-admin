// 测试Supabase API密钥是否有效
const supabaseUrl = 'https://qghxnulnxxtvaqupoxeo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHhudWxueHh0dmFxdXBveGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMzcwMzAsImV4cCI6MjA3NjYxMzAzMH0.RK8pQz9Qv7wKZ1yC-Qx9G3bS5P--k3-5Y2jZ_4b1_AA'

async function testApiKey() {
  console.log('🔍 测试Supabase API密钥...')
  console.log('URL:', supabaseUrl)
  console.log('Key长度:', supabaseAnonKey.length)
  
  try {
    // 测试简单的REST API调用
    const response = await fetch(`${supabaseUrl}/rest/v1/posts?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('📊 响应状态:', response.status, response.statusText)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API密钥有效，获取到数据:', data)
    } else {
      console.log('❌ API密钥无效，错误详情:')
      const errorText = await response.text()
      console.log('错误信息:', errorText)
    }
    
  } catch (error) {
    console.log('❌ 请求失败:', error.message)
  }
}

testApiKey()