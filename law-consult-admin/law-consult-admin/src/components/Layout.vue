<template>
  <div class="layout">
    <!-- 侧边栏 -->
    <Sidebar />

    <!-- 主要内容区 -->
    <div class="layout-main">
      <!-- 顶部导航 -->
      <Header />

      <!-- 内容区 -->
      <main class="layout-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/store'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

const authStore = useAuthStore()

onMounted(() => {
  // 恢复认证状态
  authStore.initializeAuth()
})
</script>

<style scoped>
.layout {
  width: 100%;
  height: 100vh;
  display: flex;
  overflow: hidden;
  background-color: var(--bg-page);
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  margin-left: var(--sidebar-width);
  box-sizing: border-box;
}

.layout-content {
  flex: 1;
  overflow: auto;
  padding: var(--spacing-5);
  background-color: var(--bg-page);
}

/* 响应式 */
@media (max-width: 768px) {
  .layout-content {
    padding: var(--spacing-4);
  }
}
</style>
