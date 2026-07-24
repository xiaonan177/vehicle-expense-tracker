// 首页 - 加油费用看板
const app = getApp()
const { formatMoney, getMonthName, getDaysRemaining, showToast } = require('../../utils/util')

Page({
  data: {
    viewMode: 'year', // year | month
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    stats: null,
    monthlyStats: [],
    monthExpenses: [],
    reminders: [],
    loading: true
  },

  onLoad() {
    this.fetchData()
  },

  onShow() {
    this.fetchData()
  },

  async fetchData() {
    this.setData({ loading: true })
    try {
      const [statsRes, monthlyRes, remindersRes] = await Promise.all([
        app.request({ url: `/expenses/stats?vehicle_id=${app.globalData.vehicleId}` }),
        app.request({ url: `/expenses/monthly-stats?year=${this.data.currentYear}` }),
        app.request({ url: `/reminders?vehicle_id=${app.globalData.vehicleId}` })
      ])

      // 获取当月费用明细
      let monthExpenses = []
      if (this.data.viewMode === 'month') {
        const monthStr = String(this.data.currentMonth).padStart(2, '0')
        const expensesRes = await app.request({
          url: `/expenses?vehicle_id=${app.globalData.vehicleId}&month=${this.data.currentYear}-${monthStr}`
        })
        monthExpenses = expensesRes || []
      }

      this.setData({
        stats: statsRes,
        monthlyStats: monthlyRes || [],
        monthExpenses,
        reminders: (remindersRes || []).slice(0, 3),
        loading: false
      })
    } catch (err) {
      console.error('获取数据失败:', err)
      showToast('加载失败')
      this.setData({ loading: false })
    }
  },

  switchToYear() {
    this.setData({ viewMode: 'year' })
    this.fetchData()
  },

  switchToMonth() {
    this.setData({ viewMode: 'month' })
    this.fetchData()
  },

  selectMonth(e) {
    const month = e.currentTarget.dataset.month
    this.setData({ currentMonth: month, viewMode: 'month' })
    this.fetchData()
  },

  prevMonth() {
    let { currentYear, currentMonth } = this.data
    currentMonth--
    if (currentMonth < 1) {
      currentMonth = 12
      currentYear--
    }
    this.setData({ currentYear, currentMonth, viewMode: 'month' })
    this.fetchData()
  },

  nextMonth() {
    let { currentYear, currentMonth } = this.data
    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
    this.setData({ currentYear, currentMonth, viewMode: 'month' })
    this.fetchData()
  },

  goToExpenses() {
    wx.switchTab({ url: '/pages/expenses/index' })
  },

  goToReminders() {
    wx.switchTab({ url: '/pages/reminders/index' })
  },

  addExpense() {
    wx.navigateTo({ url: '/pages/expenses/add' })
  },

  addReminder() {
    wx.navigateTo({ url: '/pages/reminders/add' })
  }
})
