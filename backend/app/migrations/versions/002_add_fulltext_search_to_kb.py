"""
Migration: Add Full-Text Search to Knowledge Base | 为知识库添加全文搜索支持

This migration adds PostgreSQL full-text search capability to the knowledge base
for hybrid search (vector + keyword) functionality.

Revision ID: 002_add_fulltext_search_to_kb
Revises: 001_add_user_sessions_table
Create Date: 2025-02-25
"""

from typing import Sequence, Union

# revision identifiers, used by Alembic
revision: str = "002_add_fulltext_search_to_kb"
down_revision: Union[str, None] = "001_add_user_sessions_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Upgrade database schema to add full-text search support.

    Adds:
    1. search_vector column (tsvector type) to knowledge_base_chunks table
    2. GIN index for fast full-text search
    3. Trigger to auto-update search_vector on chunk_text changes
    """
    from sqlalchemy import text
    from app.db.database import engine

    with engine.connect() as conn:
        # 1. Add search_vector column (tsvector for Chinese text search)
        conn.execute(
            text("""
            ALTER TABLE knowledge_base_chunks 
            ADD COLUMN IF NOT EXISTS search_vector tsvector 
            GENERATED ALWAYS AS (
                setweight(to_tsvector('chinese', chunk_text), 'A') ||
                setweight(to_tsvector('chinese', section_title), 'B') ||
                setweight(to_tsvector('chinese', document_title), 'C')
            ) STORED
        """)
        )

        # 2. Create GIN index for fast full-text search
        conn.execute(
            text("""
            CREATE INDEX IF NOT EXISTS idx_kb_chunks_search_vector 
            ON knowledge_base_chunks 
            USING GIN (search_vector)
        """)
        )

        # 3. Create index for disease_category + is_active combined queries
        conn.execute(
            text("""
            CREATE INDEX IF NOT EXISTS idx_kb_chunks_category_active 
            ON knowledge_base_chunks (disease_category, is_active)
        """)
        )

        # 4. Create index for source_type filtering
        conn.execute(
            text("""
            CREATE INDEX IF NOT EXISTS idx_kb_chunks_source_type 
            ON knowledge_base_chunks (source_type)
        """)
        )

        conn.commit()

    print("✅ Full-text search columns and indexes added successfully")


def downgrade() -> None:
    """
    Downgrade database schema to remove full-text search support.
    """
    from sqlalchemy import text
    from app.db.database import engine

    with engine.connect() as conn:
        # Drop indexes
        conn.execute(
            text("""
            DROP INDEX IF EXISTS idx_kb_chunks_source_type
        """)
        )

        conn.execute(
            text("""
            DROP INDEX IF EXISTS idx_kb_chunks_category_active
        """)
        )

        conn.execute(
            text("""
            DROP INDEX IF EXISTS idx_kb_chunks_search_vector
        """)
        )

        # Drop column
        conn.execute(
            text("""
            ALTER TABLE knowledge_base_chunks 
            DROP COLUMN IF EXISTS search_vector
        """)
        )

        conn.commit()

    print("✅ Full-text search columns and indexes removed")
