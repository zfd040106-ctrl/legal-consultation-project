<template>
  <div class="page-container">
    <!-- 页面卡片 -->
    <div class="page-card">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-title">
          <h2>用户管理</h2>
          <span class="header-count">共 {{ displayTotal }} 条记录</span>
        </div>
        <div class="header-actions">
          <el-button @click="handleRefresh" :icon="Refresh" :loading="isLoading">
            刷新
          </el-button>
        </div>
      </div>

      <!-- 筛选区域 -->
      <div class="filter-section">
        <div class="filter-row">
          <el-input
            v-model="searchText"
            placeholder="搜索账号、用户名或手机号..."
            clearable
            class="search-input"
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-select
            v-model="filterRole"
            placeholder="角色筛选"
            clearable
            class="filter-select"
            @change="handleFilterChange"
          >
            <el-option label="用户" value="user" />
            <el-option label="律师" value="lawyer" />
          </el-select>
          <el-select
            v-model="filterStatus"
            placeholder="状态筛选"
            clearable
            class="filter-select"
            @change="handleFilterChange"
          >
            <el-option label="活跃" value="active" />
            <el-option label="禁用" value="blocked" />
          </el-select>
          <el-button type="primary" @click="handleSearch" :icon="Search">
            搜索
          </el-button>
        </div>
      </div>

      <!-- 表格区域 -->
      <div class="table-section">
        <el-table
          :data="tableData"
          v-loading="isLoading"
          element-loading-text="加载中..."
          class="custom-table"
          :header-cell-style="{ background: '#f8f9fb', color: '#52525b', fontWeight: 500 }"
        >
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="account" label="账号" min-width="120" />
          <el-table-column label="角色" width="100">
            <template #default="{ row }">
              <span class="role-tag" :class="row.role">
                {{ row.role === 'lawyer' ? '律师' : '用户' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="用户名" min-width="120" show-overflow-tooltip />
          <el-table-column prop="phone" label="手机号" width="130" />
          <el-table-column label="注册时间" width="160">
            <template #default="{ row }">
              <span class="time-text">{{ formatDate(row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <span class="status-badge" :class="row.status">
                <span class="status-dot"></span>
                {{ row.status === 'active' ? '活跃' : '禁用' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button link type="primary" size="small" @click="showDetail(row)">
                  详情
                </el-button>
                <el-button
                  link
                  :type="row.status === 'active' ? 'warning' : 'success'"
                  size="small"
                  @click="toggleStatus(row)"
                >
                  {{ row.status === 'active' ? '禁用' : '启用' }}
                </el-button>
                <el-button link type="danger" size="small" @click="handleDeleteUser(row)">
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>

          <!-- 空状态 -->
          <template #empty>
            <div class="empty-state">
              <el-icon :size="48"><User /></el-icon>
              <p>暂无用户数据</p>
            </div>
          </template>
        </el-table>
      </div>

      <!-- 分页区域 -->
      <div class="pagination-section" v-if="displayTotal > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @change="handlePageChange"
          background
          small
        />
      </div>
    </div>

    <!-- 用户详情抽屉 -->
    <el-drawer
      v-model="detailVisible"
      title="用户详情"
      direction="rtl"
      size="420px"
      class="detail-drawer"
    >
      <div v-if="selectedUser" class="detail-content">
        <!-- 用户头像区域 -->
        <div class="user-profile">
          <div class="profile-avatar">
            <img v-if="selectedUser.avatar" :src="selectedUser.avatar" alt="头像" class="avatar-img" />
            <span v-else>{{ selectedUser.username?.charAt(0)?.toUpperCase() || 'U' }}</span>
          </div>
          <div class="profile-info">
            <h3>{{ selectedUser.username || '未设置' }}</h3>
            <p>{{ selectedUser.account }}</p>
          </div>
          <span class="profile-status" :class="selectedUser.status">
            {{ selectedUser.status === 'active' ? '活跃' : '禁用' }}
          </span>
        </div>

        <!-- 信息列表 -->
        <div class="info-section">
          <div class="info-item">
            <span class="info-label">用户ID</span>
            <span class="info-value">{{ selectedUser.id }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">手机号</span>
            <span class="info-value">{{ selectedUser.phone || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">角色</span>
            <span class="info-value">
              <span class="role-tag" :class="selectedUser.role">
                {{ selectedUser.role === 'lawyer' ? '律师' : '普通用户' }}
              </span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">注册时间</span>
            <span class="info-value">{{ formatDate(selectedUser.createdAt) }}</span>
          </div>
        </div>

        <!-- 操作区域 -->
        <div class="action-section">
          <el-button
            :type="selectedUser.status === 'active' ? 'warning' : 'success'"
            @click="toggleStatus(selectedUser)"
            style="width: 100%"
          >
            {{ selectedUser.status === 'active' ? '禁用账号' : '启用账号' }}
          </el-button>
          <el-button type="danger" plain @click="handleDeleteUser(selectedUser)" style="width: 100%">
            删除用户
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, User } from '@element-plus/icons-vue'
import { getUsers, updateUserStatus, deleteUser } from '@/api/admin'

const allData = ref([])
const searchText = ref('')
const filterRole = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const isLoading = ref(false)
const detailVisible = ref(false)
const selectedUser = ref(null)

// 显示的总数（直接使用服务端返回的 total）
const displayTotal = computed(() => total.value)

// 加载用户列表（服务端分页和搜索）
const loadUsers = async () => {
  isLoading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    if (filterRole.value) {
      params.role = filterRole.value
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    if (searchText.value.trim()) {
      params.keyword = searchText.value.trim()
    }

    const response = await getUsers(params)
    if (response && response.items) {
      allData.value = response.items
      total.value = response.total || 0
    } else if (Array.isArray(response)) {
      allData.value = response
      total.value = response.length
    } else {
      allData.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error(error.message || '加载用户列表失败')
    allData.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

// 表格数据直接使用服务端返回的数据
const tableData = computed(() => allData.value)

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const showDetail = (user) => {
  selectedUser.value = { ...user }
  detailVisible.value = true
}

// 搜索（服务端搜索）
const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

// 状态筛选变化（服务端过滤）
const handleFilterChange = () => {
  currentPage.value = 1
  loadUsers()
}

const handleRefresh = () => {
  searchText.value = ''
  filterRole.value = ''
  filterStatus.value = ''
  currentPage.value = 1
  loadUsers()
}

const toggleStatus = (user) => {
  const newStatus = user.status === 'active' ? 'blocked' : 'active'
  const statusLabel = newStatus === 'active' ? '启用' : '禁用'

  ElMessageBox.confirm(
    `确定要${statusLabel}此用户吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await updateUserStatus(user.id, newStatus)
      user.status = newStatus
      if (selectedUser.value && selectedUser.value.id === user.id) {
        selectedUser.value.status = newStatus
      }
      ElMessage.success('状态已更新')
    } catch (error) {
      ElMessage.error(error.message || '更新状态失败')
    }
  }).catch(() => {})
}

const handleDeleteUser = (user) => {
  ElMessageBox.confirm(
    '确定要删除此用户吗？该操作不可撤销',
    '删除用户',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteUser(user.id)
      ElMessage.success('用户已删除')
      detailVisible.value = false
      loadUsers()
    } catch (error) {
      ElMessage.error(error.message || '删除用户失败')
    }
  }).catch(() => {})
}

// 分页变化（服务端分页，保持搜索条件）
const handlePageChange = () => {
  loadUsers()
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.page-container {
  width: 100%;
}

.page-card {
  background: var(--bg-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  border: none;
  overflow: hidden;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5) var(--spacing-6);
  border-bottom: 1px solid var(--border-light);
}

.header-title {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-3);
}

.header-title h2 {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.header-count {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

/* 筛选区域 */
.filter-section {
  padding: var(--spacing-4) var(--spacing-6);
  background: transparent;
  border-bottom: 1px solid var(--border-light);
}

.filter-row {
  display: flex;
  gap: var(--spacing-3);
  align-items: center;
}

.search-input {
  width: 280px;
}

.filter-select {
  width: 140px;
}

/* 表格区域 */
.table-section {
  padding: 0 var(--spacing-6);
}

.custom-table {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: transparent;
}

:deep(.el-table__header th) {
  font-weight: var(--font-medium) !important;
  font-size: var(--text-sm);
  color: var(--text-tertiary) !important;
  background: transparent !important;
}

:deep(.el-table__body td) {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-light) !important;
}

:deep(.el-table__row:hover td) {
  background-color: var(--bg-hover) !important;
}

/* 角色标签 */
.role-tag {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.role-tag.lawyer {
  background: var(--success-light);
  color: var(--success-color);
}

.role-tag.user {
  background: var(--gray-100);
  color: var(--text-secondary);
}

/* 状态标签 */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-badge.active {
  color: var(--success-color);
}

.status-badge.active .status-dot {
  background: var(--success-color);
}

.status-badge.blocked {
  color: var(--danger-color);
}

.status-badge.blocked .status-dot {
  background: var(--danger-color);
}

/* 时间文本 */
.time-text {
  color: var(--text-tertiary);
  font-size: var(--text-xs);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: var(--spacing-2);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-12) 0;
  color: var(--text-placeholder);
}

.empty-state p {
  margin-top: var(--spacing-3);
  font-size: var(--text-sm);
}

/* 分页区域 */
.pagination-section {
  display: flex;
  justify-content: flex-end;
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--border-light);
}

.filter-hint {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

/* 详情抽屉 */
.detail-content {
  padding: var(--spacing-5);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding-bottom: var(--spacing-5);
  border-bottom: 1px solid var(--border-light);
  margin-bottom: var(--spacing-5);
}

.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--gray-600), var(--gray-400));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  overflow: hidden;
}

.profile-avatar .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info {
  flex: 1;
}

.profile-info h3 {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-1) 0;
}

.profile-info p {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin: 0;
}

.profile-status {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.profile-status.active {
  background: var(--success-light);
  color: var(--success-color);
}

.profile-status.blocked {
  background: var(--danger-light);
  color: var(--danger-color);
}

/* 信息列表 */
.info-section {
  margin-bottom: var(--spacing-6);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) 0;
  border-bottom: 1px solid var(--border-light);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.info-value {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

/* 操作区域 */
.action-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}
</style>
