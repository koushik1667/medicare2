"""
Email Templates | 邮件模板

提供各类邮件的HTML和文本模板
"""

from string import Template
import logging

from app.services.email_service import temail_service

logger = logging.getLogger(__name__)

from string import Template

# =============================================================================
# 患者注册验证邮件 | Patient Registration Verification Email
# =============================================================================

PATIENT_REGISTRATION_EMAIL_SUBJECT = "【MediCareAI】欢迎注册 - 请验证您的邮箱"

PATIENT_REGISTRATION_EMAIL_HTML = Template("""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>邮箱验证 - MediCareAI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333; 
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #ffffff;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header p { font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .welcome { font-size: 20px; color: #333; margin-bottom: 20px; }
        .message { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px;
            border-left: 4px solid #667eea;
        }
        .button-container { text-align: center; margin: 30px 0; }
        .button {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .info-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .info-box p { margin: 5px 0; font-size: 14px; }
        .link-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            word-break: break-all;
            font-family: monospace;
            font-size: 13px;
            color: #666;
            margin: 20px 0;
        }
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #666;
            font-size: 13px;
        }
        .footer p { margin: 5px 0; }
        .divider { 
            height: 1px; 
            background: linear-gradient(90deg, transparent, #ddd, transparent);
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 欢迎加入 MediCareAI</h1>
            <p>智能疾病管理系统</p>
        </div>
        
        <div class="content">
            <h2 class="welcome">您好，$user_name！</h2>
            
            <div class="message">
                <p>感谢您注册 <strong>MediCareAI</strong>，您的智能健康助手！</p>
                <p style="margin-top: 15px;">为了确保您的账户安全，我们需要验证您的邮箱地址。请点击下方按钮完成验证：</p>
            </div>
            
            <div class="button-container">
                <a href="$verification_url" class="button">验证邮箱地址</a>
            </div>
            
            <div class="info-box">
                <p><strong>⏰ 重要提示：</strong></p>
                <p>此验证链接将在 <strong>24小时</strong> 后失效，请尽快完成验证。</p>
            </div>
            
            <p style="color: #666; font-size: 14px;">如果按钮无法点击，请复制以下链接到浏览器地址栏：</p>
            <div class="link-box">$verification_url</div>
            
            <div class="divider"></div>
            
            <div style="color: #666; font-size: 14px; line-height: 1.8;">
                <p><strong>您可以使用 MediCareAI 进行：</strong></p>
                <ul style="margin: 10px 0 10px 20px;">
                    <li>AI智能症状分析与健康评估</li>
                    <li>个人健康档案管理</li>
                    <li>诊疗记录追踪</li>
                    <li>与医生在线咨询</li>
                </ul>
            </div>
            
            <div class="info-box" style="background: #e8f4f8; border-color: #bee5eb;">
                <p><strong>📧 没有收到邮件？</strong></p>
                <p>请检查您的垃圾邮件文件夹，或尝试重新发送验证邮件。</p>
                <p>如非本人操作，请忽略此邮件。</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>MediCareAI 智能疾病管理系统</strong></p>
            <p>本邮件由系统自动发送，请勿直接回复</p>
            <p style="margin-top: 10px; color: #999;">© 2024 MediCareAI. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
""")

PATIENT_REGISTRATION_EMAIL_TEXT = Template("""
欢迎加入 MediCareAI 智能疾病管理系统！

您好，$user_name！

感谢您注册 MediCareAI。为了确保您的账户安全，请验证您的邮箱地址：

$verification_url

此链接将在24小时后失效。

您可以使用 MediCareAI 进行：
- AI智能症状分析与健康评估
- 个人健康档案管理
- 诊疗记录追踪
- 与医生在线咨询

如非本人操作，请忽略此邮件。

MediCareAI 智能疾病管理系统
""")


async def send_patient_registration_email(
    to_email: str, user_name: str, verification_url: str
) -> bool:

    html_content = PATIENT_REGISTRATION_EMAIL_HTML.substitute(
        user_name=user_name, verification_url=verification_url
    )

    text_content = PATIENT_REGISTRATION_EMAIL_TEXT.substitute(
        user_name=user_name, verification_url=verification_url
    )

    success, _ = await temail_service.send_email(
        to_email=to_email,
        subject=PATIENT_REGISTRATION_EMAIL_SUBJECT,
        html_content=html_content,
        text_content=text_content,
    )
    return success


# =============================================================================
# 医生注册待审核通知邮件 | Doctor Registration Pending Email
# =============================================================================

DOCTOR_REGISTRATION_PENDING_SUBJECT = "【MediCareAI】医生注册申请已提交 - 等待审核"

DOCTOR_REGISTRATION_PENDING_HTML = Template("""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>医生注册申请 - MediCareAI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333; 
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #ffffff;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header p { font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .welcome { font-size: 20px; color: #333; margin-bottom: 20px; }
        .message { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px;
            border-left: 4px solid #667eea;
        }
        .info-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .info-box p { margin: 5px 0; font-size: 14px; }
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #666;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👨‍⚕️ 医生注册申请</h1>
            <p>MediCareAI 智能疾病管理系统</p>
        </div>
        
        <div class="content">
            <h2 class="welcome">您好，$doctor_name！</h2>
            
            <div class="message">
                <p>感谢您注册 <strong>MediCareAI</strong> 医生平台！</p>
                <p style="margin-top: 15px;">您的医生账户注册申请已成功提交，我们的管理员将在 <strong>1-2个工作日</strong> 内完成审核。</p>
            </div>
            
            <div class="info-box">
                <p><strong>⏰ 审核说明：</strong></p>
                <p>• 审核时间：1-2个工作日</p>
                <p>• 审核结果将通过邮件通知您</p>
                <p>• 审核通过后您即可登录系统</p>
            </div>
            
            <div style="color: #666; font-size: 14px; line-height: 1.8;">
                <p>如有任何疑问，请联系我们的客服团队。</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>MediCareAI 智能疾病管理系统</strong></p>
            <p>本邮件由系统自动发送，请勿直接回复</p>
        </div>
    </div>
</body>
</html>
""")

DOCTOR_REGISTRATION_PENDING_TEXT = Template("""
医生注册申请 - MediCareAI

您好，$doctor_name！

感谢您注册 MediCareAI 医生平台！

您的医生账户注册申请已成功提交，我们的管理员将在 1-2个工作日 内完成审核。

审核说明：
• 审核时间：1-2个工作日
• 审核结果将通过邮件通知您
• 审核通过后您即可登录系统

如有任何疑问，请联系我们的客服团队。

MediCareAI 智能疾病管理系统
""")


async def send_doctor_pending_email(to_email: str, doctor_name: str) -> bool:

    html_content = DOCTOR_REGISTRATION_PENDING_HTML.substitute(doctor_name=doctor_name)
    text_content = DOCTOR_REGISTRATION_PENDING_TEXT.substitute(doctor_name=doctor_name)

    success, _ = await temail_service.send_email(
        to_email=to_email,
        subject=DOCTOR_REGISTRATION_PENDING_SUBJECT,
        html_content=html_content,
        text_content=text_content,
    )
    return success
    return success


# =============================================================================
# 医生审核拒绝通知邮件 | Doctor Rejection Email
# =============================================================================

DOCTOR_REJECTION_SUBJECT = (
    "【MediCareAI】医生注册审核未通过 - Doctor Registration Rejected"
)

DOCTOR_REJECTION_HTML = Template("""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>医生注册审核通知 - MediCareAI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333;
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
            color: white; 
            padding: 30px; 
            text-align: center;
        }
        .header h1 { font-size: 24px; margin-bottom: 10px; }
        .content { padding: 30px; }
        .welcome {
            color: #333;
            font-size: 20px;
            margin-bottom: 20px;
        }
        .alert {
            background: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .alert strong { color: #721c24; }
        .reason {
            background: #f8f9fa;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            border-left: 4px solid #ffc107;
        }
        .reason-label {
            font-weight: bold;
            color: #856404;
            margin-bottom: 5px;
        }
        .info-box {
            background: #e8f4f8;
            border: 1px solid #bee5eb;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .info-box p { margin: 5px 0; font-size: 14px; }
        .footer { 
            background: #f8f9fa;
            padding: 20px; 
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 医生注册审核通知</h1>
            <p>Doctor Registration Review</p>
        </div>
        
        <div class="content">
            <h2 class="welcome">您好，$doctor_name</h2>
            
            <div class="alert">
                <strong>很抱歉，您的医生注册申请未通过审核。</strong>
            </div>
            
            <div class="reason">
                <div class="reason-label">审核意见 / Rejection Reason：</div>
                <div>$rejection_reason</div>
            </div>
            
            <div class="info-box">
                <p><strong>您可以：</strong></p>
                <p>• 根据审核意见修改资料后重新注册</p>
                <p>• 使用原有的邮箱地址和执业证书号重新提交申请</p>
                <p>• 如有疑问，请联系管理员了解详情</p>
            </div>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
                感谢您关注 MediCareAI 平台，期待您再次申请。
            </p>
        </div>
        
        <div class="footer">
            <p><strong>MediCareAI 智能疾病管理系统</strong></p>
            <p>本邮件由系统自动发送，请勿直接回复</p>
        </div>
    </div>
</body>
</html>""")

DOCTOR_REJECTION_TEXT = Template("""医生注册审核通知 - MediCareAI

您好，$doctor_name

很抱歉，您的医生注册申请未通过审核。

审核意见 / Rejection Reason：
$rejection_reason

您可以：
• 根据审核意见修改资料后重新注册
• 使用原有的邮箱地址和执业证书号重新提交申请
• 如有疑问，请联系管理员了解详情

感谢您关注 MediCareAI 平台，期待您再次申请。

MediCareAI 智能疾病管理系统
本邮件由系统自动发送，请勿直接回复""")


async def send_doctor_rejection_email(
    to_email: str, doctor_name: str, rejection_reason: str
) -> bool:

    html_content = DOCTOR_REJECTION_HTML.substitute(
        doctor_name=doctor_name, rejection_reason=rejection_reason or "未提供具体原因"
    )
    text_content = DOCTOR_REJECTION_TEXT.substitute(
        doctor_name=doctor_name, rejection_reason=rejection_reason or "未提供具体原因"
    )

    logger.info(f"正在发送医生审核拒绝邮件到 {to_email}")
    success, error_msg = await temail_service.send_email(
        to_email=to_email,
        subject=DOCTOR_REJECTION_SUBJECT,
        html_content=html_content,
        text_content=text_content,
    )

    if not success:
        logger.error(f"医生审核拒绝邮件发送失败: {error_msg}")

    return success


# =============================================================================
# 医生审核通过通知邮件 | Doctor Approval Email
# =============================================================================

DOCTOR_APPROVAL_SUBJECT = "【MediCareAI】医生注册审核通过 - 欢迎加入"

DOCTOR_APPROVAL_HTML = Template("""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>审核通过 - MediCareAI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333; 
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #ffffff;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header p { font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .welcome { font-size: 20px; color: #333; margin-bottom: 20px; }
        .message { 
            background: #d4edda; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px;
            border-left: 4px solid #28a745;
        }
        .button-container { text-align: center; margin: 30px 0; }
        .button {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
        }
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #666;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 审核通过</h1>
            <p>MediCareAI 智能疾病管理系统</p>
        </div>
        
        <div class="content">
            <h2 class="welcome">恭喜您，$doctor_name！</h2>
            
            <div class="message">
                <p><strong>您的医生账户已通过审核！</strong></p>
                <p style="margin-top: 15px;">欢迎加入 MediCareAI 医生平台，您现在可以使用医生账户登录系统，为患者提供专业的医疗服务。</p>
            </div>
            
            <div class="button-container">
                <a href="$login_url" class="button">立即登录</a>
            </div>
            
            <div style="color: #666; font-size: 14px; line-height: 1.8;">
                <p><strong>您可以在平台上：</strong></p>
                <ul style="margin: 10px 0 10px 20px;">
                    <li>管理患者档案和诊疗记录</li>
                    <li>查看AI辅助诊断建议</li>
                    <li>与患者在线沟通</li>
                    <li>管理个人医生资料</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>MediCareAI 智能疾病管理系统</strong></p>
            <p>本邮件由系统自动发送，请勿直接回复</p>
        </div>
    </div>
</body>
</html>
""")

DOCTOR_APPROVAL_TEXT = Template("""
审核通过 - MediCareAI

恭喜您，$doctor_name！

您的医生账户已通过审核！

欢迎加入 MediCareAI 医生平台，您现在可以使用医生账户登录系统，为患者提供专业的医疗服务。

点击以下链接登录：
$login_url

您可以在平台上：
• 管理患者档案和诊疗记录
• 查看AI辅助诊断建议
• 与患者在线沟通
• 管理个人医生资料

MediCareAI 智能疾病管理系统
""")


async def send_doctor_approval_email(
    to_email: str, doctor_name: str, login_url: str
) -> bool:

    html_content = DOCTOR_APPROVAL_HTML.substitute(
        doctor_name=doctor_name, login_url=login_url
    )
    text_content = DOCTOR_APPROVAL_TEXT.substitute(
        doctor_name=doctor_name, login_url=login_url
    )

    logger.info(f"正在发送医生审核通过邮件到 {to_email}")
    success, error_msg = await temail_service.send_email(
        to_email=to_email,
        subject=DOCTOR_APPROVAL_SUBJECT,
        html_content=html_content,
        text_content=text_content,
    )

    if not success:
        logger.error(f"医生审核通过邮件发送失败: {error_msg}")


# =============================================================================
# 医生认证撤销通知邮件 | Doctor Revocation Email
# =============================================================================

DOCTOR_REVOCATION_SUBJECT = (
    "【MediCareAI】医生认证已被撤销 - Doctor Certification Revoked"
)

DOCTOR_REVOCATION_HTML = Template("""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>医生认证撤销通知 - MediCareAI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333;
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
            color: white; 
            padding: 30px; 
            text-align: center;
        }
        .header h1 { font-size: 24px; margin-bottom: 10px; }
        .content { padding: 30px; }
        .alert {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .alert strong { color: #856404; }
        .reason {
            background: #f8f9fa;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            border-left: 4px solid #dc3545;
        }
        .reason-label {
            font-weight: bold;
            color: #dc3545;
            margin-bottom: 5px;
        }
        .footer { 
            background: #f8f9fa;
            padding: 20px; 
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ 医生认证撤销通知</h1>
            <p>Doctor Certification Revoked</p>
        </div>
        
        <div class="content">
            <p>尊敬的 <strong>$doctor_name</strong>，您好！</p>
            
            <div class="alert">
                <strong>重要通知：</strong>您的医生认证已被管理员撤销。
            </div>
            
            <p>撤销后您将无法：</p>
            <ul style="margin: 15px 0 15px 20px; color: #666;">
                <li>登录医生平台</li>
                <li>查看患者病例</li>
                <li>添加专业评论</li>
            </ul>
            
            <div class="reason">
                <div class="reason-label">撤销原因：</div>
                <div>$reason</div>
            </div>
            
            <p style="margin-top: 20px; color: #666;">
                如果您对此有疑问，请联系管理员了解详情。
            </p>
        </div>
        
        <div class="footer">
            <p><strong>MediCareAI 智能疾病管理系统</strong></p>
            <p>本邮件由系统自动发送，请勿直接回复</p>
        </div>
    </div>
</body>
</html>""")

DOCTOR_REVOCATION_TEXT = Template("""医生认证撤销通知 - MediCareAI

尊敬的 $doctor_name，您好！

【重要通知】您的医生认证已被管理员撤销。

撤销后您将无法：
- 登录医生平台
- 查看患者病例  
- 添加专业评论

撤销原因：
$reason

如果您对此有疑问，请联系管理员了解详情。

MediCareAI 智能疾病管理系统
本邮件由系统自动发送，请勿直接回复
""")


# =============================================================================
# 医生认证恢复通知邮件 | Doctor Re-approval Email
# =============================================================================

DOCTOR_REAPPROVAL_SUBJECT = (
    "【MediCareAI】医生认证已恢复 - Doctor Certification Restored"
)

DOCTOR_REAPPROVAL_HTML = Template("""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>医生认证恢复通知 - MediCareAI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333;
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px; 
            text-align: center;
        }
        .header h1 { font-size: 24px; margin-bottom: 10px; }
        .content { padding: 30px; }
        .welcome {
            color: #667eea;
            font-size: 20px;
            margin-bottom: 20px;
        }
        .message {
            background: #e8f5e9;
            border-left: 4px solid #4caf50;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .message strong { color: #2e7d32; }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
        }
        .notes {
            background: #f8f9fa;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            border-left: 4px solid #667eea;
        }
        .notes-label {
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        .footer { 
            background: #f8f9fa;
            padding: 20px; 
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 医生认证已恢复</h1>
            <p>Doctor Certification Restored</p>
        </div>
        
        <div class="content">
            <h2 class="welcome">欢迎回来，$doctor_name！</h2>
            
            <div class="message">
                <strong>好消息：</strong>您的医生认证已被管理员恢复，您现在可以重新使用医生平台的所有功能。
            </div>
            
            <p>您现在可以：</p>
            <ul style="margin: 15px 0 15px 20px; color: #666;">
                <li>登录医生平台</li>
                <li>查看和管理患者病例</li>
                <li>添加专业评论和建议</li>
                <li>与患者在线沟通</li>
            </ul>
            
            <div class="button-container">
                <a href="$login_url" class="button">立即登录平台</a>
            </div>
            
            $notes_section
            
            <p style="margin-top: 20px; color: #666;">
                感谢您继续为 MediCareAI 平台贡献力量！
            </p>
        </div>
        
        <div class="footer">
            <p><strong>MediCareAI 智能疾病管理系统</strong></p>
            <p>本邮件由系统自动发送，请勿直接回复</p>
        </div>
    </div>
</body>
</html>""")

DOCTOR_REAPPROVAL_TEXT = Template("""医生认证恢复通知 - MediCareAI

欢迎回来，$doctor_name！

【好消息】您的医生认证已被管理员恢复，您现在可以重新使用医生平台的所有功能。

您现在可以：
- 登录医生平台
- 查看和管理患者病例
- 添加专业评论和建议
- 与患者在线沟通

点击以下链接登录平台：
$login_url

$notes_text

感谢您继续为 MediCareAI 平台贡献力量！

MediCareAI 智能疾病管理系统
本邮件由系统自动发送，请勿直接回复
""")


async def send_doctor_revocation_email(
    to_email: str, doctor_name: str, reason: str
) -> bool:

    html_content = DOCTOR_REVOCATION_HTML.substitute(
        doctor_name=doctor_name, reason=reason or "未提供具体原因"
    )
    text_content = DOCTOR_REVOCATION_TEXT.substitute(
        doctor_name=doctor_name, reason=reason or "未提供具体原因"
    )

    logger.info(f"正在发送医生认证撤销邮件到 {to_email}")
    success, error_msg = await temail_service.send_email(
        to_email=to_email,
        subject=DOCTOR_REVOCATION_SUBJECT,
        html_content=html_content,
        text_content=text_content,
    )

    if not success:
        logger.error(f"医生认证撤销邮件发送失败: {error_msg}")

    return success


async def send_doctor_reapproval_email(
    to_email: str, doctor_name: str, login_url: str, notes: str = None
) -> bool:

    # 处理备注信息显示
    if notes:
        notes_section = f'<div class="notes"><div class="notes-label">管理员备注：</div><div>{notes}</div></div>'
        notes_text = f"管理员备注：\n{notes}"
    else:
        notes_section = ""
        notes_text = ""

    html_content = DOCTOR_REAPPROVAL_HTML.substitute(
        doctor_name=doctor_name, login_url=login_url, notes_section=notes_section
    )
    text_content = DOCTOR_REAPPROVAL_TEXT.substitute(
        doctor_name=doctor_name, login_url=login_url, notes_text=notes_text
    )

    logger.info(f"正在发送医生认证恢复邮件到 {to_email}")
    success, error_msg = await temail_service.send_email(
        to_email=to_email,
        subject=DOCTOR_REAPPROVAL_SUBJECT,
        html_content=html_content,
        text_content=text_content,
    )

    if not success:
        logger.error(f"医生认证恢复邮件发送失败: {error_msg}")

    return success


# =============================================================================
# 系统维护通知邮件 | System Maintenance Notification Email
# =============================================================================

MAINTENANCE_NOTIFICATION_SUBJECT = "【MediCareAI】系统维护通知"

MAINTENANCE_NOTIFICATION_HTML = Template("""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>系统维护通知 - MediCareAI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header p { font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .welcome { font-size: 20px; color: #333; margin-bottom: 20px; }
        .message {
            background: #fff3cd;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #ffc107;
        }
        .message strong { color: #856404; }
        .info-box {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .info-box p { margin: 8px 0; font-size: 14px; }
        .info-label {
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #ddd, transparent);
            margin: 30px 0;
        }
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #666;
            font-size: 13px;
        }
        .footer p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 系统维护通知</h1>
            <p>MediCareAI 智能疾病管理系统</p>
        </div>

        <div class="content">
            <h2 class="welcome">您好，$user_name！</h2>

            <div class="message">
                <p><strong>我们即将进行系统维护，届时服务可能暂时不可用。</strong></p>
                <p style="margin-top: 10px;">为了给您提供更好的服务体验，我们需要对系统进行例行维护和升级。</p>
            </div>

            <div class="info-box">
                <div class="info-label">⏰ 维护时间</div>
                <p>$maintenance_time</p>
            </div>

            $maintenance_content_section

            <div class="divider"></div>

            <div style="color: #666; font-size: 14px; line-height: 1.8;">
                <p>对于维护期间给您带来的不便，我们深表歉意。感谢您的理解与支持！</p>
                <p style="margin-top: 15px;">如有紧急需求，请在维护开始前或结束后使用系统。</p>
            </div>
        </div>

        <div class="footer">
            <p><strong>MediCareAI 智能疾病管理系统</strong></p>
            <p>本邮件由系统自动发送，请勿直接回复</p>
            <p style="margin-top: 10px; color: #999;">© 2024 MediCareAI. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
""")

MAINTENANCE_NOTIFICATION_TEXT = Template("""
系统维护通知 - MediCareAI

您好，$user_name！

我们即将进行系统维护，届时服务可能暂时不可用。

为了给您提供更好的服务体验，我们需要对系统进行例行维护和升级。

维护时间：
$maintenance_time

$maintenance_content_text

对于维护期间给您带来的不便，我们深表歉意。感谢您的理解与支持！

如有紧急需求，请在维护开始前或结束后使用系统。

MediCareAI 智能疾病管理系统
本邮件由系统自动发送，请勿直接回复
""")


async def send_maintenance_notification_email(
    to_email: str,
    user_name: str,
    maintenance_time: str,
    maintenance_content: str = "",
) -> bool:

    # 处理维护内容显示
    if maintenance_content:
        maintenance_content_section = f"""<div class="info-box">
            <div class="info-label">📝 维护内容</div>
            <p>{maintenance_content}</p>
        </div>"""
        maintenance_content_text = f"维护内容：\n{maintenance_content}\n"
    else:
        maintenance_content_section = ""
        maintenance_content_text = ""

    html_content = MAINTENANCE_NOTIFICATION_HTML.substitute(
        user_name=user_name,
        maintenance_time=maintenance_time,
        maintenance_content_section=maintenance_content_section,
    )
    text_content = MAINTENANCE_NOTIFICATION_TEXT.substitute(
        user_name=user_name,
        maintenance_time=maintenance_time,
        maintenance_content_text=maintenance_content_text,
    )

    logger.info(f"正在发送系统维护通知邮件到 {to_email}")
    success, error_msg = await temail_service.send_email(
        to_email=to_email,
        subject=MAINTENANCE_NOTIFICATION_SUBJECT,
        html_content=html_content,
        text_content=text_content,
    )

    if not success:
        logger.error(f"系统维护通知邮件发送失败: {error_msg}")

    return success
