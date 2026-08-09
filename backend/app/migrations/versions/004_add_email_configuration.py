"""
Migration: Add Email Configuration Table | 添加邮件配置表

创建 email_configurations 表用于存储SMTP配置

Revision ID: 004_add_email_configuration
Revises: 003_add_email_verification_fields
Create Date: 2025-02-26
"""

from typing import Sequence, Union

# revision identifiers, used by Alembic
revision: str = "004_add_email_configuration"
down_revision: Union[str, None] = "003_add_email_verification_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Upgrade database schema to add email configuration table.
    """
    from sqlalchemy import text
    from app.db.database import engine

    with engine.connect() as conn:
        # 创建邮件配置表
        conn.execute(
            text("""
            CREATE TABLE IF NOT EXISTS email_configurations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                smtp_host VARCHAR(255) NOT NULL,
                smtp_port INTEGER NOT NULL DEFAULT 587,
                smtp_user VARCHAR(255) NOT NULL,
                smtp_password VARCHAR(255) NOT NULL,
                smtp_from_email VARCHAR(255) NOT NULL,
                smtp_from_name VARCHAR(255) NOT NULL DEFAULT 'MediCareAI',
                smtp_use_tls BOOLEAN NOT NULL DEFAULT true,
                is_active BOOLEAN NOT NULL DEFAULT true,
                is_default BOOLEAN NOT NULL DEFAULT false,
                test_status VARCHAR(50) NOT NULL DEFAULT 'untested',
                test_message TEXT,
                tested_at TIMESTAMP WITH TIME ZONE,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_by UUID REFERENCES users(id) ON DELETE SET NULL
            )
        """)
        )

        # 创建索引
        conn.execute(
            text("""
            CREATE INDEX IF NOT EXISTS idx_email_config_is_default 
            ON email_configurations(is_default)
        """)
        )

        conn.execute(
            text("""
            CREATE INDEX IF NOT EXISTS idx_email_config_is_active 
            ON email_configurations(is_active)
        """)
        )

        # 创建更新时间触发器
        conn.execute(
            text("""
            CREATE OR REPLACE FUNCTION update_email_config_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        """)
        )

        conn.execute(
            text("""
            DROP TRIGGER IF EXISTS trigger_update_email_config_updated_at ON email_configurations
        """)
        )

        conn.execute(
            text("""
            CREATE TRIGGER trigger_update_email_config_updated_at
                BEFORE UPDATE ON email_configurations
                FOR EACH ROW
                EXECUTE FUNCTION update_email_config_updated_at()
        """)
        )

        conn.commit()

    print("✅ Email configuration table created successfully")


def downgrade() -> None:
    """
    Downgrade database schema to remove email configuration table.
    """
    from sqlalchemy import text
    from app.db.database import engine

    with engine.connect() as conn:
        # 删除触发器
        conn.execute(
            text("""
            DROP TRIGGER IF EXISTS trigger_update_email_config_updated_at ON email_configurations
        """)
        )

        conn.execute(
            text("""
            DROP FUNCTION IF EXISTS update_email_config_updated_at()
        """)
        )

        # 删除索引
        conn.execute(
            text("""
            DROP INDEX IF EXISTS idx_email_config_is_active
        """)
        )

        conn.execute(
            text("""
            DROP INDEX IF EXISTS idx_email_config_is_default
        """)
        )

        # 删除表
        conn.execute(
            text("""
            DROP TABLE IF EXISTS email_configurations
        """)
        )

        conn.commit()

    print("✅ Email configuration table removed")
