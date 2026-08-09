"""
Email Configuration API Endpoints | 邮件配置API端点

提供管理员邮件配置管理功能：
- 创建/更新/删除SMTP配置
- 测试邮件配置
- 设置默认配置

提供邮件配置管理功能给管理员界面
"""

from typing import List, Optional
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.db.database import get_db
from app.core.deps import require_admin
from app.models.models import EmailConfiguration, User
from app.services.email_service import temail_service

import logging

logger = logging.getLogger(__name__)
router = APIRouter()


# =============================================================================
# Schemas | 模式定义
# =============================================================================


class EmailConfigBase(BaseModel):
    """邮件配置基础模式 | Email Configuration Base Schema"""

    smtp_host: str = Field(..., description="SMTP服务器地址")
    smtp_port: int = Field(default=587, description="SMTP服务器端口")
    smtp_user: str = Field(..., description="SMTP用户名")
    smtp_password: str = Field(..., description="SMTP密码")
    smtp_from_email: str = Field(..., description="发件人邮箱")
    smtp_from_name: str = Field(default="MediCareAI", description="发件人名称")
    smtp_use_tls: bool = Field(default=True, description="使用TLS加密")
    description: Optional[str] = Field(None, description="配置描述")


class EmailConfigCreate(EmailConfigBase):
    """创建邮件配置请求 | Create Email Configuration Request"""

    is_default: bool = Field(default=False, description="设为默认配置")


class EmailConfigUpdate(BaseModel):
    """更新邮件配置请求 | Update Email Configuration Request"""

    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    smtp_from_name: Optional[str] = None
    smtp_use_tls: Optional[bool] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    description: Optional[str] = None


class EmailConfigResponse(BaseModel):
    """邮件配置响应 | Email Configuration Response"""

    id: UUID
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_from_email: str
    smtp_from_name: str
    smtp_use_tls: bool
    is_active: bool
    is_default: bool
    test_status: str
    test_message: Optional[str]
    tested_at: Optional[datetime]
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EmailConfigTestRequest(BaseModel):
    """测试邮件配置请求 | Test Email Configuration Request"""

    test_email: str = Field(..., description="用于接收测试邮件的邮箱地址")


class EmailConfigTestResponse(BaseModel):
    """测试邮件配置响应 | Test Email Configuration Response"""

    success: bool
    message: str


class EmailConfigListResponse(BaseModel):
    """邮件配置列表响应 | Email Configuration List Response"""

    configs: List[EmailConfigResponse]
    total: int


# =============================================================================
# API Endpoints | API端点
# =============================================================================


@router.get("/configs", response_model=EmailConfigListResponse)
async def list_email_configs(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> EmailConfigListResponse:
    """
    获取所有邮件配置列表 | Get all email configurations

    - 仅管理员可访问
    - 返回所有SMTP配置（密码字段会被隐藏）
    """
    stmt = select(EmailConfiguration).order_by(EmailConfiguration.created_at.desc())
    result = await db.execute(stmt)
    configs = result.scalars().all()

    return EmailConfigListResponse(
        configs=[EmailConfigResponse.model_validate(c) for c in configs],
        total=len(configs),
    )


@router.get("/configs/{config_id}", response_model=EmailConfigResponse)
async def get_email_config(
    config_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> EmailConfigResponse:
    """
    获取单个邮件配置详情 | Get email configuration details

    - 仅管理员可访问
    """
    stmt = select(EmailConfiguration).where(EmailConfiguration.id == config_id)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="配置不存在 / Configuration not found",
        )

    return EmailConfigResponse.model_validate(config)


@router.post(
    "/configs", response_model=EmailConfigResponse, status_code=status.HTTP_201_CREATED
)
async def create_email_config(
    config_data: EmailConfigCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> EmailConfigResponse:
    """
    创建新的邮件配置 | Create new email configuration

    - 仅管理员可访问
    - 如果设为默认，会自动取消其他配置的默认状态
    """
    # 如果设为默认，取消其他配置的默认状态
    if config_data.is_default:
        await _clear_default_config(db)

    # 创建新配置
    new_config = EmailConfiguration(
        smtp_host=config_data.smtp_host,
        smtp_port=config_data.smtp_port,
        smtp_user=config_data.smtp_user,
        smtp_password=config_data.smtp_password,
        smtp_from_email=config_data.smtp_from_email,
        smtp_from_name=config_data.smtp_from_name,
        smtp_use_tls=config_data.smtp_use_tls,
        description=config_data.description,
        is_default=config_data.is_default,
        is_active=True,
        created_by=current_user.id,
    )

    db.add(new_config)
    await db.commit()
    await db.refresh(new_config)

    logger.info(f"Email configuration created by {current_user.email}: {new_config.id}")

    return EmailConfigResponse.model_validate(new_config)


@router.put("/configs/{config_id}", response_model=EmailConfigResponse)
async def update_email_config(
    config_id: UUID,
    config_data: EmailConfigUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> EmailConfigResponse:
    """
    更新邮件配置 | Update email configuration

    - 仅管理员可访问
    - 如果设为默认，会自动取消其他配置的默认状态
    """
    stmt = select(EmailConfiguration).where(EmailConfiguration.id == config_id)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="配置不存在 / Configuration not found",
        )

    # 如果设为默认，取消其他配置的默认状态
    if config_data.is_default:
        await _clear_default_config(db, exclude_id=config_id)

    # 更新配置
    update_data = config_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)

    config.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(config)

    logger.info(f"Email configuration updated by {current_user.email}: {config_id}")

    return EmailConfigResponse.model_validate(config)


@router.delete("/configs/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_email_config(
    config_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    删除邮件配置 | Delete email configuration

    - 仅管理员可访问
    """
    stmt = select(EmailConfiguration).where(EmailConfiguration.id == config_id)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="配置不存在 / Configuration not found",
        )

    await db.delete(config)
    await db.commit()

    logger.info(f"Email configuration deleted by {current_user.email}: {config_id}")


@router.post("/configs/{config_id}/test", response_model=EmailConfigTestResponse)
async def test_email_config(
    config_id: UUID,
    test_data: EmailConfigTestRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> EmailConfigTestResponse:
    """
    测试邮件配置 | Test email configuration

    - 仅管理员可访问
    - 发送测试邮件到指定邮箱
    - 更新配置的测试状态
    """
    stmt = select(EmailConfiguration).where(
        and_(EmailConfiguration.id == config_id, EmailConfiguration.is_active == True)
    )
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="配置不存在或未激活 / Configuration not found or inactive",
        )

    # 临时设置邮件服务使用此配置
    original_config = {
        "host": temail_service.smtp_host,
        "port": temail_service.smtp_port,
        "user": temail_service.smtp_user,
        "password": temail_service.smtp_password,
        "from_email": temail_service.from_email,
        "from_name": temail_service.from_name,
        "use_tls": temail_service.use_tls,
    }

    try:
        # 设置测试配置
        temail_service.smtp_host = config.smtp_host
        temail_service.smtp_port = config.smtp_port
        temail_service.smtp_user = config.smtp_user
        temail_service.smtp_password = config.smtp_password
        temail_service.from_email = config.smtp_from_email
        temail_service.from_name = config.smtp_from_name
        temail_service.use_tls = config.smtp_use_tls
        temail_service.config_source = "test"

        # 发送测试邮件
        html_content = """
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #667eea;">MediCareAI 邮件配置测试</h2>
                <p>这是一封测试邮件，用于验证SMTP配置是否正确。</p>
                <p>如果您收到这封邮件，说明邮件服务配置成功！</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">
                    MediCareAI 智能疾病管理系统<br>
                    测试时间: {test_time}
                </p>
            </div>
        </body>
        </html>
        """.format(test_time=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"))

        text_content = """
        MediCareAI 邮件配置测试
        
        这是一封测试邮件，用于验证SMTP配置是否正确。
        如果您收到这封邮件，说明邮件服务配置成功！
        
        MediCareAI 智能疾病管理系统
        """

        logger.info(f"Testing email config {config_id}: sending to {test_data.test_email}")
        success, error_msg = await temail_service.send_email(
            to_email=test_data.test_email,
            subject="【MediCareAI】邮件配置测试 / Email Configuration Test",
            html_content=html_content,
            text_content=text_content,
        )
        logger.info(f"Email send result: success={success}, error={error_msg}")

        if success:
            # 更新配置测试状态
            config.test_status = "success"
            config.test_message = f"测试邮件成功发送到 {test_data.test_email}"
            config.tested_at = datetime.utcnow()
            await db.commit()

            logger.info(
                f"Email config test passed for {config_id} by {current_user.email}"
            )

            response = EmailConfigTestResponse(
                success=True,
                message=f"测试邮件发送成功 / Test email sent successfully to {test_data.test_email}",
            )
            logger.info(f"Returning success response: {response}")
            return response
        else:
            logger.error(f"Email send failed: {error_msg}")
            raise Exception(error_msg or "邮件发送失败")

    except Exception as e:
        # 更新配置测试状态
        config.test_status = "failed"
        config.test_message = f"测试失败: {str(e)}"
        config.tested_at = datetime.utcnow()
        await db.commit()

        logger.error(f"Email config test failed for {config_id}: {e}")

        return EmailConfigTestResponse(
            success=False, message=f"测试失败 / Test failed: {str(e)}"
        )

    finally:
        # 恢复原始配置
        temail_service.smtp_host = original_config["host"]
        temail_service.smtp_port = original_config["port"]
        temail_service.smtp_user = original_config["user"]
        temail_service.smtp_password = original_config["password"]
        temail_service.from_email = original_config["from_email"]
        temail_service.from_name = original_config["from_name"]
        temail_service.use_tls = original_config["use_tls"]
        temail_service.config_source = "none"


@router.post("/configs/{config_id}/set-default", response_model=EmailConfigResponse)
async def set_default_email_config(
    config_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> EmailConfigResponse:
    """
    设置默认邮件配置 | Set default email configuration

    - 仅管理员可访问
    - 会将指定配置设为默认，其他配置取消默认状态
    """
    stmt = select(EmailConfiguration).where(EmailConfiguration.id == config_id)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="配置不存在 / Configuration not found",
        )

    # 取消其他配置的默认状态
    await _clear_default_config(db, exclude_id=config_id)

    # 设置当前配置为默认
    config.is_default = True
    config.is_active = True
    config.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(config)

    logger.info(f"Email config {config_id} set as default by {current_user.email}")

    return EmailConfigResponse.model_validate(config)


@router.get("/status")
async def get_email_service_status(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    获取邮件服务状态 | Get email service status

    - 仅管理员可访问
    - 返回当前邮件服务的配置来源和可用性
    """
    # 加载配置
    await temail_service.load_config_from_db()
    is_available = temail_service.check_availability()

    return {
        "is_available": is_available,
        "config_source": temail_service.config_source,
        "smtp_host": temail_service.smtp_host,
        "smtp_port": temail_service.smtp_port,
        "smtp_user": temail_service.smtp_user,
        "from_email": temail_service.from_email,
        "from_name": temail_service.from_name,
        "use_tls": temail_service.use_tls,
    }


# =============================================================================
# Helper Functions | 辅助函数
# =============================================================================


async def _clear_default_config(db: AsyncSession, exclude_id: Optional[UUID] = None):
    """
    清除默认配置标记 | Clear default configuration flag

    将除指定ID外的所有配置取消默认状态
    """
    stmt = select(EmailConfiguration).where(EmailConfiguration.is_default == True)

    if exclude_id:
        stmt = stmt.where(EmailConfiguration.id != exclude_id)

    result = await db.execute(stmt)
    default_configs = result.scalars().all()

    for config in default_configs:
        config.is_default = False
        config.updated_at = datetime.utcnow()

    await db.commit()
