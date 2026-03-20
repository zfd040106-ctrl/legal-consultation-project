<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <div class="header-title">
          <h2>首页轮播图</h2>
          <span class="header-count">共 {{ total }} 条记录</span>
        </div>
        <div class="header-actions">
          <el-button type="primary" class="primary-action" :icon="Plus" @click="openCreateDialog">
            新增轮播图
          </el-button>
          <el-button class="secondary-action" :icon="Refresh" :loading="isLoading" @click="loadCarousels">
            刷新
          </el-button>
        </div>
      </div>

      <div class="filter-section">
        <div class="filter-row">
          <el-input
            v-model="searchText"
            placeholder="搜索标题或分类..."
            clearable
            class="search-input"
            :prefix-icon="Search"
            @keyup.enter="applySearch"
            @clear="applySearch"
          />
          <el-select v-model="statusFilter" placeholder="状态" clearable class="status-select" @change="applySearch">
            <el-option label="上线" value="active" />
            <el-option label="下线" value="inactive" />
          </el-select>
          <el-button type="primary" class="search-action" :icon="Search" @click="applySearch">
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
          :header-cell-style="{ background: '#f8f9fb', color: '#52525b', fontWeight: 600 }"
        >
          <el-table-column prop="id" label="ID" width="72" />
          <el-table-column label="封面图" width="112">
            <template #default="{ row }">
              <el-image v-if="row.imageUrl" :src="row.displayImageUrl" class="cover-image" fit="cover" />
              <div v-else class="cover-placeholder">暂无图片</div>
            </template>
          </el-table-column>
          <el-table-column label="轮播图信息" min-width="320">
            <template #default="{ row }">
              <div class="title-cell">
                <div class="title-main">{{ row.title || '-' }}</div>
                <div class="title-meta">
                  <span v-if="row.category" class="meta-tag">{{ row.category }}</span>
                  <span class="meta-summary">{{ row.summary || '暂无摘要' }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" width="168">
            <template #default="{ row }">
              <span class="time-text">{{ formatDateTime(row.updatedAt || row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sortOrder" label="排序" width="88" />
          <el-table-column label="操作" width="196" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button link type="primary" size="small" @click="editCarousel(row)">编辑</el-button>
                <el-button
                  link
                  size="small"
                  :type="row.status === 'active' ? 'warning' : 'success'"
                  :loading="statusSubmittingId === row.id"
                  @click="toggleCarouselStatus(row)"
                >
                  {{ row.status === 'active' ? '下线' : '上线' }}
                </el-button>
                <el-button link type="danger" size="small" @click="removeCarousel(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>

          <template #empty>
            <div class="empty-state">
              <el-icon :size="48"><PictureFilled /></el-icon>
              <p>暂无轮播图数据</p>
            </div>
          </template>
        </el-table>
      </div>

      <div class="pagination-section" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
          small
          @size-change="loadCarousels"
          @current-change="loadCarousels"
        />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="760px"
      align-center
      destroy-on-close
      :close-on-click-modal="false"
      class="carousel-dialog"
      @closed="handleDialogClosed"
    >
      <div class="dialog-scroll">
        <div class="editor-form">
          <div class="form-row">
            <label class="form-label required">标题</label>
            <div class="form-field">
              <el-input
                v-model="formData.title"
                maxlength="200"
                show-word-limit
                placeholder="请输入轮播图标题"
              />
            </div>
          </div>

          <div class="form-row">
            <label class="form-label">分类</label>
            <div class="form-field">
              <el-input
                v-model="formData.category"
                maxlength="50"
                placeholder="例如：劳动法、婚姻法"
              />
            </div>
          </div>

          <div class="form-row form-row-top">
            <label class="form-label">摘要</label>
            <div class="form-field">
              <el-input
                v-model="formData.summary"
                type="textarea"
                :rows="3"
                maxlength="500"
                show-word-limit
                placeholder="请输入轮播图摘要"
              />
            </div>
          </div>

          <div class="form-row form-row-top">
            <label class="form-label required">详情内容</label>
            <div class="form-field">
              <div
                class="txt-dropzone"
                :class="{ active: isTxtDragActive }"
                @click="triggerTxtImport"
                @dragenter.prevent="isTxtDragActive = true"
                @dragover.prevent="isTxtDragActive = true"
                @dragleave.prevent="isTxtDragActive = false"
                @drop.prevent="handleTxtDrop"
              >
                <el-icon class="dropzone-icon"><UploadFilled /></el-icon>
                <div class="dropzone-title">
                  {{ isTxtDragActive ? '释放以上传 TXT 文件' : '将 TXT 文件拖拽至此，或点击上传' }}
                </div>
                <div class="dropzone-tip">仅支持 .txt，最大 1MB</div>
                <input
                  ref="txtInputRef"
                  class="hidden-input"
                  type="file"
                  accept=".txt,text/plain"
                  @change="handleTxtImport"
                />
              </div>

              <el-input
                v-model="formData.content"
                type="textarea"
                :rows="10"
                maxlength="2000"
                show-word-limit
                placeholder="请输入轮播详情内容"
              />
            </div>
          </div>

          <div class="form-row form-row-top">
            <label class="form-label required">封面图</label>
            <div class="form-field">
              <div class="upload-tip-row">
                <el-upload
                  class="cover-uploader"
                  :show-file-list="false"
                  :http-request="handleCoverUpload"
                  accept="image/png,image/jpeg,image/webp"
                >
                  <button class="upload-trigger" type="button">上传封面图</button>
                </el-upload>
                <span class="field-tip">支持 jpg/png/webp，建议 16:9，5MB 以内</span>
              </div>

              <div v-if="formData.imageUrl" class="cover-preview-card">
                <el-image :src="normalizeAdminImageUrl(formData.imageUrl)" fit="cover" class="cover-preview-image" />
              </div>
            </div>
          </div>

          <div class="form-row">
            <label class="form-label">排序值</label>
            <div class="form-field compact-field">
              <el-input-number v-model="formData.sortOrder" :min="0" :max="999" controls-position="right" />
            </div>
          </div>

          <div class="form-row">
            <label class="form-label">展示时间</label>
            <div class="form-field">
              <el-date-picker
                v-model="activeTimeRange"
                class="form-date-range"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss"
                clearable
              />
              <div class="field-tip field-tip-block">留空表示长期展示；设置后仅在该时间范围内生效</div>
            </div>
          </div>

          <div class="form-row">
            <label class="form-label">状态</label>
            <div class="form-field compact-field">
              <el-select v-model="formData.status" placeholder="请选择状态">
                <el-option label="上线" value="active" />
                <el-option label="下线" value="inactive" />
              </el-select>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="primary-action" :loading="submitting" @click="saveCarousel">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, PictureFilled, UploadFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store'
import {
  createCarousel,
  deleteCarousel,
  getCarousels,
  updateCarousel,
  uploadCarouselImage
} from '@/api/admin'

const TITLE_LIMIT = 200
const SUMMARY_LIMIT = 500
const CONTENT_LIMIT = 2000
const TXT_FILE_LIMIT = 1 * 1024 * 1024
const IMAGE_FILE_LIMIT = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const API_BASE_URL = 'http://localhost:8080/api'
const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')

const authStore = useAuthStore()

const tableData = ref([])
const searchText = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const isLoading = ref(false)
const statusSubmittingId = ref(null)

const dialogVisible = ref(false)
const dialogTitle = ref('新增轮播图')
const isEditing = ref(false)
const submitting = ref(false)
const txtInputRef = ref(null)
const isTxtDragActive = ref(false)

const createEmptyForm = () => ({
  id: null,
  title: '',
  category: '',
  summary: '',
  content: '',
  imageUrl: '',
  sortOrder: 0,
  status: 'active',
  startTime: null,
  endTime: null
})

const formData = ref(createEmptyForm())

const adminId = computed(() => Number(authStore.adminId || localStorage.getItem('adminId') || 0))
const activeTimeRange = computed({
  get() {
    const { startTime, endTime } = formData.value
    return startTime && endTime ? [startTime, endTime] : []
  },
  set(value) {
    if (Array.isArray(value) && value.length === 2) {
      formData.value.startTime = value[0] || null
      formData.value.endTime = value[1] || null
      return
    }
    formData.value.startTime = null
    formData.value.endTime = null
  }
})

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const normalizeList = (response) => {
  if (Array.isArray(response)) {
    return { items: response, total: response.length }
  }
  if (response && Array.isArray(response.items)) {
    return { items: response.items, total: response.total || 0 }
  }
  if (response && Array.isArray(response.list)) {
    return { items: response.list, total: response.total || response.list.length }
  }
  return { items: [], total: 0 }
}

const normalizeAdminImageUrl = (rawUrl) => {
  if (!rawUrl) {
    return ''
  }

  const trimmedUrl = String(rawUrl).trim()
  if (!trimmedUrl) {
    return ''
  }

  let normalizedUrl = trimmedUrl.replace(/\\/g, '/')

  if (/^https?:\/\//i.test(normalizedUrl)) {
    const uploadMatch = normalizedUrl.match(/\/uploads\/.+$/i)
    if (uploadMatch) {
      return `${MEDIA_BASE_URL}${uploadMatch[0]}`
    }
    return normalizedUrl
  }

  if (normalizedUrl.startsWith('/uploads/')) {
    return `${MEDIA_BASE_URL}${normalizedUrl}`
  }

  return `${MEDIA_BASE_URL}/uploads/${normalizedUrl.replace(/^\/+/, '')}`
}

const normalizeCarouselItem = (item) => ({
  ...item,
  displayImageUrl: normalizeAdminImageUrl(item?.imageUrl)
})

const clampText = (value, limit) => (value || '').trim().slice(0, limit)

const buildPayload = (source) => ({
  title: clampText(source.title, TITLE_LIMIT),
  category: clampText(source.category, 50),
  summary: clampText(source.summary, SUMMARY_LIMIT),
  content: clampText(source.content, CONTENT_LIMIT),
  imageUrl: source.imageUrl || '',
  sortOrder: Number.isFinite(Number(source.sortOrder)) ? Number(source.sortOrder) : 0,
  status: source.status || 'active',
  startTime: source.startTime || null,
  endTime: source.endTime || null
})

const loadCarousels = async () => {
  isLoading.value = true
  try {
    const response = await getCarousels({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchText.value.trim() || undefined,
      status: statusFilter.value || undefined
    })
    const { items, total: totalCount } = normalizeList(response)
    tableData.value = items.map(normalizeCarouselItem)
    total.value = totalCount
  } catch (error) {
    console.error('加载轮播图失败:', error)
    ElMessage.error(error.message || '加载轮播图失败')
    tableData.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

const applySearch = () => {
  currentPage.value = 1
  loadCarousels()
}

const openCreateDialog = () => {
  isEditing.value = false
  dialogTitle.value = '新增轮播图'
  formData.value = createEmptyForm()
  isTxtDragActive.value = false
  dialogVisible.value = true
}

const editCarousel = (row) => {
  isEditing.value = true
  dialogTitle.value = '编辑轮播图'
  formData.value = {
    id: row.id,
    title: row.title || '',
    category: row.category || '',
    summary: row.summary || '',
    content: row.content || '',
    imageUrl: row.imageUrl || '',
    sortOrder: row.sortOrder ?? 0,
    status: row.status || 'active',
    startTime: row.startTime || null,
    endTime: row.endTime || null
  }
  isTxtDragActive.value = false
  dialogVisible.value = true
}

const validateForm = () => {
  if (!clampText(formData.value.title, TITLE_LIMIT)) {
    ElMessage.warning('请输入轮播图标题')
    return false
  }
  if (!clampText(formData.value.content, CONTENT_LIMIT)) {
    ElMessage.warning('请输入轮播详情内容')
    return false
  }
  if (!formData.value.imageUrl) {
    ElMessage.warning('请上传轮播封面图')
    return false
  }
  if (formData.value.startTime && formData.value.endTime) {
    const startTime = new Date(formData.value.startTime).getTime()
    const endTime = new Date(formData.value.endTime).getTime()
    if (!Number.isNaN(startTime) && !Number.isNaN(endTime) && endTime < startTime) {
      ElMessage.warning('结束时间不能早于开始时间')
      return false
    }
  }
  if (!adminId.value && !isEditing.value) {
    ElMessage.warning('未获取到管理员身份')
    return false
  }
  return true
}

const saveCarousel = async () => {
  if (!validateForm()) return

  submitting.value = true
  const payload = buildPayload(formData.value)

  try {
    if (isEditing.value) {
      await updateCarousel(formData.value.id, payload)
      ElMessage.success('轮播图已更新')
    } else {
      await createCarousel({
        ...payload,
        adminId: adminId.value
      })
      ElMessage.success('轮播图已创建')
    }
    dialogVisible.value = false
    loadCarousels()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

const toggleCarouselStatus = async (row) => {
  const nextStatus = row.status === 'active' ? 'inactive' : 'active'
  statusSubmittingId.value = row.id
  try {
    await updateCarousel(row.id, {
      ...buildPayload(row),
      status: nextStatus
    })
    ElMessage.success(nextStatus === 'active' ? '轮播图已上线' : '轮播图已下线')
    loadCarousels()
  } catch (error) {
    ElMessage.error(error.message || '状态更新失败')
  } finally {
    statusSubmittingId.value = null
  }
}

const removeCarousel = (row) => {
  ElMessageBox.confirm('确定要删除这张轮播图吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        await deleteCarousel(row.id)
        ElMessage.success('删除成功')
        loadCarousels()
      } catch (error) {
        ElMessage.error(error.message || '删除失败')
      }
    })
    .catch(() => {})
}

const validateImageFile = (file) => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    ElMessage.warning('封面图仅支持 jpg、png、webp 格式')
    return false
  }
  if (file.size > IMAGE_FILE_LIMIT) {
    ElMessage.warning('封面图大小不能超过 5MB')
    return false
  }
  return true
}

const handleCoverUpload = async ({ file }) => {
  if (!validateImageFile(file)) return

  try {
    const url = await uploadCarouselImage(file, adminId.value)
    formData.value.imageUrl = url
    ElMessage.success('封面图上传成功')
  } catch (error) {
    ElMessage.error(error.message || '封面图上传失败')
  }
}

const triggerTxtImport = async () => {
  await nextTick()
  txtInputRef.value?.click()
}

const validateTxtFile = (file) => {
  const isTxt = /\.txt$/i.test(file.name || '') || file.type === 'text/plain'
  if (!isTxt) {
    ElMessage.warning('仅支持导入 TXT 文件')
    return false
  }
  if (file.size > TXT_FILE_LIMIT) {
    ElMessage.warning('TXT 文件不能超过 1MB')
    return false
  }
  return true
}

const applyTxtFile = async (file) => {
  if (!file || !validateTxtFile(file)) return

  try {
    const text = await file.text()
    const normalizedText = text.slice(0, CONTENT_LIMIT)
    formData.value.content = normalizedText
    if (text.length > CONTENT_LIMIT) {
      ElMessage.warning(`TXT 内容超过 ${CONTENT_LIMIT} 字，已自动截断`)
    } else {
      ElMessage.success('TXT 内容已导入')
    }
  } catch (error) {
    ElMessage.error(error.message || 'TXT 导入失败')
  }
}

const handleTxtImport = async (event) => {
  const file = event.target.files && event.target.files[0]
  await applyTxtFile(file)
  event.target.value = ''
  isTxtDragActive.value = false
}

const handleTxtDrop = async (event) => {
  const file = event.dataTransfer?.files?.[0]
  await applyTxtFile(file)
  isTxtDragActive.value = false
}

const handleDialogClosed = () => {
  isTxtDragActive.value = false
}

onMounted(() => {
  loadCarousels()
})
</script>

<style scoped>
.page-container {
  width: 100%;
}

.page-card {
  background: #ffffff;
  border-radius: 22px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  border: 1px solid #edf0f5;
  overflow: hidden;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px 18px;
}

.header-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.header-title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.header-count {
  color: #64748b;
  font-size: 13px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.primary-action,
.search-action {
  --el-button-bg-color: #0f172a;
  --el-button-border-color: #0f172a;
  --el-button-hover-bg-color: #1e293b;
  --el-button-hover-border-color: #1e293b;
  --el-button-active-bg-color: #0f172a;
  --el-button-active-border-color: #0f172a;
  min-width: 112px;
  border-radius: 999px;
  font-weight: 600;
}

.secondary-action {
  border-radius: 999px;
  border-color: #d7ddea;
  color: #475569;
}

.filter-section {
  padding: 0 28px 18px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 320px;
}

.status-select {
  width: 138px;
}

.table-section {
  padding: 0 20px;
}

.custom-table {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: transparent;
  --el-table-row-hover-bg-color: #f8fafc;
}

:deep(.el-table__inner-wrapper::before) {
  display: none;
}

:deep(.el-table__header th) {
  font-size: 13px;
  color: #64748b !important;
  background: #f8fafc !important;
  border-bottom: none !important;
}

:deep(.el-table__body td) {
  border-bottom: 1px solid #edf2f7 !important;
  padding-top: 14px;
  padding-bottom: 14px;
  font-size: 13px;
  color: #334155;
}

.cover-image,
.cover-preview-image {
  width: 84px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
}

.cover-preview-image {
  width: 240px;
  height: 135px;
}

.cover-placeholder {
  width: 84px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 12px;
  border: 1px dashed #d8dee9;
}

.title-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-main {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
}

.title-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  flex-shrink: 0;
}

.meta-summary {
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-text {
  color: #64748b;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 0;
  color: #94a3b8;
}

.empty-state p {
  margin: 12px 0 0;
  font-size: 13px;
}

.pagination-section {
  display: flex;
  justify-content: flex-end;
  padding: 18px 28px 24px;
}

.dialog-scroll {
  max-height: 72vh;
  overflow-y: auto;
  padding-right: 8px;
}

.editor-form {
  padding: 4px 6px 8px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.form-row-top {
  align-items: flex-start;
}

.form-label {
  width: 88px;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  line-height: 22px;
  padding-top: 6px;
}

.form-label.required::before {
  content: '*';
  color: #ef4444;
  margin-right: 4px;
}

.form-field {
  flex: 1;
  min-width: 0;
}

.compact-field {
  max-width: 180px;
}

.form-date-range {
  width: 100%;
  max-width: 420px;
}

.txt-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 110px;
  border: 1px dashed #d7ddea;
  background: #f8fafc;
  border-radius: 16px;
  margin-bottom: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.txt-dropzone:hover,
.txt-dropzone.active {
  border-color: #0f172a;
  background: #f1f5f9;
}

.dropzone-icon {
  font-size: 22px;
  color: #64748b;
}

.dropzone-title {
  font-size: 14px;
  color: #0f172a;
}

.dropzone-tip,
.field-tip {
  font-size: 12px;
  color: #94a3b8;
}

.field-tip-block {
  display: block;
  margin-top: 8px;
}

.upload-tip-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.upload-trigger {
  padding: 9px 16px;
  border-radius: 12px;
  border: 1px solid #d7ddea;
  background: #ffffff;
  color: #334155;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.upload-trigger:hover {
  border-color: #0f172a;
  color: #0f172a;
}

.cover-preview-card {
  display: inline-flex;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

.hidden-input {
  display: none;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.carousel-dialog .el-dialog) {
  border-radius: 24px;
  overflow: hidden;
}

:deep(.carousel-dialog .el-dialog__header) {
  padding: 22px 26px 12px;
  margin-right: 0;
}

:deep(.carousel-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

:deep(.carousel-dialog .el-dialog__body) {
  padding: 8px 26px 10px;
}

:deep(.carousel-dialog .el-dialog__footer) {
  padding: 14px 26px 24px;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-select__wrapper),
:deep(.el-input-number .el-input__wrapper) {
  border-radius: 14px;
  box-shadow: 0 0 0 1px #dbe2ea inset;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus),
:deep(.el-select__wrapper.is-focused),
:deep(.el-input-number .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #0f172a inset;
}

:deep(.el-input__count),
:deep(.el-textarea__count) {
  color: #94a3b8;
  font-size: 12px;
}

@media (max-width: 1024px) {
  .page-header,
  .filter-section,
  .pagination-section {
    padding-left: 18px;
    padding-right: 18px;
  }

  .table-section {
    padding: 0 12px;
  }

  .filter-row {
    flex-wrap: wrap;
  }

  .search-input {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  .form-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .form-label {
    width: auto;
    padding-top: 0;
  }

  .compact-field {
    max-width: none;
  }

  .upload-tip-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
