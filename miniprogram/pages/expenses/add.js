// 添加费用页
const app = getApp()
const { showToast } = require('../../utils/util')

Page({
  data: {
    type: 'fuel',
    amount: '',
    description: '',
    mileage: '',
    expenseDate: '',
    submitting: false
  },

  onLoad() {
    const today = new Date().toISOString().split('T')[0]
    this.setData({ expenseDate: today })
  },

  setType(e) {
    this.setData({ type: e.currentTarget.dataset.type })
  },

  onAmountInput(e) {
    this.setData({ amount: e.detail.value })
  },

  onDescInput(e) {
    this.setData({ description: e.detail.value })
  },

  onMileageInput(e) {
    this.setData({ mileage: e.detail.value })
  },

  onDateChange(e) {
    this.setData({ expenseDate: e.detail.value })
  },

  async submit() {
    const { type, amount, description, mileage, expenseDate } = this.data

    if (!amount || parseFloat(amount) <= 0) {
      showToast('请输入有效金额')
      return
    }

    if (!expenseDate) {
      showToast('请选择日期')
      return
    }

    this.setData({ submitting: true })

    try {
      await app.request({
        url: '/expenses',
        method: 'POST',
        data: {
          vehicle_id: app.globalData.vehicleId,
          type,
          amount,
          description,
          mileage: mileage ? parseInt(mileage) : undefined,
          expense_date: expenseDate
        }
      })
      showToast('添加成功', 'success')
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (err) {
      showToast('添加失败')
      this.setData({ submitting: false })
    }
  }
})
