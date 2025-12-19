#!/bin/bash

# 作业批改查看器 - 重启脚本
# 用于清除缓存并重启开发服务器

echo "🔄 正在清除缓存..."
rm -rf node_modules/.vite
rm -rf dist

echo "✅ 缓存已清除"
echo ""
echo "🚀 正在启动开发服务器..."
echo ""

npm run dev

