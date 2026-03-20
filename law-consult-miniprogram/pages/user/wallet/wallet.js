const { get, post } = require('../../../utils/api');
const { getStorage } = require('../../../utils/storage');

Page({
  data: {
    ownerId: null,
    loading: true,
    loadingMore: false,
    hasMore: true,
    page: 1,
    pageSize: 20,
    summary: {
      availableBalance: '0.00',
      frozenBalance: '0.00',
      totalIncome: '0.00',
      totalExpense: '0.00'
    },
    flows: []
  },

  onLoad() {
    this.setData({
      ownerId: getStorage('userId')
    });
    this.loadWallet(true);
  },

  handleBack() {
    wx.navigateBack();
  },

  formatMoney(value) {
    return Number(value || 0).toFixed(2);
  },

  formatDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hour = `${date.getHours()}`.padStart(2, '0');
    const minute = `${date.getMinutes()}`.padStart(2, '0');
    return `${month}-${day} ${hour}:${minute}`;
  },

  mapFlow(item) {
    const labelMap = {
      consult_pay: '咨询支付',
      consult_refund: '咨询退款',
      recharge: '充值',
      withdraw_success: '提现'
    };
    const isIncome = item.direction === 'in';
    return {
      ...item,
      bizLabel: labelMap[item.bizType] || item.remark || '钱包流水',
      amountText: `${isIncome ? '+' : '-'}¥${this.formatMoney(item.amount)}`,
      amountClass: isIncome ? 'income' : 'expense',
      timeText: this.formatDateTime(item.createdAt)
    };
  },

  async loadWallet(isRefresh = false) {
    const ownerId = this.data.ownerId;
    if (!ownerId) return;

    const targetPage = isRefresh ? 1 : this.data.page;
    this.setData({
      loading: isRefresh,
      loadingMore: !isRefresh
    });

    try {
      const [summaryResponse, flowsResponse] = await Promise.all([
        get(`/wallet/user/${ownerId}`),
        get(`/wallet/user/${ownerId}/flows`, {
          page: targetPage,
          pageSize: this.data.pageSize
        })
      ]);

      let items = [];
      if (Array.isArray(flowsResponse)) {
        items = flowsResponse;
      } else if (flowsResponse && Array.isArray(flowsResponse.items)) {
        items = flowsResponse.items;
      } else if (flowsResponse && Array.isArray(flowsResponse.list)) {
        items = flowsResponse.list;
      }

      const flows = items.map(item => this.mapFlow(item));

      this.setData({
        summary: {
          availableBalance: this.formatMoney(summaryResponse.availableBalance),
          frozenBalance: this.formatMoney(summaryResponse.frozenBalance),
          totalIncome: this.formatMoney(summaryResponse.totalIncome),
          totalExpense: this.formatMoney(summaryResponse.totalExpense)
        },
        flows: isRefresh ? flows : [...this.data.flows, ...flows],
        hasMore: flows.length >= this.data.pageSize,
        page: targetPage + 1
      });
    } catch (error) {
      console.error('加载钱包信息失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({
        loading: false,
        loadingMore: false
      });
    }
  },

  loadMore() {
    if (!this.data.hasMore || this.data.loadingMore) return;
    this.loadWallet(false);
  },

  handleRecharge() {
    wx.showModal({
      title: '余额充值',
      editable: true,
      placeholderText: '请输入充值金额',
      success: async (res) => {
        if (!res.confirm) return;
        await this.submitWalletAction(`/wallet/user/${this.data.ownerId}/recharge`, res.content, '充值成功');
      }
    });
  },

  handleWithdraw() {
    wx.showModal({
      title: '申请提现',
      editable: true,
      placeholderText: '请输入提现金额',
      success: async (res) => {
        if (!res.confirm) return;
        await this.submitWalletAction(`/wallet/user/${this.data.ownerId}/withdraw`, res.content, '提现申请已提交');
      }
    });
  },

  async submitWalletAction(url, rawAmount, successText) {
    const amount = Number(rawAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      });
      return;
    }

    try {
      await post(url, {
        amount: amount.toFixed(2)
      });

      wx.showToast({
        title: successText,
        icon: 'success'
      });
      this.setData({ page: 1 });
      this.loadWallet(true);
    } catch (error) {
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      });
    }
  }
});
