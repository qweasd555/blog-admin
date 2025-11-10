<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2>仪表盘</h2>
      <p>系统概览和统计数据</p>
      <div class="status-indicator" :class="{ online: systemStatus.supabase, offline: !systemStatus.supabase }">
        {{ systemStatus.supabase ? '✅ 在线' : '❌ 离线' }}
        <span v-if="systemStatus.lastSync"> - 最后同步: {{ formatTime(systemStatus.lastSync) }}</span>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon user-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon post-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalPosts }}</div>
            <div class="stat-label">总文章数</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon comment-icon">
            <el-icon><ChatLineRound /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalComments }}</div>
            <div class="stat-label">总评论数</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon today-icon">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayUsers }}</div>
            <div class="stat-label">今日注册</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 快速操作 -->
    <el-card class="quick-actions">
      <template #header>
        <div class="card-header">
          <span>快速操作</span>
        </div>
      </template>
      <div class="action-buttons">
        <el-button type="primary" @click="$router.push('/users')">
          <el-icon><User /></el-icon>
          用户管理
        </el-button>
        <el-button type="primary" @click="$router.push('/posts')">
          <el-icon><Document /></el-icon>
          文章管理
        </el-button>
        <el-button type="primary" @click="$router.push('/comments')">
          <el-icon><ChatLineRound /></el-icon>
          评论管理
        </el-button>
        <el-button type="info" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </el-card>

    <!-- 最近活动 -->
    <el-card class="recent-activity">
      <template #header>
        <div class="card-header">
          <span>最近活动</span>
          <el-tooltip content="数据来源: Supabase数据库 / 本地缓存 / 示例数据">
            <el-icon><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>
      <el-table :data="recentActivities" style="width: 100%">
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getActivityType(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column label="来源" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.source === 'supabase'" type="success">实时</el-tag>
            <el-tag v-else-if="row.source === 'local_storage'" type="warning">缓存</el-tag>
            <el-tag v-else type="info">示例</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Document, ChatLineRound, Calendar, Refresh, InfoFilled } from '@element-plus/icons-vue'
import { getStats, getRecentActivities, getSystemStatus, testSupabaseConnection } from '@/utils/dataService'

const stats = ref({
  totalUsers: 0,
  totalPosts: 0,
  totalComments: 0,
  todayUsers: 0
})

const recentActivities = ref([])
const systemStatus = ref({})
const loading = ref(false)

const getActivityType = (type) => {
  const typeMap = {
    '用户': 'success',
    '文章': 'primary',
    '评论': 'warning',
    '系统': 'info'
  }
  return typeMap[type] || 'info'
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const refreshData = async () => {
  loading.value = true
  await loadData()
  loading.value = false
  ElMessage.success('数据已刷新')
}

const loadData = async () => {
  try {
    console.log('🔍 开始加载仪表盘数据...')
    
    // 获取系统状态 - 确保在数据加载前测试连接
    await testSupabaseConnection()
    systemStatus.value = getSystemStatus()
    
    // 使用智能数据服务获取统计数据
    const statsData = await getStats()
    stats.value = {
      totalUsers: statsData.totalUsers,
      totalPosts: statsData.totalPosts,
      totalComments: statsData.totalComments,
      todayUsers: statsData.todayUsers
    }
    
    // 根据数据源显示不同的提示信息
    if (systemStatus.value.supabase) {
      console.log('✅ 数据来源: Supabase数据库')
      ElMessage.success('数据库连接正常')
    } else if (statsData.dataSource.posts === 'local_storage') {
      console.log('📱 数据来源: 本地缓存')
      ElMessage.info('正在使用本地缓存数据，数据可能不是最新的')
    } else {
      console.log('📄 数据来源: 示例数据')
      ElMessage.warning('数据库连接失败，正在使用示例数据演示系统功能...')
    }
    
    // 获取最近活动
    recentActivities.value = await getRecentActivities()
    
    console.log('✅ 仪表盘数据加载完成')
    
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('数据加载失败，请检查系统连接')
    
    // 更新系统状态为离线
    systemStatus.value = {
      supabase: false,
      lastSync: null,
      timestamp: new Date().toISOString()
    }
    
    // 最终降级处理：使用完整的示例数据
    stats.value = {
      totalUsers: 15,
      totalPosts: 25,
      totalComments: 128,
      todayUsers: 2
    }
    
    recentActivities.value = [
      {
        type: '系统',
        description: '博客管理系统初始化完成',
        time: new Date().toLocaleString('zh-CN'),
        source: 'default'
      },
      {
        type: '文章',
        description: '文章 "欢迎使用博客管理系统" 发布',
        time: new Date(Date.now() - 86400000).toLocaleString('zh-CN'),
        source: 'default'
      },
      {
        type: '评论',
        description: '用户发表了对系统功能的评论',
        time: new Date(Date.now() - 172800000).toLocaleString('zh-CN'),
        source: 'default'
      },
      {
        type: '文章',
        description: '文章 "如何配置数据库连接" 发布',
        time: new Date(Date.now() - 259200000).toLocaleString('zh-CN'),
        source: 'default'
      }
    ]
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.dashboard-header {
  margin-bottom: 20px;
}

.dashboard-header h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.dashboard-header p {
  margin: 0;
  color: #666;
}

.status-indicator {
  font-size: 14px;
  margin-top: 5px;
}

.status-indicator.online {
  color: #67c23a;
}

.status-indicator.offline {
  color: #f56c6c;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.user-icon { background: #67c23a; }
.post-icon { background: #409eff; }
.comment-icon { background: #e6a23c; }
.today-icon { background: #f56c6c; }

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.quick-actions {
  margin-bottom: 20px;
}

.card-header {
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.recent-activity {
  margin-bottom: 20px;
}
</style>