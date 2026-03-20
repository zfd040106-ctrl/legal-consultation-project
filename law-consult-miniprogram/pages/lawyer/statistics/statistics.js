const { get } = require('../../../utils/api');
const { getStorage } = require('../../../utils/storage');

Page({
  data: {
    timeRange: 'week',
    loading: false,
    refreshing: false,
    overview: {
      totalConsultations: 0,
      resolvedCount: 0,
      inProgressCount: 0
    },
    walletSummary: {
      availableBalance: '0.00',
      frozenBalance: '0.00',
      totalIncome: '0.00',
      totalWithdrawn: '0.00'
    },
    recentFlows: [],
    categoryData: []
  },

  onLoad() {
    this.loadStatistics();
  },

  handleBack() {
    wx.navigateBack();
  },

  onTimeRangeChange(e) {
    this.setData({ timeRange: e.detail.value });
    this.loadStatistics();
  },

  onRefresh() {
    this.setData({ refreshing: true });
    this.loadStatistics().finally(() => {
      this.setData({ refreshing: false });
    });
  },

  formatMoney(value) {
    return Number(value || 0).toFixed(2);
  },

  formatDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hour = `${date.getHours()}`.padStart(2, '0');
    const minute = `${date.getMinutes()}`.padStart(2, '0');
    return `${month}-${day} ${hour}:${minute}`;
  },

  mapFlow(item) {
    const labelMap = {
      consult_settle: '咨询结算入账',
      withdraw_success: '申请提现'
    };
    const isIncome = item.direction === 'in';
    return {
      ...item,
      title: labelMap[item.bizType] || item.remark || '钱包流水',
      amountText: `${isIncome ? '+' : '-'}¥${this.formatMoney(item.amount)}`,
      amountClass: isIncome ? 'income' : 'expense',
      timeText: this.formatDateTime(item.createdAt)
    };
  },

  async loadStatistics() {
    this.setData({ loading: true });

    try {
      const lawyerId = getStorage('userId');
      if (!lawyerId) {
        this.setData({ loading: false });
        return;
      }

      const statsResponse = await get('/lawyers/statistics', {
        lawyerId,
        timeRange: this.data.timeRange
      });

      const overview = statsResponse.overview || {};
      const wallet = statsResponse.wallet || {};

      const flowItems = Array.isArray(statsResponse.recentFlows) ? statsResponse.recentFlows : [];

      this.setData({
        overview: {
          totalConsultations: overview.totalConsultations || 0,
          resolvedCount: overview.resolvedCount || 0,
          inProgressCount: overview.inProgressCount || 0
        },
        walletSummary: {
          availableBalance: this.formatMoney(wallet.availableBalance),
          frozenBalance: this.formatMoney(wallet.frozenBalance),
          totalIncome: this.formatMoney(wallet.totalIncome),
          totalWithdrawn: this.formatMoney(wallet.totalWithdrawn)
        },
        recentFlows: flowItems.map(item => this.mapFlow(item)),
        categoryData: this.processCategoryData(statsResponse.categories || [])
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
      this.setData({
        overview: { totalConsultations: 0, resolvedCount: 0, inProgressCount: 0 },
        walletSummary: { availableBalance: '0.00', frozenBalance: '0.00', totalIncome: '0.00', totalWithdrawn: '0.00' },
        recentFlows: [],
        categoryData: []
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  processCategoryData(data) {
    if (!data || data.length === 0) return [];

    const colors = ['#34C759', '#007AFF', '#FF9500', '#FF3B30', '#5856D6', '#AF52DE'];
    const total = data.reduce((sum, item) => sum + item.count, 0);

    return data.map((item, index) => ({
      name: item.name,
      count: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
      color: colors[index % colors.length]
    }));
  },

  goToWallet() {
    wx.navigateTo({
      url: '/pages/lawyer/wallet/wallet'
    });
  }
});
