<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <div class="header-title">
          <h2>投诉管理</h2>
          <span class="header-count">共 {{ total }} 条记录</span>
        </div>
      </div>

      <div class="filter-section">
        <div class="filter-row">
          <el-input
            v-model="searchText"
            placeholder="搜索投诉原因或内容"
            clearable
            class="search-input"
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-select
            v-model="filterType"
            placeholder="反馈类型"
            clearable
            class="filter-select"
            @change="applySearch"
          >
            <el-option label="投诉" value="complaint" />
            <el-option label="建议" value="suggestion" />
            <el-option label="反馈" value="bug" />
          </el-select>
          <el-select
            v-model="filterStatus"
            placeholder="处理状态"
            clearable
            class="filter-select"
            @change="applySearch"
          >
            <el-option label="待处理" value="pending" />
            <el-option label="调查中" value="investigating" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已驳回" value="dismissed" />
          </el-select>
          <el-button type="primary" class="search-button" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
        </div>
      </div>

      <div class="table-section">
        <el-table
          :data="tableData"
          v-loading="isLoading"
          element-loading-text="加载中..."
          class="complaint-table"
          empty-text="暂无投诉数据"
          @row-click="showDetail"
        >
          <el-table-column prop="id" label="ID" width="72" />
          <el-table-column label="关联咨询编号" width="120">
            <template #default="{ row }">
              <span class="cell-text">{{ getConsultationText(row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="110">
            <template #default="{ row }">
              <span class="type-pill" :class="row.type">
                {{ getTypeLabel(row.type) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="反馈人" min-width="120">
            <template #default="{ row }">
              <span class="cell-text">{{ getDisplayUser(row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <span class="status-pill" :class="row.status">
                {{ getStatusLabel(row.status) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="原因" min-width="170" show-overflow-tooltip />
          <el-table-column prop="content" label="内容" min-width="320" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="summary-text">{{ row.content || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="88" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="showDetail(row)">
                处理
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="total > 0" class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
          small
          @change="handlePageChange"
        />
      </div>
    </div>

    <el-drawer
      v-model="detailVisible"
      title="投诉处理"
      direction="rtl"
      size="500px"
      class="detail-drawer"
    >
      <div class="detail-body" v-loading="detailLoading">
        <template v-if="selectedComplaint">
          <div class="drawer-meta">
            <span class="type-pill large" :class="selectedComplaint.type">
              {{ getTypeLabel(selectedComplaint.type) }}
            </span>
            <span class="status-pill large" :class="selectedComplaint.status">
              {{ getStatusLabel(selectedComplaint.status) }}
            </span>
          </div>

          <div class="info-list">
            <div class="info-item">
              <span class="info-label">关联咨询编号</span>
              <span class="info-value">{{ getConsultationText(selectedComplaint) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">反馈人</span>
              <span class="info-value">{{ getDisplayUser(selectedComplaint) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">原因</span>
              <span class="info-value">{{ selectedComplaint.reason || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">反馈时间</span>
              <span class="info-value">{{ formatDate(selectedComplaint.createdAt) }}</span>
            </div>
          </div>

          <div class="section-block">
            <div class="section-title">反馈内容</div>
            <div class="content-box">{{ selectedComplaint.content || '-' }}</div>
          </div>

          <div class="section-block">
            <div class="section-title">处理信息</div>
            <div class="form-item">
              <label class="field-label">处理状态</label>
              <el-select v-model="selectedComplaint.status" class="full-width">
                <el-option label="待处理" value="pending" />
                <el-option label="调查中" value="investigating" />
                <el-option label="已解决" value="resolved" />
                <el-option label="已驳回" value="dismissed" />
              </el-select>
            </div>
            <div class="form-item">
              <label class="field-label">处理说明</label>
              <el-input
                v-model="selectedComplaint.handleReason"
                type="textarea"
                placeholder="输入处理说明..."
                :rows="4"
              />
            </div>
          </div>

          <div class="action-section">
            <el-button
              type="primary"
              class="primary-action"
              :loading="isSaving"
              @click="handleComplaintAction"
            >
              保存处理
            </el-button>
            <el-button class="secondary-action" @click="detailVisible = false">
              关闭
            </el-button>
          </div>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store'
import { getComplaintDetail, getComplaints, handleComplaint } from '@/api/admin'

const authStore = useAuthStore()

const tableData = ref([])
const searchText = ref('')
const filterType = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const isLoading = ref(false)
const detailVisible = ref(false)
const detailLoading = ref(false)
const isSaving = ref(false)
const selectedComplaint = ref(null)

const displayTotal = computed(() => total.value)

const statusLabelMap = {
  pending: '待处理',
  investigating: '调查中',
  resolved: '已解决',
  dismissed: '已驳回'
}

const typeLabelMap = {
  complaint: '投诉',
  suggestion: '建议',
  bug: '反馈'
}

const formatDate = (dateValue) => {
  if (!dateValue) return '-'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return dateValue

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const getTypeLabel = (type) => typeLabelMap[type] || type || '-'
const getStatusLabel = (status) => statusLabelMap[status] || status || '-'

const getDisplayUser = (complaint) => {
  if (!complaint) return '-'
  return complaint.complainerName || `用户 ${complaint.userId ?? 'N/A'}`
}

const getConsultationText = (complaint) => {
  if (!complaint) return '-'
  return complaint.consultationId ?? '-'
}

const loadComplaints = async () => {
  isLoading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }

    if (searchText.value.trim()) params.keyword = searchText.value.trim()
    if (filterType.value) params.type = filterType.value
    if (filterStatus.value) params.status = filterStatus.value

    const response = await getComplaints(params)
    if (response?.items) {
      tableData.value = response.items
      total.value = response.total || 0
    } else {
      tableData.value = Array.isArray(response) ? response : []
      total.value = tableData.value.length
    }
  } catch (error) {
    ElMessage.error(error.message || '加载投诉列表失败')
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadComplaints()
}

const applySearch = () => {
  currentPage.value = 1
  loadComplaints()
}

const handlePageChange = () => {
  loadComplaints()
}

const showDetail = async (complaint) => {
  if (!complaint?.id) return

  detailVisible.value = true
  detailLoading.value = true
  selectedComplaint.value = {
    ...complaint,
    handleReason: complaint.handleReason || ''
  }

  try {
    const detail = await getComplaintDetail(complaint.id)
    selectedComplaint.value = {
      ...detail,
      handleReason: detail?.handleReason || ''
    }
  } catch (error) {
    ElMessage.error(error.message || '加载投诉详情失败')
  } finally {
    detailLoading.value = false
  }
}

const handleComplaintAction = async () => {
  if (!selectedComplaint.value?.id) return
  if (!selectedComplaint.value.status) {
    ElMessage.warning('请选择处理状态')
    return
  }

  const nextStatusLabel = getStatusLabel(selectedComplaint.value.status)

  try {
    await ElMessageBox.confirm(
      `确定将当前投诉状态更新为“${nextStatusLabel}”吗？`,
      '确认处理',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  isSaving.value = true
  try {
    const adminId = Number(authStore.adminId)
    await handleComplaint(
      selectedComplaint.value.id,
      adminId,
      selectedComplaint.value.status,
      selectedComplaint.value.handleReason?.trim() || ''
    )

    ElMessage.success('投诉处理成功')
    detailVisible.value = false
    await loadComplaints()
  } catch (error) {
    ElMessage.error(error.message || '处理投诉失败')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadComplaints()
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
  font-size: 18px;
  font-weight: var(--font-bold);
  color: var(--text-primary);
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
  align-items: center;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}

.search-input {
  width: 340px;
}

.filter-select {
  width: 144px;
}

.search-button {
  min-width: 108px;
}

.table-section {
  padding: 0 var(--spacing-6);
}

.pagination-section {
  padding: var(--spacing-4) var(--spacing-6) var(--spacing-5);
  display: flex;
  justify-content: flex-end;
}

.type-pill,
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.type-pill.complaint {
  background: #fee2e2;
  color: #b91c1c;
}

.type-pill.suggestion {
  background: #e0f2fe;
  color: #0369a1;
}

.type-pill.bug {
  background: #fef3c7;
  color: #b45309;
}

.status-pill.pending {
  background: #fef3c7;
  color: #b45309;
}

.status-pill.investigating {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-pill.resolved {
  background: #dcfce7;
  color: #15803d;
}

.status-pill.dismissed {
  background: #f3f4f6;
  color: #4b5563;
}

.status-pill.large,
.type-pill.large {
  min-width: 88px;
}

.drawer-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.info-list,
.section-block {
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light);
}

.info-label {
  color: var(--text-secondary);
}

.info-value {
  color: var(--text-primary);
  text-align: right;
}

.section-title {
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 600;
}

.content-box {
  padding: 14px;
  border-radius: 12px;
  background: var(--bg-subtle);
  line-height: 1.7;
  color: var(--text-primary);
}

.form-item {
  margin-bottom: 16px;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.full-width {
  width: 100%;
}

.action-section {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
