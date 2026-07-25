// 车辆管家 - 微信小程序
App({
  globalData: {
    // 后端 API 地址，部署时替换为实际域名
    baseUrl: 'https://vehicle-expense-tracker-server-fu93.vercel.app/api/v1',
    // 车辆 ID，实际使用时从后端获取
    vehicleId: 1
  },

  onLaunch() {
    // 小程序启动时执行
    console.log('车辆管家小程序启动')
  },

  // 封装请求方法
  request(options) {
    const { url, method = 'GET', data, header = {} } = options
    const baseUrl = this.globalData.baseUrl

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${baseUrl}${url}`,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          ...header
        },
        success(res) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`))
          }
        },
        fail(err) {
          reject(err)
        }
      })
    })
  },

  // 上传文件
  uploadFile(filePath) {
    const baseUrl = this.globalData.baseUrl

    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${baseUrl}/files`,
        filePath,
        name: 'file',
        formData: {
          vehicle_id: String(this.globalData.vehicleId)
        },
        success(res) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(res.data))
          } else {
            reject(new Error(`上传失败: ${res.statusCode}`))
          }
        },
        fail(err) {
          reject(err)
        }
      })
    })
  }
})
