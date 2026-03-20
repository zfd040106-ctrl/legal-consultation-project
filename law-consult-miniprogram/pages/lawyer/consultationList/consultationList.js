const { get, post } = require('../../../utils/api');
const { getStorage } = require('../../../utils/storage');

Page({
  data: {
    activeTab: 'all',
    keyword: '',
    consultations: [],
    loading: false,
    loadingMore: false,
    refreshing: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    unreadCount: 0,
    statusText: {
      open: '公开待接',
      pending_accept: '定向待接受',
      in_progress: '处理中',
      resolved: '已解决',
      closed: '已关闭'
    },
    statusTheme: {
      open: 'warning',
      pending_accept: 'warning',
      in_progress: 'primary',
      resolved: 'success',
      closed: 'default'
    },
    payStatusText: {
      unpaid: '未支付',
      escrowed: '已托管',
      settled: '已结算',
      refunded: '已退款'
    }
  },

  onLoad(options) {
    if (options.status) {
      this.setData({ activeTab: options.status });
    }
    this.loadConsultations(true);
  },

  handleBack() {
    wx.navigateBack();
  },

  handleSearchChange(e) {
    this.setData({ keyword: e.detail.value || '' });
  },

  handleSearch() {
    this.loadConsultations(true);
  },

  handleClear() {
    this.setData({ keyword: '' });
    this.loadConsultations(true);
  },

  handleTabChange(e) {
    this.setData({
      activeTab: e.detail.value
    });
    this.loadConsultations(true);
  },

  onRefresh() {
    this.setData({ refreshing: true });
    this.loadConsultations(true).finally(() => {
      this.setData({ refreshing: false });
    });
  },

  loadMore() {
    if (!this.data.hasMore || this.data.loadingMore) return;
    this.loadConsultations(false);
  },

  formatTime(dateStr) {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
    if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;

    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${month}-${day}`;
  },

  formatMoney(value) {
    return Number(value || 0).toFixed(2);
  },

  async loadConsultations(isRefresh = false) {
    const lawyerId = getStorage('userId');
    if (!lawyerId) {
      return Promise.resolve();
    }

    const nextPage = isRefresh ? 1 : this.data.page;
    this.setData({
      loading: isRefresh,
      loadingMore: !isRefresh
    });

    try {
      const params = {
        page: nextPage,
        pageSize: this.data.pageSize
      };

      if (this.data.activeTab !== 'all') {
        params.status = this.data.activeTab;
      }
      if (this.data.keyword) {
        params.keyword = this.data.keyword;
      }

      const res = await get(`/consultations/lawyer/${lawyerId}`, params);

      let dataList = [];
      if (Array.isArray(res)) {
        dataList = res;
      } else if (res && Array.isArray(res.items)) {
        dataList = res.items;
      } else if (res && Array.isArray(res.list)) {
        dataList = res.list;
      }

      const consultations = dataList.map((item) => ({
        ...item,
        description: item.description || item.content || '',
        timeText: this.formatTime(item.createdAt || item.createTime),
        assignmentTypeText: item.assignmentType === 'directed' ? '定向咨询' : '公开咨询',
        feeAmountText: this.formatMoney(item.feeAmount),
        hasFee: Number(item.feeAmount || 0) > 0,
        payStatusText: this.data.payStatusText[item.payStatus] || '未支付'
      }));

      this.setData({
        consultations: isRefresh ? consultations : [...this.data.consultations, ...consultations],
        hasMore: consultations.length >= this.data.pageSize,
        page: nextPage + 1
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
      if (isRefresh) {
        this.setData({
          consultations: [],
          hasMore: false
        });
      }
    } finally {
      this.setData({
        loading: false,
        loadingMore: false
      });
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/lawyer/consultationDetail/consultationDetail?id=${id}`
    });
  },

  async handleDelete(e) {
    const consultationId = e.currentTarget.dataset.id;
    const consultation = this.data.consultations.find((item) => item.id === consultationId);

    if (!consultation || consultation.status !== 'resolved') {
      wx.showToast({
        title: '只可删除已解决咨询',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '删除咨询',
      content: '删除后将在律师端隐藏该记录，是否继续？',
      confirmColor: '#FF3B30',
      success: async (res) => {
        if (!res.confirm) return;

        wx.showLoading({ title: '删除中...' });
        try {
          await post(`/consultations/${consultationId}/soft-delete`, {
            role: 'lawyer'
          });
          wx.hideLoading();
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          this.loadConsultations(true);
        } catch (error) {
          wx.hideLoading();
          wx.showToast({
            title: error.message || '删除失败',
            icon: 'none'
          });
        }
      }
    });
  }
});
