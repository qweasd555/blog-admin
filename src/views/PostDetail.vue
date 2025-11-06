<template>
  <div class="post-detail">
    <div class="page-header">
      <el-button @click="goBack" type="primary" size="small">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2>文章详情</h2>
    </div>

    <el-card v-loading="loading">
      <div v-if="post" class="post-content">
        <div class="post-header">
          <h1 class="post-title">{{ post.title }}</h1>
          <div class="post-meta">
            <span class="author">作者: {{ post.username || post.author || post.author_name || '匿名作者' }}</span>
            <span class="date">发布时间: {{ formatDate(post.created_at) }}</span>
            <span class="views">文章点赞量: {{ post.views || 0 }}</span>
            <el-tag :type="post.status === 'published' ? 'success' : 'warning'">
              {{ post.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </div>
        </div>

        <div class="post-body">
          <div class="content-section">
            <h3>文章内容</h3>
            <div class="content" v-html="post.content || '暂无内容'"></div>
          </div>

          <div class="post-actions">
            <el-button type="primary" @click="editPost">
              <el-icon><Edit /></el-icon>
              编辑文章
            </el-button>
            <el-button @click="goBack">
              返回列表
            </el-button>
          </div>
        </div>
      </div>

      <div v-else class="no-data">
        <el-empty description="文章不存在或已被删除" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Edit } from '@element-plus/icons-vue'
import { supabase } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const post = ref(null)

const postId = route.params.id

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const loadPostDetail = async () => {
  try {
    loading.value = true
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()
    
    if (error) {
      console.error('获取文章详情失败:', error)
      ElMessage.error('获取文章详情失败')
      return
    }
    
    post.value = data
  } catch (error) {
    console.error('加载文章详情失败:', error)
    ElMessage.error('加载文章详情失败')
  } finally {
    loading.value = false
  }
}

const editPost = () => {
  router.push(`/posts/edit/${postId}`)
}

const goBack = () => {
  router.push('/posts')
}

onMounted(() => {
  if (postId) {
    loadPostDetail()
  }
})
</script>

<style scoped>
.post-detail {
  padding: 0;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.post-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.post-title {
  font-size: 28px;
  color: #333;
  margin: 0 0 15px 0;
  line-height: 1.4;
}

.post-meta {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
  color: #666;
  font-size: 14px;
}

.post-body {
  line-height: 1.8;
}

.content-section {
  margin-bottom: 30px;
}

.content-section h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 18px;
}

.content {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  min-height: 200px;
}

.post-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.no-data {
  text-align: center;
  padding: 40px 0;
}
</style>