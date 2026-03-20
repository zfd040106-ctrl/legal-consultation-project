<template>
  <div class="page-container">
    <!-- 页面卡片 -->
    <div class="page-card">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-title">
          <h2>律师审核</h2>
          <span class="header-count">共 {{ total }} 条待审核</span>
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
            placeholder="搜索律师名称/手机号..."
            clearable
            class="search-input"
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
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
          <el-table-column prop="username" label="律师名称" min-width="120" />
          <el-table-column prop="account" label="账号" min-width="120" />
          <el-table-column prop="phone" label="手机号" width="130" />
          <el-table-column label="申请时间" width="160">
            <template #default="{ row }">
              <span class="time-text">{{ formatDate(row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default>
              <span class="status-badge pending">
                <span class="status-dot"></span>
                待审核
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button link type="primary" size="small" @click="showDetail(row)">
                  审核
                </el-button>
              </div>
            </template>
          </el-table-column>

          <!-- 空状态 -->
          <template #empty>
            <div class="empty-state">
              <el-icon :size="48"><Briefcase /></el-icon>
              <p>暂无待审核律师</p>
            </div>
          </template>
        </el-table>
      </div>

      <!-- 分页区域 -->
      <div class="pagination-section" v-if="total > 0">
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

    <!-- 审核详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="律师审核详情"
      width="680px"
      class="audit-dialog"
    >
      <div v-if="selectedLawyer" class="detail-content">
        <!-- 律师基本信息 -->
        <div class="info-section">
          <div class="section-title">律师信息</div>
          <!-- 头像展示 -->
          <div v-if="selectedLawyer.avatar" class="avatar-display">
            <img :src="selectedLawyer.avatar" alt="律师头像" class="lawyer-avatar" />
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">律师名称</span>
              <span class="info-value">{{ selectedLawyer.name }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">手机号</span>
              <span class="info-value">{{ selectedLawyer.phone }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">证件号</span>
              <span class="info-value">{{ selectedLawyer.licenseNumber }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">律所名称</span>
              <span class="info-value">{{ selectedLawyer.lawFirmName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">专业领域</span>
              <span class="info-value">{{ selectedLawyer.field }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">执业年限</span>
              <span class="info-value">{{ selectedLawyer.yearsOfPractice }}年</span>
            </div>
          </div>
        </div>

        <!-- 证件展示 -->
        <div class="info-section">
          <div class="section-title">上传证件</div>
          <div v-if="selectedLawyer.certificates && selectedLawyer.certificates.length > 0" class="cert-grid">
            <div
              v-for="(cert, index) in selectedLawyer.certificates"
              :key="index"
              class="cert-item"
              @click="openDocument(cert.url)"
            >
              <template v-if="isImageUrl(cert.url)">
                <img :src="cert.url" :alt="cert.name" class="cert-image" />
              </template>
              <template v-else>
                <div class="cert-file">
                  <el-icon :size="32"><Document /></el-icon>
                  <span class="file-ext">{{ getFileExtension(cert.url) }}</span>
                </div>
              </template>
              <span class="cert-name">{{ cert.name }}</span>
            </div>
          </div>
          <div v-else class="empty-cert">
            <span>暂无证件</span>
          </div>
        </div>

        <!-- 审核操作 -->
        <div class="audit-section">
          <div class="section-title">审核决定</div>
          <el-radio-group v-model="auditDecision" class="decision-group">
            <el-radio label="approve">
              <span class="decision-label approve">批准申请</span>
            </el-radio>
            <el-radio label="reject">
              <span class="decision-label reject">拒绝申请</span>
            </el-radio>
          </el-radio-group>
          <div v-if="auditDecision === 'reject'" class="reject-reason">
            <el-input
              v-model="rejectReason"
              type="textarea"
              placeholder="请输入拒绝原因..."
              :rows="3"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAudit">确认审核</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Briefcase, Document } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store'
import { getPendingLawyers, getLawyerDetail, approveLawyer, rejectLawyer } from '@/api/admin'

const authStore = useAuthStore()

const tableData = ref([])
const allData = ref([])
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const isLoading = ref(false)
const detailVisible = ref(false)
const selectedLawyer = ref(null)
const auditDecision = ref('approve')
const rejectReason = ref('')

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

// 加载待审核律师列表
const loadPendingLawyers = async () => {
  isLoading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }

    const response = await getPendingLawyers(params)
    if (response.items) {
      allData.value = response.items
      total.value = response.total
    } else {
      allData.value = response
      total.value = response.length
    }
    applySearch()
  } catch (error) {
    console.error('加载律师列表失败:', error)
    ElMessage.error(error.message || '加载律师列表失败')
  } finally {
    isLoading.value = false
  }
}

// 应用搜索过滤
const applySearch = () => {
  let filtered = allData.value

  if (searchText.value.trim()) {
    const keyword = searchText.value.toLowerCase()
    filtered = filtered.filter(lawyer => {
      return (
        lawyer.name?.toLowerCase().includes(keyword) ||
        lawyer.username?.toLowerCase().includes(keyword) ||
        lawyer.phone?.includes(keyword)
      )
    })
  }

  tableData.value = filtered
  // 不覆盖服务端total，保持分页正常工作
}

// 查看详情
const showDetail = async (lawyer) => {
  try {
    const detail = await getLawyerDetail(lawyer.id)
    selectedLawyer.value = detail
    auditDecision.value = 'approve'
    rejectReason.value = ''
    detailVisible.value = true
  } catch (error) {
    ElMessage.error(error.message || '获取律师详情失败')
  }
}

const handleSearch = () => {
  currentPage.value = 1
  applySearch()
}

const handleRefresh = () => {
  loadPendingLawyers()
}

const handlePageChange = () => {
  loadPendingLawyers()
}

// 判断是否为图片URL
const isImageUrl = (url) => {
  if (!url) return false
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
  const lowerUrl = url.toLowerCase()
  return imageExtensions.some(ext => lowerUrl.endsWith(ext))
}

// 获取文件扩展名
const getFileExtension = (url) => {
  if (!url) return ''
  const parts = url.split('.')
  return parts.length > 1 ? parts.pop().toUpperCase() : ''
}

// 打开文档
const openDocument = (url) => {
  if (url) {
    window.open(url, '_blank')
  }
}

// 提交审核
const submitAudit = async () => {
  if (auditDecision.value === 'reject' && !rejectReason.value.trim()) {
    ElMessage.warning('请填写拒绝原因')
    return
  }

  const action = auditDecision.value === 'approve' ? '批准' : '拒绝'
  ElMessageBox.confirm(
    `确定要${action}该律师申请吗？`,
    '确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const lawyerId = selectedLawyer.value.id
      const adminId = parseInt(authStore.adminId)

      if (auditDecision.value === 'approve') {
        await approveLawyer(lawyerId, adminId, '')
      } else {
        await rejectLawyer(lawyerId, adminId, rejectReason.value)
      }

      ElMessage.success(`审核已${action}`)
      detailVisible.value = false
      loadPendingLawyers()
    } catch (error) {
      ElMessage.error(error.message || `${action}律师失败`)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadPendingLawyers()
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

.status-badge.pending {
  color: var(--warning-color);
}

.status-badge.pending .status-dot {
  background: var(--warning-color);
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

/* 审核弹窗内容 */
.detail-content {
  padding: var(--spacing-2);
}

.info-section {
  margin-bottom: var(--spacing-6);
}

.section-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-2);
  border-bottom: 1px solid var(--border-light);
}

/* 头像展示 */
.avatar-display {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-4);
}

.lawyer-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.info-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.info-value {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

/* 证件展示 */
.cert-grid {
  display: flex;
  gap: var(--spacing-4);
  flex-wrap: wrap;
}

.cert-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out);
}

.cert-item:hover {
  transform: scale(1.02);
}

.cert-image {
  width: 160px;
  height: 120px;
  object-fit: cover;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.cert-file {
  width: 160px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  background: var(--bg-hover);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  color: var(--text-tertiary);
}

.file-ext {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.cert-name {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.empty-cert {
  padding: var(--spacing-6);
  text-align: center;
  color: var(--text-placeholder);
  background: var(--bg-hover);
  border-radius: var(--radius-lg);
}

/* 审核操作 */
.audit-section {
  margin-top: var(--spacing-4);
}

.decision-group {
  display: flex;
  gap: var(--spacing-6);
  margin-top: var(--spacing-3);
}

.decision-label {
  font-weight: var(--font-medium);
}

.decision-label.approve {
  color: var(--success-color);
}

.decision-label.reject {
  color: var(--danger-color);
}

.reject-reason {
  margin-top: var(--spacing-4);
}

/* 弹窗底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
}
</style>
