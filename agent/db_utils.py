"""
Database utilities for PostgreSQL connection and operations.
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
from uuid import UUID
import logging
import hashlib

import asyncpg
from asyncpg.pool import Pool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class DatabasePool:
    """Manages PostgreSQL connection pool."""
    
    def __init__(self, database_url: Optional[str] = None):
        """
        Initialize database pool.
        
        Args:
            database_url: PostgreSQL connection URL
        """
        self.database_url = database_url or os.getenv("DATABASE_URL")
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable not set")
        
        self.pool: Optional[Pool] = None
    
    async def initialize(self):
        """Create connection pool."""
        if not self.pool:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=5,
                max_size=20,
                max_inactive_connection_lifetime=300,
                command_timeout=60
            )
            logger.info("Database connection pool initialized")
    
    async def close(self):
        """Close connection pool."""
        if self.pool:
            await self.pool.close()
            self.pool = None
            logger.info("Database connection pool closed")
    
    @asynccontextmanager
    async def acquire(self):
        """Acquire a connection from the pool."""
        if not self.pool:
            await self.initialize()
        
        async with self.pool.acquire() as connection:
            yield connection


# Global database pool instance
db_pool = DatabasePool()


async def initialize_database():
    """Initialize database connection pool."""
    await db_pool.initialize()


async def close_database():
    """Close database connection pool."""
    await db_pool.close()


# Account Management Functions
def _sha256(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


async def get_account_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Fetch account by username from accounts table (if exists)."""
    async with db_pool.acquire() as conn:
        try:
            row = await conn.fetchrow(
                """
                SELECT id::text, username, password_hash, full_name, department, domain, title, role, is_active,
                       last_login_at, created_at, updated_at, metadata
                FROM accounts
                WHERE username = $1
                """,
                username,
            )
        except Exception as e:
            logger.error(f"accounts lookup failed: {e}")
            return None
        if not row:
            return None
        meta_val = row["metadata"]
        if isinstance(meta_val, str):
            try:
                meta_val = json.loads(meta_val)
            except Exception:
                meta_val = {}
        return {
            "id": row["id"],
            "username": row["username"],
            "password_hash": row["password_hash"],
            "full_name": row["full_name"],
            "department": row["department"],
            "domain": row["domain"],
            "title": row["title"],
            "role": row["role"],
            "is_active": row["is_active"],
            "last_login_at": row["last_login_at"].isoformat() if row["last_login_at"] else None,
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
            "metadata": meta_val or {},
        }


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password using bcrypt (if hash looks like bcrypt), else sha256 or plaintext for dev."""
    if not stored_hash:
        return False
    # bcrypt prefix
    if stored_hash.startswith("$2"):
        try:
            import bcrypt  # type: ignore
            return bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
        except Exception:
            return False
    # sha256 hex
    if len(stored_hash) == 64 and all(c in "0123456789abcdef" for c in stored_hash.lower()):
        return _sha256(password) == stored_hash
    # dev fallback: plaintext
    return password == stored_hash


async def touch_last_login(account_id: str) -> None:
    async with db_pool.acquire() as conn:
        try:
            await conn.execute("UPDATE accounts SET last_login_at = CURRENT_TIMESTAMP WHERE id=$1::uuid", account_id)
        except Exception as e:
            logger.debug(f"touch_last_login failed: {e}")


async def create_default_accounts_if_missing() -> None:
    async with db_pool.acquire() as conn:
        try:
            await conn.fetchval("SELECT 1 FROM accounts LIMIT 1")
        except Exception:
            logger.info("accounts table not found; skipping default seed")
            return
        async def ensure(username: str, pwd: str, full_name: str, role: str, department: str, domain: str, title: str):
            exists = await conn.fetchval("SELECT 1 FROM accounts WHERE username=$1", username)
            if exists:
                return
            pwd_hash = _sha256(pwd)
            await conn.execute(
                """
                INSERT INTO accounts (username, password_hash, full_name, department, domain, title, role, is_active)
                VALUES ($1,$2,$3,$4,$5,$6,$7, TRUE)
                """,
                username, pwd_hash, full_name, department, domain, title, role,
            )
        await ensure("admin", "admin", "Quản trị hệ thống", "admin", "CNTT", "Hệ thống", "Quản trị viên")
        await ensure("manager", "manager", "Trưởng phòng Tài liệu", "manager", "Tài liệu", "Quản trị tài liệu", "Trưởng phòng")


# Session Management Functions
async def create_session(
    user_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    timeout_minutes: int = 60
) -> str:
    """
    Create a new session.
    
    Args:
        user_id: Optional user identifier
        metadata: Optional session metadata
        timeout_minutes: Session timeout in minutes
    
    Returns:
        Session ID
    """
    async with db_pool.acquire() as conn:
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=timeout_minutes)
        
        result = await conn.fetchrow(
            """
            INSERT INTO sessions (user_id, metadata, expires_at)
            VALUES ($1, $2, $3)
            RETURNING id::text
            """,
            user_id,
            json.dumps(metadata or {}),
            expires_at
        )
        
        return result["id"]


async def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Get session by ID.
    
    Args:
        session_id: Session UUID
    
    Returns:
        Session data or None if not found/expired
    """
    async with db_pool.acquire() as conn:
        result = await conn.fetchrow(
            """
            SELECT 
                id::text,
                user_id,
                metadata,
                created_at,
                updated_at,
                expires_at
            FROM sessions
            WHERE id = $1::uuid
            AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            """,
            session_id
        )
        
        if result:
            return {
                "id": result["id"],
                "user_id": result["user_id"],
                "metadata": json.loads(result["metadata"]),
                "created_at": result["created_at"].isoformat(),
                "updated_at": result["updated_at"].isoformat(),
                "expires_at": result["expires_at"].isoformat() if result["expires_at"] else None
            }
        
        return None


async def update_session(session_id: str, metadata: Dict[str, Any]) -> bool:
    """
    Update session metadata.
    
    Args:
        session_id: Session UUID
        metadata: New metadata to merge
    
    Returns:
        True if updated, False if not found
    """
    async with db_pool.acquire() as conn:
        result = await conn.execute(
            """
            UPDATE sessions
            SET metadata = metadata || $2::jsonb
            WHERE id = $1::uuid
            AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            """,
            session_id,
            json.dumps(metadata)
        )
        
        return result.split()[-1] != "0"


# Message Management Functions
async def add_message(
    session_id: str,
    role: str,
    content: str,
    metadata: Optional[Dict[str, Any]] = None
) -> str:
    """
    Add a message to a session.
    
    Args:
        session_id: Session UUID
        role: Message role (user/assistant/system)
        content: Message content
        metadata: Optional message metadata
    
    Returns:
        Message ID
    """
    async with db_pool.acquire() as conn:
        result = await conn.fetchrow(
            """
            INSERT INTO messages (session_id, role, content, metadata)
            VALUES ($1::uuid, $2, $3, $4)
            RETURNING id::text
            """,
            session_id,
            role,
            content,
            json.dumps(metadata or {})
        )
        
        return result["id"]


async def get_session_messages(
    session_id: str,
    limit: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Get messages for a session.
    
    Args:
        session_id: Session UUID
        limit: Maximum number of messages to return
    
    Returns:
        List of messages ordered by creation time
    """
    async with db_pool.acquire() as conn:
        query = """
            SELECT 
                id::text,
                role,
                content,
                metadata,
                created_at
            FROM messages
            WHERE session_id = $1::uuid
            ORDER BY created_at
        """
        
        if limit:
            query += f" LIMIT {limit}"
        
        results = await conn.fetch(query, session_id)
        
        return [
            {
                "id": row["id"],
                "role": row["role"],
                "content": row["content"],
                "metadata": json.loads(row["metadata"]),
                "created_at": row["created_at"].isoformat()
            }
            for row in results
        ]


# Document Management Functions
async def get_document(document_id: str) -> Optional[Dict[str, Any]]:
    """
    Get document by ID.
    
    Args:
        document_id: Document UUID
    
    Returns:
        Document data or None if not found
    """
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT 
                d.id::text AS id,
                d.title,
                d.source,
                d.content,
                /* merge normalized columns and lookup names into metadata for UI */
                (d.metadata 
                  || jsonb_build_object(
                        'author_id', d.author_id::text,
                        'author', COALESCE(a.full_name, a.username),
                        'effective_date', to_char(d.effective_date, 'YYYY-MM-DD'),
                        'document_type_id', d.document_type_id::text,
                        'issuing_unit_id', d.issuing_unit_id::text,
                        'site_id', d.site_id::text,
                        'document_type_name', COALESCE(dt.name, NULL),
                        'issuing_unit_name', COALESCE(ou.name, NULL),
                        'site_name', COALESCE(s.name, NULL)
                    )
                ) AS metadata,
                d.created_at,
                d.updated_at
            FROM documents d
            LEFT JOIN document_types dt ON dt.id = d.document_type_id
            LEFT JOIN org_units ou ON ou.id = d.issuing_unit_id
            LEFT JOIN sites s ON s.id = d.site_id
            LEFT JOIN accounts a ON a.id = d.author_id
            WHERE d.id = $1::uuid
            """,
            document_id
        )

        if not row:
            return None
        meta_val = row["metadata"]
        if isinstance(meta_val, str):
            try:
                meta_val = json.loads(meta_val)
            except Exception:
                meta_val = {}
        return {
            "id": row["id"],
            "title": row["title"],
            "source": row["source"],
            "content": row["content"],
            "metadata": meta_val or {},
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
        }


async def list_documents(
    limit: int = 100,
    offset: int = 0,
    metadata_filter: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    List documents with optional filtering.
    
    Args:
        limit: Maximum number of documents to return
        offset: Number of documents to skip
        metadata_filter: Optional metadata filter
    
    Returns:
        List of documents
    """
    async with db_pool.acquire() as conn:
        query = """
            SELECT 
                d.id::text,
                d.title,
                d.source,
                /* merge normalized columns and lookup names into metadata for UI */
                (d.metadata 
                  || jsonb_build_object(
                        'author_id', d.author_id::text,
                        'author', COALESCE(a.full_name, a.username),
                        'effective_date', to_char(d.effective_date, 'YYYY-MM-DD'),
                        'document_type_id', d.document_type_id::text,
                        'issuing_unit_id', d.issuing_unit_id::text,
                        'site_id', d.site_id::text,
                        'document_type_name', COALESCE(dt.name, NULL),
                        'issuing_unit_name', COALESCE(ou.name, NULL),
                        'site_name', COALESCE(s.name, NULL)
                    )
                ) AS metadata,
                d.created_at,
                d.updated_at,
                COUNT(c.id) AS chunk_count
            FROM documents d
            LEFT JOIN document_types dt ON dt.id = d.document_type_id
            LEFT JOIN org_units ou ON ou.id = d.issuing_unit_id
            LEFT JOIN sites s ON s.id = d.site_id
            LEFT JOIN accounts a ON a.id = d.author_id
            LEFT JOIN chunks c ON d.id = c.document_id
        """
        
        params = []
        conditions = []
        
        if metadata_filter:
            conditions.append(f"d.metadata @> ${len(params) + 1}::jsonb")
            params.append(json.dumps(metadata_filter))
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += """
            GROUP BY d.id, d.title, d.source, d.metadata, d.created_at, d.updated_at, dt.name, ou.name, s.name, a.full_name, a.username
            ORDER BY d.created_at DESC
            LIMIT $%d OFFSET $%d
        """ % (len(params) + 1, len(params) + 2)
        
        params.extend([limit, offset])
        
        results = await conn.fetch(query, *params)
        
        return [
            {
                "id": row["id"],
                "title": row["title"],
                "source": row["source"],
                "metadata": json.loads(row["metadata"]),
                "created_at": row["created_at"].isoformat(),
                "updated_at": row["updated_at"].isoformat(),
                "chunk_count": row["chunk_count"]
            }
            for row in results
        ]


# Vector Search Functions
async def vector_search(
    embedding: List[float],
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Perform vector similarity search.
    
    Args:
        embedding: Query embedding vector
        limit: Maximum number of results
    
    Returns:
        List of matching chunks ordered by similarity (best first)
    """
    async with db_pool.acquire() as conn:
        # Convert embedding to PostgreSQL vector string format
        # PostgreSQL vector format: '[1.0,2.0,3.0]' (no spaces after commas)
        embedding_str = '[' + ','.join(map(str, embedding)) + ']'
        
        results = await conn.fetch(
            "SELECT * FROM match_chunks($1::vector, $2)",
            embedding_str,
            limit
        )
        
        return [
            {
                "chunk_id": row["chunk_id"],
                "document_id": row["document_id"],
                "content": row["content"],
                "similarity": row["similarity"],
                "metadata": json.loads(row["metadata"]),
                "document_title": row["document_title"],
                "document_source": row["document_source"]
            }
            for row in results
        ]


async def hybrid_search(
    embedding: List[float],
    query_text: str,
    limit: int = 10,
    text_weight: float = 0.3
) -> List[Dict[str, Any]]:
    """
    Perform hybrid search (vector + keyword).
    
    Args:
        embedding: Query embedding vector
        query_text: Query text for keyword search
        limit: Maximum number of results
        text_weight: Weight for text similarity (0-1)
    
    Returns:
        List of matching chunks ordered by combined score (best first)
    """
    async with db_pool.acquire() as conn:
        # Convert embedding to PostgreSQL vector string format
        # PostgreSQL vector format: '[1.0,2.0,3.0]' (no spaces after commas)
        embedding_str = '[' + ','.join(map(str, embedding)) + ']'
        
        results = await conn.fetch(
            "SELECT * FROM hybrid_search($1::vector, $2, $3, $4)",
            embedding_str,
            query_text,
            limit,
            text_weight
        )
        
        return [
            {
                "chunk_id": row["chunk_id"],
                "document_id": row["document_id"],
                "content": row["content"],
                "combined_score": row["combined_score"],
                "vector_similarity": row["vector_similarity"],
                "text_similarity": row["text_similarity"],
                "metadata": json.loads(row["metadata"]),
                "document_title": row["document_title"],
                "document_source": row["document_source"]
            }
            for row in results
        ]


# Chunk Management Functions
async def get_document_chunks(document_id: str) -> List[Dict[str, Any]]:
    """
    Get all chunks for a document.
    
    Args:
        document_id: Document UUID
    
    Returns:
        List of chunks ordered by chunk index
    """
    async with db_pool.acquire() as conn:
        results = await conn.fetch(
            "SELECT * FROM get_document_chunks($1::uuid)",
            document_id
        )
        
        return [
            {
                "chunk_id": row["chunk_id"],
                "content": row["content"],
                "chunk_index": row["chunk_index"],
                "metadata": json.loads(row["metadata"])
            }
            for row in results
        ]


# Utility Functions
async def execute_query(query: str, *params) -> List[Dict[str, Any]]:
    """
    Execute a custom query.
    
    Args:
        query: SQL query
        *params: Query parameters
    
    Returns:
        Query results
    """
    async with db_pool.acquire() as conn:
        results = await conn.fetch(query, *params)
        return [dict(row) for row in results]


async def test_connection() -> bool:
    """
    Test database connection.
    
    Returns:
        True if connection successful
    """
    try:
        async with db_pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False
