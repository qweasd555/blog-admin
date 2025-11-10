<template>
  <div class="comments-management">
    <div class="page-header">
      <h2>评论管理</h2>
      <p>管理系统评论内容</p>
    </div>

    <!-- 搜索和操作栏 -->
    <el-card class="search-bar">
      <div class="search-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索评论内容"
          style="width: 300px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <div class="action-buttons">
          <el-button type="primary" @click="loadComments">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 评论表格 -->
    <el-card>
      <el-table :data="filteredComments" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="content" label="评论内容" />
        <el-table-column prop="author" label="评论用户" width="120" />
        <el-table-column prop="post_title" label="所属文章" width="200">
          <template #default="{ row }">
            <el-link 
              type="primary" 
              underline="hover" 
              @click="viewPost(row.post_id)"
              style="cursor: pointer"
            >
              {{ row.post_title }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="评论时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="deleteComment(row)">
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
          :total="totalComments"
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
import { Search, Refresh } from '@element-plus/icons-vue'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 真实评论数据
const comments = ref([])

const totalComments = computed(() => comments.value.length)

const filteredComments = computed(() => {
  let filtered = comments.value
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(comment => 
      comment.content.toLowerCase().includes(keyword) ||
      comment.author.toLowerCase().includes(keyword) ||
      comment.post_title.toLowerCase().includes(keyword)
    )
  }
  
  return filtered
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const loadComments = async () => {
  try {
    loading.value = true
    
    console.log('🔍 开始连接Supabase数据库获取评论数据...')
    
    // 优先使用高级权限获取数据，确保完整访问
    console.log('🔑 使用高级权限加载评论数据...')
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    // 尝试不同的表名来获取评论数据（优先尝试更可能存在的表名）
    const tableNames = ['post_comments', 'comments', 'post_comment', 'article_comments']
    let commentsData = []
    let foundTable = false
    
    for (const tableName of tableNames) {
      try {
        console.log(`🔍 尝试从表 ${tableName} 获取评论数据...`)
        
        // 先尝试使用管理员权限
        const { data: adminData, error: adminError } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!adminError && adminData) {
          commentsData = adminData
          console.log(`✅ 使用高级权限从 ${tableName} 表成功获取评论数据:`, commentsData.length)
          foundTable = true
          break
        }
        
        // 如果高级权限失败，尝试普通权限
        console.log(`🔄 尝试使用普通权限从 ${tableName} 表获取数据...`)
        const { data: normalData, error: normalError } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!normalError && normalData) {
          commentsData = normalData
          console.log(`✅ 使用普通权限从 ${tableName} 表成功获取评论数据:`, commentsData.length)
          foundTable = true
          break
        }
        
      } catch (error) {
        console.log(`⚠️ 表 ${tableName} 获取失败:`, error.message)
      }
    }
    
    if (!foundTable) {
      console.error('❌ 所有表都无法获取评论数据')
      ElMessage.error('获取评论数据失败，请检查数据库表结构')
      loading.value = false
      return
    }
    
    // 获取所有文章ID
    const postIds = [...new Set(commentsData.map(comment => comment.post_id).filter(Boolean))]
    
    // 批量查询文章标题（使用高级权限确保能访问）
    let postTitles = {}
    if (postIds.length > 0) {
      console.log('📚 加载文章标题信息...')
      const { data: postsData, error: postsError } = await supabaseAdmin
        .from('posts')
        .select('id, title')
        .in('id', postIds)
      
      if (!postsError && postsData) {
        postsData.forEach(post => {
          postTitles[post.id] = post.title
        })
        console.log('✅ 成功加载文章标题信息')
      } else {
        console.log('⚠️ 加载文章标题信息失败，将使用默认标题')
      }
    }
    
    // 转换数据格式
    const processedComments = commentsData.map(item => ({
      id: item.id,
      content: item.content || '无内容',
      author: item.author_name || item.author || '匿名用户',
      post_id: item.post_id, // 保留文章ID用于跳转
      post_title: postTitles[item.post_id] || `文章ID: ${item.post_id}`,
      created_at: item.created_at || new Date().toISOString()
    }))
    
    // 使用新的数组引用，确保 Vue 响应式更新
    comments.value = [...processedComments]
    
    console.log(`🎉 成功加载 ${comments.value.length} 条评论`)
    
    // 只有在初次加载时显示成功消息
    if (processedComments.length > 0) {
      ElMessage.success(`成功加载 ${processedComments.length} 条评论`)
    } else {
      ElMessage.info('暂无评论数据')
    }
  } catch (error) {
    console.error('加载评论数据失败:', error)
    ElMessage.error('加载评论数据失败，请检查数据库连接')
  } finally {
    loading.value = false
  }
}



const deleteComment = async (comment) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条评论吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('🗑️ 开始删除评论:', comment.id)
    
    // 优先使用管理员权限进行删除，确保高权限操作
    console.log('🔑 使用高级权限删除评论...')
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    // 详细记录删除操作
    const { data, error } = await supabaseAdmin
      .from('post_comments')
      .delete()
      .eq('id', comment.id)
      .select()  // 添加select获取删除确认
    
    console.log('📊 删除操作响应:', { data, error })
    
    if (error) {
      console.error('❌ 高级权限删除失败:', error)
      
      // 如果高级权限失败，尝试普通权限作为备选
      console.log('🔄 尝试使用普通权限删除...')
      const { error: normalError } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', comment.id)
      
      if (normalError) {
        console.error('❌ 普通权限删除也失败:', normalError)
        
        // 最后尝试：检查表名是否正确
        console.log('🔄 尝试其他可能的表名...')
        const tableNames = ['comments', 'post_comments', 'article_comments', 'user_comments']
        
        for (const tableName of tableNames) {
          try {
            console.log(`🔄 尝试表名: ${tableName}`)
            const result = await supabaseAdmin
              .from(tableName)
              .delete()
              .eq('id', comment.id)
              
            if (!result.error) {
              console.log(`✅ 在表 ${tableName} 中删除成功`)
              break
            }
          } catch (tableErr) {
            console.log(`❌ 表 ${tableName} 删除失败:`, tableErr.message)
          }
        }
        
        ElMessage.error('删除评论失败，请检查数据库权限设置')
        return
      }
    }
    
    console.log('✅ 删除评论成功')
    
    // 从本地数据中立即移除评论，给用户即时反馈
    const originalLength = comments.value.length
    comments.value = comments.value.filter(c => c.id !== comment.id)
    console.log(`📊 本地数据更新: ${originalLength} -> ${comments.value.length} 条评论`)
    
    ElMessage.success('删除成功')
    
    // 不立即自动刷新，让用户看到删除效果
    // 如果需要最新数据，用户可以手动点击"刷新"按钮
    console.log('ℹ️ 删除完成，本地数据已更新')
    
    // 可选：3秒后自动刷新确认删除效果
    setTimeout(() => {
      console.log('🔄 自动刷新以确认删除效果...')
      loadComments()
    }, 3000)
    
  } catch (error) {
    // 用户取消操作
    console.log('用户取消删除操作')
  }
}

// 查看文章详情
const viewPost = async (postId) => {
  if (!postId) {
    ElMessage.warning('该评论未关联有效文章')
    return
  }
  
  console.log('📖 跳转到文章管理页面，文章ID:', postId)
  
  try {
    // 先获取文章标题，用于搜索
    const { supabaseAdmin } = await import('@/lib/supabase')
    const { data: postData, error } = await supabaseAdmin
      .from('posts')
      .select('title')
      .eq('id', postId)
      .single()
    
    if (error) {
      console.error('获取文章标题失败:', error)
      // 如果无法获取标题，直接使用文章ID搜索
      router.push({
        path: '/posts',
        query: { 
          search: postId,
          from: 'comments',
          highlight: postId
        }
      })
      return
    }
    
    // 使用文章标题作为搜索关键词
    const searchKeyword = postData?.title || postId
    
    // 跳转到文章管理页面并传递搜索参数
    router.push({
      path: '/posts',
      query: { 
        search: searchKeyword,
        from: 'comments',
        highlight: postId
      }
    })
    
  } catch (error) {
    console.error('跳转失败:', error)
    // 备用方案：直接跳转
    router.push('/posts')
  }
}

onMounted(() => {
  loadComments()
})
</script>

<style scoped>
.comments-management {
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