// 费用列表页
const app = getApp()
const { formatMoney, showToast, showConfirm } = require('../../utils/util')

Page({
  data: {
    expenses: [],
    filterType: 'all',
    loading: true
  },

  onLoad() {
    this.fetchExpenses()
  },

  onShow() {
    this.fetchExpenses()
  },

  async fetchExpenses() {
    this.setData({ loading: true })
    try {
      let url = `/expenses?vehicle_id=${app.globalData.vehicleId}`
      if (this.data.filterType !== 'all') {
        url += `&type=${this.data.filterType}`
      }
      const res = await app.request({ url })
      this.setData({
        expenses: res || [],
        loading: false
      })
    } catch (err) {
      console.error('获取费用失败:', err)
      showToast('加载失败')
      this.setData({ loading: false })
    }
  },

  setFilter(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ filterType: type })
    this.fetchExpenses()
  },

  async deleteExpense(e) {
    const id = e.currentTarget.dataset.id
    const confirmed = await showConfirm('确定删除这条费用记录吗？')
    if (!confirmed) return

    try {
      await app.request({
        url: `/expenses/${id}`,
        method: 'DELETE'
      })
      showToast('删除成功', 'success')
      this.fetchExpenses()
    } catch (err) {
      showToast('删除失败')
    }
  },

  goToAdd() {
    wx.navigateTo({ url: '/pages/expenses/add' })
  }
})
