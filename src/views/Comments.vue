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
        <el-table-column prop="post_title" label="所属文章" />
        <el-table-column prop="created_at" label="评论时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'approved' ? 'success' : 'warning'">
              {{ row.status === 'approved' ? '已审核' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button
              size="small"
              :type="row.status === 'approved' ? 'warning' : 'success'"
              @click="toggleCommentStatus(row)"
            >
              {{ row.status === 'approved' ? '取消审核' : '通过审核' }}
            </el-button>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { supabase } from '@/lib/supabase'

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
    
    // 直接连接真实的Supabase数据库，使用 post_comments 表
    const { data, error } = await supabase
      .from('post_comments')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ 获取评论数据失败:', error)
      ElMessage.error(`获取评论数据失败: ${error.message}`)
      
      // 如果失败，尝试检查表是否存在
      try {
        const { data: testData, error: testError } = await supabase
          .from('post_comments')
          .select('id')
          .limit(1)
        
        if (testError) {
          ElMessage.warning('评论表可能不存在，请检查数据库表结构')
        }
      } catch (testErr) {
        console.error('测试连接失败:', testErr)
      }
      
      return
    }
    
    console.log('✅ 成功获取评论数据:', data)
    
    // 转换数据格式
    comments.value = data.map(comment => ({
      id: comment.id,
      content: comment.content || '无内容',
      author: comment.author_name || '匿名用户',
      post_title: '关联文章', // 由于没有直接关联文章标题，显示通用文本
      created_at: comment.created_at || new Date().toISOString(),
      status: 'approved' // 评论默认都是已审核状态
    }))
    
    ElMessage.success(`成功加载 ${comments.value.length} 条评论`)
  } catch (error) {
    console.error('加载评论数据失败:', error)
    ElMessage.error('加载评论数据失败，请检查数据库连接')
  } finally {
    loading.value = false
  }
}

const toggleCommentStatus = async (comment) => {
  try {
    await ElMessageBox.confirm(
      `确定要${comment.status === 'approved' ? '拒绝' : '通过'}评论吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 更新数据库中的评论状态
    const { error } = await supabase
      .from('post_comments')
      .update({ status: comment.status === 'approved' ? 'rejected' : 'approved' })
      .eq('id', comment.id)
    
    if (error) {
      ElMessage.error('更新评论状态失败: ' + error.message)
      return
    }
    
    comment.status = comment.status === 'approved' ? 'rejected' : 'approved'
    ElMessage.success('操作成功')
  } catch (error) {
    // 用户取消操作
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
    
    // 从数据库删除评论
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', comment.id)
    
    if (error) {
      ElMessage.error('删除评论失败: ' + error.message)
      return
    }
    
    comments.value = comments.value.filter(c => c.id !== comment.id)
    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消操作
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