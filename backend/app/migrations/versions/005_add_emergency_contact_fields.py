"""
Migration: Add Emergency Contact Fields | 添加紧急联系人分离字段

在 users 表中添加 emergency_contact_name 和 emergency_contact_phone 字段
用于替代原有的组合 emergency_contact 字段

Revision ID: 005_add_emergency_contact_fields
Revises: 004_add_email_configuration
Create Date: 2025-03-07
"""

from typing import Sequence, Union

# revision identifiers, used by Alembic
revision: str = "005_add_emergency_contact_fields"
down_revision: Union[str, None] = "004_add_email_configuration"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Upgrade database schema to add separate emergency contact fields.
    添加分离的紧急联系人字段
    """
    from sqlalchemy import text
    from app.db.database import engine

    with engine.connect() as conn:
        # 添加紧急联系人姓名字段
        conn.execute(
            text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100)
            """)
        )

        # 添加紧急联系人电话字段
        conn.execute(
            text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20)
            """)
        )

        # 数据迁移：尝试从现有的 emergency_contact 字段拆分数据
        # 注意：这是一个最佳尝试，可能无法完美处理所有情况
        conn.execute(
            text("""
            UPDATE users 
            SET emergency_contact_name = CASE 
                WHEN emergency_contact IS NOT NULL AND POSITION(' ' IN emergency_contact) > 0 
                THEN SUBSTRING(emergency_contact FROM 1 FOR POSITION(' ' IN emergency_contact) - 1)
                WHEN emergency_contact IS NOT NULL AND LENGTH(emergency_contact) > 0 
                THEN emergency_contact
                ELSE NULL
            END,
            emergency_contact_phone = CASE 
                WHEN emergency_contact IS NOT NULL AND POSITION(' ' IN emergency_contact) > 0 
                THEN SUBSTRING(emergency_contact FROM POSITION(' ' IN emergency_contact) + 1)
                ELSE NULL
            END
            WHERE emergency_contact IS NOT NULL 
            AND (emergency_contact_name IS NULL OR emergency_contact_phone IS NULL)
            """)
        )

        conn.commit()
        print("✅ 紧急联系人字段添加成功")


def downgrade() -> None:
    """
    Downgrade database schema by removing the new fields.
    降级：删除新添加的字段
    """
    from sqlalchemy import text
    from app.db.database import engine

    with engine.connect() as conn:
        # 删除紧急联系人电话字段
        conn.execute(
            text("""
            ALTER TABLE users 
            DROP COLUMN IF EXISTS emergency_contact_phone
            """)
        )

        # 删除紧急联系人姓名字段
        conn.execute(
            text("""
            ALTER TABLE users 
            DROP COLUMN IF EXISTS emergency_contact_name
            """)
        )

        conn.commit()
        print("✅ 紧急联系人字段已删除（降级完成）")
