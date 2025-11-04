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
          <el-button type="primary" @click="handleRefresh">
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
        <el-table-column prop="views" label="浏览量" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'warning'">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { supabase } from '@/lib/supabase'

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

const viewPost = (post) => {
  ElMessage.info(`查看文章: ${post.title}`)
}

const editPost = (post) => {
  ElMessage.info(`编辑文章: ${post.title}`)
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
    
    posts.value = posts.value.filter(p => p.id !== post.id)
    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消操作
  }
}

const loadPosts = async () => {
  try {
    loading.value = true
    
    // 尝试不同的表名
    const tableNames = ['posts', 'articles', 'post']
    let postData = []
    let foundTable = false
    
    for (const tableName of tableNames) {
      try {
        // 尝试不同的查询方式
        let query = supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false })
        
        // 尝试关联查询，如果失败则使用简单查询
        try {
          const { data, error } = await query.select(`
            *,
            profiles:author_id (username, email)
          `)
          
          if (!error && data) {
            postData = data
            foundTable = true
            console.log(`✅ 从表 ${tableName} 成功加载文章数据（关联查询）`)
            break
          }
        } catch (err) {
          // 如果关联查询失败，尝试简单查询
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: false })
          
          if (!error && data) {
            postData = data
            foundTable = true
            console.log(`✅ 从表 ${tableName} 成功加载文章数据（简单查询）`)
            break
          }
        }
      } catch (err) {
        console.log(`❌ 表 ${tableName} 查询失败:`, err)
      }
    }
    
    if (!foundTable) {
      ElMessage.warning('未找到文章数据表，请检查数据库表结构')
      posts.value = []
      return
    }
    
    // 转换数据格式
    posts.value = postData.map(post => ({
      id: post.id,
      title: post.title || '无标题',
      author: post.author || post.profiles?.username || post.profiles?.email?.split('@')[0] || '匿名作者',
      created_at: post.created_at || new Date().toISOString(),
      views: post.views || 0,
      status: post.status || 'draft'
    }))
    
    ElMessage.success(`成功加载 ${posts.value.length} 篇文章`)
  } catch (error) {
    console.error('加载文章数据失败:', error)
    ElMessage.error('加载文章数据失败，请检查数据库连接')
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