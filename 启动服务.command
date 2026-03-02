#!/bin/bash

# 获取脚本的真实路径（处理符号链接和别名）
SCRIPT_PATH="$0"
# 如果是符号链接，获取真实路径
while [ -L "$SCRIPT_PATH" ]; do
    SCRIPT_PATH="$(readlink "$SCRIPT_PATH")"
done

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"

# 项目目录（固定路径）
PROJECT_DIR="/Users/bruce/Downloads/project"

# 切换到项目目录
cd "$PROJECT_DIR" || {
    echo "❌ 错误：无法切换到项目目录: $PROJECT_DIR"
    exit 1
}

# 检查 package.json 是否存在
if [ ! -f "package.json" ]; then
    echo "❌ 错误：在项目目录中找不到 package.json"
    echo "   当前目录: $(pwd)"
    exit 1
fi

# 设置终端窗口标题
echo -e "\033]0;多平台数据整合工具\007"
echo "📁 项目目录: $PROJECT_DIR"

# 检查端口是否被占用
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 5173 已被占用，正在停止旧进程..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    sleep 2
fi

echo "🚀 正在启动开发服务器..."
echo ""

# 启动开发服务器
npm run dev &
SERVER_PID=$!

# 等待服务器启动
echo "⏳ 等待服务器启动..."
for i in {1..10}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ 服务器已启动！"
        sleep 1
        echo "🌐 正在打开浏览器..."
        open http://localhost:5173
        echo ""
        echo "✨ 应用已启动！"
        echo "📝 按 Ctrl+C 停止服务器"
        echo ""
        # 等待用户中断
        wait $SERVER_PID
        exit 0
    fi
    sleep 1
done

echo "❌ 服务器启动超时，请检查错误信息"
kill $SERVER_PID 2>/dev/null
exit 1

