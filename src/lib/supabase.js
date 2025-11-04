import { createClient } from '@supabase/supabase-js'

// 使用与博客项目相同的 Supabase 配置
const supabaseUrl = 'https://qghxnulnxxtvaqupoxeo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnaHhudWxueHh0dmFxdXBveGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMzcwMzAsImV4cCI6MjA3NjYxMzAzMH0._RahoiQh9FBFhcvirKqvm4SDZ2dlK7rfZSCC02ZbSXM'

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 导出 Supabase 客户端
export default supabase