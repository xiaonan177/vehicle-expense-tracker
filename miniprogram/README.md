# 车辆管家 - 微信小程序

## 项目结构

```
miniprogram/
├── app.js              # 小程序入口，包含 API 请求封装
├── app.json            # 小程序配置（页面路由、TabBar）
├── app.wxss            # 全局样式
├── project.config.json # 项目配置
├── sitemap.json        # 搜索配置
├── images/             # TabBar 图标
├── utils/
│   └── util.js         # 工具函数
└── pages/
    ├── index/          # 首页（费用看板）
    ├── expenses/       # 费用列表
    ├── expenses/add    # 添加费用
    ├── files/          # 文件管理
    ├── reminders/      # 提醒列表
    └── reminders/add   # 添加提醒
```

## 使用步骤

### 1. 配置后端地址

编辑 `app.js`，将 `baseUrl` 改为你的后端 API 地址：

```javascript
globalData: {
  baseUrl: 'https://your-domain.com/api/v1',  // 替换为实际域名
  vehicleId: 1
}
```

### 2. 配置小程序 AppID

编辑 `project.config.json`，将 `appid` 改为你的小程序 AppID：

```json
{
  "appid": "your-actual-appid"
}
```

### 3. 配置服务器域名

在微信小程序管理后台 → 开发 → 开发管理 → 开发设置 → 服务器域名，添加你的后端域名到 `request` 和 `uploadFile` 白名单。

### 4. 导入项目

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开微信开发者工具，选择"导入项目"
3. 选择 `miniprogram/` 目录
4. 填入 AppID（或使用测试号）
5. 点击"导入"

### 5. 编译预览

在微信开发者工具中点击"编译"，即可在模拟器中预览小程序。

## 功能说明

- **首页**：加油费用看板，支持年度/月度切换，展示各类费用统计
- **费用**：费用记录列表，支持按类型筛选、添加、删除
- **文件**：车辆文件管理，支持上传照片/视频，按分类管理
- **提醒**：到期提醒管理，支持加油/维修/保养/保险/年检提醒

## 注意事项

- TabBar 图标需要替换为 81x81 像素的 PNG 图片
- 后端 API 需要支持 HTTPS（小程序要求）
- 文件上传需要配置后端域名到小程序白名单
