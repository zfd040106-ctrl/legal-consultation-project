<template>
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="logo-mark">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="36" rx="10" fill="#1a1a1a" />
          <path d="M18 9L9 13.5V16L18 11.5L27 16V13.5L18 9Z" fill="white" />
          <path d="M11 17V24L18 27.5L25 24V17L18 20.5L11 17Z" fill="white" fill-opacity="0.85" />
        </svg>
      </div>
      <span class="logo-text">法律咨询</span>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section">
        <div
          v-for="item in menuItems"
          :key="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          @click="navigateTo(item.path)"
        >
          <div class="nav-icon">
            <component :is="item.icon" />
          </div>
          <span class="nav-label">{{ item.label }}</span>
          <div v-if="isActive(item.path)" class="active-indicator"></div>
        </div>
      </div>
    </nav>

    <div class="sidebar-logout">
      <div class="nav-item" @click="handleLogout">
        <div class="nav-icon">
          <SwitchButton />
        </div>
        <span class="nav-label">退出登录</span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis,
  User,
  Briefcase,
  ChatLineSquare,
  Message,
  Notification,
  PictureFilled,
  SwitchButton
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const menuItems = computed(() => [
  { path: '/dashboard', label: '仪表盘', icon: DataAnalysis },
  { path: '/users', label: '用户管理', icon: User },
  { path: '/lawyers/audit', label: '律师审核', icon: Briefcase },
  { path: '/consultations', label: '咨询管理', icon: Message },
  { path: '/complaints', label: '投诉管理', icon: ChatLineSquare },
  { path: '/announcements', label: '系统公告', icon: Notification },
  { path: '/carousels', label: '轮播图管理', icon: PictureFilled }
])

const isActive = (path) => route.path === path || route.path.startsWith(path + '/')

const navigateTo = (path) => {
  if (path !== route.path) {
    router.push(path).catch((error) => {
      console.error('导航失败:', error)
    })
  }
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (error) {
    ElMessage.error('退出登录失败')
  }
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background-color: var(--bg-nav);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  padding: var(--spacing-4) 0;
  box-shadow: var(--shadow-sidebar);
}

.sidebar-logo {
  padding: var(--spacing-2) var(--spacing-5) var(--spacing-6);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.logo-mark {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-text {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0 var(--spacing-3);
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  color: var(--text-placeholder);
}

.nav-item:hover {
  background-color: var(--bg-hover);
  color: var(--text-secondary);
}

.nav-item.active {
  background-color: transparent;
  color: var(--text-primary);
}

.active-indicator {
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background-color: var(--gray-900);
  border-radius: 0 2px 2px 0;
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.nav-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  white-space: nowrap;
}

.sidebar-logout {
  padding: var(--spacing-2) var(--spacing-3) var(--spacing-4);
  width: 100%;
}

.sidebar-logout .nav-item {
  color: var(--gray-400);
}

.sidebar-logout .nav-item:hover {
  color: var(--danger-color);
  background-color: var(--danger-light);
}
</style>
