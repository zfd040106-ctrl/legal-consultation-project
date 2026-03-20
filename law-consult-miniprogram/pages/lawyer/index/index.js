const { get } = require('../../../utils/api');
const { getStorage } = require('../../../utils/storage');

Page({
  data: {
    lawyerInfo: {},
    stats: {
      pendingCount: 0,
      inProgressCount: 0,
      resolvedCount: 0,
      replyRate: 0
    },
    consultations: [],
    myConsultations: [],
    loading: false
  },

  onLoad() {
    this.loadLawyerInfo();
    this.loadStats();
    this.loadConsultations();
    this.loadMyConsultations();
  },

  onShow() {
    this.loadLawyerInfo();
    this.loadStats();
    this.loadConsultations();
    this.loadMyConsultations();
  },

  async loadLawyerInfo() {
    try {
      const lawyerInfo = wx.getStorageSync('userInfo') || {};
      const userId = getStorage('userId');
      if (!userId) {
        this.setData({ lawyerInfo });
        return;
      }
      const res = await get('/lawyers/profile', { userId });
      // 后端返回 { user: {...}, lawyerInfo: {...} }
      // 需要合并 user 信息（包含 avatar）和 lawyerInfo
      const userData = res.user || {};
      const lawyerData = res.lawyerInfo || {};
      this.setData({
        lawyerInfo: {
          ...lawyerInfo,
          ...userData,
          ...lawyerData,
          avatar: userData.avatar || lawyerInfo.avatar
        }
      });
    } catch (error) {
      console.error('获取律师信息失败:', error);
      // 使用本地存储的信息
      const lawyerInfo = wx.getStorageSync('userInfo') || {};
      this.setData({ lawyerInfo });
    }
  },

  async loadStats() {
    try {
      const lawyerId = getStorage('userId');
      if (!lawyerId) return;
      const res = await get('/lawyers/index-stats', { lawyerId });

      this.setData({
        stats: {
          pendingCount: res.pendingCount || 0,
          inProgressCount: res.inProgressCount || 0,
          resolvedCount: res.resolvedCount || 0,
          replyRate: 0
        }
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  },

  async loadConsultations() {
    this.setData({ loading: true });

    try {
      const lawyerId = getStorage('userId');
      if (!lawyerId) {
        this.setData({ loading: false });
        return;
      }
      const res = await get(`/consultations/lawyer/${lawyerId}`, {
        status: 'open',
        page: 1,
        pageSize: 2
      });

      // 兼容不同的响应格式
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
        timeText: this.formatTime(item.createdAt || item.createTime)
      }));

      this.setData({ consultations });
    } catch (error) {
      console.error('获取咨询列表失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadMyConsultations() {
    try {
      const lawyerId = getStorage('userId');
      if (!lawyerId) return;

      // 加载处理中和已解决的咨询
      const [inProgressRes, resolvedRes] = await Promise.all([
        get(`/consultations/lawyer/${lawyerId}`, {
          status: 'in_progress',
          page: 1,
          pageSize: 2
        }),
        get(`/consultations/lawyer/${lawyerId}`, {
          status: 'resolved',
          page: 1,
          pageSize: 2
        })
      ]);

      // 处理响应数据
      let inProgressList = [];
      let resolvedList = [];

      // 处理 in_progress 数据
      if (Array.isArray(inProgressRes)) {
        inProgressList = inProgressRes;
      } else if (inProgressRes && Array.isArray(inProgressRes.items)) {
        inProgressList = inProgressRes.items;
      } else if (inProgressRes && Array.isArray(inProgressRes.list)) {
        inProgressList = inProgressRes.list;
      }

      // 处理 resolved 数据
      if (Array.isArray(resolvedRes)) {
        resolvedList = resolvedRes;
      } else if (resolvedRes && Array.isArray(resolvedRes.items)) {
        resolvedList = resolvedRes.items;
      } else if (resolvedRes && Array.isArray(resolvedRes.list)) {
        resolvedList = resolvedRes.list;
      }

      // 合并并转换数据
      const myConsultations = [...inProgressList, ...resolvedList].map(item => ({
        ...item,
        statusText: {
          'in_progress': '处理中',
          'resolved': '已解决',
          'closed': '已关闭'
        }[item.status] || item.status,
        timeText: this.formatTime(item.createdAt || item.createTime)
      }));

      this.setData({ myConsultations });
    } catch (error) {
      console.error('获取我的咨询失败:', error);
    }
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

  goToConsultationList(e) {
    const status = e.currentTarget.dataset.status || 'all';
    wx.navigateTo({
      url: `/pages/lawyer/consultationList/consultationList?status=${status}`
    });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/lawyer/consultationDetail/consultationDetail?id=${id}`
    });
  },

  goToStatistics() {
    wx.navigateTo({
      url: '/pages/lawyer/statistics/statistics'
    });
  },

  goToProfile() {
    wx.navigateTo({
      url: '/pages/lawyer/profile/edit-profile/edit-profile'
    });
  },

  goToMessage() {
    wx.navigateTo({
      url: '/pages/lawyer/message/message'
    });
  },

  /**
   * 处理导航栏标签切换
   */
  handleTabChange(e) {
    const { tab } = e.detail;
    // 导航由组件处理，这里可以添加额外的逻辑
    console.log('切换到标签页:', tab);
  }
});
