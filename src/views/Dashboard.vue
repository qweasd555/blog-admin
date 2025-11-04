<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2>仪表盘</h2>
      <p>系统概览和统计数据</p>
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
            <el-icon><ChatDotRound /></el-icon>
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
          <el-icon><ChatDotRound /></el-icon>
          评论管理
        </el-button>
      </div>
    </el-card>

    <!-- 最近活动 -->
    <el-card class="recent-activity">
      <template #header>
        <div class="card-header">
          <span>最近活动</span>
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
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { ElMessage } from 'element-plus'

const stats = ref({
  totalUsers: 0,
  totalPosts: 0,
  totalComments: 0,
  todayUsers: 0
})

const recentActivities = ref([])

const getActivityType = (type) => {
  const typeMap = {
    '用户': 'success',
    '文章': 'primary',
    '评论': 'warning'
  }
  return typeMap[type] || 'info'
}

const loadData = async () => {
  try {
    // 加载真实数据
    
    // 获取用户总数 - 尝试不同的表名
    let userCount = 0
    const tableNames = ['profiles', 'users', 'user']
    
    for (const tableName of tableNames) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (!error && count) {
          userCount = count
          console.log(`✅ 从表 ${tableName} 获取到用户数据: ${count}`)
          break
        }
      } catch (err) {
        console.log(`❌ 表 ${tableName} 不存在或查询失败`)
      }
    }
    
    stats.value.totalUsers = userCount
    
    // 获取文章总数
    let postCount = 0
    try {
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
      
      if (!error) {
        postCount = count || 0
      }
    } catch (err) {
      console.log('文章表不存在')
    }
    
    stats.value.totalPosts = postCount
    
    // 获取评论总数
    let commentCount = 0
    try {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
      
      if (!error) {
        commentCount = count || 0
      }
    } catch (err) {
      console.log('评论表不存在')
    }
    
    stats.value.totalComments = commentCount
    
    // 获取今日新增用户
    const today = new Date().toISOString().split('T')[0]
    let todayUserCount = 0
    
    for (const tableName of tableNames) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today)
        
        if (!error && count) {
          todayUserCount = count
          break
        }
      } catch (err) {
        // 忽略错误，继续尝试下一个表
      }
    }
    
    stats.value.todayUsers = todayUserCount
    
    // 获取最近活动
    try {
      const { data: recentPosts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (!postsError && recentPosts) {
        recentPosts.forEach(post => {
          recentActivities.value.push({
            type: '文章',
            description: `文章 "${post.title}" 发布`,
            time: new Date(post.created_at).toLocaleString('zh-CN')
          })
        })
      }
    } catch (err) {
      console.log('无法获取最近文章')
    }
    
    try {
      const { data: recentComments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (!commentsError && recentComments) {
        recentComments.forEach(comment => {
          recentActivities.value.push({
            type: '评论',
            description: `用户发表了新评论`,
            time: new Date(comment.created_at).toLocaleString('zh-CN')
          })
        })
      }
    } catch (err) {
      console.log('无法获取最近评论')
    }
    
    // 按时间排序
    recentActivities.value.sort((a, b) => new Date(b.time) - new Date(a.time))
    recentActivities.value = recentActivities.value.slice(0, 4)
    
    // 如果所有数据都是0，显示提示信息
    if (stats.value.totalUsers === 0 && stats.value.totalPosts === 0 && stats.value.totalComments === 0) {
      ElMessage.warning('数据库中没有找到数据，请检查数据库表结构')
    }
    
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('数据加载失败，请检查数据库连接')
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
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.recent-activity {
  margin-bottom: 20px;
}
</style>