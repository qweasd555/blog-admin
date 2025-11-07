<template>
  <div class="posts-management">
    <div class="page-header">
      <h2>文章管理</h2>
      <p>管理系统文章内容</p>
    </div>

    <!-- 搜索和操作栏 -->
    <el-card class="search-bar">
      <div class="search-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索文章标题"
          style="width: 300px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <div class="action-buttons">
          <el-button type="primary" @click="createPost">
            <el-icon><Plus /></el-icon>
            新建文章
          </el-button>
          <el-button @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 文章表格 -->
    <el-card>
      <el-table :data="filteredPosts" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="created_at" label="发布时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="views" label="文章点赞量" width="100" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewPost(row)">
              查看
            </el-button>
            <el-button size="small" type="warning" @click="editPost(row)">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="deletePost(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalPosts"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { supabase, supabaseAdmin } from '@/lib/supabase'

const router = useRouter()
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 真实文章数据
const posts = ref([])

const totalPosts = computed(() => posts.value.length)

const filteredPosts = computed(() => {
  let filtered = posts.value
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(post => 
      post.title.toLowerCase().includes(keyword) ||
      post.author.toLowerCase().includes(keyword)
    )
  }
  
  return filtered
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const createPost = () => {
  router.push('/posts/edit')
}

const viewPost = (post) => {
  router.push(`/posts/detail/${post.id}`)
}

const editPost = (post) => {
  router.push(`/posts/edit/${post.id}`)
}

const deletePost = async (post) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文章 "${post.title}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 从数据库中删除文章
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', post.id)
    
    if (error) {
      throw error
    }
    
    // 从前端列表中删除
    posts.value = posts.value.filter(p => p.id !== post.id)
    ElMessage.success('删除成功')
  } catch (error) {
    console.error('删除文章失败:', error)
    ElMessage.error(`删除文章失败: ${error.message}`)
  }
}

const loadPosts = async () => {
  try {
    loading.value = true
    
    console.log('🔍 开始加载文章数据...')
    console.log('Supabase配置:', {
      url: import.meta.env.VITE_SUPABASE_URL,
      keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length
    })
    
    // 第一步：获取文章数据
    console.log('📝 获取文章数据...')
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (postsError) {
      console.error('❌ 获取文章数据失败:', postsError)
      ElMessage.error(`获取文章数据失败: ${postsError.message}`)
      
      // 提供示例数据用于调试
      posts.value = [
        {
          id: 'demo-1',
          title: '示例文章1',
          author: '演示用户',
          created_at: new Date().toISOString(),
          views: 10
        },
        {
          id: 'demo-2', 
          title: '示例文章2',
          author: '测试用户',
          created_at: new Date().toISOString(),
          views: 5
        }
      ]
      loading.value = false
      return
    }
    
    console.log('✅ 成功获取文章数据:', postsData?.length || 0)
    
    if (!postsData || postsData.length === 0) {
      console.log('⚠️ 没有找到文章数据，posts表可能为空')
      ElMessage.info('暂无文章数据')
      posts.value = []
      loading.value = false
      return
    }
    
    // 第二步：获取用户数据 - 简化逻辑，只查询关键表
    console.log('👥 开始获取用户数据...')
    let users = []
    
    // 尝试查询profiles表（这是Supabase推荐的用户信息表）
    try {
      console.log('🔍 查询profiles表...')
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, email, created_at')
        .order('created_at', { ascending: false })
      
      if (!profilesError && profilesData && profilesData.length > 0) {
        console.log('✅ 从profiles表获取用户数据:', profilesData.length)
        users = profilesData.map(profile => ({
          id: profile.id,
          username: profile.username || '用户',
          nickname: profile.full_name || profile.username || '用户',
          email: profile.email || '无邮箱',
          created_at: profile.created_at
        }))
      }
    } catch (error) {
      console.log('❌ profiles表查询失败:', error.message)
    }
    
    // 如果profiles表没有数据，尝试查询user_profiles表
    if (users.length === 0) {
      try {
        console.log('🔍 查询user_profiles表...')
        const { data: userProfilesData, error: userProfilesError } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
        
        if (!userProfilesError && userProfilesData && userProfilesData.length > 0) {
          console.log('✅ 从user_profiles表获取用户数据:', userProfilesData.length)
          users = userProfilesData.map(user => ({
            id: user.id || user.user_id,
            username: user.username || user.nickname || '用户',
            nickname: user.nickname || user.username || '用户',
            email: user.email || '无邮箱',
            created_at: user.created_at
          }))
        }
      } catch (error) {
        console.log('❌ user_profiles表查询失败:', error.message)
      }
    }
    
    // 如果还没有用户数据，尝试使用Service Role Key查询auth.users表
    if (users.length === 0) {
      try {
        console.log('🔍 使用Service Role Key查询auth.users表...')
        const { data: authUsers, error: authError } = await supabaseAdmin
          .from('auth.users')
          .select('id, email, raw_user_meta_data, created_at')
          .order('created_at', { ascending: false })
          .limit(50)
        
        if (!authError && authUsers && authUsers.length > 0) {
          console.log('✅ 从auth.users表获取用户数据:', authUsers.length)
          users = authUsers.map(user => {
            const metaData = user.raw_user_meta_data || {}
            const username = metaData.username || user.email?.split('@')[0] || '用户'
            const nickname = metaData.name || metaData.nickname || username
            
            return {
              id: user.id,
              username: username,
              nickname: nickname,
              email: user.email,
              created_at: user.created_at
            }
          })
        }
      } catch (error) {
        console.log('❌ auth.users表查询失败:', error.message)
      }
    }
    
    console.log('📊 最终获取到用户数据:', users.length)
    if (users.length > 0) {
      console.log('📋 用户列表:', users.map(u => ({ id: u.id, name: u.nickname })))
    }
    
    // 第三步：处理文章数据，匹配作者
    console.log('🔗 开始用户-文章匹配...')
    posts.value = postsData.map(post => {
      let authorName = post.author || '匿名作者'
      let matchedUserId = null
      
      // 简单匹配逻辑：检查user_id字段
      if (post.user_id && users.length > 0) {
        const matchedUser = users.find(u => u.id === post.user_id)
        if (matchedUser) {
          authorName = matchedUser.nickname || matchedUser.username || '用户'
          matchedUserId = matchedUser.id
          console.log(`✅ 文章 ${post.id} 匹配到用户: ${authorName} (ID: ${matchedUserId})`)
        }
      }
      
      // 如果user_id不匹配，尝试从author字段匹配
      if (!matchedUserId && post.author && users.length > 0) {
        // 如果author是UUID格式，尝试匹配ID
        if (post.author.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i)) {
          const matchedUser = users.find(u => u.id === post.author)
          if (matchedUser) {
            authorName = matchedUser.nickname || matchedUser.username || '用户'
            matchedUserId = matchedUser.id
            console.log(`✅ 文章 ${post.id} 通过author UUID匹配到用户: ${authorName}`)
          }
        } else {
          // 如果author是用户名，直接使用
          const matchedUser = users.find(u => 
            u.username === post.author || 
            u.nickname === post.author || 
            u.email === post.author
          )
          if (matchedUser) {
            authorName = matchedUser.nickname || matchedUser.username || post.author
            matchedUserId = matchedUser.id
            console.log(`✅ 文章 ${post.id} 通过作者名匹配到用户: ${authorName}`)
          }
        }
      }
      
      // 计算浏览量/点赞量
      let views = 0
      const viewFields = ['views', 'view_count', 'likes', 'like_count']
      for (const field of viewFields) {
        if (post[field] !== undefined && post[field] !== null) {
          views = parseInt(post[field]) || 0
          if (views > 0) break
        }
      }
      
      return {
        id: post.id,
        title: post.title || '无标题',
        author: authorName,
        created_at: post.created_at || new Date().toISOString(),
        views: views
      }
    })
    
    console.log(`🎉 成功加载 ${posts.value.length} 篇文章`)
    ElMessage.success(`成功加载 ${posts.value.length} 篇文章`)
    
  } catch (error) {
    console.error('加载文章数据失败:', error)
    ElMessage.error('加载文章数据失败，请检查浏览器控制台查看详细错误信息')
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  loadPosts()
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.posts-management {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
}

.search-bar {
  margin-bottom: 20px;
}

.search-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>