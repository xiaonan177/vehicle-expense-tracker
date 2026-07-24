// 工具函数

/**
 * 格式化金额（泰铢）
 */
function formatMoney(amount) {
  const num = parseFloat(amount) || 0
  return '฿' + num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

/**
 * 获取月份名称
 */
function getMonthName(month) {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  return months[month - 1] || ''
}

/**
 * 费用类型配置
 */
const EXPENSE_TYPES = {
  fuel: { label: '加油', icon: '⛽', color: '#3B82F6', bg: '#EFF6FF' },
  maintenance: { label: '维修', icon: '🔧', color: '#F59E0B', bg: '#FFFBEB' },
  purchase: { label: '购车', icon: '🚗', color: '#6366F1', bg: '#EEF2FF' },
  paperwork: { label: '手续', icon: '📋', color: '#8B5CF6', bg: '#F5F3FF' },
  insurance: { label: '保险费', icon: '🛡️', color: '#10B981', bg: '#ECFDF5' }
}

/**
 * 提醒类型配置
 */
const REMINDER_TYPES = {
  fuel: { label: '加油', icon: '⛽', color: '#3B82F6' },
  maintenance: { label: '维修', icon: '🔧', color: '#F59E0B' },
 保养: { label: '保养', icon: '🔩', color: '#8B5CF6' },
  insurance: { label: '保险', icon: '🛡️', color: '#10B981' },
  inspection: { label: '年检', icon: '📋', color: '#EF4444' }
}

/**
 * 计算剩余天数
 */
function getDaysRemaining(dateStr) {
  if (!dateStr) return 0
  const due = new Date(dateStr)
  const now = new Date()
  const diff = due.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * 显示提示
 */
function showToast(title, icon = 'none') {
  wx.showToast({ title, icon, duration: 2000 })
}

/**
 * 显示确认对话框
 */
function showConfirm(content) {
  return new Promise((resolve) => {
    wx.showModal({
      title: '提示',
      content,
      success(res) {
        resolve(res.confirm)
      }
    })
  })
}

module.exports = {
  formatMoney,
  formatDate,
  formatDateTime,
  getMonthName,
  EXPENSE_TYPES,
  REMINDER_TYPES,
  getDaysRemaining,
  showToast,
  showConfirm
}
