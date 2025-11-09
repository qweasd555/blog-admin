<template>
  <div class="post-edit">
    <div class="page-header">
      <el-button @click="goBack" type="primary" size="small">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2>{{ isEdit ? '编辑文章' : '新建文章' }}</h2>
    </div>

    <el-card v-loading="loading">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文章标题" />
        </el-form-item>

        <el-form-item label="作者" prop="author">
          <el-input v-model="form.author" placeholder="请输入作者名称" />
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="10"
            placeholder="请输入文章内容"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { supabase } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const formRef = ref()

const postId = route.params.id
const isEdit = !!postId

const form = reactive({
  title: '',
  author: '', // 这里存储作者姓名（author_name）
  content: '',
  author_id: '' // 存储实际的author字段（UUID）
})

const rules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' }
  ],
  author: [
    { required: true, message: '请输入作者名称', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' }
  ]
}

const loadPostData = async () => {
  if (!isEdit) return
  
  try {
    loading.value = true
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()
    
    if (error) {
      console.error('获取文章数据失败:', error)
      ElMessage.error('获取文章数据失败')
      return
    }
    
    Object.assign(form, {
      title: data.title || '',
      author: data.author_name || data.author || '', // 优先显示作者姓名
      content: data.content || '',
      author_id: data.author || '' // 存储原author字段
    })
    
    console.log('📝 加载的文章数据:', data)
  } catch (error) {
    console.error('加载文章数据失败:', error)
    ElMessage.error('加载文章数据失败')
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    // 根据数据库表结构准备数据
    const postData = {
      title: form.title,
      content: form.content,
      author_name: form.author // 存储作者姓名
    }
    
    // 如果是编辑模式，保持原来的author字段（UUID）
    if (isEdit && form.author_id) {
      postData.author = form.author_id
    } else {
      // 新建模式，需要生成或获取合适的author ID
      // 这里简化处理：如果没有author_id，使用一个默认的UUID
      // 实际应用中应该从用户系统获取正确的author ID
      postData.author = 'admin-' + Date.now()
    }
    
    console.log('📝 准备保存文章数据:', postData)
    
    let result
    
    if (isEdit) {
      console.log('🔄 开始更新文章，ID:', postId)
      // 更新文章
      const { data, error } = await supabase
        .from('posts')
        .update(postData)
        .eq('id', postId)
        .select()
        
      if (error) {
        console.error('❌ 更新文章失败:', error)
        ElMessage.error(`更新失败: ${error.message}`)
        return
      }
      
      console.log('✅ 更新成功:', data)
      result = data
      ElMessage.success('文章更新成功')
    } else {
      console.log('➕ 开始创建新文章')
      // 创建新文章
      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        
      if (error) {
        console.error('❌ 创建文章失败:', error)
        ElMessage.error(`创建失败: ${error.message}`)
        return
      }
      
      console.log('✅ 创建成功:', data)
      result = data
      ElMessage.success('文章创建成功')
    }
    
    goBack()
  } catch (error) {
    console.error('保存文章失败:', error)
    ElMessage.error('保存文章失败，请检查表单数据')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/posts')
}

onMounted(() => {
  if (isEdit) {
    loadPostData()
  }
})
</script>

<style scoped>
.post-edit {
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

.el-form {
  max-width: 800px;
}
</style>