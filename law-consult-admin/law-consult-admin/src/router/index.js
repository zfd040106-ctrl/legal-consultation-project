import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store'

const Login = () => import('@/pages/login/Login.vue')
const Layout = () => import('@/components/Layout.vue')
const Dashboard = () => import('@/pages/dashboard/Dashboard.vue')

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      requiresAuth: false,
      title: '管理员登录'
    }
  },
  {
    path: '/',
    component: Layout,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: {
          title: '仪表盘',
          requiresAuth: true
        }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('@/pages/users/UserList.vue'),
        meta: {
          title: '用户管理',
          requiresAuth: true
        }
      },
      {
        path: 'lawyers/audit',
        name: 'LawyerAudit',
        component: () => import('@/pages/lawyers/LawyerAudit.vue'),
        meta: {
          title: '律师审核',
          requiresAuth: true
        }
      },
      {
        path: 'complaints',
        name: 'ComplaintManagement',
        component: () => import('@/pages/complaints/ComplaintManagement.vue'),
        meta: {
          title: '投诉管理',
          requiresAuth: true
        }
      },
      {
        path: 'consultations',
        name: 'ConsultationManagement',
        component: () => import('@/pages/consultations/ConsultationManagement.vue'),
        meta: {
          title: '咨询管理',
          requiresAuth: true
        }
      },
      {
        path: 'announcements',
        name: 'AnnouncementList',
        component: () => import('@/pages/announcements/AnnouncementList.vue'),
        meta: {
          title: '系统公告',
          requiresAuth: true
        }
      },
      {
        path: 'carousels',
        name: 'CarouselManagement',
        component: () => import('@/pages/carousels/CarouselManagement.vue'),
        meta: {
          title: '轮播图管理',
          requiresAuth: true
        }
      },
      {
        path: 'audit-logs',
        name: 'AuditLogs',
        component: () => import('@/pages/audit-logs/AuditLogs.vue'),
        meta: {
          title: '操作日志',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (!authStore.isLoggedIn) {
    authStore.initializeAuth()
  }

  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isLoggedIn) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  if (to.path === '/login' && authStore.isLoggedIn) {
    next('/dashboard')
    return
  }

  next()
})

router.afterEach((to) => {
  document.title = `${to.meta.title || '管理后台'} - 法律咨询平台`
})

export default router
