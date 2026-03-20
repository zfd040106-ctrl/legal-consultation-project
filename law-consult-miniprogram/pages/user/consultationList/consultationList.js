const { get, post } = require('../../../utils/api');
const { APP_CONSTANTS } = require('../../../utils/config');
const { getStorage } = require('../../../utils/storage');

Page({
  data: {
    consultations: [],
    loading: true,
    loadingMore: false,
    hasMore: true,
    page: 1,
    pageSize: APP_CONSTANTS.PAGE_SIZE,
    activeTab: 'all',
    keyword: '',
    statusText: {
      open: '待处理',
      pending_accept: '待律师接受',
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
    }
  },

  onLoad(options) {
    if (options.keyword) {
      this.setData({
        keyword: decodeURIComponent(options.keyword)
      });
    }
    this.loadConsultations();
  },

  onShow() {
    if (this.data.consultations.length > 0) {
      this.refreshList();
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  async loadConsultations(isRefresh = false) {
    if (isRefresh) {
      this.setData({
        page: 1,
        hasMore: true,
        consultations: []
      });
    }

    this.setData({ loading: true });

    try {
      const params = {
        page: this.data.page,
        pageSize: this.data.pageSize
      };

      if (this.data.activeTab !== 'all') {
        params.status = this.data.activeTab;
      }

      if (this.data.keyword) {
        params.keyword = this.data.keyword;
      }

      const userId = getStorage('userId');
      const response = await get(`/consultations/user/${userId}`, params);

      let dataList = [];
      if (Array.isArray(response)) {
        dataList = response;
      } else if (response && Array.isArray(response.items)) {
        dataList = response.items;
      } else if (response && Array.isArray(response.list)) {
        dataList = response.list;
      }

      const newList = dataList.map((item) => ({
        ...item,
        content: item.content || item.description,
        createTimeText: this.formatTime(item.createdAt || item.createTime || item.created_at)
      }));

      const consultations = isRefresh
        ? newList
        : [...this.data.consultations, ...newList];

      this.setData({
        consultations,
        hasMore: newList.length >= this.data.pageSize,
        loading: false,
        loadingMore: false
      });
    } catch (error) {
      console.error('加载咨询列表失败:', error);
      this.setData({
        loading: false,
        loadingMore: false
      });
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  refreshList() {
    this.loadConsultations(true);
  },

  async loadMore() {
    if (!this.data.hasMore || this.data.loadingMore) return;

    this.setData({
      loadingMore: true,
      page: this.data.page + 1
    });

    try {
      await this.loadConsultations(false);
    } catch (error) {
      console.error('加载更多失败:', error);
      this.setData({
        loadingMore: false,
        page: this.data.page - 1
      });
    }
  },

  formatTime(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const now = Date.now();
    const diff = now - date.getTime();

    if (diff < 60 * 60 * 1000) {
      const minutes = Math.max(1, Math.floor(diff / (60 * 1000)));
      return `${minutes}分钟前`;
    }

    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}小时前`;
    }

    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}天前`;
    }

    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  handleSearchChange(e) {
    this.setData({
      keyword: e.detail.value
    });
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

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/user/consultationDetail/consultationDetail?id=${id}`
    });
  },

  goToConsultation() {
    wx.navigateTo({
      url: '/pages/user/consultation/consultation'
    });
  },

  async handleDelete(e) {
    const consultationId = e.currentTarget.dataset.id;
    const consultation = this.data.consultations.find((item) => item.id === consultationId);

    if (!consultation) return;

    const status = consultation.status;
    const isHardDelete = status === 'open' || status === 'pending_accept';
    const deleteType = isHardDelete ? '硬删除' : '软删除';
    const confirmMsg = isHardDelete
      ? '当前咨询将被彻底删除，无法恢复。确定继续吗？'
      : '当前咨询将被标记为删除，数据仍会保留。确定继续吗？';

    wx.showModal({
      title: `${deleteType}确认`,
      content: confirmMsg,
      confirmColor: isHardDelete ? '#FF3B30' : '#FF9500',
      success: async (res) => {
        if (!res.confirm) return;

        wx.showLoading({ title: '删除中...' });
        try {
          if (isHardDelete) {
            await post(`/consultations/${consultationId}/delete`, {});
          } else {
            await post(`/consultations/${consultationId}/soft-delete`, {
              role: 'user'
            });
          }
          wx.hideLoading();
          wx.showToast({
            title: `已${deleteType}`,
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
  },

  onPullDownRefresh() {
    this.loadConsultations(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  }
});
