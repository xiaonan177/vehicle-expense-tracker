# 云端部署指南

## 方案一：Railway 部署（推荐）

### 1. 注册账号
访问 https://railway.app → 用 GitHub 账号登录

### 2. 创建项目
- 点击 "New Project" → "Deploy from GitHub repo"
- 选择你的代码仓库

### 3. 配置环境变量
在 Railway 项目设置中添加以下环境变量：
```
NODE_ENV=production
PORT=3000
SUPABASE_URL=你的Supabase地址
SUPABASE_ANON_KEY=你的Supabase匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的Supabase服务密钥
S3_BUCKET=你的S3存储桶名
S3_REGION=你的S3区域
S3_ACCESS_KEY_ID=你的S3访问密钥
S3_SECRET_ACCESS_KEY=你的S3密钥
```

### 4. 部署
Railway 会自动检测 `railway.json` 配置并部署
部署完成后会分配一个域名：`https://xxx.up.railway.app`

### 5. 更新小程序配置
将 `miniprogram/app.js` 中的 `baseUrl` 改为：
```javascript
baseUrl: 'https://xxx.up.railway.app/api/v1'
```

---

## 方案二：Vercel 部署

### 1. 注册账号
访问 https://vercel.com → 用 GitHub 账号登录

### 2. 导入项目
- 点击 "Add New Project" → "Import Git Repository"
- 选择你的代码仓库

### 3. 配置环境变量
在项目设置中添加与 Railway 相同的环境变量

### 4. 部署
Vercel 会自动检测 `vercel.json` 配置并部署
部署完成后会分配一个域名：`https://xxx.vercel.app`

---

## 方案三：微信云开发

### 1. 开通云开发
在微信开发者工具中点击 "云开发" → 开通

### 2. 创建云函数
将后端逻辑改为云函数格式

### 3. 部署云函数
右键云函数目录 → "上传并部署"

---

## 注意事项

1. **域名备案**：如果使用国内服务器（阿里云/腾讯云），域名需要备案
2. **HTTPS**：小程序要求后端必须是 HTTPS
3. **域名白名单**：在小程序管理后台配置服务器域名
4. **免费额度**：Railway 和 Vercel 都有免费额度，适合个人项目
