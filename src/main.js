import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// 按需注册图标（只注册常用的）
const requiredIcons = [
  'Edit', 'Delete', 'View', 'Search', 'Plus', 'Minus',
  'Setting', 'User', 'Lock', 'Message', 'Document', 'Folder'
]

requiredIcons.forEach(iconName => {
  const iconComponent = ElementPlusIconsVue[iconName]
  if (iconComponent) {
    app.component(iconName, iconComponent)
  }
})

app.use(createPinia())
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
  // 按需导入组件
  import: true,
  // 配置按需加载的组件
  components: [
    'ElButton', 'ElTable', 'ElTableColumn', 'ElForm', 'ElFormItem',
    'ElInput', 'ElSelect', 'ElOption', 'ElPagination', 'ElDialog',
    'ElMessage', 'ElMessageBox', 'ElLoading', 'ElMenu', 'ElMenuItem',
    'ElSubMenu', 'ElContainer', 'ElHeader', 'ElAside', 'ElMain'
  ]
})

app.mount('#app')