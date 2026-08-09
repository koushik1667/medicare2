"""
Lab Report Extraction Task Service | 检验报告提取任务服务

在文档处理完成后，自动调用 AI 提取检验报告的结构化数据。
"""

import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import MedicalDocument, ExtractedLabReport
from app.services.ai_report_extractor import ai_report_extractor

logger = logging.getLogger(__name__)


class LabReportExtractionTask:
    """检验报告提取任务"""

    @staticmethod
    async def process_document(
        document_id: str, db: AsyncSession
    ) -> Optional[ExtractedLabReport]:
        """
        处理文档，提取检验报告数据

        Args:
            document_id: 文档ID
            db: 数据库会话

        Returns:
            提取的检验报告数据，如果不是检验报告则返回None
        """
        try:
            # 获取文档
            result = await db.execute(
                select(MedicalDocument).where(MedicalDocument.id == document_id)
            )
            document = result.scalar_one_or_none()

            if not document:
                logger.warning(f"Document {document_id} not found")
                return None

            # 检查是否已经提取过
            existing_result = await db.execute(
                select(ExtractedLabReport).where(
                    ExtractedLabReport.document_id == document_id
                )
            )
            if existing_result.scalar_one_or_none():
                logger.info(f"Document {document_id} already processed")
                return None

            # 获取文档文本内容
            report_text = ""

            # 优先使用 cleaned_content
            if document.cleaned_content:
                report_text = document.cleaned_content.get("text", "")

            # 如果没有，使用 extracted_content
            if not report_text and document.extracted_content:
                extracted_data = document.extracted_content
                if extracted_data.get("markdown_content"):
                    report_text = extracted_data["markdown_content"]
                elif extracted_data.get("text_content"):
                    report_text = extracted_data["text_content"]

            if not report_text or len(report_text.strip()) < 50:
                logger.warning(f"Document {document_id} has no extractable text")
                return None

            # 调用 AI 提取
            logger.info(f"Starting AI extraction for document {document_id}")
            extraction_result = await ai_report_extractor.extract_lab_report(
                report_text
            )

            # 检查是否提取到数据
            items = extraction_result.get("items", [])
            if not items:
                logger.info(f"No lab items extracted from document {document_id}")
                return None

            # 创建提取记录
            extracted_report = ExtractedLabReport(
                document_id=document.id,
                medical_case_id=document.medical_case_id,
                report_type=extraction_result.get("report_type", "unknown"),
                extracted_items=items,
                patient_info=extraction_result.get("patient_info", {}),
                summary=extraction_result.get("summary", ""),
                extraction_metadata={
                    "source": "ai_extraction",
                    "item_count": len(items),
                    "text_length": len(report_text),
                },
                status="completed",
            )

            db.add(extracted_report)
            await db.commit()
            await db.refresh(extracted_report)

            logger.info(
                f"Successfully extracted {len(items)} items from document {document_id}"
            )
            return extracted_report

        except Exception as e:
            logger.error(f"Error processing document {document_id}: {e}")
            await db.rollback()

            # 创建失败记录
            try:
                failed_report = ExtractedLabReport(
                    document_id=document_id,
                    medical_case_id=document.medical_case_id if document else None,
                    status="failed",
                    extraction_metadata={"error": str(e)},
                )
                db.add(failed_report)
                await db.commit()
            except:
                pass

            return None

    @staticmethod
    async def reprocess_document(
        document_id: str, db: AsyncSession
    ) -> Optional[ExtractedLabReport]:
        """
        重新处理文档（删除旧记录后重新提取）

        Args:
            document_id: 文档ID
            db: 数据库会话

        Returns:
            提取的检验报告数据
        """
        try:
            # 删除旧记录
            result = await db.execute(
                select(ExtractedLabReport).where(
                    ExtractedLabReport.document_id == document_id
                )
            )
            old_records = result.scalars().all()
            for record in old_records:
                await db.delete(record)
            await db.commit()

            # 重新处理
            return await LabReportExtractionTask.process_document(document_id, db)

        except Exception as e:
            logger.error(f"Error reprocessing document {document_id}: {e}")
            await db.rollback()
            return None


# 便捷函数
async def extract_lab_report_from_document(
    document_id: str, db: AsyncSession
) -> Optional[ExtractedLabReport]:
    """从文档提取检验报告数据"""
    return await LabReportExtractionTask.process_document(document_id, db)
