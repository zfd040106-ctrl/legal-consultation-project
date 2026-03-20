<template>
  <div class="dashboard">
    <div class="dashboard-main">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card"
             v-for="stat in statsData"
             :key="stat.key"
             @click="stat.onClick"
             :class="{ clickable: stat.onClick }">
          <div class="stat-header">
            <span class="stat-label">{{ stat.label }}</span>
            <el-icon class="stat-more"><MoreFilled /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ formatNumber(stat.value) }}</div>
            <div class="stat-trend" :class="stat.trendType">
              {{ stat.trend }}
            </div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="chart-section">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-section">
              <h3 class="chart-title">注册统计</h3>
              <div class="chart-legend">
                <span class="legend-item">
                  <span class="legend-dot-solid"></span>
                  <span class="legend-number">{{ displayUserCount }}</span>
                  <span class="legend-label">用户注册</span>
                </span>
                <span class="legend-item">
                  <span class="legend-dot-hollow"></span>
                  <span class="legend-number">{{ displayLawyerCount }}</span>
                  <span class="legend-label">律师注册</span>
                </span>
              </div>
            </div>
            <div class="chart-controls">
              <div class="year-selector">
                <button
                  class="year-nav-btn"
                  @click="changeYear(-1)"
                  :disabled="selectedYear <= 2020"
                >
                  <el-icon><ArrowLeft /></el-icon>
                </button>
                <span class="year-label">{{ selectedYear }}年</span>
                <button
                  class="year-nav-btn"
                  @click="changeYear(1)"
                  :disabled="selectedYear >= currentYear"
                >
                  <el-icon><ArrowRight /></el-icon>
                </button>
              </div>
              <!-- 月份选择器 -->
              <div class="month-selector" v-if="chartPeriodType === 'monthly'">
                <button
                  class="year-nav-btn"
                  @click="changeMonth(-1)"
                  :disabled="!canPrevMonth"
                >
                  <el-icon><ArrowLeft /></el-icon>
                </button>
                <span class="year-label">{{ currentMonthLabel }}</span>
                <button
                  class="year-nav-btn"
                  @click="changeMonth(1)"
                  :disabled="!canNextMonth"
                >
                  <el-icon><ArrowRight /></el-icon>
                </button>
              </div>
              <!-- 周选择器 -->
              <div class="week-selector" v-if="chartPeriodType === 'weekly'">
                <button
                  class="year-nav-btn"
                  @click="changeWeek(-1)"
                  :disabled="!canPrevWeek"
                >
                  <el-icon><ArrowLeft /></el-icon>
                </button>
                <span class="year-label week-label">{{ currentWeekLabel }}</span>
                <button
                  class="year-nav-btn"
                  @click="changeWeek(1)"
                  :disabled="!canNextWeek"
                >
                  <el-icon><ArrowRight /></el-icon>
                </button>
              </div>
              <div class="period-tabs">
                <button
                  class="period-tab"
                  :class="{ active: chartPeriodType === 'weekly' }"
                  @click="switchPeriod('weekly')"
                >周</button>
                <button
                  class="period-tab"
                  :class="{ active: chartPeriodType === 'monthly' }"
                  @click="switchPeriod('monthly')"
                >月</button>
                <button
                  class="period-tab"
                  :class="{ active: chartPeriodType === 'yearly' }"
                  @click="switchPeriod('yearly')"
                >年</button>
              </div>
            </div>
          </div>
          <div class="chart-body">
            <div ref="userGrowthChart" class="chart-container"></div>
          </div>
        </div>
      </div>

      <!-- 最近公告 -->
      <div class="announcements-section">
        <div class="announcements-card">
          <div class="announcements-header">
            <h3 class="announcements-title">最近公告</h3>
            <span class="view-more" @click="$router.push('/announcements')">查看全部</span>
          </div>
          <div class="announcements-list">
            <div class="announcement-item" v-for="item in recentAnnouncements" :key="item.id" @click="$router.push('/announcements')">
              <div class="announcement-content">
                <div class="announcement-title-row">
                  <span class="announcement-title">{{ item.title }}</span>
                  <span class="announcement-badge" v-if="item.isPinned">置顶</span>
                </div>
                <p class="announcement-text">{{ item.content }}</p>
              </div>
              <span class="announcement-date">{{ formatDate(item.createdAt) }}</span>
            </div>
            <div class="announcement-item empty" v-if="recentAnnouncements.length === 0">
              <span class="empty-text">暂无公告</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧面板 -->
    <div class="dashboard-aside">
      <!-- 咨询统计环形图 -->
      <div class="aside-card consultation-card">
        <div class="aside-header">
          <h3 class="aside-title">咨询统计</h3>
        </div>
        <div class="consultation-chart">
          <div ref="consultationChart" class="consultation-chart-container"></div>
        </div>
        <div class="consultation-legend">
          <div class="legend-row" v-for="item in consultationLegend" :key="item.name">
            <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
            <span class="legend-name">{{ item.name }}</span>
            <span class="legend-value">{{ item.value }}</span>
          </div>
        </div>
      </div>

      <!-- 最近操作 -->
      <div class="aside-card">
        <div class="aside-header">
          <h3 class="aside-title">最近操作</h3>
          <el-icon class="aside-icon"><Setting /></el-icon>
        </div>
        <div class="activity-list">
          <div class="activity-item" v-for="(activity, index) in recentActivities" :key="index">
            <div class="activity-dot" :class="activity.type"></div>
            <div class="activity-content">
              <p class="activity-text">
                <span v-html="activity.text"></span>
              </p>
              <span class="activity-time">{{ activity.time }}</span>
            </div>
          </div>
        </div>
        <button class="view-all-btn" @click="$router.push('/audit-logs')">查看全部</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { MoreFilled, Setting, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  getStatistics,
  getUserGrowthData,
  getLawyerGrowthData,
  getUsers,
  getComplaints,
  getPendingLawyers,
  getAnnouncements,
  getConsultationDistribution,
  getRecentAuditLogs
} from '@/api/admin'
import { ElMessage } from 'element-plus'

const router = useRouter()

const statistics = ref({
  totalUsers: 0,
  totalLawyers: 0,
  pendingLawyers: 0,
  totalConsultations: 0,
  openConsultations: 0,
  resolvedConsultations: 0,
  totalAnnouncements: 0,
  pinnedAnnouncements: 0
})

// 日期选择器
const now = new Date()
const chartPeriodType = ref('monthly')
const selectedWeek = ref(new Date(now))
const selectedMonth = ref(new Date(now.getFullYear(), now.getMonth(), 1))
const selectedYear = ref(now.getFullYear())
const currentYear = computed(() => new Date().getFullYear())

// 切换年份
const changeYear = (delta) => {
  const newYear = selectedYear.value + delta
  if (newYear >= 2020 && newYear <= currentYear.value) {
    selectedYear.value = newYear
    // 同步更新月份和周的年份
    selectedMonth.value = new Date(newYear, selectedMonth.value.getMonth(), 1)
    selectedWeek.value = new Date(newYear, selectedWeek.value.getMonth(), selectedWeek.value.getDate())
    initUserGrowthChart()
  }
}

// 月份显示标签
const currentMonthLabel = computed(() => {
  return `${selectedMonth.value.getMonth() + 1}月`
})

// 是否可以切换到上一个月
const canPrevMonth = computed(() => {
  const month = selectedMonth.value.getMonth()
  const year = selectedYear.value
  return !(year === 2020 && month === 0)
})

// 是否可以切换到下一个月
const canNextMonth = computed(() => {
  const now = new Date()
  const month = selectedMonth.value.getMonth()
  const year = selectedYear.value
  return !(year === now.getFullYear() && month === now.getMonth())
})

// 切换月份
const changeMonth = (delta) => {
  const newMonth = new Date(selectedMonth.value)
  newMonth.setMonth(newMonth.getMonth() + delta)

  // 如果跨年了，同步更新年份
  if (newMonth.getFullYear() !== selectedYear.value) {
    selectedYear.value = newMonth.getFullYear()
  }

  selectedMonth.value = newMonth
  initUserGrowthChart()
}

// 周显示标签
const currentWeekLabel = computed(() => {
  const weekStart = getWeekStart(selectedWeek.value)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const startMonth = weekStart.getMonth() + 1
  const startDay = weekStart.getDate()
  const endMonth = weekEnd.getMonth() + 1
  const endDay = weekEnd.getDate()

  if (startMonth === endMonth) {
    return `${startMonth}月${startDay}-${endDay}日`
  }
  return `${startMonth}月${startDay}-${endMonth}月${endDay}日`
})

// 是否可以切换到上一周
const canPrevWeek = computed(() => {
  const weekStart = getWeekStart(selectedWeek.value)
  const minDate = new Date(2020, 0, 1)
  return weekStart > minDate
})

// 是否可以切换到下一周
const canNextWeek = computed(() => {
  const now = new Date()
  const currentWeekStart = getWeekStart(now)
  const selectedWeekStart = getWeekStart(selectedWeek.value)
  return selectedWeekStart < currentWeekStart
})

// 切换周
const changeWeek = (delta) => {
  const newWeek = new Date(selectedWeek.value)
  newWeek.setDate(newWeek.getDate() + delta * 7)

  // 如果跨年了，同步更新年份
  if (newWeek.getFullYear() !== selectedYear.value) {
    selectedYear.value = newWeek.getFullYear()
  }

  selectedWeek.value = newWeek
  initUserGrowthChart()
}

// 获取某日期所在周的周一
const getWeekStart = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const userGrowthData = ref([])
const lawyerGrowthData = ref([])
const recentAnnouncements = ref([])
const isLoading = ref(false)
const consultationDistribution = ref([])

// 图表引用
const userGrowthChart = ref(null)
const consultationChart = ref(null)
let userGrowthInstance = null
let consultationChartInstance = null

// 咨询分类颜色映射
const categoryColorMap = {
  '民法': '#2563EB',
  '合同法': '#0F766E',
  '劳动法': '#059669',
  '公司法': '#4F46E5',
  '知识产权': '#6366F1',
  '婚姻法': '#D97706',
  '刑法': '#1F2937',
  '房产法': '#CBD5E1',
  '其他': '#E5E7EB'
}
const defaultColor = '#E5E7EB'

const consultationLegend = computed(() => {
  if (!consultationDistribution.value.length) {
    return [
      { name: '民法', value: 0, color: categoryColorMap['民法'] },
      { name: '合同法', value: 0, color: categoryColorMap['合同法'] },
      { name: '其他', value: 0, color: categoryColorMap['其他'] }
    ]
  }
  return consultationDistribution.value.map((item) => {
    const name = item.category || item.name || '其他'
    return {
      name,
      value: item.count || item.value || 0,
      color: categoryColorMap[name] || defaultColor
    }
  })
})

// 计算选定时间段的用户和律师数量
const displayUserCount = computed(() => {
  if (!userGrowthData.value.length) {
    return 0
  }

  let total = 0
  const dataToSum = getFilteredData(userGrowthData.value)
  dataToSum.forEach(item => {
    total += item.count || item.userCount || item.users || item.value || 0
  })
  return total
})

const displayLawyerCount = computed(() => {
  if (!lawyerGrowthData.value.length) {
    return 0
  }

  let total = 0
  const dataToSum = getFilteredData(lawyerGrowthData.value)
  dataToSum.forEach(item => {
    total += item.count || item.lawyerCount || item.lawyers || item.value || 0
  })
  return total
})

// 根据选择的时间段过滤数据
const getFilteredData = (dataSource) => {
  if (!dataSource || !dataSource.length) return []

  if (chartPeriodType.value === 'weekly') {
    const weekStart = getWeekStart(selectedWeek.value)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    return dataSource.filter(item => {
      const itemDate = new Date(item.date || item.day)
      return itemDate >= weekStart && itemDate <= weekEnd
    })
  } else if (chartPeriodType.value === 'monthly') {
    const year = selectedMonth.value.getFullYear()
    const month = selectedMonth.value.getMonth()

    return dataSource.filter(item => {
      const itemDate = new Date(item.date || item.day)
      return itemDate.getFullYear() === year && itemDate.getMonth() === month
    })
  } else {
    // yearly
    const year = selectedYear.value
    return dataSource.filter(item => {
      const itemDate = new Date(item.date || item.day)
      return itemDate.getFullYear() === year
    })
  }
}

// 格式化数字
const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num?.toLocaleString() || '0'
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 格式化相对时间
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return formatDate(dateStr)
}

// 统计数据配置
const statsData = computed(() => [
  {
    key: 'users',
    label: '总用户数',
    value: statistics.value.totalUsers || 0,
    trend: `+${statistics.value.totalLawyers || 0} 位律师`,
    trendType: 'positive',
    onClick: () => router.push('/users')
  },
  {
    key: 'lawyers',
    label: '待审核律师',
    value: statistics.value.pendingLawyers || 0,
    trend: statistics.value.pendingLawyers > 0 ? '需要处理' : '暂无待审核',
    trendType: statistics.value.pendingLawyers > 0 ? 'negative' : 'positive',
    onClick: () => router.push('/lawyers/audit')
  },
  {
    key: 'consultations',
    label: '总咨询数',
    value: statistics.value.totalConsultations || 0,
    trend: `${statistics.value.resolvedConsultations || 0} 个已解决`,
    trendType: 'positive',
    onClick: () => router.push('/consultations')
  }
])

// 最近操作
const recentActivities = ref([])

// 格式化状态文字
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

// 格式化审核日志为活动显示
const formatAuditLog = (log) => {
  const { action, targetType, targetId, newStatus } = log

  // 获取操作类型样式
  const typeMap = {
    'approve': 'success',
    'reject': 'warning',
    'delete': 'warning',
    'process': 'info'
  }

  // 生成描述文字
  let text = ''

  if (targetType === 'lawyer') {
    if (action === 'approve') {
      text = `审核通过了律师 <strong>#${targetId}</strong> 的注册申请`
    } else if (action === 'reject') {
      text = `拒绝了律师 <strong>#${targetId}</strong> 的注册申请`
    }
  } else if (targetType === 'complaint') {
    if (newStatus) {
      text = `处理了投诉 <strong>#${targetId}</strong>，状态更新为「${formatStatus(newStatus)}」`
    } else {
      text = `处理了投诉 <strong>#${targetId}</strong>`
    }
  } else if (targetType === 'consultation' && action === 'delete') {
    text = `删除了咨询 <strong>#${targetId}</strong>`
  }

  // 默认格式
  if (!text) {
    const actionText = { 'approve': '审核通过', 'reject': '拒绝', 'delete': '删除', 'process': '处理' }[action] || action
    const targetText = { 'lawyer': '律师', 'consultation': '咨询', 'complaint': '投诉' }[targetType] || targetType
    text = `${actionText}了${targetText} <strong>#${targetId}</strong>`
  }

  return {
    type: typeMap[action] || 'info',
    text: text,
    time: formatRelativeTime(log.createdAt),
    date: new Date(log.createdAt)
  }
}

// 加载最近活动数据
const loadRecentActivities = async () => {
  try {
    // 优先从审核日志获取
    const auditRes = await getRecentAuditLogs(5)
    const auditLogs = auditRes.data || auditRes || []

    if (auditLogs.length > 0) {
      recentActivities.value = auditLogs.map(formatAuditLog).slice(0, 5)
      return
    }
  } catch (e) {
    console.warn('获取审核日志失败，使用备用数据')
  }

  // 备用：从其他接口获取活动
  const activities = []

  try {
    const usersRes = await getUsers({ page: 1, pageSize: 3 })
    const users = usersRes.items || usersRes || []
    users.slice(0, 2).forEach(user => {
      activities.push({
        type: 'success',
        text: `用户 <strong>${user.username || user.name || '新用户'}</strong> 完成注册`,
        time: formatRelativeTime(user.createdAt),
        date: new Date(user.createdAt)
      })
    })
  } catch (e) {
    console.warn('获取用户活动失败')
  }

  try {
    const lawyersRes = await getPendingLawyers({ page: 1, pageSize: 3 })
    const lawyers = lawyersRes.items || lawyersRes || []
    lawyers.slice(0, 2).forEach(lawyer => {
      activities.push({
        type: 'info',
        text: `律师 <strong>${lawyer.username || lawyer.name || '新律师'}</strong> 申请审核`,
        time: formatRelativeTime(lawyer.createdAt),
        date: new Date(lawyer.createdAt)
      })
    })
  } catch (e) {
    console.warn('获取律师活动失败')
  }

  try {
    const complaintsRes = await getComplaints({ page: 1, pageSize: 3 })
    const complaints = complaintsRes.items || complaintsRes || []
    complaints.slice(0, 2).forEach(complaint => {
      activities.push({
        type: 'warning',
        text: `收到新${complaint.type === 'suggestion' ? '建议' : '投诉'} <strong>#${complaint.id}</strong>`,
        time: formatRelativeTime(complaint.createdAt),
        date: new Date(complaint.createdAt)
      })
    })
  } catch (e) {
    console.warn('获取投诉活动失败')
  }

  activities.sort((a, b) => b.date - a.date)
  recentActivities.value = activities.slice(0, 5)

  if (recentActivities.value.length === 0) {
    recentActivities.value = [
      { type: 'info', text: '暂无最近操作', time: '-' }
    ]
  }
}

// 加载最近公告
const loadRecentAnnouncements = async () => {
  try {
    const res = await getAnnouncements({ page: 1, pageSize: 2 })
    const items = res.items || res.data || res || []
    recentAnnouncements.value = items.slice(0, 2)
  } catch (error) {
    console.warn('获取公告列表失败:', error.message)
    recentAnnouncements.value = []
  }
}

// 加载统计数据
const loadStatistics = async () => {
  isLoading.value = true
  try {
    const data = await getStatistics()
    statistics.value = {
      totalUsers: data.totalUsers || 0,
      totalLawyers: data.totalLawyers || 0,
      pendingLawyers: data.pendingLawyers || 0,
      totalConsultations: data.totalConsultations || 0,
      openConsultations: data.openConsultations || 0,
      resolvedConsultations: data.resolvedConsultations || 0,
      totalAnnouncements: data.totalAnnouncements || 0,
      pinnedAnnouncements: data.pinnedAnnouncements || 0
    }

    // 获取用户增长数据
    try {
      const growthData = await getUserGrowthData()
      userGrowthData.value = growthData.data || growthData || []
    } catch (error) {
      console.warn('获取用户增长数据失败:', error.message)
      userGrowthData.value = []
    }

    // 获取律师增长数据
    try {
      const lawyerData = await getLawyerGrowthData()
      lawyerGrowthData.value = lawyerData.data || lawyerData || []
    } catch (error) {
      console.warn('获取律师增长数据失败:', error.message)
      lawyerGrowthData.value = []
    }

    // 加载最近活动
    await loadRecentActivities()

    // 加载最近公告
    await loadRecentAnnouncements()

    // 加载咨询分布数据
    try {
      const distributionRes = await getConsultationDistribution()
      consultationDistribution.value = distributionRes.data || distributionRes || []
    } catch (error) {
      console.warn('获取咨询分布数据失败:', error.message)
      consultationDistribution.value = []
    }

    await nextTick()
    initCharts()
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  } finally {
    isLoading.value = false
  }
}

// 切换周期类型
const switchPeriod = (period) => {
  chartPeriodType.value = period
  // 根据当前选择的年份重置月/周
  const year = selectedYear.value
  const now = new Date()
  if (period === 'weekly') {
    // 如果是当前年，使用当前周；否则使用该年第一周
    if (year === now.getFullYear()) {
      selectedWeek.value = new Date(now)
    } else {
      selectedWeek.value = new Date(year, 0, 1)
    }
  } else if (period === 'monthly') {
    // 如果是当前年，使用当前月；否则使用该年1月
    if (year === now.getFullYear()) {
      selectedMonth.value = new Date(year, now.getMonth(), 1)
    } else {
      selectedMonth.value = new Date(year, 0, 1)
    }
  }
  initUserGrowthChart()
}

// 初始化图表
const initCharts = () => {
  initUserGrowthChart()
  initConsultationChart()
}

// 获取图表数据（根据周期类型）
const getChartData = (dataSource) => {
  const labels = []
  const data = []

  if (chartPeriodType.value === 'weekly') {
    // 每周 - 显示日期数字
    const weekStart = getWeekStart(selectedWeek.value)

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart)
      currentDate.setDate(currentDate.getDate() + i)
      labels.push(currentDate.getDate().toString())

      const dateStr = currentDate.toISOString().split('T')[0]
      const item = dataSource.find(d => {
        const itemDate = (d.date || d.day || '').split('T')[0]
        return itemDate === dateStr
      })
      data.push(item ? (item.count || item.userCount || item.lawyerCount || item.users || item.lawyers || item.value || 0) : 0)
    }
  } else if (chartPeriodType.value === 'monthly') {
    // 每月 - 按7天分组：1-7, 8-14, 15-21, 22-28, 29-末
    const year = selectedMonth.value.getFullYear()
    const month = selectedMonth.value.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const ranges = [
      { start: 1, end: 7, label: '1-7' },
      { start: 8, end: 14, label: '8-14' },
      { start: 15, end: 21, label: '15-21' },
      { start: 22, end: 28, label: '22-28' }
    ]

    // 添加最后一段
    if (daysInMonth > 28) {
      ranges.push({ start: 29, end: daysInMonth, label: `29-${daysInMonth}` })
    }

    for (const range of ranges) {
      labels.push(range.label)

      let rangeTotal = 0
      for (let day = range.start; day <= Math.min(range.end, daysInMonth); day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const item = dataSource.find(d => {
          const itemDate = (d.date || d.day || '').split('T')[0]
          return itemDate === dateStr
        })
        rangeTotal += item ? (item.count || item.userCount || item.lawyerCount || item.users || item.lawyers || item.value || 0) : 0
      }
      data.push(rangeTotal)
    }
  } else {
    // 每年 - 显示 1月-12月
    const year = selectedYear.value
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

    for (let month = 1; month <= 12; month++) {
      labels.push(monthNames[month - 1])

      // 汇总该月所有数据
      let monthTotal = 0
      dataSource.forEach(item => {
        const itemDate = new Date(item.date || item.day)
        if (itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month) {
          monthTotal += item.count || item.userCount || item.lawyerCount || item.users || item.lawyers || item.value || 0
        }
      })
      data.push(monthTotal)
    }
  }

  return { labels, data }
}

// 用户和律师注册柱状图
const initUserGrowthChart = () => {
  if (!userGrowthChart.value) return

  if (userGrowthInstance) {
    userGrowthInstance.dispose()
  }
  userGrowthInstance = echarts.init(userGrowthChart.value)

  // 获取用户数据
  const userResult = getChartData(userGrowthData.value)
  // 获取律师数据
  const lawyerResult = getChartData(lawyerGrowthData.value)

  const labels = userResult.labels
  const userData = userResult.data
  const lawyerData = lawyerResult.data

  // 核心几何参数
  const barWidth = 12 // 柱宽固定12px
  const barGapPx = 3 // 同组间距3px（更紧密）
  const dotSize = 10 // 圆点直径
  const dotOffset = 14 // 圆点距柱底距离

  // 计算Y轴最大值
  const maxVal = Math.max(...userData, ...lawyerData, 1)
  const yMax = Math.ceil(maxVal * 1.15)

  console.log('Chart data:', { userData, lawyerData, maxVal, yMax })

  // 自定义绘制胶囊形柱子（两端都是半圆）
  const renderCapsuleBar = (params, api, color) => {
    const categoryIndex = api.value(0)
    const value = api.value(1)
    if (value === 0) return null

    const barLayout = api.barLayout({
      barWidth: barWidth,
      barGap: barGapPx / barWidth,
      count: 2
    })

    const x = api.coord([categoryIndex, 0])[0] + barLayout[params.seriesIndex].offsetCenter
    const yBase = api.coord([categoryIndex, 0])[1]
    const yTop = api.coord([categoryIndex, value])[1]
    const height = yBase - yTop

    const radius = barWidth / 2 // 半圆半径

    // 数据为1时绘制圆形
    if (value === 1) {
      return {
        type: 'circle',
        shape: {
          cx: x,
          cy: yBase - radius,
          r: radius
        },
        style: {
          fill: color
        }
      }
    }

    // 数据≥2时绘制胶囊形，确保最小高度能显示出长度
    const actualHeight = Math.max(height, barWidth + 4) // 至少比圆形高4px
    const actualYTop = yBase - actualHeight // 根据实际高度计算顶部位置

    // 胶囊形状：顶部半圆 + 中间矩形 + 底部半圆
    return {
      type: 'group',
      children: [
        // 中间矩形
        {
          type: 'rect',
          shape: {
            x: x - barWidth / 2,
            y: actualYTop + radius,
            width: barWidth,
            height: actualHeight - barWidth // 减去两个半圆的高度
          },
          style: {
            fill: color
          }
        },
        // 顶部半圆
        {
          type: 'circle',
          shape: {
            cx: x,
            cy: actualYTop + radius,
            r: radius
          },
          style: {
            fill: color
          }
        },
        // 底部半圆
        {
          type: 'circle',
          shape: {
            cx: x,
            cy: yBase - radius,
            r: radius
          },
          style: {
            fill: color
          }
        }
      ]
    }
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#1a1a1a',
        fontSize: 12
      },
      axisPointer: {
        type: 'none'
      },
      formatter: function(params) {
        const customs = params.filter(p => p.seriesType === 'custom')
        if (customs.length === 0) return ''
        let result = `<div style="font-weight:600;margin-bottom:8px;color:#111827">${customs[0].axisValue}</div>`
        customs.forEach(param => {
          const color = param.seriesName === '用户注册' ? '#1a1a1a' : '#d4d4d4'
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:8px"></span>`
          result += `<div style="display:flex;justify-content:space-between;align-items:center;min-width:140px;margin:4px 0">${dot}<span style="color:#6b7280">${param.seriesName}</span><span style="font-weight:600;margin-left:16px;color:#111827">${param.value[1]}</span></div>`
        })
        return result
      }
    },
    grid: {
      left: '50',
      right: '20',
      bottom: '55',
      top: '20',
      containLabel: false
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11,
        margin: 30
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yMax,
      minInterval: 1,
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed'
        }
      },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11,
        margin: 12,
        formatter: (value) => Math.round(value)
      }
    },
    series: [
      // 用户注册柱（深色 - 胶囊形）
      {
        name: '用户注册',
        type: 'custom',
        data: userData.map((val, idx) => [idx, val]),
        renderItem: (params, api) => renderCapsuleBar(params, api, '#1a1a1a'),
        z: 10
      },
      // 律师注册柱（浅色 - 胶囊形）
      {
        name: '律师注册',
        type: 'custom',
        data: lawyerData.map((val, idx) => [idx, val]),
        renderItem: (params, api) => renderCapsuleBar(params, api, '#d4d4d4'),
        z: 10
      },
      // 用户圆点（实心）
      {
        name: '用户圆点',
        type: 'scatter',
        data: userData.map((val, idx) => [idx, 0]),
        symbol: 'circle',
        symbolSize: dotSize,
        symbolOffset: [-(barWidth/2 + barGapPx/2 + 1), dotOffset],
        itemStyle: {
          color: '#1a1a1a'
        },
        z: 5
      },
      // 律师圆点（空心）
      {
        name: '律师圆点',
        type: 'scatter',
        data: lawyerData.map((val, idx) => [idx, 0]),
        symbol: 'circle',
        symbolSize: dotSize,
        symbolOffset: [barWidth/2 + barGapPx/2 + 1, dotOffset],
        itemStyle: {
          color: 'transparent',
          borderColor: '#d4d4d4',
          borderWidth: 2
        },
        z: 5
      }
    ]
  }

  userGrowthInstance.setOption(option)
}

// 初始化咨询统计环形图
const initConsultationChart = () => {
  if (!consultationChart.value) return

  if (consultationChartInstance) {
    consultationChartInstance.dispose()
  }
  consultationChartInstance = echarts.init(consultationChart.value)

  const chartData = consultationLegend.value.map(item => ({
    name: item.name,
    value: item.value,
    itemStyle: { color: item.color }
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#fff',
      borderColor: '#ebebeb',
      borderWidth: 1,
      textStyle: {
        color: '#1a1a1a',
        fontSize: 12
      },
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: false
        },
        labelLine: {
          show: false
        },
        data: chartData,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        }
      }
    ]
  }

  consultationChartInstance.setOption(option)
}

// 窗口resize处理
let resizeObserver = null

const handleResize = () => {
  userGrowthInstance?.resize()
  consultationChartInstance?.resize()
}

onMounted(() => {
  loadStatistics()

  // 使用 ResizeObserver 监听容器大小变化
  resizeObserver = new ResizeObserver(() => {
    handleResize()
  })

  // 监听图表容器
  nextTick(() => {
    if (userGrowthChart.value) {
      resizeObserver.observe(userGrowthChart.value)
    }
    if (consultationChart.value) {
      resizeObserver.observe(consultationChart.value)
    }
  })

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  resizeObserver?.disconnect()
  userGrowthInstance?.dispose()
  consultationChartInstance?.dispose()
})
</script>

<style scoped>
/* ========== 布局结构 ========== */
.dashboard {
  display: flex;
  gap: var(--spacing-5);
  width: 100%;
  height: 100%;
  padding: 2px;
  box-sizing: border-box;
}

.dashboard-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
  height: 100%;
}

.dashboard-aside {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
  height: 100%;
}

/* ========== 三种卡片类型（严格按位置区分） ========== */

/* 类型 A：顶部核心统计卡 - 纯白 + 四周柔和阴影 */
.stat-card {
  background: var(--bg-card-stat);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card-stat);
  border: none;
}

/* 类型 B：内容嵌入型模块（图表/公告/咨询统计）
   - 背景色 = 页面背景
   - 柔和阴影 */
.chart-card,
.announcements-card,
.consultation-card {
  background: var(--bg-card-content);
  border-radius: var(--radius-card);
  border: none;
  position: relative;
  box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.12);
}

/* 类型 C：右侧浮层卡片（最近操作）
   - 背景略凉不是纯白
   - 四周有阴影 */
.aside-card:not(.consultation-card) {
  background: var(--bg-card-float);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card-float);
  border: none;
}

/* ========== 统计卡片 ========== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-5);
  flex-shrink: 0;
}

.stat-card {
  padding: var(--spacing-5) var(--spacing-6);
  transition: box-shadow var(--duration-normal) var(--ease-out), transform var(--duration-normal) var(--ease-out);
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  box-shadow: var(--shadow-card-stat-hover);
  transform: translateY(-2px);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-3);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  font-weight: var(--font-medium);
}

.stat-more {
  color: var(--gray-300);
  cursor: pointer;
  font-size: 18px;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.stat-value {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.stat-trend {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.stat-trend.positive {
  color: var(--success-color);
}

.stat-trend.negative {
  color: var(--danger-color);
}

/* ========== 图表区域 ========== */
.chart-section {
  flex: 1;
  min-height: 0;
}

.chart-card {
  overflow: visible;
  height: 100%;
  display: flex;
  flex-direction: column;
  z-index: 1;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5) var(--spacing-6);
  flex-shrink: 0;
  gap: var(--spacing-4);
}

.chart-title-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-6);
  flex-shrink: 0;
}

.chart-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
}

.chart-legend {
  display: flex;
  gap: var(--spacing-6);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.legend-dot-solid {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--gray-900);
  flex-shrink: 0;
}

.legend-dot-hollow {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: transparent;
  border: 2px solid var(--gray-400);
  box-sizing: border-box;
  flex-shrink: 0;
}

.legend-number {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-left: var(--spacing-1);
}

.legend-label {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin-left: var(--spacing-1);
}

.chart-controls {
  display: flex;
  gap: var(--spacing-3);
  align-items: center;
  overflow-x: auto;
  flex-shrink: 1;
  min-width: 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.chart-controls::-webkit-scrollbar {
  display: none;
}

.year-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  background-color: var(--bg-hover);
  border-radius: var(--radius-lg);
  padding: 3px;
  flex-shrink: 0;
}

.year-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-tertiary);
  transition: all var(--duration-fast) var(--ease-out);
}

.year-nav-btn:hover:not(:disabled) {
  background-color: var(--bg-card);
  color: var(--text-primary);
}

.year-nav-btn:disabled {
  color: var(--text-disabled);
  cursor: not-allowed;
}

.year-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  min-width: 52px;
  text-align: center;
}

.year-label.week-label {
  min-width: 90px;
}

.month-selector,
.week-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  background-color: var(--bg-hover);
  border-radius: var(--radius-lg);
  padding: 3px;
  flex-shrink: 0;
}

.period-tabs {
  display: flex;
  background-color: var(--bg-hover);
  border-radius: var(--radius-lg);
  padding: 3px;
  gap: 2px;
  flex-shrink: 0;
}

.period-tab {
  padding: 6px 16px;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.period-tab:hover {
  color: var(--text-secondary);
}

.period-tab.active {
  background-color: var(--bg-card);
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.chart-body {
  flex: 1;
  padding: var(--spacing-2) var(--spacing-6) var(--spacing-5);
  min-height: 0;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 220px;
}

/* ========== 公告区域 ========== */
.announcements-section {
  flex-shrink: 0;
}

.announcements-card {
  overflow: visible;
  z-index: 1;
}

.announcements-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5) var(--spacing-6);
}

.announcements-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.view-more {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-out);
}

.view-more:hover {
  color: var(--text-secondary);
}

.announcements-list {
  padding: 0 var(--spacing-6) var(--spacing-5);
}

.announcement-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--spacing-4) 0;
  cursor: pointer;
  transition: opacity var(--duration-fast) var(--ease-out);
}

.announcement-item:not(:last-child) {
  border-bottom: 1px solid var(--border-light);
}

.announcement-item:hover {
  opacity: 0.7;
}

.announcement-item.empty {
  justify-content: center;
  cursor: default;
}

.announcement-content {
  flex: 1;
  min-width: 0;
}

.announcement-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-1);
}

.announcement-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.announcement-badge {
  font-size: 10px;
  padding: 2px 8px;
  background-color: var(--warning-light);
  color: var(--warning-color);
  border-radius: var(--radius-sm);
  font-weight: var(--font-medium);
}

.announcement-text {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 500px;
}

.announcement-date {
  font-size: var(--text-sm);
  color: var(--text-placeholder);
  flex-shrink: 0;
  margin-left: var(--spacing-4);
}

.empty-text {
  font-size: var(--text-sm);
  color: var(--text-placeholder);
}

/* ========== 右侧面板 ========== */
.aside-card {
  padding: var(--spacing-5);
}

.aside-card:last-child {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.consultation-card {
  flex: none;
  overflow: visible;
  z-index: 1;
}

.consultation-chart {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-2) 0;
}

.consultation-chart-container {
  width: 160px;
  height: 160px;
}

.consultation-legend {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--border-light);
  overflow: hidden;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
}

.legend-color {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-name {
  flex: 1;
  min-width: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-value {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  flex-shrink: 0;
}

.aside-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
  flex-shrink: 0;
}

.aside-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.aside-icon {
  color: var(--gray-300);
  cursor: pointer;
  font-size: 18px;
}

/* ========== 活动列表 ========== */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  flex: 1;
  overflow-y: auto;
  margin-bottom: var(--spacing-4);
}

.activity-item {
  display: flex;
  gap: var(--spacing-3);
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
  border: 2px solid;
  background: transparent;
}

.activity-dot.success {
  border-color: var(--success-color);
}

.activity-dot.info {
  border-color: var(--gray-300);
}

.activity-dot.warning {
  border-color: var(--warning-color);
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-1) 0;
  line-height: 1.5;
}

.activity-text :deep(strong) {
  color: var(--text-primary);
  font-weight: var(--font-semibold);
}

.activity-time {
  font-size: var(--text-xs);
  color: var(--text-placeholder);
}

.view-all-btn {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--gray-900);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
  flex-shrink: 0;
}

.view-all-btn:hover {
  background-color: var(--gray-800);
}

/* ========== 响应式 ========== */
@media (max-width: 1200px) {
  .dashboard {
    flex-direction: column;
    height: auto;
  }

  .dashboard-aside {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    height: auto;
  }

  .aside-card {
    flex: 1;
    min-width: 280px;
  }

  .aside-card:last-child {
    flex: 1;
    min-height: auto;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .aside-card {
    min-width: 100%;
  }
}
</style>
