"""
Vector Embedding API Endpoints | 向量嵌入API端点
Admin-only endpoints for managing embedding models and knowledge base.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import logging
from app.db.database import get_db
from app.services.vector_embedding_service import VectorEmbeddingService
from app.services.kb_vectorization_service import KnowledgeBaseVectorizationService
from app.core.deps import get_current_active_user
from app.models.models import User
import uuid

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/configs", response_model=list[dict])
async def list_embedding_configs(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> list[dict]:
    """List all embedding configurations (Admin only)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    service = VectorEmbeddingService(db)
    configs = await service.get_all_configs()
    
    return [
        {
            "id": str(config.id),
            "name": config.name,
            "provider": config.provider,
            "model_id": config.model_id,
            "vector_dimension": config.vector_dimension,
            "is_active": config.is_active,
            "is_default": config.is_default,
            "test_status": config.test_status,
            "last_tested_at": config.last_tested_at.isoformat() if config.last_tested_at else None,
            "created_at": config.created_at.isoformat() if config.created_at else None
        }
        for config in configs
    ]


@router.post("/configs", response_model=dict)
async def create_embedding_config(
    name: str,
    provider: str,
    model_id: str,
    api_url: str,
    api_key: str,
    vector_dimension: int = 1536,
    max_input_length: int = 8192,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Create new embedding configuration (Admin only)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    service = VectorEmbeddingService(db)
    config = await service.create_config(
        name=name,
        provider=provider,
        model_id=model_id,
        api_url=api_url,
        api_key=api_key,
        vector_dimension=vector_dimension,
        max_input_length=max_input_length,
        created_by=current_user.id
    )
    
    return {
        "id": str(config.id),
        "name": config.name,
        "provider": config.provider,
        "model_id": config.model_id,
        "test_status": config.test_status,
        "message": "Configuration created. Please test the connection."
    }


@router.post("/configs/{config_id}/test", response_model=dict)
async def test_embedding_config(
    config_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Test embedding configuration (Admin only)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    service = VectorEmbeddingService(db)
    result = await service.test_config(config_id)
    
    return result


@router.post("/configs/{config_id}/activate")
async def activate_embedding_config(
    config_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Activate embedding configuration (Admin only)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    service = VectorEmbeddingService(db)
    await service.set_active(config_id, True)
    
    return {"message": "Configuration activated"}


@router.post("/configs/{config_id}/set-default")
async def set_default_embedding_config(
    config_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Set default embedding configuration (Admin only)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    service = VectorEmbeddingService(db)
    await service.set_default(config_id)
    
    return {"message": "Configuration set as default"}


@router.delete("/configs/{config_id}")
async def delete_embedding_config(
    config_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Delete embedding configuration (Admin only)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    service = VectorEmbeddingService(db)
    success = await service.delete_config(config_id)
    
    if success:
        return {"message": "Configuration deleted"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )


@router.post("/knowledge-base/vectorize")
async def vectorize_knowledge_document(
    document_content: str,
    document_title: str,
    disease_category: str,
    disease_id: uuid.UUID = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Vectorize a knowledge base document (Admin only)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    service = KnowledgeBaseVectorizationService(db)
    result = await service.vectorize_markdown_document(
        document_content=document_content,
        document_title=document_title,
        disease_category=disease_category,
        disease_id=disease_id,
        source_type='disease_guideline',
        created_by=current_user.id
    )
    
    return result


@router.get("/knowledge-base/statistics")
async def get_kb_statistics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Get knowledge base vectorization statistics (Admin only)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    service = KnowledgeBaseVectorizationService(db)
    stats = await service.get_chunk_statistics()
    
    return stats


@router.post("/knowledge-base/search")
async def search_knowledge_base(
    query: str,
    disease_category: str = None,
    source_type: str = None,
    document_title: str = None,
    top_k: int = 5,
    enable_hybrid: bool = True,
    vector_weight: float = 0.7,
    keyword_weight: float = 0.3,
    use_hyde: bool = False,
    min_similarity: float = 0.6,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> list[dict]:
    """
    Search knowledge base with hybrid retrieval (vector + full-text) | 混合检索知识库
    
    Supports:
    - Hybrid search: Combines vector similarity + PostgreSQL full-text search (RRF fusion)
    - Metadata filtering: Filter by disease_category, source_type, document_title
    - HyDE expansion: Use LLM to generate hypothetical documents for better retrieval
    
    Parameters:
    - query: Search query text
    - disease_category: Filter by disease category (e.g., 'respiratory', 'cardiovascular')
    - source_type: Filter by source type ('disease_guideline', 'medical_document', 'research_paper', 'unified_kb')
    - document_title: Filter by document title (partial match)
    - top_k: Number of results to return (default: 5)
    - enable_hybrid: Enable hybrid search (vector + keyword). If false, uses vector only.
    - vector_weight: Weight for vector search scores (0-1, default: 0.7)
    - keyword_weight: Weight for keyword search scores (0-1, default: 0.3)
    - use_hyde: Use HyDE (Hypothetical Document Embeddings) for query expansion
    - min_similarity: Minimum similarity threshold for vector search (default: 0.6)
    """
    from app.services.rag_enhancement_service import RAGEnhancementService
    
    search_query = query
    
    # Apply HyDE query expansion if enabled
    if use_hyde:
        enhancement_service = RAGEnhancementService(db)
        enhancement_result = await enhancement_service.enhance_retrieval_query(
            query=query,
            use_hyde=True,
            use_rewrite=True,
            language="zh" if current_user.language == "zh" else "en"
        )
        search_query = enhancement_result['final_search_query']
    
    # Perform search
    service = KnowledgeBaseVectorizationService(db)
    
    if enable_hybrid:
        results = await service.hybrid_search(
            query_text=search_query,
            disease_category=disease_category,
            source_type=source_type,
            document_title=document_title,
            top_k=top_k,
            min_similarity=min_similarity,
            vector_weight=vector_weight,
            keyword_weight=keyword_weight,
            enable_hybrid=True
        )
    else:
        # Fallback to vector-only search
        results = await service.search_similar_chunks(
            query_text=search_query,
            disease_category=disease_category,
            top_k=top_k,
            min_similarity=min_similarity
        )
    
    return results


@router.post("/knowledge-base/compress")
async def compress_knowledge_base_results(
    query: str,
    chunk_ids: List[str],
    max_tokens: int = 2000,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Compress retrieved knowledge base chunks using LLM | 上下文压缩
    
    Extracts only the content relevant to the query from retrieved chunks,
    reducing noise and token usage for AI diagnosis.
    
    Parameters:
    - query: User query to determine relevance
    - chunk_ids: List of knowledge base chunk IDs to compress
    - max_tokens: Maximum tokens for compressed output (default: 2000)
    """
    from app.services.rag_enhancement_service import RAGEnhancementService
    from app.models.models import KnowledgeBaseChunk
    from sqlalchemy import select
    
    try:
        # Fetch chunks by IDs
        stmt = select(KnowledgeBaseChunk).where(
            KnowledgeBaseChunk.id.in_(chunk_ids),
            KnowledgeBaseChunk.is_active == True
        )
        result = await db.execute(stmt)
        chunks = result.scalars().all()
        
        if not chunks:
            return {
                "compressed_text": "",
                "key_points": [],
                "sources": [],
                "relevance_score": 0.0,
                "message": "No chunks found for the provided IDs"
            }
        
        # Format chunks for compression
        chunk_dicts = [
            {
                'id': str(chunk.id),
                'text': chunk.chunk_text,
                'section_title': chunk.section_title,
                'document_title': chunk.document_title,
                'disease_category': chunk.disease_category
            }
            for chunk in chunks
        ]
        
        # Compress context
        enhancement_service = RAGEnhancementService(db)
        compressed = await enhancement_service.compress_context(
            query=query,
            chunks=chunk_dicts,
            max_tokens=max_tokens,
            language="zh" if current_user.language == "zh" else "en"
        )
        
        return {
            "compressed_text": compressed['compressed_text'],
            "key_points": compressed['key_points'],
            "sources": compressed['sources'],
            "relevance_score": compressed['relevance_score'],
            "original_chunks_count": len(chunks),
            "message": "Context compressed successfully"
        }
        
    except Exception as e:
        logger.error(f"Context compression failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compress context: {str(e)}"
        )


@router.post("/knowledge-base/enhance-query")
async def enhance_search_query(
    query: str,
    use_hyde: bool = True,
    use_rewrite: bool = True,
    context: str = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Enhance search query using HyDE and query rewriting | 查询增强
    
    Returns the enhanced query and metadata without performing actual search.
    Useful for previewing query enhancement effects.
    
    Parameters:
    - query: Original user query
    - use_hyde: Enable HyDE expansion (default: True)
    - use_rewrite: Enable query rewriting (default: True)
    - context: Optional patient context for better HyDE generation
    """
    from app.services.rag_enhancement_service import RAGEnhancementService
    
    try:
        enhancement_service = RAGEnhancementService(db)
        result = await enhancement_service.enhance_retrieval_query(
            query=query,
            use_hyde=use_hyde,
            use_rewrite=use_rewrite,
            context=context,
            language="zh" if current_user.language == "zh" else "en"
        )
        
        return {
            "original_query": result['original_query'],
            "rewritten_query": result['rewritten_query'],
            "final_search_query": result['final_search_query'],
            "expanded_keywords": result['expanded_keywords'],
            "hyde_document": result['hyde_result']['hypothetical_document'] if result['hyde_result'] else None,
            "confidence": result['hyde_result']['confidence'] if result['hyde_result'] else 0.0
        }
        
    except Exception as e:
        logger.error(f"Query enhancement failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to enhance query: {str(e)}"
        )


@router.post("/knowledge-base/build-indices")
async def search_knowledge_base(
    query: str,
    disease_category: str = None,
    top_k: int = 5,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> list[dict]:
    """Search knowledge base using vector similarity"""
    # Allow all authenticated users to search
    service = KnowledgeBaseVectorizationService(db)
    results = await service.search_similar_chunks(
        query_text=query,
        disease_category=disease_category,
        top_k=top_k,
        min_similarity=0.6
    )

    return results


@router.post("/knowledge-base/build-indices")
async def build_kb_indices(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Build adaptive indices from knowledge base content (Admin only).

    This analyzes all knowledge base documents and builds dynamic term indices
    for enhanced retrieval. Should be called after adding new documents.
    """
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    from app.services.kb_analyzer import refresh_kb_indices

    try:
        stats = await refresh_kb_indices(db)
        return {
            "success": True,
            "message": "Knowledge base indices built successfully",
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to build indices: {str(e)}"
        )


@router.get("/knowledge-base/indices-stats")
async def get_kb_indices_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Get knowledge base analyzer statistics (Admin only).

    Returns statistics about the dynamic term indices.
    """
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    from app.services.kb_analyzer import get_kb_analyzer

    try:
        analyzer = await get_kb_analyzer(db)
        stats = analyzer.export_index_stats()
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get stats: {str(e)}"
        )
