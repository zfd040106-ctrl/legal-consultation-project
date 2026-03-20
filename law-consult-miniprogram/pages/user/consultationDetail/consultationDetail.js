const { get, post } = require('../../../utils/api');
const { getStorage } = require('../../../utils/storage');

Page({
  data: {
    consultationId: '',
    detail: {},
    replies: [],
    loading: true,
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
    },
    payStatusText: {
      unpaid: '未支付',
      escrowed: '已托管',
      settled: '已结算',
      refunded: '已退款'
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ consultationId: options.id });
      this.loadDetail();
    }
  },

  onShow() {
    if (this.data.consultationId && !this.data.loading) {
      this.loadDetail();
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  async loadDetail() {
    this.setData({ loading: true });

    try {
      const detailRes = await get(`/consultations/${this.data.consultationId}`);
      const consultationData = detailRes.consultation || detailRes;
      const repliesData = detailRes.replies || [];

      const detail = {
        ...consultationData,
        content: consultationData.content || consultationData.description || '',
        attachments: this.parseAttachments(consultationData.attachments),
        createTimeText: this.formatTime(consultationData.createdAt || consultationData.createTime),
        feeAmountText: this.formatMoney(consultationData.feeAmount),
        assignmentTypeText: consultationData.assignmentType === 'directed' ? '定向咨询' : '公开咨询',
        payStatusText: this.data.payStatusText[consultationData.payStatus] || '未支付',
        hasFee: Number(consultationData.feeAmount || 0) > 0,
        canPay: Number(consultationData.feeAmount || 0) > 0
          && consultationData.payStatus === 'unpaid'
          && ['open', 'pending_accept'].includes(consultationData.status)
      };

      const replies = repliesData.map((item) => ({
        ...item,
        createTimeText: this.formatTime(item.createdAt || item.createTime)
      }));

      this.setData({
        detail,
        replies,
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  parseAttachments(attachmentsText) {
    if (!attachmentsText) return [];

    let urls = [];
    try {
      urls = JSON.parse(attachmentsText);
    } catch (error) {
      urls = attachmentsText.split(',').filter((url) => url.trim());
    }

    return urls.map((url) => ({
      url,
      isImage: this.checkIsImage(url)
    }));
  },

  formatMoney(value) {
    return Number(value || 0).toFixed(2);
  },

  formatTime(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  checkIsImage(url) {
    if (!url) return false;
    const ext = url.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  },

  previewAttachment(e) {
    const { url, isImage } = e.currentTarget.dataset;

    if (isImage) {
      const images = this.data.detail.attachments
        .filter((item) => item.isImage)
        .map((item) => item.url);

      wx.previewImage({
        current: url,
        urls: images
      });
      return;
    }

    wx.showLoading({ title: '下载中...' });
    wx.downloadFile({
      url,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          wx.openDocument({
            filePath: res.tempFilePath,
            showMenu: true
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        });
      }
    });
  },

  goToChat() {
    wx.navigateTo({
      url: `/pages/user/chat/chat?id=${this.data.consultationId}`
    });
  },

  handleComplaint() {
    wx.navigateTo({
      url: `/pages/user/complaint/complaint?consultationId=${this.data.consultationId}&lawyerId=${this.data.detail.lawyerId || ''}`
    });
  },

  async handlePay() {
    wx.showLoading({ title: '支付中...' });
    try {
      const userId = getStorage('userId');
      await post(`/consultations/${this.data.consultationId}/pay`, { userId });
      wx.hideLoading();
      wx.showToast({
        title: '支付成功',
        icon: 'success'
      });
      this.loadDetail();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '支付失败',
        icon: 'none'
      });
    }
  },

  handleAddReply() {
    wx.showModal({
      title: '追问',
      editable: true,
      placeholderText: '请输入追问内容',
      success: async (res) => {
        if (res.confirm && res.content) {
          await this.submitReply(res.content);
        }
      }
    });
  },

  async submitReply(content) {
    wx.showLoading({ title: '提交中...' });

    try {
      const userId = getStorage('userId');
      await post(`/consultations/${this.data.consultationId}/user-reply`, {
        userId,
        content: content.trim()
      });

      wx.hideLoading();
      wx.showToast({
        title: '追问已发送',
        icon: 'success'
      });
      this.loadDetail();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '发送失败',
        icon: 'none'
      });
    }
  },

  onPullDownRefresh() {
    this.loadDetail().finally(() => {
      wx.stopPullDownRefresh();
    });
  }
});
