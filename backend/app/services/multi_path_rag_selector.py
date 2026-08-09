"""
Multi-Path Intelligent RAG Selector - 多路召回智能RAG选择器
Optimized retrieval combining disease category pre-filtering with vector search.

多路召回策略:
1. 疾病分类预过滤 + 向量检索 (Path 1)
2. 全局向量检索 (Path 2 - Fallback)
3. 关键词精确匹配 (Path 3)
4. 语义扩展召回 (Path 4)

Features:
- Dynamic disease category prediction from symptoms
- Multi-path recall for high recall and precision
- Intelligent result merging with deduplication
- Adaptive scoring based on retrieval path
"""

import logging
from typing import Dict, List, Any, Optional, Set, Tuple
from dataclasses import dataclass, field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from collections import defaultdict

from app.services.vector_embedding_service import VectorEmbeddingService
from app.services.kb_vectorization_service import KnowledgeBaseVectorizationService
from app.services.reranking_service import RerankingService
from app.models.models import KnowledgeBaseChunk
import re

logger = logging.getLogger(__name__)


@dataclass
class KnowledgeSource:
    """Knowledge source with relevance info"""

    category: str
    relevance_score: float
    chunks: List[Dict[str, Any]]
    selection_reason: str


@dataclass
class MedicalEntity:
    """Extracted medical entity from text"""

    text: str
    entity_type: str
    confidence: float


@dataclass
class RetrievedChunk:
    """Retrieved chunk with metadata"""

    id: str
    text: str
    section_title: str
    document_title: str
    disease_category: str
    similarity_score: float
    retrieval_path: str  # 'category_filtered', 'universal', 'term_based', 'exact_match'
    matched_terms: List[str] = field(default_factory=list)
    category_boost: float = 0.0


class DiseaseCategoryPredictor:
    """Disease category predictor based on symptom patterns - 疾病分类预测器"""

    # 疾病分类关键词映射 (动态可扩展)
    CATEGORY_PATTERNS = {
        "respiratory": {
            "keywords": [
                "咳嗽",
                "咳痰",
                "咳血",
                "呼吸困难",
                "喘息",
                "哮喘",
                "肺炎",
                "支气管炎",
                "肺气肿",
                "肺",
                "胸",
                "咳",
                "喘",
                "呼吸",
                "气促",
                "气短",
                "鼻塞",
                "流涕",
                "咽痛",
            ],
            "symptoms": ["咳嗽", "咳痰", "呼吸困难", "胸痛", "喘息", "气促"],
            "weight": 1.0,
        },
        "cardiovascular": {
            "keywords": [
                "心悸",
                "胸闷",
                "胸痛",
                "心绞痛",
                "心衰",
                "高血压",
                "低血压",
                "心律",
                "心跳",
                "心脏",
                "血管",
                "血压",
                "动脉硬化",
                "冠心病",
            ],
            "symptoms": ["心悸", "胸闷", "胸痛", "呼吸困难", "水肿"],
            "weight": 1.0,
        },
        "digestive": {
            "keywords": [
                "腹痛",
                "腹泻",
                "便秘",
                "恶心",
                "呕吐",
                "消化不良",
                "胃炎",
                "胃溃疡",
                "肠炎",
                "肝病",
                "胆囊",
                "胰腺",
                "肠",
                "胃",
                "腹",
                "吐",
                "泻",
                "便秘",
            ],
            "symptoms": ["腹痛", "腹泻", "恶心", "呕吐", "消化不良"],
            "weight": 1.0,
        },
        "neurological": {
            "keywords": [
                "头痛",
                "头晕",
                "眩晕",
                "抽搐",
                "癫痫",
                "昏迷",
                "瘫痪",
                "麻木",
                "神经",
                "脑",
                "脊髓",
                "意识",
                "震颤",
                "共济失调",
            ],
            "symptoms": ["头痛", "头晕", "意识障碍", "抽搐", "瘫痪"],
            "weight": 1.0,
        },
        "pediatric": {
            "keywords": [
                "儿童",
                "婴儿",
                "幼儿",
                "小儿",
                "发烧",
                "患儿",
                "预防接种",
                "发育",
            ],
            "symptoms": ["发热", "咳嗽", "腹泻", "惊厥"],
            "weight": 1.0,
        },
        "dermatology": {
            "keywords": [
                "皮疹",
                "瘙痒",
                "湿疹",
                "荨麻疹",
                "皮炎",
                "皮肤",
                "疱",
                "疹",
                "红斑",
                "脱屑",
                "溃疡",
                "皮肤损伤",
            ],
            "symptoms": ["皮疹", "瘙痒", "皮肤红斑", "水疱"],
            "weight": 1.0,
        },
        "endocrine": {
            "keywords": [
                "糖尿病",
                "甲亢",
                "甲减",
                "甲状腺",
                "肾上腺",
                "垂体",
                "内分泌",
                "血糖",
                "胰岛素",
                "代谢",
                "激素",
            ],
            "symptoms": ["多饮", "多尿", "体重变化", "乏力"],
            "weight": 1.0,
        },
        "infectious": {
            "keywords": [
                "发热",
                "感染",
                "传染",
                "病毒",
                "细菌",
                "炎症",
                "抗生素",
                "抗病毒",
                "流感",
                "新冠",
                "支原体",
                "衣原体",
                "阳性",
                "阴性",
            ],
            "symptoms": ["发热", "寒战", "感染灶", "炎症指标升高"],
            "weight": 1.0,
        },
        "urinary": {
            "keywords": [
                "尿频",
                "尿急",
                "尿痛",
                "血尿",
                "蛋白尿",
                "肾",
                "泌尿",
                "膀胱",
                "尿道",
                "排尿",
                "尿",
            ],
            "symptoms": ["尿频", "尿急", "尿痛", "血尿"],
            "weight": 1.0,
        },
    }

    @classmethod
    def predict_categories(
        cls, symptoms: str, document_texts: Optional[List[str]] = None
    ) -> List[Tuple[str, float]]:
        """
        Predict disease categories based on symptoms - 基于症状预测疾病分类

        Returns:
            List of (category, confidence_score) tuples, sorted by confidence
        """
        all_text = (
            symptoms.lower()
            + " "
            + " ".join([t.lower() for t in (document_texts or [])])
        )
        scores = {}

        for category, data in cls.CATEGORY_PATTERNS.items():
            score = 0.0
            matched_keywords = []

            # 关键词匹配得分
            for keyword in data["keywords"]:
                if keyword in all_text:
                    score += 1.0
                    matched_keywords.append(keyword)

            # 核心症状匹配得分 (权重更高)
            for symptom in data["symptoms"]:
                if symptom in all_text:
                    score += 2.0
                    matched_keywords.append(symptom)

            # 归一化得分
            if matched_keywords:
                score = score / (
                    len(data["keywords"]) * 0.5 + len(data["symptoms"]) * 1.0
                )
                score *= data["weight"]
                scores[category] = min(score, 1.0)  # 最高1.0

        # 排序并返回
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_scores

    @classmethod
    def get_top_categories(
        cls,
        symptoms: str,
        document_texts: Optional[List[str]] = None,
        top_n: int = 2,
        threshold: float = 0.2,
    ) -> List[str]:
        """Get top N predicted categories above threshold"""
        predictions = cls.predict_categories(symptoms, document_texts)
        return [cat for cat, score in predictions[:top_n] if score >= threshold]


class MultiPathRAGSelector:
    """
    Multi-Path RAG Selector - 多路召回RAG选择器

    Retrieval Paths (召回路径):
    1. Category-Filtered Path: 疾病分类预测 → 分类过滤 → 向量检索
    2. Universal Path: 全局向量检索 (Fallback)
    3. Term-Based Path: 关键词精确匹配
    4. Exact Match Path: 症状关键词精确匹配

    Result Fusion Strategy (结果融合策略):
    - Reciprocal Rank Fusion (RRF) for ranking
    - Score normalization across different paths
    - Deduplication with highest score retention
    - Category boost for predicted categories
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.vector_service = VectorEmbeddingService(db)
        self.kb_service = KnowledgeBaseVectorizationService(db)
        self.reranking_service = RerankingService(db)

    async def select_knowledge_bases(
        self,
        symptoms: str,
        document_texts: Optional[List[str]] = None,
        patient_age: Optional[int] = None,
        top_k: int = 5,
        min_similarity: float = 0.5,
        enable_multi_path: bool = True,
    ) -> Dict[str, Any]:
        """
        Multi-path knowledge base selection with intelligent fusion

        Args:
            symptoms: Symptom description
            document_texts: List of extracted text from uploaded documents
            patient_age: Patient age
            top_k: Number of top results
            min_similarity: Minimum similarity threshold
            enable_multi_path: Whether to enable multi-path recall

        Returns:
            Dict with sources, metadata, and retrieval statistics
        """
        logger.info(f"🚀 Multi-path RAG selection for: {symptoms[:80]}...")

        # Step 1: Predict disease categories
        predicted_categories = DiseaseCategoryPredictor.get_top_categories(
            symptoms, document_texts, top_n=2, threshold=0.2
        )
        logger.info(f"📊 Predicted categories: {predicted_categories}")

        # Step 2: Multi-path retrieval
        all_retrieved_chunks: Dict[str, RetrievedChunk] = {}
        retrieval_stats = {}

        if enable_multi_path and predicted_categories:
            # Path 1: Category-filtered vector search
            # Add 'unified' to predicted categories for unified KB architecture
            search_categories = predicted_categories + ["unified"]
            cat_chunks = await self._category_filtered_search(
                symptoms=symptoms,
                predicted_categories=search_categories,
                document_texts=document_texts,
                min_similarity=min_similarity
                * 0.9,  # Slightly lower threshold for category path
                top_k=15,
            )
            all_retrieved_chunks.update({c.id: c for c in cat_chunks})
            retrieval_stats["category_filtered"] = len(cat_chunks)
            logger.info(f"✅ Category-filtered path: {len(cat_chunks)} chunks")

        # Path 2: Universal vector search (always run as baseline)
        uni_chunks = await self._universal_vector_search(
            symptoms=symptoms,
            document_texts=document_texts,
            min_similarity=min_similarity,
            top_k=15,
        )
        # Merge with existing, keep higher score
        for chunk in uni_chunks:
            if chunk.id not in all_retrieved_chunks:
                all_retrieved_chunks[chunk.id] = chunk
            else:
                # If chunk already exists from another path, boost its score
                existing = all_retrieved_chunks[chunk.id]
                existing.similarity_score = max(
                    existing.similarity_score, chunk.similarity_score
                )
                existing.retrieval_path = (
                    "multi_path"  # Mark as found in multiple paths
                )
        retrieval_stats["universal"] = len(uni_chunks)
        logger.info(f"✅ Universal path: {len(uni_chunks)} chunks")

        # Path 3: Term-based exact match
        term_chunks = await self._term_based_search(
            symptoms=symptoms, document_texts=document_texts, top_k=10
        )
        for chunk in term_chunks:
            if chunk.id not in all_retrieved_chunks:
                all_retrieved_chunks[chunk.id] = chunk
            else:
                # Boost score for term matches
                all_retrieved_chunks[chunk.id].similarity_score += 0.1
        retrieval_stats["term_based"] = len(term_chunks)
        logger.info(f"✅ Term-based path: {len(term_chunks)} chunks")

        # Step 3: Apply category boost for predicted categories
        if predicted_categories:
            for chunk in all_retrieved_chunks.values():
                if chunk.disease_category in predicted_categories:
                    chunk.category_boost = 0.15
                    chunk.similarity_score += chunk.category_boost

        # Step 4: Convert to list and sort
        all_chunks = list(all_retrieved_chunks.values())
        all_chunks.sort(key=lambda x: x.similarity_score, reverse=True)

        # Step 5: Re-rank based on document relevance if documents provided
        if document_texts:
            all_chunks = self._rerank_by_document_relevance(all_chunks, document_texts)

        # Step 5.5: External reranking (if configured)
        all_chunks = await self._apply_external_reranking(symptoms, all_chunks)

        # Step 6: Group by category and select top sources
        grouped_sources = self._group_by_category(all_chunks)
        selected_sources = self._select_top_sources(grouped_sources, top_k)

        # Step 7: Generate reasoning
        reasoning = self._generate_reasoning(
            selected_sources, predicted_categories, retrieval_stats
        )
        total_chunks = sum(len(source.chunks) for source in selected_sources)

        result = {
            "sources": [
                {
                    "category": source.category,
                    "relevance_score": source.relevance_score,
                    "chunks": source.chunks,
                    "selection_reason": source.selection_reason,
                }
                for source in selected_sources
            ],
            "selection_reasoning": reasoning,
            "total_chunks": total_chunks,
            "predicted_categories": predicted_categories,
            "retrieval_stats": retrieval_stats,
            "unique_chunks_found": len(all_retrieved_chunks),
        }

        logger.info(
            f"🎯 Multi-path RAG complete: {len(selected_sources)} sources, "
            f"{total_chunks} chunks from {len(all_retrieved_chunks)} unique chunks"
        )
        return result

    async def _category_filtered_search(
        self,
        symptoms: str,
        predicted_categories: List[str],
        document_texts: Optional[List[str]],
        min_similarity: float,
        top_k: int,
    ) -> List[RetrievedChunk]:
        """
        Path 1: Category-filtered vector search
        Search within predicted disease categories for higher precision
        """
        # Build enhanced query
        enhanced_query = self._build_enhanced_query(symptoms, document_texts or [])
        query_embedding = await self.vector_service.generate_embedding(enhanced_query)

        # Query chunks filtered by predicted categories
        stmt = select(KnowledgeBaseChunk).where(
            KnowledgeBaseChunk.is_active == True,
            KnowledgeBaseChunk.disease_category.in_(predicted_categories),
        )
        result = await self.db.execute(stmt)
        chunks = result.scalars().all()

        retrieved = []
        for chunk in chunks:
            if chunk.embedding:
                similarity = self._cosine_similarity(query_embedding, chunk.embedding)
                if similarity >= min_similarity:
                    retrieved.append(
                        RetrievedChunk(
                            id=str(chunk.id),
                            text=chunk.chunk_text,
                            section_title=chunk.section_title or "",
                            document_title=chunk.document_title or "",
                            disease_category=chunk.disease_category or "general",
                            similarity_score=similarity,
                            retrieval_path="category_filtered",
                        )
                    )
                    chunk.retrieval_count += 1

        await self.db.commit()
        retrieved.sort(key=lambda x: x.similarity_score, reverse=True)
        return retrieved[:top_k]

    async def _universal_vector_search(
        self,
        symptoms: str,
        document_texts: Optional[List[str]],
        min_similarity: float,
        top_k: int,
    ) -> List[RetrievedChunk]:
        """
        Path 2: Universal vector search across all categories
        Fallback path to ensure high recall
        """
        enhanced_query = self._build_enhanced_query(symptoms, document_texts or [])
        query_embedding = await self.vector_service.generate_embedding(enhanced_query)

        stmt = select(KnowledgeBaseChunk).where(KnowledgeBaseChunk.is_active == True)
        result = await self.db.execute(stmt)
        chunks = result.scalars().all()

        retrieved = []
        for chunk in chunks:
            if chunk.embedding:
                similarity = self._cosine_similarity(query_embedding, chunk.embedding)
                if similarity >= min_similarity:
                    retrieved.append(
                        RetrievedChunk(
                            id=str(chunk.id),
                            text=chunk.chunk_text,
                            section_title=chunk.section_title or "",
                            document_title=chunk.document_title or "",
                            disease_category=chunk.disease_category or "general",
                            similarity_score=similarity,
                            retrieval_path="universal",
                        )
                    )
                    chunk.retrieval_count += 1

        await self.db.commit()
        retrieved.sort(key=lambda x: x.similarity_score, reverse=True)
        return retrieved[:top_k]

    async def _term_based_search(
        self, symptoms: str, document_texts: Optional[List[str]], top_k: int
    ) -> List[RetrievedChunk]:
        """
        Path 3: Term-based exact match search
        Find chunks with exact keyword matches
        """
        all_text = (symptoms + " " + " ".join(document_texts or [])).lower()

        # Extract key medical terms
        medical_terms = set()

        # 症状关键词
        symptom_keywords = [
            "咳嗽",
            "咳痰",
            "咳血",
            "发热",
            "发烧",
            "头痛",
            "头晕",
            "胸痛",
            "腹痛",
            "腹泻",
            "恶心",
            "呕吐",
            "呼吸困难",
            "心悸",
            "抽搐",
            "昏迷",
            "皮疹",
            "瘙痒",
            "水肿",
            "乏力",
            "消瘦",
            "失眠",
            "疼痛",
        ]
        for term in symptom_keywords:
            if term in all_text:
                medical_terms.add(term)

        # 检查关键词
        test_keywords = ["阳性", "阴性", "异常", "增高", "降低", "升高", "减少"]
        for term in test_keywords:
            if term in all_text:
                medical_terms.add(term)

        if not medical_terms:
            return []

        # Query chunks containing these terms
        stmt = select(KnowledgeBaseChunk).where(KnowledgeBaseChunk.is_active == True)
        result = await self.db.execute(stmt)
        chunks = result.scalars().all()

        retrieved = []
        for chunk in chunks:
            chunk_text_lower = chunk.chunk_text.lower()
            matched = [term for term in medical_terms if term in chunk_text_lower]

            if matched:
                # Score based on number of matched terms
                score = 0.5 + (len(matched) * 0.1)  # Base 0.5 + 0.1 per match
                retrieved.append(
                    RetrievedChunk(
                        id=str(chunk.id),
                        text=chunk.chunk_text,
                        section_title=chunk.section_title or "",
                        document_title=chunk.document_title or "",
                        disease_category=chunk.disease_category or "general",
                        similarity_score=min(score, 0.9),  # Cap at 0.9
                        retrieval_path="term_based",
                        matched_terms=matched,
                    )
                )

        retrieved.sort(key=lambda x: x.similarity_score, reverse=True)
        return retrieved[:top_k]

    def _build_enhanced_query(self, symptoms: str, document_texts: List[str]) -> str:
        """Build enhanced query from symptoms and documents"""
        query_parts = [symptoms]
        query_parts.extend(document_texts)

        enhanced = " ".join(query_parts)

        # Add medical context
        if any(term in enhanced for term in ["阳性", "阴性", "抗原", "抗体"]):
            enhanced += " 病原学检查 实验室诊断"

        if any(term in enhanced for term in ["咳嗽", "咳痰", "呼吸困难"]):
            enhanced += " 呼吸系统 肺部疾病"

        return enhanced[:1000]  # Limit length

    def _rerank_by_document_relevance(
        self, chunks: List[RetrievedChunk], document_texts: List[str]
    ) -> List[RetrievedChunk]:
        """Re-rank chunks based on document content overlap"""
        doc_text = " ".join(document_texts).lower()
        doc_terms = set(re.findall(r"[\w\u4e00-\u9fff]+", doc_text))

        for chunk in chunks:
            chunk_terms = set(re.findall(r"[\w\u4e00-\u9fff]+", chunk.text.lower()))
            overlap = doc_terms & chunk_terms

            if overlap:
                bonus = len(overlap) * 0.02
                chunk.similarity_score += bonus

        chunks.sort(key=lambda x: x.similarity_score, reverse=True)
        return chunks

    async def _apply_external_reranking(
        self,
        query: str,
        chunks: List[RetrievedChunk],
    ) -> List[RetrievedChunk]:
        """
        应用外部重排序服务
        Apply external reranking service for more accurate semantic ranking

        Args:
            query: 用户查询
            chunks: 检索到的分块列表

        Returns:
            重排序后的分块列表
        """
        if not chunks or len(chunks) < 2:
            return chunks

        # 将 RetrievedChunk 转换为字典格式
        chunk_dicts = []
        for chunk in chunks:
            chunk_dicts.append({
                'id': chunk.id,
                'text': chunk.text,
                'section_title': chunk.section_title,
                'document_title': chunk.document_title,
                'disease_category': chunk.disease_category,
                'similarity_score': chunk.similarity_score,
                'retrieval_path': chunk.retrieval_path,
                'matched_terms': chunk.matched_terms,
                'category_boost': chunk.category_boost
            })

        # 调用重排序服务
        try:
            reranked_chunks = await self.reranking_service.rerank_chunks(
                query=query,
                chunks=chunk_dicts,
                top_n=len(chunk_dicts)
            )

            if not reranked_chunks:
                logger.debug("Reranking not applied, using original chunks")
                return chunks

            # 将重排序后的字典转换回 RetrievedChunk 对象
            result_chunks = []
            for chunk_dict in reranked_chunks:
                result_chunks.append(
                    RetrievedChunk(
                        id=chunk_dict['id'],
                        text=chunk_dict['text'],
                        section_title=chunk_dict.get('section_title', ''),
                        document_title=chunk_dict.get('document_title', ''),
                        disease_category=chunk_dict.get('disease_category', 'general'),
                        similarity_score=chunk_dict.get('rerank_score', chunk_dict.get('similarity_score', 0)),
                        retrieval_path=chunk_dict.get('retrieval_path', 'reranked'),
                        matched_terms=chunk_dict.get('matched_terms', []),
                        category_boost=chunk_dict.get('category_boost', 0.0)
                    )
                )

            logger.info(f"External reranking applied: {len(chunks)} -> {len(result_chunks)} chunks")
            return result_chunks
        except Exception as e:
            logger.warning(f"External reranking failed: {e}, using original chunks")
            return chunks

    def _group_by_category(
        self, chunks: List[RetrievedChunk]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Group chunks by disease category"""
        category_names = {
            "respiratory": "呼吸系统",
            "cardiovascular": "心血管系统",
            "digestive": "消化系统",
            "neurological": "神经系统",
            "pediatric": "儿科",
            "dermatology": "皮肤科",
            "endocrine": "内分泌系统",
            "infectious": "感染性疾病",
            "urinary": "泌尿系统",
            "unified": "医学知识库",
            "general": "通用医学知识",
        }

        grouped = defaultdict(list)
        for chunk in chunks:
            category = category_names.get(
                chunk.disease_category, chunk.disease_category
            )
            grouped[category].append(
                {
                    "chunk_id": chunk.id,
                    "chunk_text": chunk.text,
                    "section_title": chunk.section_title,
                    "document_title": chunk.document_title,
                    "disease_category": chunk.disease_category,
                    "relevance_score": chunk.similarity_score,
                    "retrieval_path": chunk.retrieval_path,
                    "matched_terms": chunk.matched_terms,
                }
            )

        return dict(grouped)

    def _select_top_sources(
        self, grouped_chunks: Dict[str, List[Dict[str, Any]]], top_k: int
    ) -> List[KnowledgeSource]:
        """Select top knowledge sources"""
        sources = []

        for category, chunks in grouped_chunks.items():
            if not chunks:
                continue

            avg_similarity = sum(c.get("similarity_score", 0) for c in chunks) / len(
                chunks
            )

            # Count paths used
            paths = set(c.get("retrieval_path", "unknown") for c in chunks)
            path_str = ", ".join(paths) if len(paths) > 1 else list(paths)[0]

            sources.append(
                KnowledgeSource(
                    category=category,
                    relevance_score=avg_similarity,
                    chunks=chunks[:5],
                    selection_reason=f"Multi-path: {path_str} (avg: {avg_similarity:.3f})",
                )
            )

        sources.sort(key=lambda x: x.relevance_score, reverse=True)
        return sources[:top_k]

    def _generate_reasoning(
        self,
        selected_sources: List[KnowledgeSource],
        predicted_categories: List[str],
        retrieval_stats: Dict[str, int],
    ) -> str:
        """Generate explanation for selection"""
        if not selected_sources:
            return "未匹配到特定知识库，使用通用医学知识。"

        parts = []
        parts.append(
            f"预测疾病分类: {', '.join(predicted_categories) if predicted_categories else '未确定'}"
        )
        parts.append(f"召回路径统计: {retrieval_stats}")
        parts.append(f"选中 {len(selected_sources)} 个知识源:")

        for source in selected_sources:
            parts.append(
                f"  - {source.category}: {len(source.chunks)} 片段 (相关度: {source.relevance_score:.3f})"
            )

        return "\n".join(parts)

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity"""
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0

        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = sum(a * a for a in vec1) ** 0.5
        magnitude2 = sum(a * a for a in vec2) ** 0.5

        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0

        return dot_product / (magnitude1 * magnitude2)


# Global service accessor
async def get_multi_path_rag_selector(db: AsyncSession) -> MultiPathRAGSelector:
    """Get MultiPathRAGSelector instance"""
    return MultiPathRAGSelector(db)
