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
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="toggleUserStatus(row)">
              禁用
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
      user.username.toLowerCase().includes(keyword) ||
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
    
    console.log('🔍 开始连接数据库获取真实用户数据...')
    
    // 尝试从多个可能的用户表获取数据
    const tablesToTry = ['user_profiles', 'profiles', 'users']
    let userData = null
    let tableUsed = null
    
    for (const table of tablesToTry) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
        
        if (!error && data && data.length > 0) {
          console.log(`✅ 成功从 ${table} 表获取用户数据:`, data.length)
          userData = data
          tableUsed = table
          break
        }
      } catch (tableError) {
        console.log(`❌ ${table} 表查询失败:`, tableError.message)
      }
    }
    
    if (userData && userData.length > 0) {
      // 智能处理不同表结构的数据
      users.value = userData.map(user => {
        // 统一处理用户信息
        const userId = user.id || user.user_id || '未知ID'
        const username = user.username || user.nickname || user.email?.split('@')[0] || '未知用户'
        const nickname = user.nickname || user.username || user.email?.split('@')[0] || '未知用户'
        const email = user.email || user.email_address || '无邮箱'
        const createdAt = user.created_at || user.created_date || new Date().toISOString()
        
        return {
          id: userId,
          username: username,
          nickname: nickname,
          email: email,
          created_at: createdAt
        }
      })
      
      ElMessage.success(`成功从 ${tableUsed} 表加载 ${users.value.length} 个真实用户`)
    } else {
      console.log('⚠️ 所有用户表都为空，显示默认数据')
      // 如果数据库中没有用户数据，显示友好的提示信息
      users.value = [{
        id: 'no-users',
        username: '暂无用户',
        nickname: '等待用户注册',
        email: 'user@example.com',
        created_at: new Date().toISOString()
      }]
      ElMessage.info('当前数据库中暂无用户数据，等待用户注册后显示真实数据')
    }
    
  } catch (error) {
    console.error('加载用户数据失败:', error)
    ElMessage.error('加载用户数据失败，请检查数据库连接')
    
    // 提供更友好的降级处理
    users.value = [{
      id: 'error',
      username: '数据加载失败',
      nickname: '请检查连接',
      email: 'error@example.com',
      created_at: new Date().toISOString()
    }]
  } finally {
    loading.value = false
  }
}

const toggleUserStatus = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要禁用用户 "${user.nickname}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟禁用用户操作
    ElMessage.info('用户禁用功能（模拟操作）')
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