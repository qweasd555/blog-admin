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
import { supabase } from '@/lib/supabase'

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
    
    // 先获取所有用户数据
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, username, nickname, email')
    
    if (usersError) {
      console.error('获取用户数据失败:', usersError)
      ElMessage.error('获取用户数据失败')
      return
    }
    
    console.log('✅ 成功获取用户数据:', users?.length || 0)
    if (users && users.length > 0) {
      console.log('📋 用户数据:', users)
    }
    
    // 获取文章数据
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ 获取文章数据失败:', error)
      ElMessage.error(`获取文章数据失败: ${error.message}`)
      return
    }
    
    console.log('✅ 成功获取文章数据:', data?.length || 0)
    
    if (data && data.length > 0) {
      console.log('📋 文章原始数据:', data.map(p => ({
        id: p.id,
        title: p.title,
        user_id: p.user_id,
        author: p.author
      })))
    }
    
    // 通过user_id匹配用户
    posts.value = data.map(post => {
      let authorName = '匿名作者'
      
      // 通过user_id直接匹配
      if (post.user_id && users) {
        const matchedUser = users.find(u => u.id === post.user_id)
        if (matchedUser) {
          authorName = matchedUser.nickname || matchedUser.username || '用户'
          console.log(`✅ 文章 ${post.id} 匹配到用户: ${matchedUser.id} -> ${authorName}`)
        } else {
          console.log(`⚠️ 文章 ${post.id} 的用户ID ${post.user_id} 在用户表中不存在`)
        }
      }
      
      // 处理点赞量/浏览量数据
      let likes = 0
      const likeFields = ['likes', 'like_count', 'favorites', 'favorite_count', 'views']
      for (const field of likeFields) {
        if (post[field] !== undefined && post[field] !== null) {
          likes = parseInt(post[field]) || 0
          break
        }
      }
      
      return {
        id: post.id,
        title: post.title || '无标题',
        author: authorName,
        created_at: post.created_at || new Date().toISOString(),
        views: likes
      }
    })
    
    const matchedCount = posts.value.filter(p => p.author !== '匿名作者').length
    const totalCount = posts.value.length
    
    console.log(`🎉 成功加载 ${totalCount} 篇文章，其中 ${matchedCount} 篇匹配到用户`)
    ElMessage.success(`成功加载 ${totalCount} 篇文章`)
    
  } catch (error) {
    console.error('加载文章数据失败:', error)
    ElMessage.error('加载文章数据失败，请检查数据库连接')
    
    // 提供降级数据
    posts.value = [{
      id: 'error',
      title: '数据加载失败',
      author: '请检查连接',
      created_at: new Date().toISOString(),
      views: 0
    }]
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