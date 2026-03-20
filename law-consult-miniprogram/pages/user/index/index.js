const { get } = require('../../../utils/api');
const { API_BASE_URL } = require('../../../utils/config');
const { getStorage, setStorage } = require('../../../utils/storage');

const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
const LOCAL_CAROUSEL_FALLBACK = '/assets/images/splash-bg.png';
const CAROUSEL_READER_STORAGE_KEY = 'userCarouselReaderItem';

Page({
  data: {
    loading: true,
    searchKeyword: '',
    consultations: [],
    pinnedAnnouncement: null,
    featuredAnnouncement: null,
    carouselItems: []
  },

  onLoad() {
    this.checkLogin();
  },

  onShow() {
    if (getStorage('userId')) {
      this.loadPageData();
    }
  },

  checkLogin() {
    const userId = getStorage('userId');
    if (!userId) {
      wx.redirectTo({
        url: '/pages/auth/login/login'
      });
      return;
    }
    this.loadPageData();
  },

  async loadPageData() {
    this.setData({ loading: true });
    try {
      await Promise.all([
        this.loadConsultations(),
        this.loadHomepageNotice(),
        this.loadCarouselItems()
      ]);
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadConsultations() {
    try {
      const userId = getStorage('userId');
      const response = await get(`/consultations/user/${userId}`, {
        page: 1,
        pageSize: 2
      });

      const dataList = this.extractList(response)
        .sort((a, b) => this.getTimestamp(
          b.updatedAt || b.updateTime || b.createTime || b.createdAt || b.updated_at || b.created_at
        ) - this.getTimestamp(
          a.updatedAt || a.updateTime || a.createTime || a.createdAt || a.updated_at || a.created_at
        ));

      const consultations = dataList.map((item) => {
        const statusText = this.getStatusText(item.status);
        return {
          ...item,
          title: item.title || '未命名咨询',
          content: item.content || item.description || '',
          categoryText: item.category || '其他',
          priority: item.priority || '',
          lawyerName: item.lawyerName || '',
          replyCount: Number(item.replyCount || 0),
          statusText,
          statusTheme: this.getStatusTheme(item.status),
          assignmentTypeText: item.assignmentType === 'directed' ? '定向咨询' : '公开咨询',
          assignmentTypeTheme: item.assignmentType === 'directed' ? 'warning' : 'success',
          timeText: this.formatTime(
            item.updatedAt || item.updateTime || item.createTime || item.createdAt || item.updated_at || item.created_at
          )
        };
      });

      this.setData({ consultations });
    } catch (error) {
      console.error('加载咨询列表失败:', error);
      this.setData({ consultations: [] });
    }
  },

  async loadHomepageNotice() {
    try {
      const response = await get('/public/announcements', {
        page: 1,
        pageSize: 10
      });

      const items = this.extractList(response);
      const pinnedList = items.filter((item) => this.isPinnedAnnouncement(item));
      const pinnedAnnouncement = pinnedList[0] || null;
      const featuredAnnouncement = pinnedList[0] || items[0] || null;

      this.setData({
        pinnedAnnouncement: pinnedAnnouncement
          ? {
              ...pinnedAnnouncement,
              isPinned: true,
              timeText: this.formatTime(
                pinnedAnnouncement.publishedAt ||
                pinnedAnnouncement.updatedAt ||
                pinnedAnnouncement.published_at ||
                pinnedAnnouncement.updated_at ||
                pinnedAnnouncement.createdAt ||
                pinnedAnnouncement.created_at
              )
            }
          : null,
        featuredAnnouncement: featuredAnnouncement
          ? {
              ...featuredAnnouncement,
              isPinned: this.isPinnedAnnouncement(featuredAnnouncement),
              timeText: this.formatTime(
                featuredAnnouncement.publishedAt ||
                featuredAnnouncement.updatedAt ||
                featuredAnnouncement.published_at ||
                featuredAnnouncement.updated_at ||
                featuredAnnouncement.createdAt ||
                featuredAnnouncement.created_at
              )
            }
          : null
      });
    } catch (error) {
      console.error('加载公告失败:', error);
      this.setData({
        pinnedAnnouncement: null,
        featuredAnnouncement: null
      });
    }
  },

  async loadCarouselItems() {
    try {
      const response = await get('/public/carousels');
      const refreshToken = Date.now();
      this.setData({
        carouselItems: (Array.isArray(response) ? response : []).map((item) =>
          this.normalizeCarouselItem(item, refreshToken)
        )
      });
    } catch (error) {
      console.error('加载轮播图失败:', error);
      this.setData({ carouselItems: [] });
    }
  },

  normalizeCarouselItem(item, refreshToken) {
    const normalizedItem = item || {};
    return {
      ...normalizedItem,
      displayImageUrl: this.normalizeCarouselImageUrl(normalizedItem.imageUrl, refreshToken)
    };
  },

  normalizeCarouselImageUrl(rawUrl, refreshToken) {
    if (!rawUrl) {
      return LOCAL_CAROUSEL_FALLBACK;
    }

    const trimmedUrl = String(rawUrl).trim();
    if (!trimmedUrl) {
      return LOCAL_CAROUSEL_FALLBACK;
    }

    let normalizedUrl = trimmedUrl.replace(/\\/g, '/');

    if (/^https?:\/\//i.test(normalizedUrl)) {
      const uploadMatch = normalizedUrl.match(/\/uploads\/.+$/i);
      if (uploadMatch) {
        normalizedUrl = `${MEDIA_BASE_URL}${uploadMatch[0]}`;
      }
    } else if (normalizedUrl.startsWith('/uploads/')) {
      normalizedUrl = `${MEDIA_BASE_URL}${normalizedUrl}`;
    } else {
      normalizedUrl = `${MEDIA_BASE_URL}/uploads/${normalizedUrl.replace(/^\/+/, '')}`;
    }

    const separator = normalizedUrl.includes('?') ? '&' : '?';
    return `${normalizedUrl}${separator}mini_v=${refreshToken}`;
  },

  handleCarouselImageError(e) {
    const index = e.currentTarget.dataset.index;
    if (index === undefined) {
      return;
    }

    const item = this.data.carouselItems[index];
    if (!item || item.displayImageUrl === LOCAL_CAROUSEL_FALLBACK) {
      return;
    }

    this.setData({
      [`carouselItems[${index}].displayImageUrl`]: LOCAL_CAROUSEL_FALLBACK
    });
  },

  extractList(response) {
    if (Array.isArray(response)) {
      return response;
    }
    if (response && Array.isArray(response.items)) {
      return response.items;
    }
    if (response && Array.isArray(response.list)) {
      return response.list;
    }
    return [];
  },

  isPinnedAnnouncement(item) {
    return !!(item && (item.isPinned === true || item.isPinned === 1 || item.isPinned === '1'));
  },

  getStatusText(status) {
    const statusMap = {
      open: '待处理',
      pending_accept: '待律师接单',
      in_progress: '处理中',
      resolved: '已解决'
    };
    return statusMap[status] || '处理中';
  },

  getStatusTheme(status) {
    const themeMap = {
      open: 'warning',
      pending_accept: 'warning',
      in_progress: 'primary',
      resolved: 'success'
    };
    return themeMap[status] || 'default';
  },

  getTimestamp(value) {
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  },

  formatTime(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

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

    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${month}-${day}`;
  },

  handleSearchChange(e) {
    this.setData({
      searchKeyword: e.detail.value || ''
    });
  },

  openFindLawyerPage() {
    const keyword = (this.data.searchKeyword || '').trim();
    const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
    wx.navigateTo({
      url: `/pages/user/findLawyer/findLawyer${query}`
    });
  },

  handleSearch(e) {
    const keyword = ((e.detail && e.detail.value) || this.data.searchKeyword || '').trim();
    this.setData({ searchKeyword: keyword });
    this.openFindLawyerPage();
  },

  handleSearchFocus() {
    this.openFindLawyerPage();
  },

  goToFindLawyer() {
    wx.navigateTo({
      url: '/pages/user/findLawyer/findLawyer'
    });
  },

  handleCarouselTap(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;

    setStorage(CAROUSEL_READER_STORAGE_KEY, item);
    wx.navigateTo({
      url: `/pages/user/carouselDetail/carouselDetail?id=${encodeURIComponent(item.id || '')}`
    });
  },

  handleAnnouncementTap(e) {
    const announcement = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.item)
      || this.data.pinnedAnnouncement
      || this.data.featuredAnnouncement;
    if (!announcement) return;

    wx.showModal({
      title: announcement.title || '系统公告',
      content: announcement.content || '暂无公告内容',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  goToConsultation() {
    wx.navigateTo({
      url: '/pages/user/consultation/consultation'
    });
  },

  goToAiChat() {
    wx.navigateTo({
      url: '/pages/user/aiChat/aiChat'
    });
  },

  goToProfile() {
    wx.navigateTo({
      url: '/pages/user/profile/profile'
    });
  },

  goToComplaint() {
    wx.navigateTo({
      url: '/pages/user/complaint/complaint'
    });
  },

  goToConsultationList() {
    wx.navigateTo({
      url: '/pages/user/consultationList/consultationList'
    });
  },

  goToConsultationDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/user/consultationDetail/consultationDetail?id=${id}`
    });
  },

  onPullDownRefresh() {
    this.loadPageData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  handleTabChange() {}
});
