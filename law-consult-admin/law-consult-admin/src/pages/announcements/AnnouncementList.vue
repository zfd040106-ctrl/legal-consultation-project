<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <div class="header-title">
          <h2>系统公告</h2>
          <span class="header-count">共 {{ displayTotal }} 条记录</span>
        </div>
        <div class="header-actions">
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">
            新建公告
          </el-button>
          <el-button :icon="Refresh" :loading="isLoading" @click="loadAnnouncements">
            刷新
          </el-button>
        </div>
      </div>

      <div class="filter-section">
        <div class="filter-row">
          <el-input
            v-model="searchText"
            placeholder="搜索公告标题..."
            clearable
            class="search-input"
            :prefix-icon="Search"
            @keyup.enter="applySearch"
            @clear="applySearch"
          />
          <el-select
            v-model="filterStatus"
            placeholder="全部状态"
            clearable
            class="status-filter"
            @change="applySearch"
          >
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-button type="primary" :icon="Search" @click="applySearch">
            搜索
          </el-button>
        </div>
      </div>

      <div class="table-section">
        <el-table
          :data="tableData"
          v-loading="isLoading"
          element-loading-text="加载中..."
          class="custom-table"
          :header-cell-style="{ background: '#f8f9fb', color: '#52525b', fontWeight: 500 }"
        >
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="title" label="标题" min-width="240" show-overflow-tooltip />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="置顶" width="100">
            <template #default="{ row }">
              <span class="pin-badge" :class="{ pinned: row.isPinned }">
                <span class="pin-dot"></span>
                {{ row.isPinned ? '已置顶' : '未置顶' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="发布时间" width="180">
            <template #default="{ row }">
              <span class="time-text">{{ formatDateTime(row.publishedAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button link type="primary" size="small" @click="editAnnouncement(row)">
                  编辑
                </el-button>
                <el-button
                  link
                  :type="row.isPinned ? 'warning' : 'success'"
                  size="small"
                  @click="togglePin(row)"
                >
                  {{ row.isPinned ? '取消置顶' : '置顶' }}
                </el-button>
                <el-button link type="danger" size="small" @click="deleteAnnouncement(row)">
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>

          <template #empty>
            <div class="empty-state">
              <el-icon :size="48"><Notification /></el-icon>
              <p>暂无公告数据</p>
            </div>
          </template>
        </el-table>
      </div>

      <div class="pagination-section" v-if="displayTotal > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
          small
          @change="loadAnnouncements"
        />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      class="announcement-dialog"
    >
      <div class="form-content">
        <div class="form-item">
          <label class="form-label required">公告标题</label>
          <el-input v-model="formData.title" placeholder="请输入公告标题" />
        </div>
        <div class="form-item">
          <label class="form-label required">公告内容</label>
          <el-input
            v-model="formData.content"
            type="textarea"
            placeholder="请输入公告内容"
            :rows="6"
          />
        </div>
        <div class="form-item">
          <label class="form-label required">公告状态</label>
          <el-select v-model="formData.status" class="dialog-select">
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
        <div class="form-item">
          <label class="form-label">置顶设置</label>
          <div class="switch-wrapper">
            <el-switch v-model="formData.isPinned" />
            <span class="switch-label">{{ formData.isPinned ? '置顶显示' : '普通显示' }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAnnouncement">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Notification, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store'
import {
  createAnnouncement,
  deleteAnnouncement as deleteAnnouncementApi,
  getAnnouncements,
  pinAnnouncement,
  unpinAnnouncement,
  updateAnnouncement
} from '@/api/admin'

const authStore = useAuthStore()

const statusOptions = [
  { label: '已发布', value: 'published' },
  { label: '草稿', value: 'draft' }
]

const tableData = ref([])
const searchText = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const isLoading = ref(false)

const dialogVisible = ref(false)
const dialogTitle = ref('新建公告')
const isEditing = ref(false)
const formData = ref(createDefaultForm())

const displayTotal = computed(() => total.value)

function createDefaultForm() {
  return {
    id: null,
    title: '',
    content: '',
    status: 'published',
    isPinned: false
  }
}

function getStatusLabel(status) {
  return status === 'draft' ? '草稿' : '已发布'
}

function getStatusTagType(status) {
  return status === 'draft' ? 'info' : 'success'
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function loadAnnouncements() {
  isLoading.value = true

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('请求超时，请检查网络连接')), 15000)
  })

  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }

    if (searchText.value.trim()) {
      params.keyword = searchText.value.trim()
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }

    const response = await Promise.race([
      getAnnouncements(params),
      timeoutPromise
    ])

    if (response && response.items) {
      tableData.value = response.items
      total.value = response.total || 0
    } else if (Array.isArray(response)) {
      tableData.value = response
      total.value = response.length
    } else if (response && typeof response === 'object') {
      const dataArray = response.data || response
      tableData.value = Array.isArray(dataArray) ? dataArray : []
      total.value = tableData.value.length
    } else {
      tableData.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('加载公告失败:', error)
    ElMessage.error(error.message || '加载公告失败')
    tableData.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

function applySearch() {
  currentPage.value = 1
  loadAnnouncements()
}

function openCreateDialog() {
  isEditing.value = false
  dialogTitle.value = '新建公告'
  formData.value = createDefaultForm()
  dialogVisible.value = true
}

function editAnnouncement(announcement) {
  isEditing.value = true
  dialogTitle.value = '编辑公告'
  formData.value = {
    id: announcement.id,
    title: announcement.title || '',
    content: announcement.content || '',
    status: announcement.status || 'published',
    isPinned: Boolean(announcement.isPinned)
  }
  dialogVisible.value = true
}

async function saveAnnouncement() {
  if (!formData.value.title.trim()) {
    ElMessage.warning('请输入公告标题')
    return
  }
  if (!formData.value.content.trim()) {
    ElMessage.warning('请输入公告内容')
    return
  }

  try {
    if (isEditing.value) {
      await updateAnnouncement(formData.value.id, {
        title: formData.value.title.trim(),
        content: formData.value.content.trim(),
        isPinned: formData.value.isPinned,
        status: formData.value.status
      })
      ElMessage.success('公告已更新')
    } else {
      await createAnnouncement({
        adminId: Number(authStore.adminId),
        title: formData.value.title.trim(),
        content: formData.value.content.trim(),
        isPinned: formData.value.isPinned,
        status: formData.value.status
      })
      ElMessage.success('公告已创建')
    }

    dialogVisible.value = false
    loadAnnouncements()
  } catch (error) {
    ElMessage.error(error.message || '保存公告失败')
  }
}

function deleteAnnouncement(announcement) {
  ElMessageBox.confirm('确定要删除此公告吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        await deleteAnnouncementApi(announcement.id)
        ElMessage.success('公告已删除')
        loadAnnouncements()
      } catch (error) {
        ElMessage.error(error.message || '删除公告失败')
      }
    })
    .catch(() => {})
}

async function togglePin(announcement) {
  try {
    if (announcement.isPinned) {
      await unpinAnnouncement(announcement.id)
      ElMessage.success('已取消置顶')
    } else {
      await pinAnnouncement(announcement.id)
      ElMessage.success('已置顶')
    }
    loadAnnouncements()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

onMounted(() => {
  loadAnnouncements()
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

.header-actions {
  display: flex;
  gap: var(--spacing-3);
}

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

.status-filter {
  width: 140px;
}

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

.pin-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-tertiary);
}

.pin-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--gray-300);
}

.pin-badge.pinned {
  color: var(--warning-color);
}

.pin-badge.pinned .pin-dot {
  background: var(--warning-color);
}

.time-text {
  color: var(--text-tertiary);
  font-size: var(--text-xs);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-2);
}

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

.pagination-section {
  display: flex;
  justify-content: flex-end;
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--border-light);
}

.form-content {
  padding: var(--spacing-2);
}

.form-item {
  margin-bottom: var(--spacing-5);
}

.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.form-label.required::before {
  content: '*';
  color: var(--danger-color);
  margin-right: 4px;
}

.dialog-select {
  width: 100%;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.switch-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
}
</style>
