<template>
  <div class="login-container">
    <div class="login-form">
      <div class="login-header">
        <h2>博客后台管理系统</h2>
        <p>管理员登录</p>
      </div>
      
      <el-form :model="form" :rules="rules" ref="loginForm" class="form">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="管理员账号"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          @click="handleLogin"
          class="login-btn"
        >
          登录
        </el-button>
      </el-form>
      
      <div class="demo-info">
        <p><strong>演示账号：</strong></p>
        <p>账号：admin</p>
        <p>密码：admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const loginForm = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入管理员账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginForm.value) return
  
  try {
    await loginForm.value.validate()
    loading.value = true
    
    // 模拟登录验证（演示用）
    if (form.username === 'admin' && form.password === 'admin123') {
      // 模拟成功登录
      const mockUser = {
        id: 'demo-admin-id',
        email: 'admin@example.com',
        username: 'admin',
        loginTime: new Date().toISOString()
      }
      
      // 保存用户信息到本地存储
      localStorage.setItem('admin_token', mockUser.id)
      localStorage.setItem('admin_user', JSON.stringify(mockUser))
      
      ElMessage.success('登录成功（演示模式）')
      router.push('/dashboard')
    } else {
      ElMessage.error('账号或密码错误，请使用演示账号：admin / admin123')
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #333;
  margin-bottom: 10px;
}

.login-header p {
  color: #666;
  font-size: 14px;
}

.form {
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  margin-top: 10px;
}

.demo-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  font-size: 14px;
  color: #666;
}

.demo-info p {
  margin: 5px 0;
}
</style>