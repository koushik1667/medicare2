#!/bin/bash
# diagnose-email-issue.sh - 邮件发送问题诊断脚本
# Email Sending Issue Diagnostic Script
#
# 使用方法 | Usage:
#   ./scripts/diagnose-email-issue.sh

set -e

# 颜色定义 | Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "MediCareAI 邮件问题诊断工具"
echo "Email Issue Diagnostic Tool"
echo "=========================================="
echo ""

# 检查当前配置
echo -e "${BLUE}📋 检查当前邮件配置...${NC}"
echo ""

# 读取 .env 配置
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ 错误：找不到 .env 文件${NC}"
    exit 1
fi

# 读取配置
SMTP_HOST=$(grep "^SMTP_HOST=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "")
SMTP_PORT=$(grep "^SMTP_PORT=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "587")
SMTP_USER=$(grep "^SMTP_USER=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "")
SMTP_USE_TLS=$(grep "^SMTP_USE_TLS=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr '[:upper:]' '[:lower:]' || echo "true")

echo "当前配置 | Current Configuration:"
echo "-----------------------------------"
echo "  SMTP_HOST:     ${SMTP_HOST:-${RED}未设置${NC}}"
echo "  SMTP_PORT:     ${SMTP_PORT:-587}"
echo "  SMTP_USER:     ${SMTP_USER:-${RED}未设置${NC}}"
echo "  SMTP_USE_TLS:  ${SMTP_USE_TLS:-true}"
echo ""

# 诊断端口和 TLS 配置是否正确
echo -e "${BLUE}🔍 诊断配置是否正确...${NC}"
echo ""

diagnose_issue() {
    local issues=0
    
    # 检查 1：端口 465 与 TLS 设置
    if [ "$SMTP_PORT" = "465" ]; then
        if [ "$SMTP_USE_TLS" = "true" ]; then
            echo -e "${RED}❌ 问题 #1：端口配置错误${NC}"
            echo "   端口 465 使用 SSL 直接连接，不应该启用 STARTTLS"
            echo "   建议：设置 SMTP_USE_TLS=false"
            echo ""
            issues=$((issues + 1))
        else
            echo -e "${GREEN}✅ 端口 465 配置正确 (SSL 直接连接)${NC}"
            echo ""
        fi
    fi
    
    # 检查 2：端口 587 与 TLS 设置
    if [ "$SMTP_PORT" = "587" ]; then
        if [ "$SMTP_USE_TLS" = "false" ]; then
            echo -e "${RED}❌ 问题 #2：端口配置错误${NC}"
            echo "   端口 587 需要使用 STARTTLS 加密"
            echo "   建议：设置 SMTP_USE_TLS=true"
            echo ""
            issues=$((issues + 1))
        else
            echo -e "${GREEN}✅ 端口 587 配置正确 (STARTTLS)${NC}"
            echo ""
        fi
    fi
    
    # 检查 3：邮箱服务商匹配
    if [ -n "$SMTP_HOST" ]; then
        echo "检测邮箱服务商..."
        case "$SMTP_HOST" in
            *qq.com*)
                echo "  检测到：QQ邮箱"
                if [ "$SMTP_PORT" != "465" ]; then
                    echo -e "  ${YELLOW}⚠️  QQ邮箱通常使用端口 465${NC}"
                    echo "     建议: SMTP_PORT=465, SMTP_USE_TLS=false"
                    issues=$((issues + 1))
                fi
                ;;
            *163.com*)
                echo "  检测到：163邮箱"
                if [ "$SMTP_PORT" != "465" ]; then
                    echo -e "  ${YELLOW}⚠️  163邮箱通常使用端口 465${NC}"
                    echo "     建议: SMTP_PORT=465, SMTP_USE_TLS=false"
                    issues=$((issues + 1))
                fi
                ;;
            *gmail.com*)
                echo "  检测到：Gmail"
                if [ "$SMTP_PORT" != "587" ]; then
                    echo -e "  ${YELLOW}⚠️  Gmail 通常使用端口 587${NC}"
                    echo "     建议: SMTP_PORT=587, SMTP_USE_TLS=true"
                    issues=$((issues + 1))
                fi
                ;;
            *outlook.com*|*office365.com*)
                echo "  检测到：Outlook"
                if [ "$SMTP_PORT" != "587" ]; then
                    echo -e "  ${YELLOW}⚠️  Outlook 通常使用端口 587${NC}"
                    echo "     建议: SMTP_PORT=587, SMTP_USE_TLS=true"
                    issues=$((issues + 1))
                fi
                ;;
        esac
        echo ""
    fi
    
    # 检查 4：关键配置是否为空
    if [ -z "$SMTP_HOST" ] || [ -z "$SMTP_USER" ]; then
        echo -e "${RED}❌ 问题 #3：缺少关键配置${NC}"
        [ -z "$SMTP_HOST" ] && echo "   - SMTP_HOST 未设置"
        [ -z "$SMTP_USER" ] && echo "   - SMTP_USER 未设置"
        echo ""
        issues=$((issues + 1))
    fi
    
    return $issues
}

diagnose_issue
issue_count=$?

echo ""
echo "=========================================="

if [ $issue_count -eq 0 ]; then
    echo -e "${GREEN}✅ 配置看起来正确${NC}"
    echo ""
    echo "如果邮件仍然发送失败，可能原因："
    echo "1. 邮箱密码/授权码错误"
    echo "2. 邮箱服务器防火墙限制"
    echo "3. Docker 容器网络问题"
    echo ""
    echo -e "${BLUE}建议：运行邮件测试脚本${NC}"
    echo "  ./scripts/email-config-check.sh --test"
else
    echo -e "${YELLOW}⚠️  发现 $issue_count 个配置问题${NC}"
    echo ""
    echo -e "${BLUE}快速修复：${NC}"
    echo ""
    
    # 生成修复建议
    echo "请编辑 .env 文件并修改以下配置："
    echo "  nano .env"
    echo ""
    
    if [ "$SMTP_PORT" = "465" ] && [ "$SMTP_USE_TLS" = "true" ]; then
        echo "修改 SMTP_USE_TLS："
        echo "  SMTP_USE_TLS=false"
        echo ""
    fi
    
    if [ "$SMTP_PORT" = "587" ] && [ "$SMTP_USE_TLS" = "false" ]; then
        echo "修改 SMTP_USE_TLS："
        echo "  SMTP_USE_TLS=true"
        echo ""
    fi
    
    echo "修改后重启后端服务："
    echo "  docker compose restart backend"
    echo ""
    echo "或使用交互式配置工具："
    echo "  ./scripts/email-config-check.sh --fix"
fi

echo "=========================================="
