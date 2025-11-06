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
    
    console.log('🔍 开始连接Supabase数据库获取文章数据...')
    
    // 首先尝试从多个可能的用户表获取用户数据
    let userProfiles = []
    const userTables = ['user_profiles', 'profiles', 'users']
    
    for (const table of userTables) {
      try {
        console.log(`🔄 尝试从 ${table} 表获取用户数据...`)
        const { data: userData, error: userError } = await supabase
          .from(table)
          .select('*')
          .limit(100)
        
        if (!userError && userData && userData.length > 0) {
          console.log(`✅ 成功从 ${table} 表获取用户数据:`, userData.length)
          userProfiles = userData
          break
        }
      } catch (tableError) {
        console.log(`❌ ${table} 表查询失败:`, tableError.message)
      }
    }
    
    // 如果用户表都为空，创建一个默认用户
    if (userProfiles.length === 0) {
      console.log('📝 创建默认用户数据作为备用')
      userProfiles = [{
        id: 'default-admin',
        username: 'admin',
        nickname: '管理员',
        email: 'admin@example.com'
      }]
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
    
    // 转换数据格式，智能匹配用户信息
    posts.value = data.map(post => {
      // 智能匹配作者信息
      let authorName = '匿名作者'
      
      // 策略1：优先通过user_id精确匹配
      if (post.user_id) {
        const matchedUser = userProfiles.find(u => u.id === post.user_id)
        if (matchedUser) {
          authorName = matchedUser.nickname || matchedUser.username || '匿名作者'
          console.log(`✅ 通过user_id匹配到用户: ${authorName}`)
        }
      }
      
      // 策略2：通过邮箱模糊匹配
      if (authorName === '匿名作者' && post.author && typeof post.author === 'string') {
        const authorEmail = post.author.toLowerCase()
        const matchedUser = userProfiles.find(u => u.email && u.email.toLowerCase().includes(authorEmail))
        if (matchedUser) {
          authorName = matchedUser.nickname || matchedUser.username || '匿名作者'
          console.log(`✅ 通过邮箱匹配到用户: ${authorName}`)
        }
      }
      
      // 策略3：通过昵称模糊匹配
      if (authorName === '匿名作者') {
        const authorFields = [
          post.username, 
          post.author, 
          post.author_name, 
          post.author_nickname,
          post.author_username
        ]
        
        for (const field of authorFields) {
          if (field && typeof field === 'string' && field.trim() && field !== 'undefined' && field !== 'null') {
            const searchValue = field.trim().toLowerCase()
            
            // 精确匹配昵称
            const exactMatch = userProfiles.find(u => 
              u.nickname && u.nickname.toLowerCase() === searchValue
            )
            if (exactMatch) {
              authorName = exactMatch.nickname || exactMatch.username || '匿名作者'
              console.log(`✅ 通过昵称精确匹配到用户: ${authorName}`)
              break
            }
            
            // 模糊匹配用户名
            const fuzzyMatch = userProfiles.find(u => 
              u.username && u.username.toLowerCase().includes(searchValue)
            )
            if (fuzzyMatch) {
              authorName = fuzzyMatch.nickname || fuzzyMatch.username || '匿名作者'
              console.log(`✅ 通过用户名模糊匹配到用户: ${authorName}`)
              break
            }
          }
        }
      }
      
      // 策略4：使用文章中的原始作者信息（清洗和格式化）
      if (authorName === '匿名作者') {
        const authorFields = [post.username, post.author, post.author_name]
        for (const field of authorFields) {
          if (field && typeof field === 'string' && field.trim() && field !== 'undefined' && field !== 'null') {
            // 清洗作者名字，移除特殊字符和乱码
            authorName = field.trim()
              .replace(/[^\w\u4e00-\u9fa5\s]/g, '') // 移除特殊字符，保留中文、字母、数字和空格
              .replace(/\s+/g, ' ') // 合并多个空格
              .trim()
            
            // 如果清洗后还有内容，使用它
            if (authorName && authorName.length > 0) {
              console.log(`🔧 使用原始作者信息: ${authorName}`)
              break
            }
          }
        }
      }
      
      // 策略5：如果所有匹配都失败，使用默认名称
      if (authorName === '匿名作者' || !authorName) {
        authorName = '匿名作者'
        console.log('⚠️ 无法匹配到作者，使用默认名称')
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
    
    const successMessage = `成功加载 ${posts.value.length} 篇文章，从 ${userProfiles.length} 个用户中匹配作者信息`
    console.log('🎉', successMessage)
    ElMessage.success(successMessage)
    
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