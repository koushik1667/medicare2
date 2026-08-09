#!/usr/bin/env python3
"""
手动触发知识库文档向量化 | Manual Knowledge Base Vectorization Tool

用法: docker-compose exec backend python3 /app/scripts/vectorize_documents.py
"""

import asyncio
import sys
from pathlib import Path

# 添加项目根目录到路径
sys.path.insert(0, "/app")

from app.db.database import AsyncSessionLocal
from app.services.unified_kb_service import get_unified_knowledge_loader
from app.services.kb_vectorization_service import KnowledgeBaseVectorizationService
from app.services.vector_embedding_service import VectorEmbeddingService
from app.services.dynamic_config_service import DynamicConfigService
import logging

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def vectorize_all_pending_documents():
    """向量化所有待处理的文档"""

    async with AsyncSessionLocal() as db:
        try:
            # 获取所有文档
            kb_loader = get_unified_knowledge_loader()
            docs = kb_loader.load_all_documents()

            logger.info(f"Found {len(docs)} documents in knowledge base")

            if not docs:
                logger.info("No documents found to vectorize")
                return

            # 检查向量配置
            vector_service = VectorEmbeddingService(db)
            config = None

            try:
                config = await vector_service.get_active_config()
                if config:
                    logger.info(
                        f"Using vector config: {config.name} ({config.provider}/{config.model_id})"
                    )
            except Exception as e:
                logger.warning(
                    f"Could not get config from vector_embedding_configs: {e}"
                )

            if not config:
                try:
                    embedding_config = await DynamicConfigService.get_embedding_config(
                        db
                    )
                    if (
                        embedding_config
                        and embedding_config.get("source") == "database"
                    ):
                        logger.info(
                            f"Using vector config from ai_model_configurations: {embedding_config['model_id']}"
                        )
                    else:
                        logger.error("No active vector embedding configuration found!")
                        return
                except Exception as config_error:
                    logger.error(f"Failed to get vector config: {config_error}")
                    return

            # 初始化向量化服务
            kb_service = KnowledgeBaseVectorizationService(db)

            # 向量化每个文档
            for doc in docs:
                try:
                    logger.info(f"Processing document: {doc.title}")

                    result = await kb_service.vectorize_markdown_document(
                        document_content=doc.content,
                        document_title=doc.title,
                        disease_category=doc.category if doc.category else "general",
                        disease_id=None,
                        source_type="unified_kb",
                        created_by=1,  # admin user id
                    )

                    logger.info(
                        f"✅ Vectorization complete for {doc.title}: "
                        f"{result.get('new_chunks', 0)} chunks created, "
                        f"{result.get('total_chunks', 0)} total"
                    )

                except Exception as e:
                    logger.error(f"❌ Failed to vectorize {doc.title}: {e}")
                    import traceback

                    logger.error(traceback.format_exc())

            logger.info("All documents processed!")

        except Exception as e:
            logger.error(f"Error in vectorization process: {e}")
            import traceback

            logger.error(traceback.format_exc())


if __name__ == "__main__":
    logger.info("Starting manual document vectorization...")
    asyncio.run(vectorize_all_pending_documents())
