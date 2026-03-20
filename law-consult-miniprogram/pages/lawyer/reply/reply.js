const { post } = require('../../../utils/api');
const { getStorage } = require('../../../utils/storage');

Page({
  data: {
    consultationId: '',
    content: '',
    error: '',
    loading: false
  },

  onLoad(options) {
    if (options.consultationId) {
      this.setData({ consultationId: options.consultationId });
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  handleContentChange(e) {
    this.setData({
      content: e.detail.value,
      error: ''
    });
  },

  validateForm() {
    if (!this.data.content || this.data.content.trim().length < 10) {
      this.setData({ error: '回复内容至少10个字符' });
      return false;
    }
    return true;
  },

  async handleSubmit() {
    if (!this.validateForm()) {
      wx.showToast({
        title: '请检查输入',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    try {
      const lawyerId = getStorage('userId');
      await post(`/consultations/${this.data.consultationId}/reply`, {
        lawyerId,
        content: this.data.content.trim(),
        isSolution: false
      });

      wx.showToast({
        title: '回复成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  }
});
