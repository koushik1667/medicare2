#!/bin/bash
# =============================================================================
# MediCareAI 生产环境安全更新脚本
# Production Environment Security Update Script
# =============================================================================
# 使用说明 | Usage:
#   ./scripts/update-production.sh [选项]
#
# 选项 | Options:
#   --check-only    仅检查配置，不执行更新
#   --force         强制更新，跳过确认提示
#   --help          显示帮助信息
#
# 重要提示 | IMPORTANT:
#   1. 此脚本适用于阿里云服务器 8.137.177.147 (openmedicareai.life)
#   2. 执行前请确保已备份数据
#   3. 确保已配置所有必要的环境变量
# =============================================================================

set -e  # 遇到错误立即退出

# 颜色定义 | Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 服务器配置 | Server configuration
SERVER_IP="8.137.177.147"
SERVER_USER="houge"
PROJECT_DIR="~/MediCareAI"
DOMAIN="openmedicareai.life"

# 检查模式标志 | Check mode flag
CHECK_ONLY=false
FORCE=false

# 解析参数 | Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --check-only)
            CHECK_ONLY=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --help)
            echo "MediCareAI 生产环境安全更新脚本"
            echo ""
            echo "用法: ./scripts/update-production.sh [选项]"
            echo ""
            echo "选项:"
            echo "  --check-only    仅检查配置，不执行更新"
            echo "  --force         强制更新，跳过确认提示"
            echo "  --help          显示此帮助信息"
            exit 0
            ;;
        *)
            echo -e "${RED}未知选项: $1${NC}"
            exit 1
            ;;
    esac
done

# 打印带颜色的消息 | Print colored message
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 检查服务器连接 | Check server connection
check_server_connection() {
    print_message $BLUE "🔍 检查服务器连接... | Checking server connection..."
    
    if ! ping -c 1 $SERVER_IP &> /dev/null; then
        print_message $RED "❌ 无法连接到服务器 $SERVER_IP"
        exit 1
    fi
    
    print_message $GREEN "✅ 服务器连接正常 | Server connection OK"
}

# 检查必要的命令 | Check required commands
check_requirements() {
    print_message $BLUE "🔍 检查必要的命令... | Checking required commands..."
    
    local commands=("ssh" "scp" "git")
    for cmd in "${commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            print_message $RED "❌ 未找到命令: $cmd"
            exit 1
        fi
    done
    
    print_message $GREEN "✅ 所有必要的命令已安装 | All required commands installed"
}

# 生成生产环境配置检查脚本 | Generate production config check script
generate_config_check() {
    cat << 'EOF'
#!/bin/bash
# 生产环境配置检查脚本 | Production Environment Config Check Script
# 此脚本在服务器上运行

set -e

DOMAIN="openmedicareai.life"
ENV_FILE="~/MediCareAI/.env"
ERRORS=0

echo "🔍 检查生产环境配置... | Checking production environment configuration..."
echo ""

# 检查文件是否存在
check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        echo "❌ 错误: .env 文件不存在"
        echo "   请从 .env.example 复制并配置:"
        echo "   cp .env.example .env"
        ((ERRORS++))
        return 1
    fi
    echo "✅ .env 文件存在"
    return 0
}

# 检查必需的变量
check_required_vars() {
    echo ""
    echo "📋 检查必需的变量..."
    
    local required_vars=(
        "POSTGRES_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET_KEY"
        "CORS_ORIGINS"
        "ALLOWED_HOSTS"
        "TRUSTED_PROXY_HOSTS"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$ENV_FILE" 2>/dev/null; then
            echo "❌ 缺少必需变量: $var"
            ((ERRORS++))
        else
            # 检查值是否为空或为默认值
            value=$(grep "^$var=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
            if [ -z "$value" ] || [[ "$value" == "your_secure_"* ]] || [[ "$value" == "changeme" ]]; then
                echo "⚠️  $var 未设置或为默认值"
                ((ERRORS++))
            else
                echo "✅ $var 已设置"
            fi
        fi
    done
}

# 检查 CORS 配置
check_cors_config() {
    echo ""
    echo "🔒 检查 CORS 配置..."
    
    local cors_origins=$(grep "^CORS_ORIGINS=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -z "$cors_origins" ]; then
        echo "❌ CORS_ORIGINS 未设置"
        echo "   建议配置: CORS_ORIGINS=[\"https://$DOMAIN\",\"https://www.$DOMAIN\"]"
        ((ERRORS++))
    elif [[ "$cors_origins" == "*" ]] || [[ "$cors_origins" == '["*"]' ]]; then
        echo "⚠️  CORS_ORIGINS 设置为允许所有来源（*），这在生产环境不安全"
        echo "   建议配置: CORS_ORIGINS=[\"https://$DOMAIN\",\"https://www.$DOMAIN\"]"
        ((ERRORS++))
    else
        echo "✅ CORS_ORIGINS 已配置: $cors_origins"
    fi
}

# 检查 Host 配置
check_host_config() {
    echo ""
    echo "🔒 检查 Allowed Hosts 配置..."
    
    local allowed_hosts=$(grep "^ALLOWED_HOSTS=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -z "$allowed_hosts" ]; then
        echo "❌ ALLOWED_HOSTS 未设置"
        echo "   建议配置: ALLOWED_HOSTS=[\"$DOMAIN\",\"www.$DOMAIN\"]"
        ((ERRORS++))
    elif [[ "$allowed_hosts" == "*" ]] || [[ "$allowed_hosts" == '["*"]' ]]; then
        echo "⚠️  ALLOWED_HOSTS 设置为允许所有主机（*），这在生产环境不安全"
        echo "   建议配置: ALLOWED_HOSTS=[\"$DOMAIN\",\"www.$DOMAIN\"]"
        ((ERRORS++))
    else
        echo "✅ ALLOWED_HOSTS 已配置: $allowed_hosts"
    fi
}

# 检查 DEBUG 模式
check_debug_mode() {
    echo ""
    echo "🐛 检查 DEBUG 模式..."
    
    local debug=$(grep "^DEBUG=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    
    if [[ "$debug" == "true" ]]; then
        echo "⚠️  DEBUG 模式已启用，生产环境应禁用"
        echo "   建议配置: DEBUG=false"
        ((ERRORS++))
    else
        echo "✅ DEBUG 模式已禁用"
    fi
}

# 主检查流程
main() {
    echo "=========================================="
    echo "MediCareAI 生产环境配置检查"
    echo "域名: $DOMAIN"
    echo "=========================================="
    echo ""
    
    check_env_file
    check_required_vars
    check_cors_config
    check_host_config
    check_debug_mode
    
    echo ""
    echo "=========================================="
    if [ $ERRORS -eq 0 ]; then
        echo "✅ 所有检查通过！配置正确。"
        exit 0
    else
        echo "❌ 发现 $ERRORS 个问题，请修复后再更新。"
        echo ""
        echo "快速修复命令:"
        echo "  nano $ENV_FILE"
        exit 1
    fi
}

main
EOF
}

# 显示更新信息 | Show update info
show_update_info() {
    print_message $BLUE "=========================================="
    print_message $BLUE "MediCareAI 生产环境安全更新"
    print_message $BLUE "=========================================="
    print_message $YELLOW "服务器: $SERVER_IP ($DOMAIN)"
    print_message $YELLOW "项目目录: $PROJECT_DIR"
    print_message $BLUE "=========================================="
    echo ""
    
    print_message $YELLOW "本次更新包含以下安全修复:"
    print_message $YELLOW "1. CORS 配置改为从环境变量读取（不再硬编码允许所有来源）"
    print_message $YELLOW "2. TrustedHost 配置改为从环境变量读取"
    print_message $YELLOW "3. ProxyHeadersMiddleware 配置改为从环境变量读取"
    print_message $YELLOW "4. 移除 docker-compose.yml 中的硬编码密码"
    print_message $YELLOW "5. DEBUG 模式改为从环境变量读取"
    echo ""
    
    print_message $RED "⚠️  重要提示:"
    print_message $RED "   更新前必须确保服务器 .env 文件已配置:"
    print_message $RED "   - CORS_ORIGINS"
    print_message $RED "   - ALLOWED_HOSTS"
    print_message $RED "   - TRUSTED_PROXY_HOSTS"
    print_message $RED "   - POSTGRES_PASSWORD"
    print_message $RED "   - REDIS_PASSWORD"
    echo ""
}

# 在服务器上执行配置检查 | Run config check on server
check_server_config() {
    print_message $BLUE "🔍 检查服务器配置... | Checking server configuration..."
    
    # 生成临时检查脚本
    local check_script=$(generate_config_check)
    
    # 将脚本复制到服务器并执行
    echo "$check_script" | ssh $SERVER_USER@$SERVER_IP 'bash -s'
    
    return $?
}

# 更新服务器 | Update server
update_server() {
    print_message $BLUE "🚀 开始更新服务器... | Starting server update..."
    
    ssh $SERVER_USER@$SERVER_IP << 'REMOTECOMMANDS'
        set -e
        
        cd ~/MediCareAI
        
        echo "📦 拉取最新代码..."
        git pull
        
        echo "🔄 重新构建并启动服务..."
        # 使用生产配置重新构建
        docker-compose -f docker-compose.prod.yml down
        docker-compose -f docker-compose.prod.yml up -d --build
        
        echo "⏳ 等待服务启动..."
        sleep 10
        
        echo "🔍 检查服务状态..."
        docker-compose -f docker-compose.prod.yml ps
        
        echo "✅ 更新完成！"
        
        echo ""
        echo "📊 服务健康检查:"
        curl -s http://localhost:8000/health | jq . || echo "健康检查端点暂时不可用（可能还在启动中）"
REMOTECOMMANDS
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "✅ 服务器更新成功！"
    else
        print_message $RED "❌ 服务器更新失败！"
        exit 1
    fi
}

# 验证更新 | Verify update
verify_update() {
    print_message $BLUE "🔍 验证更新结果... | Verifying update..."
    
    # 检查网站可访问性
    print_message $BLUE "🌐 检查网站可访问性..."
    
    local endpoints=(
        "https://$DOMAIN/health"
        "https://$DOMAIN:8443/health"
        "https://$DOMAIN:8444/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local status=$(curl -s -o /dev/null -w "%{http_code}" --insecure "$endpoint" 2>/dev/null)
        if [ "$status" == "200" ]; then
            print_message $GREEN "✅ $endpoint - HTTP $status"
        else
            print_message $YELLOW "⚠️  $endpoint - HTTP $status (可能需要稍后再检查)"
        fi
    done
}

# 主流程 | Main flow
main() {
    show_update_info
    
    # 检查需求
    check_requirements
    check_server_connection
    
    # 仅检查模式
    if [ "$CHECK_ONLY" = true ]; then
        print_message $BLUE "🔍 仅检查模式，不执行更新"
        check_server_config
        exit $?
    fi
    
    # 检查服务器配置
    if ! check_server_config; then
        print_message $RED "❌ 服务器配置检查失败，请修复配置后再更新"
        print_message $YELLOW "   登录服务器: ssh $SERVER_USER@$SERVER_IP"
        print_message $YELLOW "   编辑配置: nano ~/MediCareAI/.env"
        exit 1
    fi
    
    # 确认更新
    if [ "$FORCE" != true ]; then
        print_message $YELLOW ""
        read -p "⚠️  确认要更新生产环境吗？这将重启服务。输入 'yes' 继续: " confirm
        if [ "$confirm" != "yes" ]; then
            print_message $YELLOW "更新已取消"
            exit 0
        fi
    fi
    
    # 执行更新
    update_server
    
    # 验证更新
    verify_update
    
    print_message $GREEN ""
    print_message $GREEN "=========================================="
    print_message $GREEN "✅ 生产环境更新完成！"
    print_message $GREEN "=========================================="
    print_message $BLUE ""
    print_message $BLUE "访问地址:"
    print_message $BLUE "  - 患者端: https://$DOMAIN"
    print_message $BLUE "  - 医生端: https://$DOMAIN:8443"
    print_message $BLUE "  - 管理员端: https://$DOMAIN:8444"
}

# 捕获中断信号
trap 'print_message $RED "\n❌ 更新已中断"; exit 1' INT TERM

main
