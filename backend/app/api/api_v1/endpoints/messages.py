"""
Internal Messages API - 站内信API

Provides messaging functionality for doctors to communicate with admins.
医生向管理员发送站内信的功能。
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_, or_, func
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from app.db.database import get_db
from app.core.deps import get_current_active_user
from app.models.models import User, InternalMessage
from app.api.api_v1.endpoints.admin import AdminOperationLogger
from app.services.email_templates import send_maintenance_notification_email
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class SendMessageRequest(BaseModel):
    """Send message request / 发送消息请求"""

    subject: str
    content: str
    recipient_id: Optional[str] = None
    parent_id: Optional[str] = None


class ReplyMessageRequest(BaseModel):
    """Reply message request / 回复消息请求"""

    content: str


# ============== Helper Functions / 辅助函数 ==============


async def check_recipient_is_admin(db: AsyncSession, recipient_id: UUID) -> bool:
    """Check if recipient is an admin / 检查接收者是否是管理员"""
    stmt = select(User).where(and_(User.id == recipient_id, User.role == "admin"))
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None


async def get_default_admin(db: AsyncSession) -> Optional[User]:
    """Get the first admin user / 获取第一个管理员用户"""
    stmt = select(User).where(User.role == "admin").limit(1)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


# ============== Doctor Endpoints / 医生端点 ==============


@router.post("/messages", response_model=Dict[str, Any])
async def send_message(
    message_request: SendMessageRequest,
    http_request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Send a message to admin / 发送消息给管理员

    Doctors can only send messages to admin users.
    If recipient_id is not provided, the message will be sent to the default admin.
    医生只能给管理员发送消息。如果没有指定接收者，消息会发送给默认管理员。
    """
    # Extract data from request
    subject = message_request.subject
    content = message_request.content
    recipient_id = message_request.recipient_id
    parent_id = message_request.parent_id

    # Check if user is a doctor
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can send messages",
        )

    # Validate subject and content
    if not subject or len(subject.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject is required",
        )

    if not content or len(content.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content is required",
        )

    # Determine recipient
    target_recipient_id = None
    if recipient_id:
        try:
            target_recipient_id = UUID(recipient_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid recipient_id format",
            )

    if not target_recipient_id:
        # Get default admin
        default_admin = await get_default_admin(db)
        if not default_admin:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No admin available to receive messages",
            )
        target_recipient_id = default_admin.id
    else:
        # Verify recipient is admin
        is_admin = await check_recipient_is_admin(db, target_recipient_id)
        if not is_admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Messages can only be sent to administrators",
            )

    # Verify parent message if replying
    parent_uuid = None
    if parent_id:
        try:
            parent_uuid = UUID(parent_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid parent_id format",
            )
        parent_stmt = select(InternalMessage).where(InternalMessage.id == parent_uuid)
        parent_result = await db.execute(parent_stmt)
        parent_msg = parent_result.scalar_one_or_none()

        if not parent_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent message not found",
            )

        # Can only reply to messages sent to/from the user
        if (
            parent_msg.recipient_id != current_user.id
            and parent_msg.sender_id != current_user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot reply to this message",
            )

    # Create message
    message = InternalMessage(
        sender_id=current_user.id,
        recipient_id=target_recipient_id,
        subject=subject.strip(),
        content=content.strip(),
        parent_id=parent_uuid,
    )

    db.add(message)
    await db.commit()
    await db.refresh(message)

    # Log operation
    try:
        admin_logger = AdminOperationLogger(db)
        await admin_logger.log_operation(
            admin_id=current_user.id,
            operation_type="data_export",
            operation_details={
                "action": "send_internal_message",
                "recipient_id": str(target_recipient_id),
                "subject": subject,
            },
            ip_address=http_request.client.host if http_request else None,
        )
    except Exception as log_error:
        logger.warning(f"Failed to log message operation: {log_error}")

    logger.info(f"Doctor {current_user.id} sent message to admin {target_recipient_id}")

    return {
        "message": "Message sent successfully",
        "message_id": str(message.id),
        "recipient_id": str(target_recipient_id),
        "created_at": message.created_at.isoformat(),
    }


@router.get("/messages/sent", response_model=Dict[str, Any])
async def get_sent_messages(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get sent messages / 获取已发送的消息

    Returns list of messages sent by the current doctor.
    """
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can view sent messages",
        )

    offset = (page - 1) * page_size

    # Get total count
    count_stmt = select(InternalMessage).where(
        InternalMessage.sender_id == current_user.id
    )
    count_result = await db.execute(
        select(InternalMessage.id).where(InternalMessage.sender_id == current_user.id)
    )
    total = len(count_result.all())

    # Get messages
    stmt = (
        select(InternalMessage)
        .where(InternalMessage.sender_id == current_user.id)
        .order_by(desc(InternalMessage.created_at))
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()

    # Get recipient info for each message
    messages_list = []
    for msg in messages:
        recipient_stmt = select(User).where(User.id == msg.recipient_id)
        recipient_result = await db.execute(recipient_stmt)
        recipient = recipient_result.scalar_one_or_none()

        # Check if message has replies
        reply_stmt = (
            select(func.count())
            .select_from(InternalMessage)
            .where(InternalMessage.parent_id == msg.id)
        )
        reply_result = await db.execute(reply_stmt)
        has_reply = reply_result.scalar() > 0

        messages_list.append(
            {
                "id": str(msg.id),
                "subject": msg.subject,
                "content": msg.content[:200] + "..."
                if len(msg.content) > 200
                else msg.content,
                "recipient": {
                    "id": str(recipient.id) if recipient else None,
                    "full_name": recipient.full_name if recipient else "Unknown",
                },
                "is_read": msg.is_read,
                "created_at": msg.created_at.isoformat() if msg.created_at else None,
                "has_reply": has_reply,
            }
        )

    return {
        "messages": messages_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/messages/{message_id}", response_model=Dict[str, Any])
async def get_message_detail(
    message_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get message detail / 获取消息详情

    Doctors can only view messages they sent or received.
    """
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can view message details",
        )

    stmt = (
        select(InternalMessage)
        .where(
            and_(
                InternalMessage.id == message_id,
                or_(
                    InternalMessage.sender_id == current_user.id,
                    InternalMessage.recipient_id == current_user.id,
                ),
            )
        )
        .options(
            selectinload(InternalMessage.sender),
            selectinload(InternalMessage.recipient),
            selectinload(InternalMessage.replies),
        )
    )
    result = await db.execute(stmt)
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    # Mark as read if recipient is viewing
    if message.recipient_id == current_user.id and not message.is_read:
        message.is_read = True
        message.read_at = datetime.utcnow()
        await db.commit()

    return {
        "id": str(message.id),
        "subject": message.subject,
        "content": message.content,
        "sender": {
            "id": str(message.sender.id) if message.sender else None,
            "full_name": message.sender.full_name if message.sender else "Unknown",
            "role": message.sender.role if message.sender else None,
        },
        "recipient": {
            "id": str(message.recipient.id) if message.recipient else None,
            "full_name": message.recipient.full_name
            if message.recipient
            else "Unknown",
        },
        "is_read": message.is_read,
        "read_at": message.read_at.isoformat() if message.read_at else None,
        "parent_id": str(message.parent_id) if message.parent_id else None,
        "replies": [
            {
                "id": str(reply.id),
                "subject": reply.subject,
                "content": reply.content[:100] + "..."
                if len(reply.content) > 100
                else reply.content,
                "created_at": reply.created_at.isoformat(),
            }
            for reply in (message.replies or [])
        ],
        "created_at": message.created_at.isoformat(),
        "updated_at": message.updated_at.isoformat(),
    }


@router.delete("/messages/{message_id}", response_model=Dict[str, Any])
async def delete_message(
    message_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete a sent message / 删除已发送的消息

    Doctors can only delete messages they sent.
    """
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can delete messages",
        )

    stmt = select(InternalMessage).where(
        and_(
            InternalMessage.id == message_id,
            InternalMessage.sender_id == current_user.id,
        )
    )
    result = await db.execute(stmt)
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found or you don't have permission to delete it",
        )

    await db.delete(message)
    await db.commit()

    logger.info(f"Doctor {current_user.id} deleted message {message_id}")

    return {"message": "Message deleted successfully"}


# ============== Admin Endpoints / 管理员端点 ==============


@router.get("/admin/messages", response_model=Dict[str, Any])
async def get_admin_messages(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_read: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get messages received by admin / 获取管理员收到的消息

    Only accessible by admin users.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint",
        )

    offset = (page - 1) * page_size

    # Build query
    base_query = select(InternalMessage).where(
        InternalMessage.recipient_id == current_user.id
    )

    if is_read is not None:
        base_query = base_query.where(InternalMessage.is_read == is_read)

    # Get total count
    count_result = await db.execute(base_query)
    total = len(count_result.all())

    # Get messages
    stmt = (
        base_query.order_by(desc(InternalMessage.created_at))
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()

    # Get sender info for each message
    messages_list = []
    for msg in messages:
        sender_stmt = select(User).where(User.id == msg.sender_id)
        sender_result = await db.execute(sender_stmt)
        sender = sender_result.scalar_one_or_none()

        messages_list.append(
            {
                "id": str(msg.id),
                "subject": msg.subject,
                "content": msg.content[:200] + "..."
                if len(msg.content) > 200
                else msg.content,
                "sender": {
                    "id": str(sender.id) if sender else None,
                    "full_name": sender.full_name if sender else "Unknown",
                    "email": sender.email if sender else None,
                },
                "is_read": msg.is_read,
                "read_at": msg.read_at.isoformat() if msg.read_at else None,
                "created_at": msg.created_at.isoformat(),
            }
        )

    # Get unread count
    unread_stmt = select(InternalMessage).where(
        and_(
            InternalMessage.recipient_id == current_user.id,
            InternalMessage.is_read == False,
        )
    )
    unread_result = await db.execute(unread_stmt)
    unread_count = len(unread_result.all())

    return {
        "messages": messages_list,
        "total": total,
        "unread_count": unread_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/admin/messages/{message_id}", response_model=Dict[str, Any])
async def get_admin_message_detail(
    message_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get admin message detail / 获取管理员消息详情

    Only accessible by admin users.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint",
        )

    try:
        # First, get the message with a fresh session approach
        stmt = select(InternalMessage).where(
            and_(
                InternalMessage.id == message_id,
                InternalMessage.recipient_id == current_user.id,
            )
        )
        result = await db.execute(stmt)
        message = result.scalar_one_or_none()

        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found",
            )

        # Extract data from message object immediately to avoid lazy loading issues
        message_id_str = str(message.id)
        message_subject = message.subject
        message_content = message.content
        message_is_read = message.is_read
        message_sender_id = message.sender_id
        message_created_at = message.created_at
        message_updated_at = message.updated_at
        message_read_at = message.read_at

        # Load sender separately
        sender = None
        if message_sender_id:
            sender_stmt = select(User).where(User.id == message_sender_id)
            sender_result = await db.execute(sender_stmt)
            sender = sender_result.scalar_one_or_none()

        # Extract sender data immediately
        sender_data = {
            "id": str(sender.id) if sender else None,
            "full_name": sender.full_name if sender else "Unknown",
            "email": sender.email if sender else None,
            "role": sender.role if sender else None,
        }

        # Load replies separately
        replies_stmt = (
            select(InternalMessage)
            .where(InternalMessage.parent_id == message_id)
            .order_by(InternalMessage.created_at)
        )
        replies_result = await db.execute(replies_stmt)
        replies = replies_result.scalars().all()

        # Extract replies data immediately
        replies_data = [
            {
                "id": str(reply.id),
                "subject": reply.subject,
                "content": reply.content,
                "created_at": reply.created_at.isoformat()
                if reply.created_at
                else None,
            }
            for reply in replies
        ]

        # Mark as read if not already (use a separate transaction)
        if not message_is_read:
            update_stmt = select(InternalMessage).where(
                and_(
                    InternalMessage.id == message_id,
                    InternalMessage.recipient_id == current_user.id,
                )
            )
            update_result = await db.execute(update_stmt)
            msg_to_update = update_result.scalar_one_or_none()
            if msg_to_update:
                msg_to_update.is_read = True
                msg_to_update.read_at = datetime.utcnow()
                await db.commit()
                message_is_read = True
                message_read_at = msg_to_update.read_at

        return {
            "id": message_id_str,
            "subject": message_subject,
            "content": message_content,
            "sender": sender_data,
            "is_read": message_is_read,
            "read_at": message_read_at.isoformat() if message_read_at else None,
            "replies": replies_data,
            "created_at": message_created_at.isoformat()
            if message_created_at
            else None,
            "updated_at": message_updated_at.isoformat()
            if message_updated_at
            else None,
        }
    except Exception as e:
        logger.error(f"Error fetching message detail: {str(e)}")
        # Rollback any pending transaction
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch message: {str(e)}",
        )


@router.post("/admin/messages/{message_id}/reply", response_model=Dict[str, Any])
async def reply_to_message(
    message_id: UUID,
    reply_request: ReplyMessageRequest,
    http_request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Reply to a message / 回复消息

    Admins can reply to messages sent by doctors.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can reply to messages",
        )

    content = reply_request.content.strip()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reply content is required",
        )

    # Get original message
    stmt = select(InternalMessage).where(
        and_(
            InternalMessage.id == message_id,
            InternalMessage.recipient_id == current_user.id,
        )
    )
    result = await db.execute(stmt)
    original_msg = result.scalar_one_or_none()

    if not original_msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    # Create reply
    reply = InternalMessage(
        sender_id=current_user.id,
        recipient_id=original_msg.sender_id,
        subject=f"Re: {original_msg.subject}",
        content=content,
        parent_id=message_id,
    )

    db.add(reply)
    await db.commit()
    await db.refresh(reply)

    # Log operation
    try:
        admin_logger = AdminOperationLogger(db)
        await admin_logger.log_operation(
            admin_id=current_user.id,
            operation_type="data_export",
            operation_details={
                "action": "reply_internal_message",
                "original_message_id": str(message_id),
                "recipient_id": str(original_msg.sender_id),
            },
            ip_address=http_request.client.host if http_request else None,
        )
    except Exception as log_error:
        logger.warning(f"Failed to log reply operation: {log_error}")

    logger.info(f"Admin {current_user.id} replied to message {message_id}")

    return {
        "message": "Reply sent successfully",
        "reply_id": str(reply.id),
        "recipient_id": str(original_msg.sender_id),
        "created_at": reply.created_at.isoformat(),
    }


@router.put("/admin/messages/{message_id}/read", response_model=Dict[str, Any])
async def mark_message_as_read(
    message_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Mark message as read / 标记消息为已读

    Only accessible by admin users.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint",
        )

    stmt = select(InternalMessage).where(
        and_(
            InternalMessage.id == message_id,
            InternalMessage.recipient_id == current_user.id,
        )
    )
    result = await db.execute(stmt)
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    if not message.is_read:
        message.is_read = True
        message.read_at = datetime.utcnow()
        await db.commit()

    return {"message": "Message marked as read", "read_at": message.read_at.isoformat()}


# ============== Maintenance Notification Endpoints / 维护通知端点 ==============


class MaintenanceNotificationRequest(BaseModel):
    """Maintenance notification request / 维护通知请求"""

    maintenance_time: str
    maintenance_content: Optional[str] = None


@router.post("/admin/maintenance-notification", response_model=Dict[str, Any])
async def send_maintenance_notification(
    notification_request: MaintenanceNotificationRequest,
    http_request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Send maintenance notification to all users / 发送维护通知给所有用户

    Admins can send maintenance notification emails to all registered patients and doctors.
    管理员可以向所有注册的患者和医生发送系统维护通知邮件。
    """
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can send maintenance notifications",
        )

    # Validate maintenance_time
    if (
        not notification_request.maintenance_time
        or len(notification_request.maintenance_time.strip()) == 0
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maintenance time is required",
        )

    maintenance_time = notification_request.maintenance_time.strip()
    maintenance_content = (
        notification_request.maintenance_content.strip()
        if notification_request.maintenance_content
        else None
    )

    # Get all patients and doctors (exclude admins)
    stmt = select(User).where(or_(User.role == "patient", User.role == "doctor"))
    result = await db.execute(stmt)
    users = result.scalars().all()

    if not users:
        return {
            "message": "No users found to notify",
            "total_users": 0,
            "success_count": 0,
            "failed_count": 0,
        }

    # Send emails to all users
    success_count = 0
    failed_count = 0
    failed_emails = []

    for user in users:
        try:
            email_sent = await send_maintenance_notification_email(
                to_email=user.email,
                user_name=user.full_name,
                maintenance_time=maintenance_time,
                maintenance_content=maintenance_content or "",
            )
            if email_sent:
                success_count += 1
            else:
                failed_count += 1
                failed_emails.append(user.email)
        except Exception as e:
            logger.error(
                f"Failed to send maintenance notification to {user.email}: {e}"
            )
            failed_count += 1
            failed_emails.append(user.email)

    # Log operation
    try:
        admin_logger = AdminOperationLogger(db)
        await admin_logger.log_operation(
            admin_id=current_user.id,
            operation_type="data_export",
            operation_details={
                "action": "send_maintenance_notification",
                "maintenance_time": maintenance_time,
                "maintenance_content": maintenance_content,
                "total_users": len(users),
                "success_count": success_count,
                "failed_count": failed_count,
                "failed_emails": failed_emails,
            },
            ip_address=http_request.client.host if http_request else None,
        )
    except Exception as log_error:
        logger.warning(f"Failed to log maintenance notification operation: {log_error}")

    logger.info(
        f"Admin {current_user.id} sent maintenance notification to {len(users)} users. "
        f"Success: {success_count}, Failed: {failed_count}"
    )

    return {
        "message": "Maintenance notification sent successfully",
        "total_users": len(users),
        "success_count": success_count,
        "failed_count": failed_count,
        "failed_emails": failed_emails if failed_emails else None,
    }
