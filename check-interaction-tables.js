const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qghxnulnxxtvaqupoxeo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHhudWxueHh0dmFxdXBveGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMzcwMzAsImV4cCI6MjA3NjYxMzAzMH0._RahoiQh9FBFhcvirKqvm4SDZ2dlK7rfZSCC02ZbSXM'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('🔍 检查数据库表结构...\n')
  
  // 检查 posts 表
  console.log('1. 检查 posts 表...')
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .limit(1)
  
  if (postsError) {
    console.log('❌ posts表查询失败:', postsError.message)
  } else if (posts && posts.length > 0) {
    console.log('✅ posts表存在，字段:', Object.keys(posts[0]))
    console.log('   示例数据:', { 
      id: posts[0].id, 
      title: posts[0].title, 
      author: posts[0].author,
      author_name: posts[0].author_name 
    })
  }
  
  // 检查 post_like 表
  console.log('\n2. 检查 post_like 表...')
  const { data: likes, error: likesError } = await supabase
    .from('post_like')
    .select('*')
    .limit(1)
  
  if (likesError) {
    console.log('❌ post_like表不存在或查询失败:', likesError.message)
  } else if (likes && likes.length > 0) {
    console.log('✅ post_like表存在，字段:', Object.keys(likes[0]))
    console.log('   示例数据:', likes[0])
  }
  
  // 检查 post_likes 表（可能的复数形式）
  console.log('\n3. 检查 post_likes 表...')
  const { data: likes2, error: likes2Error } = await supabase
    .from('post_likes')
    .select('*')
    .limit(1)
  
  if (likes2Error) {
    console.log('❌ post_likes表不存在或查询失败:', likes2Error.message)
  } else if (likes2 && likes2.length > 0) {
    console.log('✅ post_likes表存在，字段:', Object.keys(likes2[0]))
    console.log('   示例数据:', likes2[0])
  }
  
  // 检查 post_comment 表
  console.log('\n4. 检查 post_comment 表...')
  const { data: comments, error: commentsError } = await supabase
    .from('post_comment')
    .select('*')
    .limit(1)
  
  if (commentsError) {
    console.log('❌ post_comment表不存在或查询失败:', commentsError.message)
  } else if (comments && comments.length > 0) {
    console.log('✅ post_comment表存在，字段:', Object.keys(comments[0]))
    console.log('   示例数据:', comments[0])
  }
  
  // 检查 post_comments 表（可能的复数形式）
  console.log('\n5. 检查 post_comments 表...')
  const { data: comments2, error: comments2Error } = await supabase
    .from('post_comments')
    .select('*')
    .limit(1)
  
  if (comments2Error) {
    console.log('❌ post_comments表不存在或查询失败:', comments2Error.message)
  } else if (comments2 && comments2.length > 0) {
    console.log('✅ post_comments表存在，字段:', Object.keys(comments2[0]))
    console.log('   示例数据:', comments2[0])
  }
}

checkTables().catch(console.error)