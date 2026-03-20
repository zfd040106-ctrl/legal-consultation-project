<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <div class="header-title">
          <h2>咨询管理</h2>
          <span class="header-count">共 {{ displayTotal }} 条记录</span>
        </div>
      </div>

      <div class="filter-section">
        <div class="filter-row">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索标题/用户/律师"
            clearable
            class="search-input"
            :prefix-icon="Search"
            @keyup.enter="applyFilters"
            @clear="applyFilters"
          />
          <el-select
            v-model="filters.type"
            placeholder="咨询类型"
            clearable
            class="filter-select"
            @change="applyFilters"
          >
            <el-option label="公开咨询" value="public" />
            <el-option label="定向咨询" value="directed" />
          </el-select>
          <el-select
            v-model="filters.status"
            placeholder="状态"
            clearable
            class="filter-select"
            @change="applyFilters"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-select
            v-model="filters.priority"
            placeholder="优先级"
            clearable
            class="filter-select"
            @change="applyFilters"
          >
            <el-option
              v-for="item in priorityOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-button type="primary" :icon="Search" class="search-button" @click="applyFilters">
            搜索
          </el-button>
        </div>
      </div>

      <div class="table-section">
        <el-table
          :data="tableData"
          v-loading="isLoading"
          element-loading-text="加载中..."
          class="consultation-table"
          :header-cell-style="{ background: '#f8fafc', color: '#667085', fontWeight: 600 }"
          highlight-current-row
          :row-class-name="getRowClassName"
          @row-click="showDetail"
        >
          <el-table-column prop="id" label="ID" width="68" />
          <el-table-column prop="userName" label="用户" width="88" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.userName || '--' }}
            </template>
          </el-table-column>
          <el-table-column prop="lawyerName" label="律师" width="88" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.lawyerName || '--' }}
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="260" show-overflow-tooltip />
          <el-table-column prop="category" label="分类" width="108" show-overflow-tooltip align="center">
            <template #default="{ row }">
              {{ row.category || '未分类' }}
            </template>
          </el-table-column>
          <el-table-column label="类型" width="104" align="center">
            <template #default="{ row }">
              <span class="type-badge" :class="row.assignmentType">
                {{ getTypeLabel(row.assignmentType) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="112" align="center">
            <template #default="{ row }">
              <span class="status-badge" :class="row.status">
                {{ getStatusLabel(row.status) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="96" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="showDetail(row)">
                详情
              </el-button>
            </template>
          </el-table-column>

          <template #empty>
            <div class="empty-state">
              <el-icon :size="44"><Message /></el-icon>
              <p>暂无咨询记录</p>
            </div>
          </template>
        </el-table>
      </div>

      <div v-if="displayTotal > 0" class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
          small
          @size-change="handlePaginationChange"
          @current-change="handlePaginationChange"
        />
      </div>
    </div>

    <el-drawer
      v-model="detailVisible"
      title="咨询详情"
      direction="rtl"
      size="525px"
      class="detail-drawer"
      @closed="resetDetail"
    >
      <div v-loading="detailLoading" class="detail-body">
        <template v-if="selectedConsultation">
          <div class="detail-header">
            <h3 class="detail-title">{{ selectedConsultation.title || '未命名咨询' }}</h3>
            <div class="drawer-meta">
              <span class="type-badge large" :class="selectedConsultation.assignmentType">
                {{ getTypeLabel(selectedConsultation.assignmentType) }}
              </span>
              <span class="drawer-status" :class="selectedConsultation.status">
                <span class="status-dot"></span>
                {{ getStatusLabel(selectedConsultation.status) }}
              </span>
            </div>
          </div>

          <section class="section-block">
            <div class="section-title">基本信息</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">咨询ID</span>
                <span class="info-value">{{ selectedConsultation.id }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">分类</span>
                <span class="info-value">{{ selectedConsultation.category || '未分类' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">类型</span>
                <span class="info-value">{{ getTypeLabel(selectedConsultation.assignmentType) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">用户</span>
                <span class="info-value">{{ selectedConsultation.userName || '--' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">律师信息</span>
                <span class="info-value">{{ selectedConsultation.lawyerName || '未分配' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">优先级</span>
                <span class="info-value">{{ getPriorityLabel(selectedConsultation.priority) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间</span>
                <span class="info-value">{{ formatDateTime(selectedConsultation.createdAt) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">更新时间</span>
                <span class="info-value">{{ formatDateTime(selectedConsultation.updatedAt) }}</span>
              </div>
            </div>
          </section>

          <section class="section-block">
            <div class="section-title">详细描述</div>
            <div class="description-box">
              {{ selectedConsultation.description || '暂无详细描述' }}
            </div>
          </section>

          <section v-if="attachmentItems.length > 0" class="section-block">
            <div class="section-title">附件 ({{ attachmentItems.length }})</div>
            <div class="attachment-list">
              <button
                v-for="(attachment, index) in attachmentItems"
                :key="`${selectedConsultation.id}-${index}`"
                type="button"
                class="attachment-card"
                @click="previewAttachment(attachment)"
              >
                <img
                  v-if="attachment.isImage"
                  :src="attachment.url"
                  :alt="attachment.name"
                  class="attachment-image"
                />
                <div v-else class="attachment-file">
                  <el-icon :size="20"><Document /></el-icon>
                  <span>{{ attachment.name }}</span>
                </div>
              </button>
            </div>
          </section>
        </template>
      </div>

      <template #footer>
        <div class="drawer-footer">
          <el-button
            type="primary"
            class="primary-action"
            :disabled="!selectedConsultation"
            @click="handleStatusChange"
          >
            更新状态
          </el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog
      v-model="statusDialogVisible"
      title="更新咨询状态"
      width="420px"
      class="status-dialog"
    >
      <div class="status-form">
        <label class="form-label">选择新状态</label>
        <el-select v-model="statusForm.status" placeholder="请选择状态" style="width: 100%">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="statusDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitStatusChange">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="imagePreviewVisible"
      title="附件预览"
      width="72%"
      class="image-preview-dialog"
    >
      <div class="image-preview-container">
        <img :src="previewImageUrl" alt="附件预览" class="preview-image" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Message, Search } from '@element-plus/icons-vue'
import {
  getConsultationDetail,
  getConsultations,
  updateConsultationStatus
} from '@/api/admin'

const BACKEND_ORIGIN = 'http://localhost:8080'

const statusOptions = [
  { label: '公开中', value: 'open' },
  { label: '待接单', value: 'pending_accept' },
  { label: '处理中', value: 'in_progress' },
  { label: '已解决', value: 'resolved' },
  { label: '已关闭', value: 'closed' }
]

const priorityOptions = [
  { label: '低优先级', value: 'low' },
  { label: '中优先级', value: 'medium' },
  { label: '高优先级', value: 'high' }
]

const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const isLoading = ref(false)

const filters = ref({
  keyword: '',
  type: '',
  status: '',
  priority: ''
})

const detailVisible = ref(false)
const detailLoading = ref(false)
const selectedConsultation = ref(null)

const statusDialogVisible = ref(false)
const statusForm = ref({
  status: ''
})

const imagePreviewVisible = ref(false)
const previewImageUrl = ref('')

const displayTotal = computed(() => total.value)

const attachmentItems = computed(() => {
  if (!selectedConsultation.value?.attachments) {
    return []
  }

  const attachments = parseAttachments(selectedConsultation.value.attachments)
  return attachments.map((item, index) => {
    const url = normalizeAssetUrl(item)
    return {
      key: `${selectedConsultation.value.id}-${index}`,
      raw: item,
      url,
      name: getFileName(item),
      isImage: isImageUrl(item)
    }
  })
})

const parseAttachments = (attachments) => {
  if (!attachments) {
    return []
  }

  if (Array.isArray(attachments)) {
    return attachments.filter(Boolean)
  }

  if (typeof attachments !== 'string') {
    return []
  }

  try {
    const parsed = JSON.parse(attachments)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return attachments.split(',').map(item => item.trim()).filter(Boolean)
  }
}

const normalizeConsultation = (consultation = {}) => ({
  ...consultation,
  assignmentType: consultation.assignmentType || 'public'
})

const normalizeAssetUrl = (url) => {
  if (!url) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(url) || /^data:|^blob:/i.test(url)) {
    return url
  }

  if (url.startsWith('/uploads/')) {
    return `${BACKEND_ORIGIN}${url}`
  }

  if (url.startsWith('uploads/')) {
    return `${BACKEND_ORIGIN}/${url}`
  }

  return `${BACKEND_ORIGIN}/uploads/${url.replace(/^\/+/, '')}`
}

const formatDateTime = (value) => {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const getTypeLabel = (type) => {
  if (type === 'directed') {
    return '定向'
  }
  return '公开'
}

const getStatusLabel = (status) => {
  const labels = {
    open: '公开中',
    pending_accept: '待接单',
    in_progress: '处理中',
    resolved: '已解决',
    closed: '已关闭'
  }
  return labels[status] || status || '--'
}

const getPriorityLabel = (priority) => {
  const labels = {
    low: '低优先级',
    medium: '中优先级',
    high: '高优先级'
  }
  return labels[priority] || '中优先级'
}

const isImageUrl = (url) => {
  if (!url) {
    return false
  }

  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].some(ext => cleanUrl.endsWith(ext))
}

const getFileName = (url) => {
  if (!url) {
    return '附件'
  }

  const normalizedUrl = url.split('?')[0]
  const segments = normalizedUrl.split('/')
  const fileName = decodeURIComponent(segments[segments.length - 1] || '附件')
  return fileName.length > 24 ? `${fileName.slice(0, 21)}...` : fileName
}

const getRowClassName = () => 'clickable-row'

const loadConsultations = async () => {
  isLoading.value = true

  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }

    if (filters.value.keyword.trim()) {
      params.keyword = filters.value.keyword.trim()
    }
    if (filters.value.type) {
      params.type = filters.value.type
    }
    if (filters.value.status) {
      params.status = filters.value.status
    }
    if (filters.value.priority) {
      params.priority = filters.value.priority
    }

    const response = await getConsultations(params)
    const items = Array.isArray(response?.items) ? response.items : []

    tableData.value = items.map(item => normalizeConsultation(item))
    total.value = Number(response?.total || 0)
  } catch (error) {
    tableData.value = []
    total.value = 0
    ElMessage.error(error.message || '加载咨询列表失败')
  } finally {
    isLoading.value = false
  }
}

const applyFilters = () => {
  currentPage.value = 1
  loadConsultations()
}

const handlePaginationChange = () => {
  loadConsultations()
}

const loadConsultationDetail = async (consultationId, closeOnError = false) => {
  if (!consultationId) {
    return
  }

  detailLoading.value = true
  selectedConsultation.value = null

  try {
    const response = await getConsultationDetail(consultationId)
    selectedConsultation.value = normalizeConsultation(response)
  } catch (error) {
    selectedConsultation.value = null
    if (closeOnError) {
      detailVisible.value = false
    }
    throw error
  } finally {
    detailLoading.value = false
  }
}

const showDetail = async (consultation) => {
  if (!consultation?.id) {
    return
  }

  detailVisible.value = true

  try {
    await loadConsultationDetail(consultation.id, true)
  } catch (error) {
    ElMessage.error(error.message || '加载咨询详情失败')
  }
}

const resetDetail = () => {
  selectedConsultation.value = null
  detailLoading.value = false
}

const handleStatusChange = () => {
  if (!selectedConsultation.value) {
    return
  }

  statusForm.value.status = selectedConsultation.value.status || ''
  statusDialogVisible.value = true
}

const submitStatusChange = async () => {
  if (!selectedConsultation.value?.id || !statusForm.value.status) {
    ElMessage.warning('请选择要更新的状态')
    return
  }

  try {
    await updateConsultationStatus(selectedConsultation.value.id, statusForm.value.status)
    statusDialogVisible.value = false
    ElMessage.success('咨询状态已更新')
    await Promise.all([
      loadConsultations(),
      loadConsultationDetail(selectedConsultation.value.id)
    ])
  } catch (error) {
    ElMessage.error(error.message || '更新咨询状态失败')
  }
}

const previewAttachment = (attachment) => {
  if (!attachment?.url) {
    return
  }

  if (attachment.isImage) {
    previewImageUrl.value = attachment.url
    imagePreviewVisible.value = true
    return
  }

  window.open(attachment.url, '_blank', 'noopener')
}

onMounted(() => {
  loadConsultations()
})
</script>

<style scoped>
.page-container {
  width: 100%;
}

.page-card {
  overflow: hidden;
  background: var(--bg-card);
  border: none;
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-5) var(--spacing-6);
  border-bottom: 1px solid var(--border-light);
}

.header-title {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-3);
}

.header-title h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
}

.header-count {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.filter-section {
  padding: var(--spacing-4) var(--spacing-6);
  border-bottom: 1px solid var(--border-light);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-3);
}

.search-input {
  width: 260px;
}

.filter-select {
  width: 118px;
}

.search-button {
  min-width: 90px;
}

.table-section {
  padding: 0 var(--spacing-6);
}

.consultation-table {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: transparent;
}

:deep(.consultation-table .el-table__header th) {
  background: transparent !important;
  color: #667085 !important;
  font-size: 13px;
  font-weight: 600 !important;
}

:deep(.consultation-table .el-table__body td) {
  color: var(--text-secondary);
  font-size: 13px;
  border-bottom: 1px solid var(--border-light) !important;
}

:deep(.consultation-table .clickable-row) {
  cursor: pointer;
}

:deep(.consultation-table .el-table__row:hover td) {
  background: #f8fafc !important;
}

.type-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.type-badge.large,
.status-badge.large {
  padding: 6px 12px;
  font-size: 13px;
}

.type-badge.public {
  color: #475467;
  background: #f2f4f7;
}

.type-badge.directed {
  color: #b54708;
  background: #fffaeb;
}

.status-badge.open {
  color: #475467;
  background: #f2f4f7;
}

.status-badge.pending_accept {
  color: #b54708;
  background: #fffaeb;
}

.status-badge.in_progress {
  color: #344054;
  background: #eef2ff;
}

.status-badge.resolved {
  color: #027a48;
  background: #ecfdf3;
}

.status-badge.closed {
  color: #b42318;
  background: #fef3f2;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: var(--spacing-12) 0;
  color: var(--text-placeholder);
}

.empty-state p {
  margin: 0;
  font-size: var(--text-sm);
}

.pagination-section {
  display: flex;
  justify-content: flex-end;
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--border-light);
}

.detail-header {
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--border-light);
}

.detail-title {
  margin: 0 0 10px 0;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.7;
}

.detail-body {
  min-height: 280px;
  padding: 20px 20px 12px;
}

.drawer-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.drawer-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
}

.drawer-status.open {
  color: #475467;
}

.drawer-status.pending_accept {
  color: #b54708;
}

.drawer-status.in_progress {
  color: #344054;
}

.drawer-status.resolved {
  color: #027a48;
}

.drawer-status.closed {
  color: #b42318;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.section-block {
  margin-bottom: 22px;
}

.section-title {
  margin-bottom: 12px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.info-label {
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.4;
}

.info-value {
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  word-break: break-word;
}

.description-box {
  padding: 14px 14px;
  color: var(--text-secondary);
  background: #f8fafc;
  border: 1px solid #eef2f6;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.attachment-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(84px, 84px));
  gap: 12px;
  justify-content: flex-start;
}

.attachment-card {
  display: flex;
  align-items: stretch;
  justify-content: center;
  width: 84px;
  min-height: 108px;
  padding: 0;
  background: #fff;
  border: 1px solid #eaecf0;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.attachment-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.attachment-image {
  width: 100%;
  height: 108px;
  object-fit: cover;
}

.attachment-file {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: var(--text-secondary);
  font-size: 12px;
  text-align: center;
  word-break: break-all;
}

.drawer-footer {
  padding: 0 20px 18px;
}

.primary-action {
  width: 100%;
  height: 40px;
  background: #0f172a;
  border-color: #0f172a;
  border-radius: 999px;
}

.primary-action:hover,
.primary-action:focus {
  background: #111c35;
  border-color: #111c35;
}

.status-form {
  padding-top: var(--spacing-2);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-2);
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
}

.image-preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 70vh;
  overflow: auto;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

:deep(.detail-drawer .el-drawer__header) {
  padding: 18px 20px;
}

:deep(.detail-drawer .el-drawer__body) {
  padding: 0;
}

:deep(.detail-drawer .el-drawer__footer) {
  padding: 0;
  border-top: none;
  box-shadow: none;
}

:deep(.detail-drawer .el-button + .el-button) {
  margin-left: 0;
}

.drawer-meta .type-badge.large {
  min-width: auto;
  padding: 4px 10px;
  font-size: 12px;
}

@media (max-width: 960px) {
  .search-input,
  .filter-select,
  .search-button {
    width: 100%;
  }

  .info-grid,
  .attachment-list {
    grid-template-columns: 1fr;
  }

  .attachment-card {
    width: 100%;
  }
}
</style>
