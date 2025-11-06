import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue')
      },
      {
        path: 'posts',
        name: 'Posts',
        component: () => import('@/views/Posts.vue')
      },
      {
        path: 'posts/detail/:id',
        name: 'PostDetail',
        component: () => import('@/views/PostDetail.vue')
      },
      {
        path: 'posts/edit/:id?',
        name: 'PostEdit',
        component: () => import('@/views/PostEdit.vue')
      },
      {
        path: 'comments',
        name: 'Comments',
        component: () => import('@/views/Comments.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('admin_token')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router