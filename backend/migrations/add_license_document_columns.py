#!/usr/bin/env python3
"""
数据库迁移脚本: 添加医生证书相关列到 doctor_verifications 表
Migration: Add license document columns to doctor_verifications table
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
        # 解析数据库连接信息
        db_url = settings.database_url
        # 从 asyncpg+postgresql:// 格式解析
        if db_url.startswith("postgresql+asyncpg://"):
            db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")

        conn = await asyncpg.connect(db_url)

        # 检查列是否已存在
        check_license_path = """
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'doctor_verifications' AND column_name = 'license_document_path'
        """

        check_license_filename = """
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'doctor_verifications' AND column_name = 'license_document_filename'
        """

        path_exists = await conn.fetchval(check_license_path)
        filename_exists = await conn.fetchval(check_license_filename)

        if not path_exists:
            logger.info("添加 license_document_path 列...")
            await conn.execute("""
                ALTER TABLE doctor_verifications 
                ADD COLUMN license_document_path VARCHAR(500) NULL
            """)
            logger.info("✓ license_document_path 列添加成功")
        else:
            logger.info("✓ license_document_path 列已存在")

        if not filename_exists:
            logger.info("添加 license_document_filename 列...")
            await conn.execute("""
                ALTER TABLE doctor_verifications 
                ADD COLUMN license_document_filename VARCHAR(255) NULL
            """)
            logger.info("✓ license_document_filename 列添加成功")
        else:
            logger.info("✓ license_document_filename 列已存在")

        logger.info("数据库迁移完成！")

    except Exception as e:
        logger.error(f"迁移失败: {e}")
        raise
    finally:
        if conn:
            await conn.close()


if __name__ == "__main__":
    asyncio.run(migrate())
