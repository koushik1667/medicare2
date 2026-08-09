#!/usr/bin/env python3
"""
数据库迁移脚本: 创建站内信表
Migration: Create internal_messages table
"""

import asyncio
import asyncpg
import os
import sys

# 添加项目根目录到 Python 路径
sys.path.insert(0, "/app")

from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def migrate():
    """执行数据库迁移"""
    conn = None
    try:
        db_url = settings.database_url
        if db_url.startswith("postgresql+asyncpg://"):
            db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")

        conn = await asyncpg.connect(db_url)

        # 检查表是否已存在
        check_table = """
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'internal_messages'
        )
        """

        table_exists = await conn.fetchval(check_table)

        if table_exists:
            logger.info("✓ internal_messages 表已存在")
        else:
            logger.info("创建 internal_messages 表...")

            await conn.execute("""
                CREATE TABLE internal_messages (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
                    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
                    subject VARCHAR(255) NOT NULL,
                    content TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT FALSE NOT NULL,
                    read_at TIMESTAMP WITH TIME ZONE,
                    parent_id UUID REFERENCES internal_messages(id) ON DELETE SET NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
            """)

            # 创建索引
            await conn.execute("""
                CREATE INDEX ix_internal_messages_sender_id ON internal_messages(sender_id)
            """)
            await conn.execute("""
                CREATE INDEX ix_internal_messages_recipient_id ON internal_messages(recipient_id)
            """)
            await conn.execute("""
                CREATE INDEX ix_internal_messages_parent_id ON internal_messages(parent_id)
            """)
            await conn.execute("""
                CREATE INDEX ix_internal_messages_sender_created ON internal_messages(sender_id, created_at)
            """)
            await conn.execute("""
                CREATE INDEX ix_internal_messages_recipient_created ON internal_messages(recipient_id, created_at)
            """)
            await conn.execute("""
                CREATE INDEX ix_internal_messages_unread ON internal_messages(recipient_id, is_read)
            """)

            logger.info("✓ internal_messages 表创建成功")

        logger.info("站内信表迁移完成！")

    except Exception as e:
        logger.error(f"迁移失败: {e}")
        raise
    finally:
        if conn:
            await conn.close()


if __name__ == "__main__":
    asyncio.run(migrate())
