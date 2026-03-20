const { get, post } = require('../../../utils/api');
const { getStorage } = require('../../../utils/storage');

Page({
  data: {
    activeTab: 'active',
    activeConsultations: [],   // 进行中的咨询
    historyConsultations: [],  // 历史咨询
    systemMessages: [],        // 系统消息
    loading: false,
    refreshing: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    unreadCount: 0
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  handleBack() {
    wx.navigateBack();
  },

  handleTabChange(e) {
    // 区分事件来源：
    // LawyerTabBar 事件格式: { tab: "xxx" } - 导航由组件处理，这里忽略
    // 页面内 t-tabs 事件格式: { value: "xxx" } - 处理消息分类筛选

    if (e.detail.tab) {
      // 来自 LawyerTabBar 的导航事件，忽略
      return;
    }

    // 处理页面内 t-tabs 的消息分类切换
    const activeTab = e.detail.value;
    this.setData({
      activeTab: activeTab,
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

  // 根据当前Tab加载数据
  async loadData(append = false) {
    if (this.data.activeTab === 'system') {
      await this.loadSystemMessages(append);
    } else {
      await this.loadConsultations(append);
    }
  },

  async loadConsultations(append = false) {
    const lawyerId = getStorage('userId');
    if (!lawyerId) {
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

      const res = await get(`/consultations/lawyer/${lawyerId}`, params);

      let dataList = [];
      if (Array.isArray(res)) {
        dataList = res;
      } else if (res && Array.isArray(res.items)) {
        dataList = res.items;
      } else if (res && Array.isArray(res.list)) {
        dataList = res.list;
      }

      const consultations = dataList.map(item => ({
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

      // 历史Tab：额外加载closed状态
      if (!isActive && !append) {
        const closedRes = await get(`/consultations/lawyer/${lawyerId}`, {
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

        const closedConsultations = closedList.map(item => ({
          ...item,
          timeText: this.formatTime(item.updatedAt || item.createdAt),
          lastMessage: item.lastReplyContent || item.description || '咨询已关闭',
          previewMessage: this.buildPreviewText(item.lastReplyContent || item.description || '咨询已关闭'),
          previewTitle: this.buildPreviewText(item.title || '', 28),
          statusText: this.getStatusText(item.status)
        }));

        this.setData({
          historyConsultations: [...this.data.historyConsultations, ...closedConsultations]
        });
      }

    } catch (error) {
      console.error('加载咨询列表失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载系统公告
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

      const messages = dataList.map(item => ({
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
      'open': '可接咨询',
      'in_progress': '咨询中',
      'resolved': '已解决',
      'closed': '已关闭'
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
      return Math.floor(diff / (60 * 1000)) + '分钟前';
    }
    if (diff < 24 * 60 * 60 * 1000) {
      return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
    }
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前';
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

  // 点击进入聊天页面
  goToChat(e) {
    const item = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: `/pages/lawyer/chat/chat?id=${item.id}`
    });
  },

  // 删除咨询记录
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
              const list = this.data.activeConsultations.filter(item => item.id !== id);
              this.setData({ activeConsultations: list });
            } else {
              const list = this.data.historyConsultations.filter(item => item.id !== id);
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

  // 滑动删除点击事件
  handleSwipeClick(e) {
    const { text } = e.detail;
    const id = e.currentTarget.dataset.id;

    if (text === '删除') {
      this.handleDelete({ currentTarget: { dataset: { id } } });
    }
  },

  // 系统通知点击
  handleSystemMessageClick(e) {
    const message = e.currentTarget.dataset.message;

    // 显示通知详情
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
  }
});
