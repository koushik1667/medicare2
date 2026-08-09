"""
I18n / Internationalization utilities
简单的国际化工具
"""

from typing import Dict, Optional
from fastapi import Request

# 错误消息字典
ERROR_MESSAGES: Dict[str, Dict[str, str]] = {
    "doctor_verification_pending": {
        "zh": "访问被拒绝。医生认证正在审核中，请等待管理员批准。",
        "en": "Access denied. Doctor verification pending. Please wait for admin approval.",
    },
    "platform_access_denied": {
        "zh": "访问被拒绝。{role}账户只能通过{platforms}平台登录。",
        "en": "Access denied. {role} accounts can only login through {platforms} platform(s).",
    },
    "invalid_credentials": {
        "zh": "邮箱或密码错误",
        "en": "Invalid email or password",
    },
    "user_inactive": {
        "zh": "用户账户已被禁用",
        "en": "User account has been disabled",
    },
}


def get_locale_from_request(request: Optional[Request] = None) -> str:
    """
    从请求头中获取语言偏好
    Get locale from request Accept-Language header

    Returns:
        'zh' for Chinese, 'en' for English (default)
    """
    if request is None:
        return "en"

    # 获取 Accept-Language header
    accept_language = request.headers.get("accept-language", "")

    # 解析语言偏好
    if accept_language:
        # 简单的解析：检查是否包含中文语言代码
        languages = [lang.strip().lower() for lang in accept_language.split(",")]
        for lang in languages:
            # 提取语言代码（去掉权重）
            lang_code = lang.split(";")[0].strip()
            if lang_code.startswith("zh"):
                return "zh"

    return "en"


def get_message(key: str, request: Optional[Request] = None, **kwargs) -> str:
    """
    获取国际化错误消息
    Get internationalized error message

    Args:
        key: 消息键
        request: FastAPI请求对象，用于获取语言偏好
        **kwargs: 用于格式化消息的参数

    Returns:
        对应语言的错误消息
    """
    locale = get_locale_from_request(request)

    # 获取消息字典
    message_dict = ERROR_MESSAGES.get(key, {})

    # 获取对应语言的消息，如果没有则使用英语
    message = message_dict.get(locale, message_dict.get("en", key))

    # 格式化消息
    if kwargs:
        try:
            message = message.format(**kwargs)
        except KeyError:
            pass

    return message


def get_message_with_locale(key: str, locale: str = "en", **kwargs) -> str:
    """
    使用指定语言代码获取消息
    Get message with specified locale

    Args:
        key: 消息键
        locale: 语言代码 ('zh' 或 'en')
        **kwargs: 用于格式化消息的参数

    Returns:
        对应语言的错误消息
    """
    # 简化语言代码
    if locale.startswith("zh"):
        locale = "zh"
    else:
        locale = "en"

    # 获取消息字典
    message_dict = ERROR_MESSAGES.get(key, {})

    # 获取对应语言的消息，如果没有则使用英语
    message = message_dict.get(locale, message_dict.get("en", key))

    # 格式化消息
    if kwargs:
        try:
            message = message.format(**kwargs)
        except KeyError:
            pass

    return message
