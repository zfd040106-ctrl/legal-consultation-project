const { get, post } = require('../../../utils/api');
const { getStorage, getUserInfo } = require('../../../utils/storage');

Page({
  data: {
    consultationId: '',
    consultation: {},
    messages: [],
    inputValue: '',
    loading: false,
    isSending: false,
    scrollToView: '',
    statusBarHeight: 20,
    navBarHeight: 44,
    inputAreaHeight: 52,
    bottomSafeHeight: 0,
    lawyerInfo: {},
    userConfirmedResolved: false,
    lawyerConfirmedResolved: false
  },

  onLoad(options) {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const statusBarHeight = windowInfo.statusBarHeight || 20;
    const safeAreaBottom = windowInfo.safeArea ? windowInfo.safeArea.bottom : windowInfo.windowHeight;
    const screenHeight = windowInfo.screenHeight || windowInfo.windowHeight || 0;
    const bottomSafeHeight = Math.max(0, screenHeight - safeAreaBottom);
    const currentUser = getUserInfo();

    this.setData({
      consultationId: options.id || '',
      statusBarHeight,
      bottomSafeHeight,
      lawyerInfo: {
        name: currentUser.username || '',
        avatar: currentUser.avatar || ''
      }
    });

    if (options.id) {
      this.loadChatData();
    }
  },

  onShow() {
    if (this.data.consultationId) {
      this.loadChatData();
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  async loadChatData() {
    if (!this.data.consultationId) return;

    this.setData({ loading: true });

    try {
      const res = await get(`/consultations/${this.data.consultationId}`);
      const consultationData = res.consultation || res;
      const replies = res.replies || [];
      const currentUser = getUserInfo();

      const messages = replies.map(item => ({
        ...item,
        timeText: this.formatTime(item.createdAt || item.updatedAt)
      }));

      this.setData({
        consultation: {
          ...consultationData,
          description: consultationData.description || consultationData.content || '',
          createdAtText: this.formatDateTime(consultationData.createdAt || consultationData.updatedAt)
        },
        messages,
        lawyerInfo: {
          name: consultationData.lawyerName || currentUser.username || '',
          avatar: consultationData.lawyerAvatar || currentUser.avatar || ''
        },
        userConfirmedResolved: !!consultationData.userConfirmedResolved,
        lawyerConfirmedResolved: !!consultationData.lawyerConfirmedResolved
      });

      this.scrollToBottom();
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  handleInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  async sendMessage() {
    const content = (this.data.inputValue || '').trim();
    if (!content || this.data.isSending) return;

    const lawyerId = getStorage('userId');
    if (!lawyerId) {
      wx.showToast({
        title: '律师未登录',
        icon: 'none'
      });
      return;
    }

    this.setData({ isSending: true });

    try {
      await post(`/consultations/${this.data.consultationId}/reply`, {
        lawyerId,
        content,
        isSolution: false
      });

      this.setData({ inputValue: '' });
      await this.loadChatData();
    } catch (error) {
      wx.showToast({
        title: error.message || '发送失败',
        icon: 'none'
      });
    } finally {
      this.setData({ isSending: false });
    }
  },

  showMoreActions() {
    wx.showActionSheet({
      itemList: ['请求结束咨询'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.requestResolve();
        }
      }
    });
  },

  async requestResolve() {
    if (this.data.lawyerConfirmedResolved && !this.data.userConfirmedResolved) {
      wx.showToast({
        title: '已请求结案，等待用户确认',
        icon: 'none'
      });
      return;
    }

    if (this.data.lawyerConfirmedResolved && this.data.userConfirmedResolved) {
      wx.showToast({
        title: '咨询已解决',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认操作',
      content: '确定要请求结束本次咨询吗？用户需要确认才能最终结案。',
      success: async (res) => {
        if (!res.confirm) return;

        try {
          await post(`/consultations/${this.data.consultationId}/request-resolve`, {
            role: 'lawyer'
          });
          wx.showToast({
            title: '已发起结案请求',
            icon: 'success'
          });
          this.loadChatData();
        } catch (error) {
          wx.showToast({
            title: error.message || '操作失败',
            icon: 'none'
          });
        }
      }
    });
  },

  async confirmResolve() {
    wx.showModal({
      title: '确认解决',
      content: '您确认咨询已解决吗？确认后将结束本次咨询。',
      success: async (res) => {
        if (!res.confirm) return;

        try {
          await post(`/consultations/${this.data.consultationId}/confirm-resolve`, {
            role: 'lawyer'
          });
          wx.showToast({
            title: '咨询已解决',
            icon: 'success'
          });
          this.loadChatData();
        } catch (error) {
          wx.showToast({
            title: error.message || '操作失败',
            icon: 'none'
          });
        }
      }
    });
  },

  viewUserInfo() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  scrollToBottom() {
    this.setData({ scrollToView: '' });
    setTimeout(() => {
      this.setData({ scrollToView: 'chat-bottom' });
    }, 50);
  },

  formatTime(dateStr) {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;

    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${hour}:${minute}`;
  },

  formatDateTime(dateStr) {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${month}-${day} ${hour}:${minute}`;
  }
});
