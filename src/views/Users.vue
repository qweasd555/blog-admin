<template>
  <div class="users-management">
    <div class="page-header">
      <h2>用户管理</h2>
      <p>管理系统用户和权限</p>
    </div>

    <!-- 搜索和操作栏 -->
    <el-card class="search-bar">
      <div class="search-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名、邮箱"
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

    <!-- 用户表格 -->
    <el-card>
      <el-table :data="filteredUsers" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '活跃' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button
              size="small"
              :type="row.status === 'active' ? 'danger' : 'success'"
              @click="toggleUserStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="warning" @click="viewUserDetail(row)">
              详情
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
          :total="totalUsers"
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

// 真实用户数据
const users = ref([])

const totalUsers = computed(() => users.value.length)

const filteredUsers = computed(() => {
  let filtered = users.value
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.nickname.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword)
    )
  }
  
  return filtered
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const viewUserDetail = (user) => {
  ElMessage.info(`查看用户详情: ${user.nickname}`)
}

const loadUsers = async () => {
  try {
    loading.value = true
    
    // 尝试不同的表名
    const tableNames = ['profiles', 'users', 'user']
    let userData = []
    let foundTable = false
    
    for (const tableName of tableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!error && data) {
          userData = data
          foundTable = true
          console.log(`✅ 从表 ${tableName} 成功加载用户数据`)
          break
        }
      } catch (err) {
        console.log(`❌ 表 ${tableName} 查询失败:`, err)
      }
    }
    
    if (!foundTable) {
      ElMessage.warning('未找到用户数据表，请检查数据库表结构')
      users.value = []
      return
    }
    
    // 转换数据格式
    users.value = userData.map(user => ({
      id: user.id,
      nickname: user.username || user.nickname || user.email?.split('@')[0] || '未知用户',
      email: user.email || '无邮箱',
      created_at: user.created_at || new Date().toISOString(),
      status: user.status || 'active'
    }))
    
    ElMessage.success(`成功加载 ${users.value.length} 个用户`)
  } catch (error) {
    console.error('加载用户数据失败:', error)
    ElMessage.error('加载用户数据失败，请检查数据库连接')
  } finally {
    loading.value = false
  }
}

const toggleUserStatus = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要${user.status === 'active' ? '禁用' : '启用'}用户 "${user.nickname}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 更新数据库中的用户状态
    const { error } = await supabase
      .from('profiles')
      .update({ status: user.status === 'active' ? 'inactive' : 'active' })
      .eq('id', user.id)
    
    if (error) {
      ElMessage.error('更新用户状态失败: ' + error.message)
      return
    }
    
    user.status = user.status === 'active' ? 'inactive' : 'active'
    ElMessage.success('操作成功')
  } catch (error) {
    // 用户取消操作
  }
}

const handleRefresh = () => {
  loadUsers()
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-management {
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