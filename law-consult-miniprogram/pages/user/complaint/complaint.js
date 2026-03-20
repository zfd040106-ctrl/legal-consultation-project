const { post } = require('../../../utils/api');

Page({
  data: {
    form: {
      type: 'complaint',
      reason: '',
      content: '',
      contact: ''
    },
    errors: {},
    loading: false,
    consultationId: '',
    reasons: [
      '服务态度差',
      '回复不专业',
      '回复不及时',
      '收费不合理',
      '信息泄露',
      '其他问题'
    ]
  },

  onLoad(options) {
    if (options.consultationId) {
      this.setData({
        consultationId: options.consultationId
      });
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  handleTypeChange(e) {
    const type = e.detail.value;
    this.setData({
      'form.type': type,
      'form.reason': '',
      'errors.reason': ''
    });
  },

  selectReason(e) {
    const reason = e.currentTarget.dataset.reason;
    this.setData({
      'form.reason': reason,
      'errors.reason': ''
    });
  },

  handleContentInput(e) {
    this.setData({
      'form.content': e.detail.value,
      'errors.content': ''
    });
  },

  handleContactInput(e) {
    this.setData({
      'form.contact': e.detail.value
    });
  },

  validateForm() {
    const { type, reason, content } = this.data.form;
    const errors = {};

    if (type === 'complaint' && !reason) {
      errors.reason = '请选择投诉原因';
    }

    if (!content || content.trim().length < 10) {
      errors.content = '描述内容至少10个字符';
    }

    this.setData({ errors });
    return Object.keys(errors).length === 0;
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
      const submitData = {
        type: this.data.form.type,
        reason: this.data.form.reason || 'unspecified',
        content: this.data.form.content.trim()
      };

      if (this.data.consultationId) {
        submitData.consultationId = this.data.consultationId;
      }

      if (this.data.form.contact) {
        submitData.contact = this.data.form.contact;
      }

      await post('/users/complaints', submitData);

      wx.showToast({
        title: '反馈已提交',
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
