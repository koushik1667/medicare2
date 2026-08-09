#!/bin/bash
# check-frontend-url.sh - 检查 FRONTEND_URL 配置脚本
# Check FRONTEND_URL Configuration Script
#
# 使用方法 | Usage:
#   ./scripts/check-frontend-url.sh

set -e

# 颜色定义 | Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "FRONTEND_URL 配置检查工具"
echo "Frontend URL Configuration Checker"
echo "=========================================="
echo ""

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ 错误：找不到 .env 文件${NC}"
    exit 1
fi

# 读取 FRONTEND_URL
FRONTEND_URL=$(grep "^FRONTEND_URL=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "")

echo "当前配置 | Current Configuration:"
echo "-----------------------------------"
if [ -z "$FRONTEND_URL" ]; then
    echo -e "  FRONTEND_URL: ${RED}❌ 未设置${NC}"
    echo ""
    echo -e "${RED}❌ 错误：FRONTEND_URL 未配置！${NC}"
    echo "这会导致邮件中的链接无法使用。"
    exit 1
else
    echo -e "  FRONTEND_URL: ${BLUE}$FRONTEND_URL${NC}"
fi

echo ""
echo "检查结果 | Check Results:"
echo "-----------------------------------"

# 检查是否是 localhost
if echo "$FRONTEND_URL" | grep -q "localhost"; then
    echo -e "${YELLOW}⚠️  警告：当前配置为 localhost${NC}"
    echo ""
    echo "这意味着："
    echo "  • 本地开发：✅ 正常工作"
    echo "  • 远程生产：❌ 用户无法访问邮件链接"
    echo ""
    echo "远程生产环境应配置为实际域名，例如："
    echo "  FRONTEND_URL=https://openmedicareai.life"
    echo ""
    
    # 检测是否是远程服务器
    if [ -n "$SSH_CLIENT" ] || [ -n "$SSH_TTY" ]; then
        echo -e "${RED}⚠️  检测到您当前在远程服务器上！${NC}"
        echo "您应该修改 FRONTEND_URL 为生产环境域名。"
        echo ""
    fi
    
    read -p "是否立即修复配置? [y/N]: " fix_choice
    if [[ $fix_choice =~ ^[Yy]$ ]]; then
        echo ""
        read -p "请输入生产环境域名 (例如: https://openmedicareai.life): " new_url
        
        if [ -n "$new_url" ]; then
            # 更新 .env 文件
            sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=$new_url|" "$ENV_FILE"
            echo -e "${GREEN}✅ 配置已更新为: $new_url${NC}"
            echo ""
            echo "请重启后端服务使配置生效："
            echo "  docker compose restart backend"
        fi
    fi
else
    echo -e "${GREEN}✅ 配置看起来正确${NC}"
    echo ""
    echo "当前 FRONTEND_URL: $FRONTEND_URL"
    echo ""
    echo "邮件中的链接将使用此地址："
    echo "  邮箱验证: ${FRONTEND_URL}/verify-email?token=..."
    echo "  密码重置: ${FRONTEND_URL}/reset-password?token=..."
    echo "  医生登录: ${FRONTEND_URL}/login"
    echo ""
    
    # 检查是否使用 HTTPS（生产环境推荐）
    if echo "$FRONTEND_URL" | grep -q "^https://"; then
        echo -e "${GREEN}✅ 使用 HTTPS（推荐用于生产环境）${NC}"
    else
        echo -e "${YELLOW}⚠️  使用 HTTP（生产环境建议使用 HTTPS）${NC}"
    fi
fi

echo ""
echo "=========================================="
