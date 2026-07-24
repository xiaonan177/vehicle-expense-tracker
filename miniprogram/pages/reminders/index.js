// 提醒列表页
const app = getApp()
const { showToast, showConfirm } = require('../../utils/util')

Page({
  data: {
    reminders: [],
    loading: true
  },

  onLoad() {
    this.fetchReminders()
  },

  onShow() {
    this.fetchReminders()
  },

  async fetchReminders() {
    this.setData({ loading: true })
    try {
      const res = await app.request({
        url: `/reminders?vehicle_id=${app.globalData.vehicleId}`
      })
      this.setData({
        reminders: res || [],
        loading: false
      })
    } catch (err) {
      console.error('获取提醒失败:', err)
      showToast('加载失败')
      this.setData({ loading: false })
    }
  },

  async toggleComplete(e) {
    const id = e.currentTarget.dataset.id
    const reminder = this.data.reminders.find(r => r.id === id)
    if (!reminder) return

    const newCompleted = !reminder.is_completed
    try {
      await app.request({
        url: `/reminders/${id}`,
        method: 'PUT',
        data: { is_completed: newCompleted }
      })
      showToast(newCompleted ? '已标记完成' : '已恢复', 'success')
      this.fetchReminders()
    } catch (err) {
      showToast('操作失败')
    }
  },

  async deleteReminder(e) {
    const id = e.currentTarget.dataset.id
    const confirmed = await showConfirm('确定删除这个提醒吗？')
    if (!confirmed) return

    try {
      await app.request({
        url: `/reminders/${id}`,
        method: 'DELETE'
      })
      showToast('删除成功', 'success')
      this.fetchReminders()
    } catch (err) {
      showToast('删除失败')
    }
  },

  goToAdd() {
    wx.navigateTo({ url: '/pages/reminders/add' })
  }
})
