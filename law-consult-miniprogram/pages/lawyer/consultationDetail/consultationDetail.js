const { get, post } = require('../../../utils/api');
const { getStorage } = require('../../../utils/storage');

Page({
  data: {
    consultationId: '',
    consultation: {},
    replies: [],
    attachments: [],
    loading: false,
    statusText: '',
    statusIcon: '',
    isAssigned: false,
    isUnassigned: false,
    canAccept: false,
    canReject: false,
    canChat: false,
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
    if (this.data.consultationId) {
      this.loadDetail();
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  async loadDetail() {
    this.setData({ loading: true });

    try {
      const res = await get(`/consultations/${this.data.consultationId}`);
      const lawyerId = getStorage('userId');

      const statusMap = {
        open: { text: '公开待接', icon: 'time' },
        pending_accept: { text: '定向待接受', icon: 'time' },
        in_progress: { text: '处理中', icon: 'loading' },
        resolved: { text: '已解决', icon: 'check-circle' },
        closed: { text: '已关闭', icon: 'close-circle' }
      };

      const consultationData = res.consultation || res;
      const repliesData = res.replies || [];
      const status = statusMap[consultationData.status] || { text: consultationData.status, icon: 'info-circle' };

      const replies = repliesData.map((item) => ({
        ...item,
        timeText: this.formatTime(item.createdAt || item.createTime)
      }));

      const isUnassigned = !consultationData.lawyerId && consultationData.assignmentType === 'public';
      const isAssigned = Number(consultationData.lawyerId) === Number(lawyerId);
      const hasFee = Number(consultationData.feeAmount || 0) > 0;
      const payReady = !hasFee || consultationData.payStatus === 'escrowed';
      const canAccept = (
        (isUnassigned && consultationData.status === 'open') ||
        (isAssigned && consultationData.status === 'pending_accept')
      ) && payReady;
      const canReject = isAssigned
        && consultationData.assignmentType === 'directed'
        && consultationData.status === 'pending_accept';
      const canChat = isAssigned && consultationData.status === 'in_progress';

      this.setData({
        consultation: {
          ...consultationData,
          description: consultationData.description || consultationData.content || '',
          createdAtText: this.formatDateTime(consultationData.createdAt || consultationData.createTime),
          assignmentTypeText: consultationData.assignmentType === 'directed' ? '定向咨询' : '公开咨询',
          feeAmountText: this.formatMoney(consultationData.feeAmount),
          hasFee,
          payStatusText: this.data.payStatusText[consultationData.payStatus] || '未支付'
        },
        replies,
        attachments: this.parseAttachments(consultationData.attachments),
        statusText: status.text,
        statusIcon: status.icon,
        isUnassigned,
        isAssigned,
        canAccept,
        canReject,
        canChat
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
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
      isImage: this.isImageUrl(url)
    }));
  },

  formatMoney(value) {
    return Number(value || 0).toFixed(2);
  },

  formatTime(dateStr) {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
    if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;

    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${month}-${day}`;
  },

  formatDateTime(dateStr) {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hour = `${date.getHours()}`.padStart(2, '0');
    const minute = `${date.getMinutes()}`.padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  goToReply() {
    wx.navigateTo({
      url: `/pages/lawyer/chat/chat?id=${this.data.consultationId}`
    });
  },

  isImageUrl(url) {
    if (!url) return false;
    const ext = url.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
  },

  previewAttachment(e) {
    const { url, isImage } = e.currentTarget.dataset;

    if (isImage) {
      const images = this.data.attachments.filter((item) => item.isImage).map((item) => item.url);
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

  async handleAccept() {
    wx.showModal({
      title: '确认接单',
      content: '确定要接受这条咨询吗？',
      success: async (res) => {
        if (!res.confirm) return;

        wx.showLoading({ title: '处理中...' });
        try {
          const lawyerId = getStorage('userId');
          await post(`/consultations/${this.data.consultationId}/accept`, { lawyerId });

          wx.hideLoading();
          wx.showToast({
            title: '接单成功',
            icon: 'success'
          });

          setTimeout(() => {
            wx.redirectTo({
              url: `/pages/lawyer/chat/chat?id=${this.data.consultationId}`
            });
          }, 1000);
        } catch (error) {
          wx.hideLoading();
          wx.showToast({
            title: error.message || '接单失败',
            icon: 'none'
          });
        }
      }
    });
  },

  async handleReject() {
    wx.showModal({
      title: '确认拒绝',
      content: '拒绝后该定向咨询将被关闭，已托管费用会自动退款。是否继续？',
      success: async (res) => {
        if (!res.confirm) return;

        wx.showLoading({ title: '处理中...' });
        try {
          const lawyerId = getStorage('userId');
          await post(`/consultations/${this.data.consultationId}/reject`, { lawyerId });
          wx.hideLoading();
          wx.showToast({
            title: '已拒绝咨询',
            icon: 'success'
          });
          this.loadDetail();
        } catch (error) {
          wx.hideLoading();
          wx.showToast({
            title: error.message || '拒绝失败',
            icon: 'none'
          });
        }
      }
    });
  }
});
