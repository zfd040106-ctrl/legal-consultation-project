const { get, post } = require('../../../utils/api');
const { getStorage } = require('../../../utils/storage');

Page({
  data: {
    activeTab: 'active',
    activeConsultations: [],
    historyConsultations: [],
    systemMessages: [],
    loading: false,
    refreshing: false,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  handleTabChange(e) {
    this.setData({
      activeTab: e.detail.value,
      page: 1,
      hasMore: true
    });
    this.loadData();
  },

  onRefresh() {
    this.setData({
      refreshing: true,
      page: 1,
      hasMore: true
    });
    this.loadData().finally(() => {
      this.setData({ refreshing: false });
    });
  },

  loadMore() {
    if (!this.data.hasMore || this.data.loading) return;

    this.setData({ page: this.data.page + 1 });
    this.loadData(true);
  },

  async loadData(append = false) {
    if (this.data.activeTab === 'system') {
      await this.loadSystemMessages(append);
    } else {
      await this.loadConsultations(append);
    }
  },

  async loadConsultations(append = false) {
    const userId = getStorage('userId');
    if (!userId) {
      this.setData({ loading: false });
      return;
    }

    this.setData({ loading: true });

    try {
      const isActive = this.data.activeTab === 'active';
      const params = {
        page: append ? this.data.page : 1,
        pageSize: this.data.pageSize
      };

      if (isActive) {
        params.status = 'in_progress';
      } else {
        params.status = 'resolved';
      }

      const res = await get(`/consultations/user/${userId}`, params);

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
        timeText: this.formatTime(item.updatedAt || item.createdAt),
        lastMessage: item.lastReplyContent || item.description || '暂无消息',
        previewMessage: this.buildPreviewText(item.lastReplyContent || item.description || '暂无消息'),
        previewTitle: this.buildPreviewText(item.title || '', 28),
        statusText: this.getStatusText(item.status)
      }));

      if (isActive) {
        this.setData({
          activeConsultations: append ? [...this.data.activeConsultations, ...consultations] : consultations,
          hasMore: consultations.length >= this.data.pageSize
        });
      } else {
        this.setData({
          historyConsultations: append ? [...this.data.historyConsultations, ...consultations] : consultations,
          hasMore: consultations.length >= this.data.pageSize
        });
      }

      if (isActive && !append) {
        const openRes = await get(`/consultations/user/${userId}`, {
          page: 1,
          pageSize: 50,
          status: 'open'
        });

        let openList = [];
        if (Array.isArray(openRes)) {
          openList = openRes;
        } else if (openRes && Array.isArray(openRes.items)) {
          openList = openRes.items;
        } else if (openRes && Array.isArray(openRes.list)) {
          openList = openRes.list;
        }

        const openConsultations = openList.map((item) => ({
          ...item,
          timeText: this.formatTime(item.updatedAt || item.createdAt),
          lastMessage: item.lastReplyContent || item.description || '等待律师接单',
          previewMessage: this.buildPreviewText(item.lastReplyContent || item.description || '等待律师接单'),
          previewTitle: this.buildPreviewText(item.title || '', 28),
          statusText: this.getStatusText(item.status)
        }));

        const existingIds = new Set(this.data.activeConsultations.map((item) => item.id));
        const uniqueOpenConsultations = openConsultations.filter((item) => !existingIds.has(item.id));

        this.setData({
          activeConsultations: [...uniqueOpenConsultations, ...this.data.activeConsultations]
        });
      }

      if (!isActive && !append) {
        const closedRes = await get(`/consultations/user/${userId}`, {
          page: 1,
          pageSize: 50,
          status: 'closed'
        });

        let closedList = [];
        if (Array.isArray(closedRes)) {
          closedList = closedRes;
        } else if (closedRes && Array.isArray(closedRes.items)) {
          closedList = closedRes.items;
        } else if (closedRes && Array.isArray(closedRes.list)) {
          closedList = closedRes.list;
        }

        const closedConsultations = closedList.map((item) => ({
          ...item,
          timeText: this.formatTime(item.updatedAt || item.createdAt),
          lastMessage: item.lastReplyContent || item.description || '暂无消息',
          previewMessage: this.buildPreviewText(item.lastReplyContent || item.description || '暂无消息'),
          previewTitle: this.buildPreviewText(item.title || '', 28),
          statusText: this.getStatusText(item.status)
        }));

        const existingIds = new Set(this.data.historyConsultations.map((item) => item.id));
        const uniqueClosedConsultations = closedConsultations.filter((item) => !existingIds.has(item.id));

        this.setData({
          historyConsultations: [...this.data.historyConsultations, ...uniqueClosedConsultations]
        });
      }
    } catch (error) {
      console.error('加载咨询列表失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadSystemMessages(append = false) {
    this.setData({ loading: true });

    try {
      const params = {
        page: append ? this.data.page : 1,
        pageSize: this.data.pageSize
      };

      const res = await get('/public/announcements', params);

      let dataList = [];
      if (Array.isArray(res)) {
        dataList = res;
      } else if (res && Array.isArray(res.items)) {
        dataList = res.items;
      } else if (res && Array.isArray(res.list)) {
        dataList = res.list;
      }

      const messages = dataList.map((item) => ({
        ...item,
        timeText: this.formatTime(item.publishedAt || item.createdAt)
      }));

      this.setData({
        systemMessages: append ? [...this.data.systemMessages, ...messages] : messages,
        hasMore: messages.length >= this.data.pageSize
      });
    } catch (error) {
      console.error('加载系统公告失败:', error);
      if (!append) {
        this.setData({ systemMessages: [], hasMore: false });
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  getStatusText(status) {
    const statusMap = {
      open: '等待接单',
      in_progress: '咨询中',
      resolved: '已解决',
      closed: '已关闭'
    };
    return statusMap[status] || status;
  },

  formatTime(dateStr) {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 60 * 1000) {
      return '刚刚';
    }
    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`;
    }
    if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
    }
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
    }

    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}-${day}`;
  },

  buildPreviewText(value, maxLength = 34) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) {
      return '';
    }

    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength)}...`;
  },

  goToChat(e) {
    const item = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: `/pages/user/chat/chat?id=${item.id}`
    });
  },

  goToConsult() {
    wx.navigateTo({
      url: '/pages/user/consultation/consultation'
    });
  },

  handleDelete(e) {
    const id = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条咨询记录吗？删除后无法恢复。',
      success: async (res) => {
        if (res.confirm) {
          try {
            await post(`/consultations/${id}/delete`);

            if (this.data.activeTab === 'active') {
              const list = this.data.activeConsultations.filter((item) => item.id !== id);
              this.setData({ activeConsultations: list });
            } else {
              const list = this.data.historyConsultations.filter((item) => item.id !== id);
              this.setData({ historyConsultations: list });
            }

            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
          } catch (error) {
            wx.showToast({
              title: error.message || '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  handleSwipeClick(e) {
    const { text } = e.detail;
    const id = e.currentTarget.dataset.id;

    if (text === '删除') {
      this.handleDelete({ currentTarget: { dataset: { id } } });
    }
  },

  handleSystemMessageClick(e) {
    const message = e.currentTarget.dataset.message;

    wx.showModal({
      title: message.title,
      content: message.content,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onPullDownRefresh() {
    this.onRefresh();
    wx.stopPullDownRefresh();
  },

  onReachBottom() {
    this.loadMore();
  },

  handleTabChangeNav() {}
});
