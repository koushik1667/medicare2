#!/bin/bash
# email-config-check.sh - 邮件配置检查和修复脚本
# Email Configuration Check and Fix Script
#
# 使用方法 | Usage:
#   ./scripts/email-config-check.sh           # 检查当前配置
#   ./scripts/email-config-check.sh --fix     # 交互式修复配置

set -e

# 颜色定义 | Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目目录 | Project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

echo "=========================================="
echo "MediCareAI 邮件配置检查工具"
echo "Email Configuration Checker"
echo "=========================================="
echo ""

# 检查 .env 文件是否存在 | Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ 错误：找不到 .env 文件${NC}"
    echo "请首先复制 .env.example 到 .env:"
    echo "  cp .env.example .env"
    exit 1
fi

# 读取当前的邮件配置 | Read current email configuration
check_email_config() {
    echo -e "${BLUE}📧 检查邮件配置...${NC}"
    echo ""
    
    # 读取配置 | Read configuration
    SMTP_HOST=$(grep "^SMTP_HOST=" "$ENV_FILE" | cut -d'=' -f2 || echo "")
    SMTP_PORT=$(grep "^SMTP_PORT=" "$ENV_FILE" | cut -d'=' -f2 || echo "587")
    SMTP_USER=$(grep "^SMTP_USER=" "$ENV_FILE" | cut -d'=' -f2 || echo "")
    SMTP_PASSWORD=$(grep "^SMTP_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2 || echo "")
    SMTP_FROM_EMAIL=$(grep "^SMTP_FROM_EMAIL=" "$ENV_FILE" | cut -d'=' -f2 || echo "")
    FRONTEND_URL=$(grep "^FRONTEND_URL=" "$ENV_FILE" | cut -d'=' -f2 || echo "")
    
    # 显示当前配置 | Show current configuration
    echo "当前配置 | Current Configuration:"
    echo "-----------------------------------"
    
    if [ -z "$SMTP_HOST" ]; then
        echo -e "  SMTP_HOST:     ${RED}❌ 未设置 (必需)${NC}"
    else
        echo -e "  SMTP_HOST:     ${GREEN}✅ $SMTP_HOST${NC}"
    fi
    
    if [ -z "$SMTP_PORT" ]; then
        echo -e "  SMTP_PORT:     ${YELLOW}⚠️  未设置 (默认: 587)${NC}"
    else
        echo -e "  SMTP_PORT:     ${GREEN}✅ $SMTP_PORT${NC}"
    fi
    
    if [ -z "$SMTP_USER" ]; then
        echo -e "  SMTP_USER:     ${RED}❌ 未设置 (必需)${NC}"
    else
        echo -e "  SMTP_USER:     ${GREEN}✅ $SMTP_USER${NC}"
    fi
    
    if [ -z "$SMTP_PASSWORD" ]; then
        echo -e "  SMTP_PASSWORD: ${RED}❌ 未设置 (必需)${NC}"
    else
        echo -e "  SMTP_PASSWORD: ${GREEN}✅ ******** (已设置)${NC}"
    fi
    
    if [ -z "$SMTP_FROM_EMAIL" ]; then
        echo -e "  SMTP_FROM_EMAIL: ${YELLOW}⚠️  未设置 (默认使用 SMTP_USER)${NC}"
    else
        echo -e "  SMTP_FROM_EMAIL: ${GREEN}✅ $SMTP_FROM_EMAIL${NC}"
    fi
    
    if [ -z "$FRONTEND_URL" ]; then
        echo -e "  FRONTEND_URL:  ${YELLOW}⚠️  未设置 (默认: http://localhost:3000)${NC}"
    else
        echo -e "  FRONTEND_URL:  ${GREEN}✅ $FRONTEND_URL${NC}"
    fi
    
    echo ""
    
    # 检查配置完整性 | Check configuration completeness
    if [ -z "$SMTP_HOST" ] || [ -z "$SMTP_USER" ] || [ -z "$SMTP_PASSWORD" ]; then
        echo -e "${RED}❌ 邮件配置不完整！${NC}"
        echo "以下必需配置缺失："
        [ -z "$SMTP_HOST" ] && echo "  - SMTP_HOST"
        [ -z "$SMTP_USER" ] && echo "  - SMTP_USER"
        [ -z "$SMTP_PASSWORD" ] && echo "  - SMTP_PASSWORD"
        echo ""
        echo "医生审核通过邮件将${RED}无法发送${NC}！"
        return 1
    else
        echo -e "${GREEN}✅ 所有必需配置已设置${NC}"
        
        # 检查端口配置是否合理 | Check if port configuration makes sense
        if [ "$SMTP_PORT" = "465" ]; then
            echo ""
            echo -e "${YELLOW}⚠️  注意：您使用的是 465 端口 (SSL 直接连接)${NC}"
            echo "确保 SMTP_USE_TLS=false"
        elif [ "$SMTP_PORT" = "587" ]; then
            echo ""
            echo -e "${BLUE}ℹ️  信息：您使用的是 587 端口 (STARTTLS)${NC}"
            echo "确保 SMTP_USE_TLS=true"
        fi
        
        return 0
    fi
}

# 测试邮件发送 | Test email sending
test_email() {
    echo ""
    echo -e "${BLUE}🧪 测试邮件发送...${NC}"
    echo ""
    
    read -p "请输入测试邮箱地址 | Enter test email address: " test_email
    
    if [ -z "$test_email" ]; then
        echo -e "${YELLOW}⚠️  跳过测试${NC}"
        return
    fi
    
    echo "正在发送测试邮件到 $test_email..."
    
    # 使用 Python 发送测试邮件
    python3 << EOF
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# 从 .env 文件读取配置
def get_env_var(key):
    with open('$ENV_FILE', 'r') as f:
        for line in f:
            if line.startswith(f'{key}='):
                return line.split('=', 1)[1].strip()
    return None

smtp_host = get_env_var('SMTP_HOST')
smtp_port = int(get_env_var('SMTP_PORT') or '587')
smtp_user = get_env_var('SMTP_USER')
smtp_password = get_env_var('SMTP_PASSWORD')
from_email = get_env_var('SMTP_FROM_EMAIL') or smtp_user
from_name = get_env_var('SMTP_FROM_NAME') or 'MediCareAI'
use_tls = (get_env_var('SMTP_USE_TLS') or 'true').lower() == 'true'

try:
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'MediCareAI 邮件测试 | Email Test'
    msg['From'] = f'{from_name} <{from_email}>'
    msg['To'] = '$test_email'
    
    html = '''
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #667eea;">MediCareAI 邮件测试成功！</h2>
        <p>这是一封测试邮件，用于验证邮件配置是否正确。</p>
        <p>如果您收到此邮件，说明您的邮件配置工作正常。</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
            MediCareAI 智能疾病管理系统<br>
            此邮件由系统自动发送
        </p>
    </body>
    </html>
    '''
    
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    
    # 发送邮件
    if smtp_port == 465:
        server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
    else:
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        if use_tls:
            server.starttls()
    
    server.login(smtp_user, smtp_password)
    server.sendmail(from_email, '$test_email', msg.as_string())
    server.quit()
    
    print("✅ 测试邮件发送成功！")
    print(f"   请检查邮箱: $test_email")
    
except Exception as e:
    print(f"❌ 测试邮件发送失败: {e}")
    exit(1)
EOF
}

# 交互式配置修复 | Interactive configuration fix
fix_config() {
    echo ""
    echo -e "${BLUE}🔧 交互式配置修复${NC}"
    echo "========================================"
    echo ""
    
    echo "请选择您的邮箱服务商 | Select your email provider:"
    echo "1) Gmail"
    echo "2) Outlook / Office 365"
    echo "3) QQ邮箱"
    echo "4) 163邮箱"
    echo "5) 阿里云邮箱"
    echo "6) 其他 / Other"
    echo ""
    read -p "选择 [1-6]: " provider_choice
    
    case $provider_choice in
        1)
            SMTP_HOST="smtp.gmail.com"
            SMTP_PORT="587"
            SMTP_USE_TLS="true"
            echo ""
            echo -e "${YELLOW}⚠️  Gmail 需要使用应用专用密码！${NC}"
            echo "请访问: https://myaccount.google.com/apppasswords"
            ;;
        2)
            SMTP_HOST="smtp.office365.com"
            SMTP_PORT="587"
            SMTP_USE_TLS="true"
            ;;
        3)
            SMTP_HOST="smtp.qq.com"
            SMTP_PORT="465"
            SMTP_USE_TLS="false"
            echo ""
            echo -e "${YELLOW}⚠️  QQ邮箱需要使用授权码而非登录密码！${NC}"
            echo "请访问: https://mail.qq.com -> 设置 -> 账户 -> 开启SMTP服务"
            ;;
        4)
            SMTP_HOST="smtp.163.com"
            SMTP_PORT="465"
            SMTP_USE_TLS="false"
            echo ""
            echo -e "${YELLOW}⚠️  163邮箱需要使用授权码！${NC}"
            ;;
        5)
            SMTP_HOST="smtp.aliyun.com"
            SMTP_PORT="465"
            SMTP_USE_TLS="false"
            ;;
        *)
            read -p "请输入 SMTP 服务器地址: " SMTP_HOST
            read -p "请输入 SMTP 端口 [587]: " SMTP_PORT
            SMTP_PORT=${SMTP_PORT:-587}
            if [ "$SMTP_PORT" = "465" ]; then
                SMTP_USE_TLS="false"
            else
                SMTP_USE_TLS="true"
            fi
            ;;
    esac
    
    echo ""
    read -p "请输入邮箱地址: " SMTP_USER
    read -sp "请输入密码/授权码: " SMTP_PASSWORD
    echo ""
    read -p "请输入发件人名称 [MediCareAI]: " from_name
    from_name=${from_name:-MediCareAI}
    
    # 检测服务器类型并建议 FRONTEND_URL
    echo ""
    echo "请选择部署环境 | Select deployment environment:"
    echo "1) 本地开发 (localhost:3000)"
    echo "2) 生产环境 (openmedicareai.life)"
    echo "3) 自定义"
    read -p "选择 [1-3]: " env_choice
    
    case $env_choice in
        1)
            FRONTEND_URL="http://localhost:3000"
            ;;
        2)
            FRONTEND_URL="https://openmedicareai.life"
            ;;
        *)
            read -p "请输入前端URL: " FRONTEND_URL
            ;;
    esac
    
    # 更新 .env 文件
    echo ""
    echo "正在更新 .env 文件..."
    
    # 删除旧的邮件配置（如果存在）
    sed -i '/^SMTP_/d' "$ENV_FILE"
    sed -i '/^FRONTEND_URL/d' "$ENV_FILE"
    
    # 添加新配置
    cat >> "$ENV_FILE" << EOF

# =============================================================================
# 邮件服务配置 (自动配置于 $(date '+%Y-%m-%d %H:%M:%S'))
# =============================================================================
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASSWORD=$SMTP_PASSWORD
SMTP_FROM_EMAIL=$SMTP_USER
SMTP_FROM_NAME=$from_name
SMTP_USE_TLS=$SMTP_USE_TLS
FRONTEND_URL=$FRONTEND_URL
EOF
    
    echo -e "${GREEN}✅ 配置已更新！${NC}"
    echo ""
    echo "新的配置："
    grep "^SMTP_\|^FRONTEND_URL" "$ENV_FILE" | grep -v PASSWORD
}

# 主逻辑 | Main logic
case "${1:-}" in
    --fix|-f)
        check_email_config || true
        fix_config
        echo ""
        read -p "是否测试邮件发送? [y/N]: " test_choice
        if [[ $test_choice =~ ^[Yy]$ ]]; then
            test_email
        fi
        ;;
    --test|-t)
        check_email_config || true
        test_email
        ;;
    *)
        check_email_config
        
        if [ $? -ne 0 ]; then
            echo ""
            echo -e "${YELLOW}💡 提示：使用 --fix 参数进行交互式配置修复${NC}"
            echo "  ./scripts/email-config-check.sh --fix"
        else
            echo ""
            read -p "是否测试邮件发送? [y/N]: " test_choice
            if [[ $test_choice =~ ^[Yy]$ ]]; then
                test_email
            fi
        fi
        ;;
esac

echo ""
echo "=========================================="
echo "检查完成 | Check completed"
echo "=========================================="
