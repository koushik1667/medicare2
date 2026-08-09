from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
import uuid


class PatientBase(BaseModel):
    """患者基础信息 - name 从 User 表获取，避免数据冗余"""
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, pattern="^(male|female)$")
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    emergency_contact: Optional[str] = Field(None, max_length=255)
    medical_record_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class PatientCreate(PatientBase):
    """创建患者 - 不需要提供 name，自动从 User 表获取"""
    pass


class PatientUpdate(BaseModel):
    """更新患者信息 - 不允许修改 name，name 应该在 User 表中修改
    
    注意：address 字段现在统一存储在 User 表中（问题4修复）", """
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, pattern="^(male|female)$")
    phone: Optional[str] = Field(None, max_length=20)
    # 问题4修复：address 现在从 User 表获取，但仍保留在 schema 中以兼容现有 API
    address: Optional[str] = Field(None, description="地址现在统一存储在 User 表中")
    emergency_contact: Optional[str] = Field(None, max_length=255)
    medical_record_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class PatientResponse(BaseModel):
    """患者响应 - 包含从 User 表获取的 user_full_name 和分离的紧急联系人字段"""
    id: uuid.UUID
    user_id: uuid.UUID
    # 从 User 表获取的姓名，避免数据冗余
    user_full_name: Optional[str] = None
    # 兼容旧字段
    name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    # 紧急联系人信息（支持新旧两种格式）
    emergency_contact: Optional[str] = None  # 组合格式（向后兼容）
    emergency_contact_name: Optional[str] = None  # 分离字段：姓名
    emergency_contact_phone: Optional[str] = None  # 分离字段：电话
    medical_record_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PatientSummary(BaseModel):
    """患者摘要"""
    id: uuid.UUID
    # 从 User 表获取的姓名
    user_full_name: Optional[str] = None
    name: Optional[str] = None  # 兼容旧字段
    date_of_birth: Optional[date] = None
    gender: Optional[str]
    medical_record_number: Optional[str]
    active_cases_count: int = 0
    
    class Config:
        from_attributes = True
