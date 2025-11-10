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
        <el-table-column prop="author_name" label="作者" width="120" />
        <el-table-column prop="created_at" label="发布时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="like_count" label="点赞数" width="80" />
        <el-table-column prop="comment_count" label="评论数" width="80" />
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
      (post.author_name && post.author_name.toLowerCase().includes(keyword))
    )
  }
  
  // 实现分页逻辑
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  
  return filtered.slice(startIndex, endIndex)
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const createPost = () => {
  router.push('/posts/edit/')
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
    
    // 使用高权限密钥从数据库中删除文章
    const { error } = await supabaseAdmin
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
      ElMessage.warning('数据库连接失败，正在使用示例数据...')
      
      // 提供更丰富的示例数据用于显示
      posts.value = [
        {
          id: 'demo-1',
          title: '欢迎使用博客管理系统',
          author: '管理员',
          created_at: new Date().toISOString(),
          views: 100
        },
        {
          id: 'demo-2', 
          title: '数据库连接问题解决方案',
          author: '技术支持',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          views: 50
        },
        {
          id: 'demo-3',
          title: '如何配置Supabase连接',
          author: '开发团队',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          views: 30
        },
        {
          id: 'demo-4',
          title: '示例文章4',
          author: '演示用户',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          views: 20
        },
        {
          id: 'demo-5',
          title: '示例文章5',
          author: '测试用户',
          created_at: new Date(Date.now() - 345600000).toISOString(),
          views: 15
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
    
    // 第二步：获取点赞和评论统计数据
    console.log('📊 开始获取文章互动数据...')
    
    // 第三步：处理文章数据，添加点赞和评论数量
    console.log('🔗 开始处理文章互动数据...')
    
    // 获取点赞统计数据
    let likeCounts = {}
    try {
      console.log('👍 获取点赞数据...')
      // 尝试从post_like表获取点赞数据
      const { data: postLikes, error: likesError } = await supabase
        .from('post_like')
        .select('post_id')
      
      if (!likesError && postLikes) {
        // 按文章ID统计点赞数
        postLikes.forEach(like => {
          likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1
        })
        console.log('✅ 从post_like表获取点赞数据')
      }
      
      // 如果post_like表不存在，尝试从post_likes表获取
      if (Object.keys(likeCounts).length === 0) {
        const { data: postLikes2, error: likesError2 } = await supabase
          .from('post_likes')
          .select('post_id')
        
        if (!likesError2 && postLikes2) {
          postLikes2.forEach(like => {
            likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1
          })
          console.log('✅ 从post_likes表获取点赞数据')
        }
      }
    } catch (error) {
      console.log('⚠️ 获取点赞数据失败:', error.message)
    }
    
    // 获取评论统计数据
    let commentCounts = {}
    try {
      console.log('💬 获取评论数据...')
      // 尝试从post_comment表获取评论数据
      const { data: postComments, error: commentsError } = await supabase
        .from('post_comment')
        .select('post_id')
      
      if (!commentsError && postComments) {
        // 按文章ID统计评论数
        postComments.forEach(comment => {
          commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1
        })
        console.log('✅ 从post_comment表获取评论数据')
      }
      
      // 如果post_comment表不存在，尝试从post_comments表获取
      if (Object.keys(commentCounts).length === 0) {
        const { data: postComments2, error: commentsError2 } = await supabase
          .from('post_comments')
          .select('post_id')
        
        if (!commentsError2 && postComments2) {
          postComments2.forEach(comment => {
            commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1
          })
          console.log('✅ 从post_comments表获取评论数据')
        }
      }
    } catch (error) {
      console.log('⚠️ 获取评论数据失败:', error.message)
    }
    
    // 处理文章数据
    posts.value = postsData.map(post => {
      // 使用author_name字段作为作者显示
      const authorName = post.author_name || post.author || '匿名作者'
      
      // 计算点赞数量
      const likeCount = likeCounts[post.id] || 0
      
      // 计算评论数量
      const commentCount = commentCounts[post.id] || 0
      
      return {
        id: post.id,
        title: post.title || '无标题',
        author_name: authorName,
        created_at: post.created_at || new Date().toISOString(),
        like_count: likeCount,
        comment_count: commentCount
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