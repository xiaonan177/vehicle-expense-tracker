// 文件管理页
const app = getApp()
const { showToast, showConfirm } = require('../../utils/util')

Page({
  data: {
    files: [],
    filterCategory: 'all',
    loading: true
  },

  onLoad() {
    this.fetchFiles()
  },

  onShow() {
    this.fetchFiles()
  },

  async fetchFiles() {
    this.setData({ loading: true })
    try {
      const res = await app.request({
        url: `/files?vehicle_id=${app.globalData.vehicleId}`
      })
      this.setData({
        files: res || [],
        loading: false
      })
    } catch (err) {
      console.error('获取文件失败:', err)
      showToast('加载失败')
      this.setData({ loading: false })
    }
  },

  setFilter(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ filterCategory: category })
  },

  chooseFile() {
    wx.chooseMedia({
      count: 9,
      mediaType: ['image', 'video'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        wx.showLoading({ title: '上传中...' })
        try {
          for (const item of res.tempFiles) {
            await app.uploadFile(item.tempFilePath)
          }
          wx.hideLoading()
          showToast('上传成功', 'success')
          this.fetchFiles()
        } catch (err) {
          wx.hideLoading()
          showToast('上传失败')
        }
      }
    })
  },

  previewFile(e) {
    const url = e.currentTarget.dataset.url
    const fileType = e.currentTarget.dataset.type
    if (fileType === 'image') {
      const urls = this.data.files.filter(f => f.file_type === 'image').map(f => f.url)
      wx.previewImage({ current: url, urls })
    } else {
      wx.downloadFile({
        url,
        success: (res) => {
          wx.openDocument({ filePath: res.tempFilePath })
        }
      })
    }
  },

  async deleteFile(e) {
    const id = e.currentTarget.dataset.id
    const confirmed = await showConfirm('确定删除这个文件吗？')
    if (!confirmed) return

    try {
      await app.request({
        url: `/files/${id}`,
        method: 'DELETE'
      })
      showToast('删除成功', 'success')
      this.fetchFiles()
    } catch (err) {
      showToast('删除失败')
    }
  },

  getFilteredFiles() {
    const { files, filterCategory } = this.data
    if (filterCategory === 'all') return files
    return files.filter(f => f.category === filterCategory)
  }
})
