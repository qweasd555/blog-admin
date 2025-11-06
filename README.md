# 博客后台管理系统

基于 Vue 3 + Element Plus + Supabase 的现代化博客后台管理系统。

## 功能特性

- ✅ 用户管理 - 管理博客用户和权限
- ✅ 文章管理 - 管理系统文章内容
- ✅ 评论管理 - 审核和管理用户评论
- ✅ 仪表盘 - 系统概览和统计数据
- ✅ 响应式设计 - 支持移动端和桌面端
- ✅ 现代化 UI - 基于 Element Plus 组件库

## 技术栈

- **前端框架**: Vue 3 + Composition API
- **UI 组件库**: Element Plus
- **路由管理**: Vue Router 4
- **状态管理**: Pinia
- **后端服务**: Supabase (PostgreSQL)
- **构建工具**: Vite

## 快速开始

### 环境要求

- Node.js 16+ 
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制 `.env.example` 为 `.env`
2. 配置你的 Supabase 信息：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
src/
├── lib/
│   └── supabase.js          # Supabase 客户端配置
├── router/
│   └── index.js            # 路由配置
├── utils/
│   └── database-tester.js  # 数据库测试工具
├── views/
│   ├── Layout.vue          # 主布局组件
│   ├── Login.vue           # 登录页面
│   ├── Dashboard.vue       # 仪表盘
│   ├── Users.vue           # 用户管理
│   ├── Posts.vue           # 文章管理
│   └── Comments.vue        # 评论管理
├── App.vue                 # 根组件
└── main.js                 # 应用入口
```

## 数据库表结构

系统支持以下表结构（自动适配）：

### 用户表
- `profiles` / `users` / `user`
- 字段：id, username, email, created_at, status

### 文章表
- `posts` / `articles` / `post`
- 字段：id, title, content, author_id, created_at, status

### 评论表
- `comments` / `comment`
- 字段：id, content, author_id, post_id, created_at, status

## 演示账号

- 账号：admin
- 密码：admin123

## 开发说明

### 数据库连接测试

项目包含数据库测试工具，可以验证连接和表结构：

```javascript
import { runFullDatabaseTest } from './src/utils/database-tester.js'

// 运行完整测试
const result = await runFullDatabaseTest()
console.log('测试结果:', result)
```

### 路由守卫

系统使用路由守卫进行权限验证，未登录用户会自动跳转到登录页面。

### 响应式设计

所有页面都采用响应式设计，支持移动端和桌面端显示。

## 部署

### 构建生产版本

```bash
npm run build
```

### 部署到静态服务器

将 `dist` 目录部署到你的静态服务器即可。

## 许可证

MIT License