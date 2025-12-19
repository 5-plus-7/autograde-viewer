# 部署指南

本文档提供了将作业批改查看器部署到生产环境的详细步骤。

## 部署前准备

### 1. 飞书配置

#### 1.1 创建飞书应用

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 登录您的飞书账号
3. 点击"创建企业自建应用"
4. 填写应用信息：
   - 应用名称：作业批改查看器
   - 应用描述：用于查看学生作业批改结果
   - 应用图标：上传一个图标

5. 创建成功后，获取：
   - **App ID** (凭证与基础信息页面)
   - **App Secret** (凭证与基础信息页面)

#### 1.2 配置应用权限

在应用管理后台的"权限管理"页面，添加以下权限：

- `bitable:app` - 查看、评论、编辑和管理多维表格
- 如需要上传文件：`drive:drive` - 查看、评论和导出云空间中的文件

点击"发布版本"使权限生效。

#### 1.3 获取多维表格信息

1. 打开您的多维表格
2. 查看浏览器地址栏URL，格式为：
   ```
   https://xxx.feishu.cn/base/{appToken}?table={tableId}&view={viewId}
   ```
3. 提取以下信息：
   - **appToken**: base/ 后面到 ?table 之间的字符串
   - **tableId**: ?table= 后面到 & 之间的字符串

4. 记录JSON文件链接所在的列名（默认为"自动批改结果json链接"）

#### 1.4 将应用添加到多维表格

1. 在多维表格中点击右上角"..."
2. 选择"高级设置" -> "添加应用"
3. 搜索并添加您刚创建的应用
4. 授权应用访问该表格

### 2. 环境变量配置

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入实际值：

```env
VITE_FEISHU_APP_ID=cli_xxxxxxxxxxxxx
VITE_FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxx
VITE_FEISHU_APP_TOKEN=bascnxxxxxxxxxxxxx
VITE_FEISHU_TABLE_ID=tblxxxxxxxxxxxxx
VITE_FEISHU_JSON_COLUMN=自动批改结果json链接
```

### 3. 更新代码使用环境变量

编辑 `src/utils/feishuAPI.js`，将硬编码的配置替换为环境变量：

```javascript
const FEISHU_CONFIG = {
  appId: import.meta.env.VITE_FEISHU_APP_ID,
  appSecret: import.meta.env.VITE_FEISHU_APP_SECRET,
  appToken: import.meta.env.VITE_FEISHU_APP_TOKEN,
  tableId: import.meta.env.VITE_FEISHU_TABLE_ID,
  jsonColumnName: import.meta.env.VITE_FEISHU_JSON_COLUMN || '自动批改结果json链接',
}
```

### 4. 更新App.jsx使用飞书API

编辑 `src/App.jsx`，启用飞书API：

```javascript
import { fetchGradingData } from './utils/feishuAPI'

const handleFetchData = async (recordId) => {
  setIsLoading(true)
  try {
    // 从飞书API获取数据
    const data = await fetchGradingData(recordId)
    
    if (data && data.length > 0) {
      setRecordData(data)
      return true
    } else {
      throw new Error('未找到对应的记录')
    }
  } catch (error) {
    console.error('获取数据错误:', error)
    alert(error.message || '获取数据失败，请检查ID是否正确')
    return false
  } finally {
    setIsLoading(false)
  }
}
```

## 部署到Vercel

### 1. 安装Vercel CLI

```bash
npm i -g vercel
```

### 2. 登录Vercel

```bash
vercel login
```

### 3. 部署

```bash
vercel
```

按照提示完成部署配置。

### 4. 配置环境变量

在Vercel控制台：

1. 进入项目设置 (Settings)
2. 选择 Environment Variables
3. 添加所有环境变量（不要包含 VITE_ 前缀会被Vercel自动添加）
4. 重新部署项目

## 部署到Netlify

### 1. 安装Netlify CLI

```bash
npm install -g netlify-cli
```

### 2. 登录Netlify

```bash
netlify login
```

### 3. 初始化项目

```bash
netlify init
```

### 4. 配置构建设置

在 `netlify.toml` 中：

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 5. 配置环境变量

```bash
netlify env:set VITE_FEISHU_APP_ID "your_value"
netlify env:set VITE_FEISHU_APP_SECRET "your_value"
netlify env:set VITE_FEISHU_APP_TOKEN "your_value"
netlify env:set VITE_FEISHU_TABLE_ID "your_value"
```

### 6. 部署

```bash
netlify deploy --prod
```

## 部署到自己的服务器

### 1. 构建项目

```bash
npm run build
```

### 2. 使用Nginx

安装Nginx并配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/your/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 启用gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### 3. 配置HTTPS (推荐)

使用 Let's Encrypt:

```bash
sudo certbot --nginx -d your-domain.com
```

## 解决CORS问题

如果遇到跨域问题，有以下几种解决方案：

### 方案1: 服务器端代理

在服务器端添加代理配置，转发飞书API请求。

Nginx配置示例：

```nginx
location /api/feishu/ {
    proxy_pass https://open.feishu.cn/;
    proxy_set_header Host open.feishu.cn;
    proxy_set_header X-Real-IP $remote_addr;
}
```

然后修改代码中的API地址为相对路径 `/api/feishu/...`

### 方案2: 使用Serverless函数

在Vercel/Netlify中创建serverless函数来代理请求：

```javascript
// api/feishu-proxy.js
export default async function handler(req, res) {
  const response = await fetch('https://open.feishu.cn' + req.url, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  })
  
  const data = await response.json()
  res.json(data)
}
```

### 方案3: 配置飞书应用的可信域名

在飞书开放平台的应用设置中，添加您的部署域名到"安全设置"的"可信域名"列表。

## 性能优化

### 1. 启用CDN

使用CDN加速静态资源加载，提升用户体验。

### 2. 图片优化

- 使用WebP格式
- 启用图片懒加载
- 使用CDN存储图片

### 3. 代码分割

Vite已经自动配置了代码分割，无需额外配置。

### 4. 缓存策略

配置合理的缓存策略：

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 监控和日志

### 1. 错误监控

集成Sentry等错误监控服务：

```javascript
// src/main.jsx
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
})
```

### 2. 访问统计

集成Google Analytics或百度统计。

## 安全建议

1. **不要在前端代码中暴露敏感信息**
   - 使用环境变量
   - 敏感操作通过后端API

2. **启用HTTPS**
   - 使用Let's Encrypt免费证书
   - 强制HTTPS访问

3. **配置CSP (Content Security Policy)**

4. **定期更新依赖**
   ```bash
   npm audit
   npm update
   ```

5. **设置请求频率限制**
   - 防止API滥用
   - 使用飞书API的限流功能

## 故障排查

### 常见问题

1. **白屏问题**
   - 检查浏览器控制台错误
   - 确认资源路径正确
   - 检查路由配置

2. **API请求失败**
   - 检查网络连接
   - 验证飞书配置
   - 查看浏览器Network面板

3. **图片加载失败**
   - 检查图片URL
   - 验证CORS配置
   - 尝试使用代理

## 维护和更新

### 更新依赖

```bash
# 检查过期依赖
npm outdated

# 更新依赖
npm update

# 更新到最新版本
npx npm-check-updates -u
npm install
```

### 备份数据

定期备份：
- 飞书多维表格数据
- 应用配置
- 用户数据（如有）

## 支持

如遇到问题，请：

1. 查看项目README和本文档
2. 检查GitHub Issues
3. 提交新的Issue并附上详细信息

---

祝您部署顺利！🎉

