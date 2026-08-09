"""
RAG Enhancement Service - RAG增强服务
Provides HyDE query expansion and context compression using existing LLM.
使用现有LLM提供HyDE查询扩展和上下文压缩功能。

Features | 功能:
- HyDE (Hypothetical Document Embeddings): Generate hypothetical answers for better retrieval
- Context Compression: Extract relevant content from retrieved chunks
- Query Rewriting: Expand and refine user queries

No additional models required - uses existing AI service configuration.
无需额外模型 - 使用现有AI服务配置。
"""

import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ai_service import AIService

logger = logging.getLogger(__name__)


class RAGEnhancementService:
    """
    RAG Enhancement Service | RAG增强服务

    Enhances retrieval quality through LLM-based techniques.
    通过基于LLM的技术提升检索质量。
    """

    def __init__(self, db: AsyncSession = None):
        self.db = db
        self._ai_service: Optional[AIService] = None

    async def _get_ai_service(self) -> AIService:
        """Get or initialize AI service with database config | 获取或初始化AI服务"""
        if self._ai_service is None:
            self._ai_service = AIService()
            if self.db:
                await self._ai_service.reload_config_from_db(self.db)
        return self._ai_service

    async def hyde_expand_query(
        self, query: str, context: Optional[str] = None, language: str = "zh"
    ) -> Dict[str, Any]:
        """
        HyDE: Generate hypothetical document for query expansion | HyDE查询扩展

        Generates a hypothetical answer/document that would contain the answer to the query.
        This hypothetical document is then used for vector search instead of the original query.

        Args:
            query: Original user query (symptoms, questions, etc.)
            context: Optional context (e.g., patient history, previous diagnoses)
            language: Language code ('zh' for Chinese, 'en' for English)

        Returns:
            {
                'original_query': str,
                'hypothetical_document': str,
                'expanded_keywords': List[str],
                'confidence': float
            }

        Example:
            Input: "咳嗽一周，有痰"
            Output: {
                'hypothetical_document': '患者因呼吸道感染就诊，表现为持续性咳嗽...',
                'expanded_keywords': ['呼吸道感染', '咳嗽', '痰', '支气管炎']
            }
        """
        ai_service = await self._get_ai_service()

        # Build HyDE prompt
        if language == "zh":
            system_prompt = """你是一位专业的医学信息生成助手。你的任务是根据用户查询生成一段包含答案的假设性医疗文档。

要求：
1. 文档应模拟真实的医疗指南或病例描述
2. 包含与查询相关的症状、诊断和治疗信息
3. 使用专业的医学术语
4. 文档长度控制在200-300字
5. 同时提取5-8个相关的医学关键词

输出格式（JSON）：
{
    "hypothetical_document": "生成的假设性文档内容...",
    "keywords": ["关键词1", "关键词2", ...],
    "confidence": 0.95
}"""

            user_prompt = f"""基于以下查询生成假设性医疗文档：

查询：{query}

{f"患者背景信息：{context}" if context else ""}

请生成一段可能包含该问题答案的医疗文档，并提取相关关键词。"""
        else:
            system_prompt = """You are a medical information generation assistant. Generate a hypothetical medical document that would contain the answer to the user's query.

Requirements:
1. Document should simulate real medical guidelines or case descriptions
2. Include symptoms, diagnosis, and treatment information related to the query
3. Use professional medical terminology
4. Document length: 200-300 words
5. Extract 5-8 relevant medical keywords

Output format (JSON):
{
    "hypothetical_document": "Generated hypothetical document...",
    "keywords": ["keyword1", "keyword2", ...],
    "confidence": 0.95
}"""

            user_prompt = f"""Generate a hypothetical medical document for this query:

Query: {query}

{f"Patient context: {context}" if context else ""}

Please generate a document that might contain the answer and extract relevant keywords."""

        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]

            response = await ai_service.chat_with_glm(messages)

            if response and "choices" in response:
                content = response["choices"][0]["message"]["content"]

                # Parse JSON response
                try:
                    import json

                    # Extract JSON from response (handle markdown code blocks)
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0]
                    elif "```" in content:
                        content = content.split("```")[1].split("```")[0]

                    result = json.loads(content.strip())

                    return {
                        "original_query": query,
                        "hypothetical_document": result.get(
                            "hypothetical_document", ""
                        ),
                        "expanded_keywords": result.get("keywords", []),
                        "confidence": result.get("confidence", 0.8),
                    }
                except json.JSONDecodeError:
                    # Fallback: treat entire response as hypothetical document
                    return {
                        "original_query": query,
                        "hypothetical_document": content.strip(),
                        "expanded_keywords": self._extract_keywords_fallback(
                            query, content
                        ),
                        "confidence": 0.7,
                    }

        except Exception as e:
            logger.error(f"HyDE expansion failed: {e}")

        # Fallback: return original query if HyDE fails
        return {
            "original_query": query,
            "hypothetical_document": query,
            "expanded_keywords": query.split(),
            "confidence": 0.0,
        }

    async def rewrite_query(
        self,
        query: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        language: str = "zh",
    ) -> str:
        """
        Rewrite query for better retrieval | 查询改写

        Expands abbreviations, corrects typos, adds synonyms, and makes the query
        more suitable for medical knowledge base retrieval.

        Args:
            query: Original user query
            chat_history: Previous conversation turns for context
            language: Language code

        Returns:
            Rewritten query optimized for retrieval

        Example:
            Input: "高血压吃什么药"
            Output: "高血压患者药物治疗方案 降压药选择 高血压用药指南"
        """
        ai_service = await self._get_ai_service()

        if language == "zh":
            system_prompt = """你是一位医学查询优化专家。将用户的查询改写为更适合医疗知识库检索的形式。

改写要求：
1. 扩展医学缩写（如"心梗"→"心肌梗死"）
2. 添加同义词和相关术语
3. 保持医学术语的准确性
4. 输出格式：改写后的查询（不要解释）

示例：
输入：高血压吃什么药
输出：高血压患者药物治疗方案 降压药选择 高血压用药指南 降压药种类"""

            user_prompt = f"请改写以下查询：\n\n{query}"

            if chat_history:
                user_prompt += (
                    f"\n\n对话历史：\n{self._format_chat_history(chat_history)}"
                )
        else:
            system_prompt = """You are a medical query optimization expert. Rewrite queries for better medical knowledge base retrieval.

Requirements:
1. Expand medical abbreviations
2. Add synonyms and related terms
3. Maintain medical terminology accuracy
4. Output: rewritten query only (no explanations)"""

            user_prompt = f"Rewrite this query:\n\n{query}"

        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]

            response = await ai_service.chat_with_glm(messages)

            if response and "choices" in response:
                rewritten = response["choices"][0]["message"]["content"].strip()
                logger.info(f"Query rewritten: '{query}' -> '{rewritten}'")
                return rewritten

        except Exception as e:
            logger.error(f"Query rewriting failed: {e}")

        return query  # Fallback to original

    async def compress_context(
        self,
        query: str,
        chunks: List[Dict[str, Any]],
        max_tokens: int = 2000,
        language: str = "zh",
    ) -> Dict[str, Any]:
        """
        Context Compression: Extract relevant content from chunks | 上下文压缩

        Uses LLM to extract only the content relevant to the query from retrieved chunks,
        reducing noise and token usage.

        Args:
            query: User query
            chunks: Retrieved knowledge base chunks
            max_tokens: Maximum tokens for compressed context
            language: Language code

        Returns:
            {
                'compressed_text': str,  # Compressed and organized content
                'key_points': List[str],  # Key information points extracted
                'sources': List[Dict],    # Source references
                'relevance_score': float  # Overall relevance
            }

        Example:
            Input chunks: ["糖尿病患者应控制饮食...", "胰岛素治疗适用于..."]
            Output: {
                'compressed_text': '糖尿病治疗方案包括：1.饮食控制 2.胰岛素治疗...',
                'key_points': ['饮食控制是基础', '胰岛素用于1型糖尿病'],
                'sources': [{'document': '糖尿病指南.md', 'section': '治疗'}]
            }
        """
        ai_service = await self._get_ai_service()

        # Prepare chunks text
        chunks_text = "\n\n".join(
            [
                f"[文档: {c.get('document_title', 'Unknown')} - 章节: {c.get('section_title', 'Unknown')}]\n{c.get('text', '')}"
                for c in chunks
            ]
        )

        if language == "zh":
            system_prompt = f"""你是一位医学信息整理专家。从提供的知识库内容中提取与用户查询相关的信息，并进行压缩整理。

要求：
1. 只保留与查询直接相关的内容
2. 按重要性组织信息
3. 保留医学术语和关键数据
4. 提取3-5个关键要点
5. 总长度控制在{max_tokens} tokens以内

输出格式（JSON）：
{{
    "compressed_text": "压缩整理后的内容...",
    "key_points": ["要点1", "要点2", ...],
    "relevance_score": 0.92
}}"""

            user_prompt = f"""查询：{query}

知识库内容：
{chunks_text}

请提取相关信息并压缩整理。"""
        else:
            system_prompt = f"""You are a medical information specialist. Extract and compress relevant content from knowledge base chunks.

Requirements:
1. Keep only content directly relevant to the query
2. Organize by importance
3. Preserve medical terminology
4. Extract 3-5 key points
5. Limit to {max_tokens} tokens

Output format (JSON):
{{
    "compressed_text": "Compressed content...",
    "key_points": ["point1", "point2", ...],
    "relevance_score": 0.92
}}"""

            user_prompt = f"""Query: {query}

Knowledge base content:
{chunks_text}

Extract and compress relevant information."""

        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]

            response = await ai_service.chat_with_glm(messages)

            if response and "choices" in response:
                content = response["choices"][0]["message"]["content"]

                # Parse JSON
                try:
                    import json

                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0]
                    elif "```" in content:
                        content = content.split("```")[1].split("```")[0]

                    result = json.loads(content.strip())

                    # Add source references
                    sources = [
                        {
                            "document": c.get("document_title", "Unknown"),
                            "section": c.get("section_title", "Unknown"),
                            "chunk_id": c.get("id", "Unknown"),
                        }
                        for c in chunks
                    ]

                    return {
                        "compressed_text": result.get("compressed_text", ""),
                        "key_points": result.get("key_points", []),
                        "sources": sources,
                        "relevance_score": result.get("relevance_score", 0.8),
                    }

                except json.JSONDecodeError:
                    # Fallback
                    return {
                        "compressed_text": content.strip()[
                            : max_tokens * 4
                        ],  # Rough token estimate
                        "key_points": [],
                        "sources": [
                            {"document": c.get("document_title")} for c in chunks
                        ],
                        "relevance_score": 0.7,
                    }

        except Exception as e:
            logger.error(f"Context compression failed: {e}")

        # Fallback: concatenate chunks
        return {
            "compressed_text": "\n\n".join([c.get("text", "") for c in chunks])[
                : max_tokens * 4
            ],
            "key_points": [],
            "sources": [{"document": c.get("document_title")} for c in chunks],
            "relevance_score": 0.5,
        }

    async def enhance_retrieval_query(
        self,
        query: str,
        use_hyde: bool = True,
        use_rewrite: bool = True,
        context: Optional[str] = None,
        language: str = "zh",
    ) -> Dict[str, Any]:
        """
        Complete query enhancement pipeline | 完整查询增强流程

        Combines query rewriting + HyDE expansion for maximum retrieval quality.

        Args:
            query: Original user query
            use_hyde: Whether to use HyDE expansion
            use_rewrite: Whether to rewrite query
            context: Optional patient context
            language: Language code

        Returns:
            {
                'original_query': str,
                'rewritten_query': str,
                'hyde_result': Dict,  # If use_hyde=True
                'final_search_query': str,  # Query to use for vector search
                'expanded_keywords': List[str]
            }
        """
        result = {
            "original_query": query,
            "rewritten_query": query,
            "hyde_result": None,
            "final_search_query": query,
            "expanded_keywords": [],
        }

        # Step 1: Query Rewriting
        if use_rewrite:
            result["rewritten_query"] = await self.rewrite_query(
                query, language=language
            )

        # Step 2: HyDE Expansion
        if use_hyde:
            hyde_result = await self.hyde_expand_query(
                query=result["rewritten_query"], context=context, language=language
            )
            result["hyde_result"] = hyde_result
            result["final_search_query"] = hyde_result["hypothetical_document"]
            result["expanded_keywords"] = hyde_result["expanded_keywords"]
        else:
            result["final_search_query"] = result["rewritten_query"]

        logger.info(
            f"Query enhancement complete: '{query[:50]}...' -> "
            f"'{result['final_search_query'][:50]}...'"
        )

        return result

    def _extract_keywords_fallback(self, query: str, document: str) -> List[str]:
        """Fallback keyword extraction | 后备关键词提取"""
        # Simple extraction: split and take meaningful words
        import re

        # Combine query and document
        text = f"{query} {document}"

        # Extract Chinese words (2-8 characters)
        chinese_words = re.findall(r"[\u4e00-\u9fa5]{2,8}", text)

        # Extract English medical terms
        english_words = re.findall(r"[a-zA-Z]{4,}", text.lower())

        # Combine and deduplicate
        all_words = list(set(chinese_words + english_words))

        # Return top 8
        return all_words[:8]

    def _format_chat_history(self, history: List[Dict[str, str]]) -> str:
        """Format chat history for prompts | 格式化对话历史"""
        formatted = []
        for turn in history[-3:]:  # Only last 3 turns
            role = turn.get("role", "user")
            content = turn.get("content", "")
            formatted.append(f"{role}: {content}")
        return "\n".join(formatted)


# Global instance
rag_enhancement_service = RAGEnhancementService()
