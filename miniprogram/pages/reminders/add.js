// 添加提醒页
const app = getApp()
const { showToast } = require('../../utils/util')

Page({
  data: {
    type: 'insurance',
    title: '',
    dueDate: '',
    notes: '',
    submitting: false
  },

  onLoad() {
    const today = new Date().toISOString().split('T')[0]
    this.setData({ dueDate: today })
  },

  setType(e) {
    this.setData({ type: e.currentTarget.dataset.type })
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  onDateChange(e) {
    this.setData({ dueDate: e.detail.value })
  },

  onNotesInput(e) {
    this.setData({ notes: e.detail.value })
  },

  async submit() {
    const { type, title, dueDate, notes } = this.data

    if (!title.trim()) {
      showToast('请输入提醒标题')
      return
    }

    if (!dueDate) {
      showToast('请选择到期日期')
      return
    }

    this.setData({ submitting: true })

    try {
      await app.request({
        url: '/reminders',
        method: 'POST',
        data: {
          vehicle_id: app.globalData.vehicleId,
          type,
          title,
          due_date: dueDate,
          notes
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
