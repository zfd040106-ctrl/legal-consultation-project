<template>
  <div class="page-container">
    <div class="page-card">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <el-button link @click="goBack" class="back-btn">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <h2>操作日志</h2>
          <span class="header-count">共 {{ total }} 条</span>
        </div>
        <el-button @click="handleRefresh" :icon="Refresh" :loading="isLoading">
          刷新
        </el-button>
      </div>

      <!-- 日志列表 -->
      <div class="log-list" v-loading="isLoading">
        <div
          class="log-item"
          v-for="log in tableData"
          :key="log.id"
          :class="getActionClass(log.action)"
        >
          <div class="log-dot"></div>
          <p class="log-text">{{ formatLogText(log) }}</p>
          <span class="log-time">{{ formatDateTime(log.createdAt) }}</span>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-if="!isLoading && tableData.length === 0">
          <el-icon :size="48"><Document /></el-icon>
          <p>暂无操作日志</p>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-section" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @change="handlePageChange"
          background
          small
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, ArrowLeft, Document } from '@element-plus/icons-vue'
import { getAuditLogsList } from '@/api/admin'

const router = useRouter()

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const isLoading = ref(false)

const goBack = () => {
  router.back()
}

const loadAuditLogs = async () => {
  isLoading.value = true
  try {
    const response = await getAuditLogsList({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    if (response && response.items) {
      tableData.value = response.items
      total.value = response.total || 0
    } else if (Array.isArray(response)) {
      tableData.value = response
      total.value = response.length
    } else {
      tableData.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('加载操作日志失败:', error)
    ElMessage.error(error.message || '加载失败')
    tableData.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

const getActionClass = (action) => {
  const map = {
    'approve': 'success',
    'reject': 'warning',
    'delete': 'danger',
    'process': 'info'
  }
  return map[action] || 'info'
}

const formatStatus = (status) => {
  const map = {
    'pending_approval': '待审核',
    'active': '已通过',
    'blocked': '已拒绝',
    'pending': '待处理',
    'investigating': '调查中',
    'resolved': '已解决',
    'dismissed': '已驳回'
  }
  return map[status] || status
}

const formatLogText = (log) => {
  const { action, targetType, targetId, newStatus } = log

  if (targetType === 'lawyer') {
    if (action === 'approve') {
      return `审核通过了律师 #${targetId} 的注册申请`
    }
    if (action === 'reject') {
      return `拒绝了律师 #${targetId} 的注册申请`
    }
  }

  if (targetType === 'complaint') {
    if (newStatus) {
      return `处理了投诉 #${targetId}，状态更新为「${formatStatus(newStatus)}」`
    }
    return `处理了投诉 #${targetId}`
  }

  if (targetType === 'consultation' && action === 'delete') {
    return `删除了咨询 #${targetId}`
  }

  const actionText = { 'approve': '审核通过', 'reject': '拒绝', 'delete': '删除', 'process': '处理' }[action] || action
  const targetText = { 'lawyer': '律师', 'consultation': '咨询', 'complaint': '投诉' }[targetType] || targetType
  return `${actionText}了${targetText} #${targetId}`
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

const handleRefresh = () => {
  currentPage.value = 1
  loadAuditLogs()
}

const handlePageChange = () => {
  loadAuditLogs()
}

onMounted(() => {
  loadAuditLogs()
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
  overflow: hidden;
}

/* 头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5) var(--spacing-6);
  border-bottom: 1px solid var(--border-light);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.back-btn {
  padding: 0;
  font-size: 18px;
  color: var(--text-secondary);
}

.back-btn:hover {
  color: var(--text-primary);
}

.page-header h2 {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.header-count {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin-left: var(--spacing-2);
}

/* 日志列表 */
.log-list {
  padding: var(--spacing-2) var(--spacing-6);
  min-height: 300px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4) 0;
  border-bottom: 1px solid var(--border-light);
}

.log-item:last-child {
  border-bottom: none;
}

/* 圆点 */
.log-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.log-item.success .log-dot {
  background: var(--success-color);
}

.log-item.warning .log-dot {
  background: var(--warning-color);
}

.log-item.danger .log-dot {
  background: var(--danger-color);
}

.log-item.info .log-dot {
  background: var(--gray-400);
}

/* 内容 */
.log-text {
  flex: 1;
  font-size: var(--text-sm);
  color: var(--text-primary);
  margin: 0;
  line-height: 1.5;
}

.log-time {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  flex-shrink: 0;
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

/* 分页 */
.pagination-section {
  display: flex;
  justify-content: center;
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--border-light);
}
</style>
