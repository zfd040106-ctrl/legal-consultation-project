const { get } = require('../../../utils/api');

Page({
  data: {
    keyword: '',
    lawyers: [],
    loading: true,
    loadingMore: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    selectMode: ''
  },

  onLoad(options) {
    this.setData({
      keyword: options.keyword ? decodeURIComponent(options.keyword) : '',
      selectMode: options.selectMode || ''
    });
    this.loadLawyers(true);
  },

  handleBack() {
    wx.navigateBack();
  },

  handleSearchChange(e) {
    this.setData({
      keyword: e.detail.value || ''
    });
  },

  handleSearch() {
    this.loadLawyers(true);
  },

  handleClear() {
    this.setData({ keyword: '' });
    this.loadLawyers(true);
  },

  async loadLawyers(isRefresh = false) {
    if (!isRefresh && (this.data.loading || this.data.loadingMore || !this.data.hasMore)) {
      return;
    }

    const nextPage = isRefresh ? 1 : this.data.page;
    this.setData({
      loading: isRefresh,
      loadingMore: !isRefresh
    });

    try {
      const response = await get('/lawyers/search', {
        keyword: this.data.keyword,
        page: nextPage,
        pageSize: this.data.pageSize
      });

      let items = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (response && Array.isArray(response.items)) {
        items = response.items;
      } else if (response && Array.isArray(response.list)) {
        items = response.list;
      }

      const lawyers = items.map(item => ({
        ...item,
        specializationText: item.specialization || '领域待补充',
        experienceText: `${item.experienceYears || 0}年执业经验`,
        totalConsultationsText: item.totalConsultations || 0
      }));

      this.setData({
        lawyers: isRefresh ? lawyers : [...this.data.lawyers, ...lawyers],
        hasMore: lawyers.length >= this.data.pageSize,
        page: nextPage + 1
      });
    } catch (error) {
      console.error('加载律师列表失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
      if (isRefresh) {
        this.setData({
          lawyers: [],
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

  loadMore() {
    this.loadLawyers(false);
  },

  goToConsultation(e) {
    const lawyerId = e.currentTarget.dataset.id;
    const url = `/pages/user/consultation/consultation?lawyerId=${lawyerId}`;

    if (this.data.selectMode === 'consultation') {
      wx.redirectTo({ url });
      return;
    }

    wx.navigateTo({ url });
  }
});
