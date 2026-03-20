<template>
  <header class="header">
    <!-- 左侧：问候语 -->
    <div class="header-left">
      <div class="greeting">
        <h1 class="greeting-title">{{ greetingText }}，{{ authStore.adminName || '管理员' }}!</h1>
        <p class="greeting-subtitle">{{ currentPageTitle }}</p>
      </div>
    </div>

    <!-- 右侧：用户 -->
    <div class="header-right">
      <!-- 用户头像 -->
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-dropdown">
          <div class="user-avatar">
            <img v-if="adminAvatar" :src="adminAvatar" alt="头像" class="avatar-img" />
            <span v-else>{{ avatarText }}</span>
          </div>
          <el-icon class="dropdown-arrow" :size="14"><ArrowDown /></el-icon>
        </div>

        <template #dropdown>
          <el-dropdown-menu class="user-menu">
            <div class="menu-header">
              <div class="menu-avatar clickable" @click="triggerAvatarUpload" title="点击修改头像">
                <img v-if="adminAvatar" :src="adminAvatar" alt="头像" class="avatar-img" />
                <span v-else>{{ avatarText }}</span>
                <div class="avatar-overlay">
                  <el-icon :size="16"><Camera /></el-icon>
                </div>
              </div>
              <div class="menu-info">
                <span class="menu-role">{{ roleText }}</span>
              </div>
            </div>
            <el-dropdown-item command="changeAvatar" class="change-avatar-item">
              <el-icon><Camera /></el-icon>
              <span>修改头像</span>
            </el-dropdown-item>
            <el-dropdown-item command="logout" class="logout-item">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 隐藏的文件上传输入 -->
    <input
      ref="avatarInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleAvatarChange"
    />
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore, useAuthStore } from '@/store'
import { ElMessage } from 'element-plus'
import { ArrowDown, SwitchButton, Camera } from '@element-plus/icons-vue'
import { getAdminProfile, uploadAvatar, updateAdminAvatar } from '@/api/admin'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const adminAvatar = ref('')
const avatarInput = ref(null)
const isUploading = ref(false)
const greetingText = ref('')
let greetingTimer = null

// 问候语库
const greetings = {
  // 深夜 (0-5点)
  lateNight: [
    '夜深了',
    '凌晨的风很温柔',
    '星星都困了',
    '月亮替你值班',
    '世界在沉睡',
    '此刻的安静很珍贵',
    '黑夜给了你黑眼圈'
  ],
  // 早晨 (6-8点)
  morning: [
    '早安',
    '新的一天开始了',
    '阳光正好',
    '今天也要加油',
    '清晨的空气很新鲜',
    '早起的鸟儿有虫吃',
    '又是元气满满的一天'
  ],
  // 上午 (9-11点)
  forenoon: [
    '上午好',
    '工作愉快',
    '效率拉满中',
    '咖啡续命时间',
    '专注当下',
    '今日事今日毕',
    '状态在线'
  ],
  // 中午 (12-13点)
  noon: [
    '中午好',
    '该吃饭了',
    '干饭人干饭魂',
    '午餐决定下午的心情',
    '记得补充能量',
    '吃饱了才有力气工作'
  ],
  // 下午 (14-17点)
  afternoon: [
    '下午好',
    '下午茶时间到',
    '困了就站起来走走',
    '坚持就是胜利',
    '离下班又近了一点',
    '下午的阳光很慵懒',
    '摸鱼要适度'
  ],
  // 傍晚 (18-19点)
  evening: [
    '傍晚好',
    '夕阳无限好',
    '今天辛苦了',
    '下班倒计时',
    '晚霞很美',
    '忙碌的一天即将结束'
  ],
  // 晚上 (20-23点)
  night: [
    '晚上好',
    '夜生活开始了',
    '今晚的月色很美',
    '早点休息',
    '别熬夜了',
    '明天又是新的一天',
    '晚安世界'
  ]
}

// 根据时间获取问候语
const getGreeting = () => {
  const hour = new Date().getHours()
  let pool

  if (hour < 6) pool = greetings.lateNight
  else if (hour < 9) pool = greetings.morning
  else if (hour < 12) pool = greetings.forenoon
  else if (hour < 14) pool = greetings.noon
  else if (hour < 18) pool = greetings.afternoon
  else if (hour < 20) pool = greetings.evening
  else pool = greetings.night

  return pool[Math.floor(Math.random() * pool.length)]
}

// 更新问候语
const updateGreeting = () => {
  greetingText.value = getGreeting()
}

// 页面标题映射
const pageTitles = {
  '/dashboard': '管理后台',
  '/users': '用户管理',
  '/lawyers': '律师管理',
  '/lawyers/audit': '律师审核',
  '/consultations': '咨询管理',
  '/complaints': '投诉管理',
  '/announcements': '公告管理'
}

const currentPageTitle = computed(() => {
  return pageTitles[route.path] || '管理后台'
})

const avatarText = computed(() => {
  const name = authStore.adminName || '管理员'
  return name.charAt(0).toUpperCase()
})

const roleText = computed(() => {
  return authStore.adminRole === 'superAdmin' ? '超级管理员' : '管理员'
})

// 加载管理员头像
const loadAdminAvatar = async () => {
  try {
    const adminId = authStore.adminId
    if (!adminId) return

    const res = await getAdminProfile(adminId)
    if (res && res.avatar) {
      adminAvatar.value = res.avatar
    }
  } catch (error) {
    console.error('获取管理员信息失败:', error)
  }
}

// 触发头像上传
const triggerAvatarUpload = () => {
  if (avatarInput.value) {
    avatarInput.value.click()
  }
}

// 处理头像文件选择
const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }

  // 验证文件大小 (最大 5MB)
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return
  }

  isUploading.value = true
  try {
    // 上传头像文件
    const avatarUrl = await uploadAvatar(file)

    // 更新管理员头像
    const adminId = authStore.adminId
    await updateAdminAvatar(adminId, avatarUrl)

    // 更新本地显示
    adminAvatar.value = avatarUrl
    ElMessage.success('头像更新成功')
  } catch (error) {
    console.error('上传头像失败:', error)
    ElMessage.error(error.message || '上传头像失败')
  } finally {
    isUploading.value = false
    // 清空文件输入，允许再次选择同一文件
    if (avatarInput.value) {
      avatarInput.value.value = ''
    }
  }
}

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await authStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch (error) {
      ElMessage.error('退出登录失败')
    }
  } else if (command === 'changeAvatar') {
    triggerAvatarUpload()
  }
}

onMounted(() => {
  loadAdminAvatar()
  // 初始化问候语
  updateGreeting()
  // 每30分钟更新一次问候语
  greetingTimer = setInterval(updateGreeting, 30 * 60 * 1000)
})

onUnmounted(() => {
  if (greetingTimer) {
    clearInterval(greetingTimer)
  }
})
</script>

<style scoped>
.header {
  height: var(--header-height);
  background-color: var(--bg-nav);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-6);
  flex-shrink: 0;
  box-shadow: var(--shadow-header);
  position: relative;
  z-index: 10;
}

.header-left {
  flex-shrink: 0;
}

.greeting-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.greeting-subtitle {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin: 2px 0 0 0;
}

/* 右侧区域 */
.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

/* 用户下拉菜单 */
.user-dropdown {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-1);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.user-dropdown:hover {
  background-color: var(--bg-hover);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--gray-600), var(--gray-500));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bg-card);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dropdown-arrow {
  color: var(--text-tertiary);
}

/* 下拉菜单样式 */
:deep(.user-menu) {
  padding: 0 !important;
  min-width: 300px;
  border-radius: var(--radius-card) !important;
  box-shadow: var(--shadow-card) !important;
  border: 1px solid var(--border-light) !important;
  overflow: hidden;
}

.menu-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--border-light);
  background-color: var(--bg-hover);
}

.menu-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--gray-600), var(--gray-500));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bg-card);
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  overflow: hidden;
}

.menu-avatar.clickable {
  cursor: pointer;
}

.menu-avatar .avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out);
  color: var(--bg-card);
}

.menu-avatar.clickable:hover .avatar-overlay {
  opacity: 1;
}

.menu-info {
  display: flex;
  flex-direction: column;
}

.menu-name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.menu-role {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

:deep(.change-avatar-item) {
  padding: var(--spacing-3) var(--spacing-4) !important;
  color: var(--text-secondary) !important;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

:deep(.change-avatar-item:hover) {
  background-color: var(--bg-hover) !important;
}

:deep(.logout-item) {
  padding: var(--spacing-3) var(--spacing-4) !important;
  color: var(--danger-color) !important;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

:deep(.logout-item:hover) {
  background-color: var(--danger-light) !important;
}

/* 响应式 */
@media (max-width: 768px) {
  .header {
    padding: 0 var(--spacing-4);
  }

  .greeting-title {
    font-size: var(--text-lg);
  }
}
</style>
