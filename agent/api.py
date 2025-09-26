"""
FastAPI endpoints for the agentic RAG system.
"""

import os
import asyncio
import json
import logging
import mimetypes
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional
from datetime import datetime, date
from pathlib import Path
import uuid

from fastapi import FastAPI, HTTPException, Request, Depends, UploadFile, File, Form, Query
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn
from dotenv import load_dotenv

from .agent import rag_agent, AgentDependencies
from .db_utils import (
    initialize_database,
    close_database,
    create_session,
    get_session,
    get_document as db_get_document,
    add_message,
    get_session_messages,
    test_connection,
    get_account_by_username,
    verify_password,
    touch_last_login,
    create_default_accounts_if_missing,
    db_pool,
)
from .graph_utils import initialize_graph, close_graph, test_graph_connection
from .models import (
    ChatRequest,
    ChatResponse,
    SearchRequest,
    SearchResponse,
    StreamDelta,
    ErrorResponse,
    HealthStatus,
    ToolCall,
    IngestionConfig
)
from .tools import (
    vector_search_tool,
    graph_search_tool,
    hybrid_search_tool,
    list_documents_tool,
    VectorSearchInput,
    GraphSearchInput,
    HybridSearchInput,
    DocumentListInput
)

from ingestion.ingest import ingest_file
from ingestion.chunker import create_chunker, ChunkingConfig
from ingestion.embedder import create_embedder

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Application configuration
APP_ENV = os.getenv("APP_ENV", "development")
APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", 8000))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Set debug level for our module during development
if APP_ENV == "development":
    logger.setLevel(logging.DEBUG)

# Metadata input models for admin CRUD
from pydantic import BaseModel
from typing import Optional

class DocumentTypeIn(BaseModel):
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    is_active: Optional[bool] = True

class OrgUnitIn(BaseModel):
    code: Optional[str] = None
    name: str
    parent_id: Optional[str] = None
    parent_ref: Optional[str] = None  # accept code or name
    child_ref: Optional[str] = None   # if provided, set this existing unit's parent to the new/updated unit
    is_active: Optional[bool] = True

class SiteIn(BaseModel):
    name: str
    kind: Optional[str] = None
    is_active: Optional[bool] = True

class EquipmentIn(BaseModel):
    code: Optional[str] = None
    name: str
    is_active: Optional[bool] = True

class KeywordIn(BaseModel):
    name: str
    is_active: Optional[bool] = True


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI app."""
    # Startup
    logger.info("Starting up agentic RAG API...")
    
    try:
        # Initialize database connections
        await initialize_database()
        logger.info("Database initialized")
        
        # Initialize graph database
        await initialize_graph()
        logger.info("Graph database initialized")
        
        # Test connections
        db_ok = await test_connection()
        graph_ok = await test_graph_connection()
        
        if not db_ok:
            logger.error("Database connection failed")
        if not graph_ok:
            logger.error("Graph database connection failed")
        
        # Seed default accounts if accounts table exists
        try:
            await create_default_accounts_if_missing()
        except Exception as e:
            logger.warning(f"Account seeding skipped: {e}")

        logger.info("Agentic RAG API startup complete")
        
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down agentic RAG API...")
    
    try:
        await close_database()
        await close_graph()
        logger.info("Connections closed")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")


# Create FastAPI app
app = FastAPI(
    title="Agentic RAG with Knowledge Graph",
    description="AI agent combining vector search and knowledge graph for tech company analysis",
    version="0.1.0",
    lifespan=lifespan
)

# Add middleware with flexible CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# Auth models
from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

class AccountOut(BaseModel):
    id: str
    username: str
    full_name: str
    department: str | None = None
    domain: str | None = None
    title: str | None = None
    role: str

class LoginResponse(BaseModel):
    user: AccountOut
    session_id: str


# Helper functions for agent execution
async def get_or_create_session(request: ChatRequest) -> str:
    """Get existing session or create new one."""
    if request.session_id:
        session = await get_session(request.session_id)
        if session:
            return request.session_id
    
    # Create new session
    return await create_session(
        user_id=request.user_id,
        metadata=request.metadata
    )


async def get_conversation_context(
    session_id: str,
    max_messages: int = 10
) -> List[Dict[str, str]]:
    """
    Get recent conversation context.
    
    Args:
        session_id: Session ID
        max_messages: Maximum number of messages to retrieve
    
    Returns:
        List of messages
    """
    messages = await get_session_messages(session_id, limit=max_messages)
    
    return [
        {
            "role": msg["role"],
            "content": msg["content"]
        }
        for msg in messages
    ]


def extract_tool_calls(result) -> List[ToolCall]:
    """
    Extract tool calls from Pydantic AI result.
    
    Args:
        result: Pydantic AI result object
    
    Returns:
        List of ToolCall objects
    """
    tools_used = []
    
    try:
        # Get all messages from the result
        messages = result.all_messages()
        
        for message in messages:
            if hasattr(message, 'parts'):
                for part in message.parts:
                    # Check if this is a tool call part
                    if part.__class__.__name__ == 'ToolCallPart':
                        try:
                            # Debug logging to understand structure
                            logger.debug(f"ToolCallPart attributes: {dir(part)}")
                            logger.debug(f"ToolCallPart content: tool_name={getattr(part, 'tool_name', None)}")
                            
                            # Extract tool information safely
                            tool_name = str(part.tool_name) if hasattr(part, 'tool_name') else 'unknown'
                            
                            # Get args - the args field is a JSON string in Pydantic AI
                            tool_args = {}
                            if hasattr(part, 'args') and part.args is not None:
                                if isinstance(part.args, str):
                                    # Args is a JSON string, parse it
                                    try:
                                        import json
                                        tool_args = json.loads(part.args)
                                        logger.debug(f"Parsed args from JSON string: {tool_args}")
                                    except json.JSONDecodeError as e:
                                        logger.debug(f"Failed to parse args JSON: {e}")
                                        tool_args = {}
                                elif isinstance(part.args, dict):
                                    tool_args = part.args
                                    logger.debug(f"Args already a dict: {tool_args}")
                            
                            # Alternative: use args_as_dict method if available
                            if hasattr(part, 'args_as_dict'):
                                try:
                                    tool_args = part.args_as_dict()
                                    logger.debug(f"Got args from args_as_dict(): {tool_args}")
                                except:
                                    pass
                            
                            # Get tool call ID
                            tool_call_id = None
                            if hasattr(part, 'tool_call_id'):
                                tool_call_id = str(part.tool_call_id) if part.tool_call_id else None
                            
                            # Create ToolCall with explicit field mapping
                            tool_call_data = {
                                "tool_name": tool_name,
                                "args": tool_args,
                                "tool_call_id": tool_call_id
                            }
                            logger.debug(f"Creating ToolCall with data: {tool_call_data}")
                            tools_used.append(ToolCall(**tool_call_data))
                        except Exception as e:
                            logger.debug(f"Failed to parse tool call part: {e}")
                            continue
    except Exception as e:
        logger.warning(f"Failed to extract tool calls: {e}")
    
    return tools_used


async def save_conversation_turn(
    session_id: str,
    user_message: str,
    assistant_message: str,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Save a conversation turn to the database.
    
    Args:
        session_id: Session ID
        user_message: User's message
        assistant_message: Assistant's response
        metadata: Optional metadata
    """
    # Save user message
    await add_message(
        session_id=session_id,
        role="user",
        content=user_message,
        metadata=metadata or {}
    )
    
    # Save assistant message
    await add_message(
        session_id=session_id,
        role="assistant",
        content=assistant_message,
        metadata=metadata or {}
    )


async def execute_agent(
    message: str,
    session_id: str,
    user_id: Optional[str] = None,
    save_conversation: bool = True
) -> tuple[str, List[ToolCall]]:
    """
    Execute the agent with a message.
    
    Args:
        message: User message
        session_id: Session ID
        user_id: Optional user ID
        save_conversation: Whether to save the conversation
    
    Returns:
        Tuple of (agent response, tools used)
    """
    try:
        # Create dependencies
        deps = AgentDependencies(
            session_id=session_id,
            user_id=user_id
        )
        
        # Get conversation context
        context = await get_conversation_context(session_id)
        
        # Build prompt with context
        full_prompt = message
        if context:
            context_str = "\n".join([
                f"{msg['role']}: {msg['content']}"
                for msg in context[-6:]  # Last 3 turns
            ])
            full_prompt = f"Previous conversation:\n{context_str}\n\nCurrent question: {message}"
        
        # Run the agent
        result = await rag_agent.run(full_prompt, deps=deps)
        
        response = result.data
        tools_used = extract_tool_calls(result)
        
        # Save conversation if requested
        if save_conversation:
            await save_conversation_turn(
                session_id=session_id,
                user_message=message,
                assistant_message=response,
                metadata={
                    "user_id": user_id,
                    "tool_calls": len(tools_used)
                }
            )
        
        return response, tools_used
        
    except Exception as e:
        logger.error(f"Agent execution failed: {e}")
        error_response = f"I encountered an error while processing your request: {str(e)}"
        
        if save_conversation:
            await save_conversation_turn(
                session_id=session_id,
                user_message=message,
                assistant_message=error_response,
                metadata={"error": str(e)}
            )
        
        return error_response, []


# API Endpoints
@app.get("/health", response_model=HealthStatus)
async def health_check():
    """Health check endpoint."""
    try:
        # Test database connections
        db_status = await test_connection()
        graph_status = await test_graph_connection()
        
        # Determine overall status
        if db_status and graph_status:
            status = "healthy"
        elif db_status or graph_status:
            status = "degraded"
        else:
            status = "unhealthy"
        
        return HealthStatus(
            status=status,
            database=db_status,
            graph_database=graph_status,
            llm_connection=True,  # Assume OK if we can respond
            version="0.1.0",
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail="Health check failed")


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Non-streaming chat endpoint."""
    try:
        # Get or create session
        session_id = await get_or_create_session(request)
        
        # Execute agent
        response, tools_used = await execute_agent(
            message=request.message,
            session_id=session_id,
            user_id=request.user_id
        )
        
        return ChatResponse(
            message=response,
            session_id=session_id,
            tools_used=tools_used,
            metadata={"search_type": str(request.search_type)}
        )
        
    except Exception as e:
        logger.error(f"Chat endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auth/login", response_model=LoginResponse)
async def auth_login(payload: LoginRequest):
    try:
        account = await get_account_by_username(payload.username)
        if not account or not account.get("is_active", True):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if not verify_password(payload.password, account.get("password_hash", "")):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        await touch_last_login(account["id"])
        session_id = await create_session(user_id=account["id"], metadata={"username": account["username"], "role": account["role"]})
        user_out = AccountOut(
            id=account["id"],
            username=account["username"],
            full_name=account.get("full_name") or account.get("name") or account["username"],
            department=account.get("department"),
            domain=account.get("domain"),
            title=account.get("title"),
            role=account.get("role", "user"),
        )
        return LoginResponse(user=user_out, session_id=session_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(status_code=500, detail="Internal error")


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Streaming chat endpoint using Server-Sent Events."""
    try:
        # Get or create session
        session_id = await get_or_create_session(request)
        
        async def generate_stream():
            """Generate streaming response using agent.iter() pattern."""
            try:
                yield f"data: {json.dumps({'type': 'session', 'session_id': session_id})}\n\n"
                
                # Create dependencies
                deps = AgentDependencies(
                    session_id=session_id,
                    user_id=request.user_id
                )
                
                # Get conversation context
                context = await get_conversation_context(session_id)
                
                # Build input with context
                full_prompt = request.message
                if context:
                    context_str = "\n".join([
                        f"{msg['role']}: {msg['content']}"
                        for msg in context[-6:]
                    ])
                    full_prompt = f"Previous conversation:\n{context_str}\n\nCurrent question: {request.message}"
                
                # Save user message immediately
                await add_message(
                    session_id=session_id,
                    role="user",
                    content=request.message,
                    metadata={"user_id": request.user_id}
                )
                
                full_response = ""
                
                # Stream using agent.iter() pattern
                async with rag_agent.iter(full_prompt, deps=deps) as run:
                    async for node in run:
                        if rag_agent.is_model_request_node(node):
                            # Stream tokens from the model
                            async with node.stream(run.ctx) as request_stream:
                                async for event in request_stream:
                                    from pydantic_ai.messages import PartStartEvent, PartDeltaEvent, TextPartDelta
                                    
                                    if isinstance(event, PartStartEvent) and event.part.part_kind == 'text':
                                        delta_content = event.part.content
                                        yield f"data: {json.dumps({'type': 'text', 'content': delta_content})}\n\n"
                                        full_response += delta_content
                                        
                                    elif isinstance(event, PartDeltaEvent) and isinstance(event.delta, TextPartDelta):
                                        delta_content = event.delta.content_delta
                                        yield f"data: {json.dumps({'type': 'text', 'content': delta_content})}\n\n"
                                        full_response += delta_content
                
                # Extract tools used from the final result
                result = run.result
                tools_used = extract_tool_calls(result)
                
                # Send tools used information
                if tools_used:
                    tools_data = [
                        {
                            "tool_name": tool.tool_name,
                            "args": tool.args,
                            "tool_call_id": tool.tool_call_id
                        }
                        for tool in tools_used
                    ]
                    yield f"data: {json.dumps({'type': 'tools', 'tools': tools_data})}\n\n"
                
                # Save assistant response
                await add_message(
                    session_id=session_id,
                    role="assistant",
                    content=full_response,
                    metadata={
                        "streamed": True,
                        "tool_calls": len(tools_used)
                    }
                )
                
                yield f"data: {json.dumps({'type': 'end'})}\n\n"
                
            except Exception as e:
                logger.error(f"Stream error: {e}")
                error_chunk = {
                    "type": "error",
                    "content": f"Stream error: {str(e)}"
                }
                yield f"data: {json.dumps(error_chunk)}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )
        
    except Exception as e:
        logger.error(f"Streaming chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search/vector")
async def search_vector(request: SearchRequest):
    """Vector search endpoint."""
    try:
        input_data = VectorSearchInput(
            query=request.query,
            limit=request.limit
        )
        
        start_time = datetime.now()
        results = await vector_search_tool(input_data)
        end_time = datetime.now()
        
        query_time = (end_time - start_time).total_seconds() * 1000
        
        return SearchResponse(
            results=results,
            total_results=len(results),
            search_type="vector",
            query_time_ms=query_time
        )
        
    except Exception as e:
        logger.error(f"Vector search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search/graph")
async def search_graph(request: SearchRequest):
    """Knowledge graph search endpoint."""
    try:
        input_data = GraphSearchInput(
            query=request.query
        )
        
        start_time = datetime.now()
        results = await graph_search_tool(input_data)
        end_time = datetime.now()
        
        query_time = (end_time - start_time).total_seconds() * 1000
        
        return SearchResponse(
            graph_results=results,
            total_results=len(results),
            search_type="graph",
            query_time_ms=query_time
        )
        
    except Exception as e:
        logger.error(f"Graph search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search/hybrid")
async def search_hybrid(request: SearchRequest):
    """Hybrid search endpoint."""
    try:
        input_data = HybridSearchInput(
            query=request.query,
            limit=request.limit
        )
        
        start_time = datetime.now()
        results = await hybrid_search_tool(input_data)
        end_time = datetime.now()
        
        query_time = (end_time - start_time).total_seconds() * 1000
        
        return SearchResponse(
            results=results,
            total_results=len(results),
            search_type="hybrid",
            query_time_ms=query_time
        )
        
    except Exception as e:
        logger.error(f"Hybrid search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/documents")
async def list_documents_endpoint(
    limit: int = 20,
    offset: int = 0
):
    """List documents endpoint."""
    try:
        input_data = DocumentListInput(limit=limit, offset=offset)
        documents = await list_documents_tool(input_data)
        
        return {
            "documents": documents,
            "total": len(documents),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Document listing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{document_id}")
async def get_document_endpoint(document_id: str):
    try:
        doc = await db_get_document(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        return doc
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get document failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/documents/{document_id}/download")
async def download_document(document_id: str, inline: bool = Query(False, description="Return inline Content-Disposition")):
    try:
        doc = await db_get_document(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        source = doc.get("source")
        if not source:
            raise HTTPException(status_code=404, detail="Document source unavailable")

        documents_folder = os.getenv("DOCUMENTS_FOLDER", "documents")
        root_path = Path(documents_folder).expanduser().resolve()
        file_path = (root_path / source).resolve()

        try:
            file_path.relative_to(root_path)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid document path")

        if not file_path.exists() or not file_path.is_file():
            raise HTTPException(status_code=404, detail="Document file not found")

        media_type, _ = mimetypes.guess_type(str(file_path))
        filename = file_path.name

        response = FileResponse(
            str(file_path),
            media_type=media_type or "application/octet-stream",
            filename=filename,
        )
        if inline:
            response.headers["Content-Disposition"] = f'inline; filename="{filename}"'
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download document failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/documents/{document_id}/summarize")
async def summarize_document(document_id: str, request: Request):
    """Summarize a specific document using the LLM and return bullet points in Vietnamese.

    Returns JSON: { "summary": "- bullet 1\n- bullet 2\n..." }
    """
    try:
        # Load the document
        doc = await db_get_document(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        content = (doc.get("content") or "").strip()
        title = doc.get("title") or "Tài liệu"
        if not content:
            # If no text content, return message
            return {"summary": "- Không có nội dung văn bản để tóm tắt."}

        # Truncate content defensively to avoid token limits
        max_chars = 12000
        if len(content) > max_chars:
            content = content[:max_chars] + "\n..."  # indicate truncation

        # Build a targeted Vietnamese prompt instructing bullet list output
        prompt = (
            "Bạn là trợ lý tóm tắt tài liệu. "
            "Hãy tóm tắt ngắn gọn nội dung tài liệu sau bằng tiếng Việt, "
            "trình bày dưới dạng các gạch đầu dòng rõ ràng (5–10 gạch đầu dòng), "
            "nêu bật các ý chính, thuật ngữ quan trọng, và kết luận (nếu có).\n\n"
            f"Tiêu đề: {title}\n"
            "Nội dung tài liệu:\n" + content + "\n\n"
            "Yêu cầu định dạng đầu ra:\n"
            "- Chỉ trả về danh sách gạch đầu dòng bằng tiếng Việt\n"
            "- Mỗi dòng bắt đầu bằng '- ' (dấu gạch ngang và khoảng trắng)\n"
            "- Không thêm tiêu đề, phần mở đầu hay phần kết thúc\n"
            "- Ngắn gọn, chính xác, dễ đọc"
        )

        # Use the agent to generate summary without saving conversation
        # Create an ephemeral session id to avoid pulling prior context
        tmp_session_id = str(uuid.uuid4())
        summary_text, _ = await execute_agent(
            message=prompt,
            session_id=tmp_session_id,
            user_id=None,
            save_conversation=False,
        )

        # Basic sanitization: ensure lines start with '- '
        lines = [ln.strip() for ln in (summary_text or "").splitlines() if ln.strip()]
        if lines and not any(ln.startswith("- ") for ln in lines):
            # Convert to bullet format if model didn't follow strictly
            lines = [f"- {ln}" for ln in lines]
        normalized = "\n".join(lines) if lines else "- (không có tóm tắt phù hợp)"

        return {"summary": normalized}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Summarize document failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Fallback ingestion if older ingestion.ingest.ingest_file lacks extra_fields
async def _ingest_with_pipeline_fallback(
    file_path: str,
    extra_fields: Dict[str, Any],
) -> "IngestionResult":
    from ingestion.ingest import DocumentIngestionPipeline  # local import to avoid circulars
    from .models import IngestionResult as _IngestionResult
    # Build pipeline with defaults
    cfg = IngestionConfig()
    pipeline = DocumentIngestionPipeline(cfg, documents_folder=os.path.dirname(file_path))
    await pipeline.initialize()
    try:
        # Read and prepare
        content, read_metadata = pipeline._read_document(file_path)
        title = pipeline._extract_title(content, file_path)
        source = os.path.relpath(file_path, pipeline.documents_folder)
        metadata = pipeline._extract_document_metadata(content, file_path, read_metadata)
        # Merge optional metadata
        if extra_fields.get("description"):
            metadata["description"] = extra_fields["description"]
        if extra_fields.get("access_level"):
            metadata["access_level"] = extra_fields["access_level"]

        # Chunk, entities, embeddings
        chunks = await pipeline.chunker.chunk_document(
            content=content,
            title=title,
            source=source,
            metadata=metadata,
        )
        if pipeline.config.extract_entities:
            try:
                chunks = await pipeline.graph_builder.extract_entities_from_chunks(chunks)
            except Exception:
                # Continue if entity extraction not available
                pass
        embedded_chunks = await pipeline.embedder.embed_chunks(chunks)

        # Insert into DB with required FKs
        async with db_pool.acquire() as conn:
            async with conn.transaction():
                title_to_use = extra_fields.get("title_override") or title
                # Normalize effective_date into a Python date if provided
                _eff_date = extra_fields.get("effective_date")
                if isinstance(_eff_date, str) and _eff_date.strip():
                    try:
                        _eff_date = date.fromisoformat(_eff_date)
                    except Exception:
                        _eff_date = None

                doc_row = await conn.fetchrow(
                    """
                    INSERT INTO documents (
                        title, source, content, metadata,
                        document_type_id, issuing_unit_id, site_id, author_id, effective_date
                    )
                    VALUES ($1, $2, $3, $4, $5::uuid, $6::uuid, $7::uuid, $8::uuid, $9)
                    RETURNING id::text
                    """,
                    title_to_use,
                    source,
                    content,
                    json.dumps(metadata),
                    extra_fields.get("document_type_id"),
                    extra_fields.get("issuing_unit_id"),
                    extra_fields.get("site_id"),
                    extra_fields.get("author_id"),
                    _eff_date,
                )
                document_id = doc_row["id"]

                # Insert chunks
                for ch in embedded_chunks:
                    embedding_data = None
                    if getattr(ch, "embedding", None):
                        embedding_data = "[" + ",".join(map(str, ch.embedding)) + "]"
                    await conn.execute(
                        """
                        INSERT INTO chunks (document_id, content, embedding, chunk_index, metadata, token_count)
                        VALUES ($1::uuid, $2, $3::vector, $4, $5, $6)
                        """,
                        document_id,
                        ch.content,
                        embedding_data,
                        ch.index,
                        json.dumps(getattr(ch, "metadata", {})),
                        getattr(ch, "token_count", None),
                    )

                # Relations
                def _dedupe(seq: List[str]) -> List[str]:
                    seen = set()
                    out: List[str] = []
                    for x in seq or []:
                        if x not in seen:
                            seen.add(x)
                            out.append(x)
                    return out

                eq_ids = _dedupe(extra_fields.get("equipment_ids") or [])
                kw_ids = _dedupe(extra_fields.get("keyword_ids") or [])
                if eq_ids:
                    await conn.executemany(
                        """
                        INSERT INTO document_equipment (document_id, equipment_id)
                        VALUES ($1::uuid, $2::uuid)
                        ON CONFLICT DO NOTHING
                        """,
                        [(document_id, eid) for eid in eq_ids],
                    )
                if kw_ids:
                    await conn.executemany(
                        """
                        INSERT INTO document_keywords (document_id, keyword_id)
                        VALUES ($1::uuid, $2::uuid)
                        ON CONFLICT DO NOTHING
                        """,
                        [(document_id, kid) for kid in kw_ids],
                    )

        # Optionally build graph
        relationships_created = 0
        errors: List[str] = []
        if not pipeline.config.skip_graph_building:
            try:
                graph_result = await pipeline.graph_builder.add_document_to_graph(
                    chunks=embedded_chunks,
                    document_title=title_to_use,
                    document_source=source,
                    document_metadata=metadata,
                )
                relationships_created = graph_result.get("episodes_created", 0)
            except Exception as ge:
                errors.append(f"Graph build failed: {ge}")

        return _IngestionResult(
            document_id=document_id,
            title=title_to_use,
            chunks_created=len(embedded_chunks),
            entities_extracted=0,
            relationships_created=relationships_created,
            processing_time_ms=0.0,
            errors=errors,
        )
    finally:
        try:
            await pipeline.close()
        except Exception:
            pass

@app.post("/documents/upload")
async def upload_documents(
    request: Request,
    files: List[UploadFile] = File(...),
    document_type_id: str = Form(...),
    issuing_unit_id: str = Form(...),
    site_id: str = Form(...),
    author_id: Optional[str] = Form(None),  # UUID of uploader
    effective_date: Optional[str] = Form(None),  # YYYY-MM-DD
    equipment_ids: Optional[str] = Form(None),   # CSV of UUIDs
    keyword_ids: Optional[str] = Form(None),     # CSV of UUIDs
    title_override: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    access_level: Optional[str] = Form(None),
    version: Optional[str] = Form(None),  # Allow user-specified version at upload
):
    """Upload one or more documents and ingest them with metadata.

    Notes:
    - equipment_ids, keyword_ids accepted as comma-separated UUID strings.
    - title_override allows forcing the document title.
    """
    documents_folder = os.getenv("DOCUMENTS_FOLDER", "documents")
    os.makedirs(documents_folder, exist_ok=True)
    results = []
    try:
        # Parse CSV lists
        def _parse_csv_ids(val: Optional[str]) -> List[str]:
            if not val:
                return []
            return [v.strip() for v in val.split(",") if v.strip()]

        # Determine author_id from session header if available; fallback to provided form field
        resolved_author_id: Optional[str] = None
        try:
            sess_id = request.headers.get("X-Session-Id") or request.headers.get("x-session-id")
            if sess_id:
                sess = await get_session(sess_id)
                if sess and sess.get("user_id"):
                    resolved_author_id = str(sess["user_id"])  # UUID
        except Exception:
            pass
        # If session didn't yield a user id, use explicit form author_id (if provided)
        if not resolved_author_id and author_id:
            resolved_author_id = author_id

        extra_fields = {
            "document_type_id": document_type_id,
            "issuing_unit_id": issuing_unit_id,
            "site_id": site_id,
            # Prefer author_id from session; fallback to none (legacy author kept in metadata)
            "author_id": resolved_author_id,
            "effective_date": effective_date,
            "equipment_ids": _parse_csv_ids(equipment_ids),
            "keyword_ids": _parse_csv_ids(keyword_ids),
            "title_override": title_override,
            "description": description,
            "access_level": access_level,
            "version": version,
        }

        for upload in files:
            # Sanitize filename to prevent path traversal
            safe_name = os.path.basename(upload.filename)
            file_path = os.path.join(documents_folder, safe_name)
            with open(file_path, "wb") as f:
                f.write(await upload.read())
            # Call ingest_file with extra_fields when supported; fallback if not
            try:
                ingestion_result = await ingest_file(
                    file_path,
                    IngestionConfig(),
                    extra_fields=extra_fields,
                )
            except TypeError as te:
                # Backward-compatibility: older ingest_file may not accept extra_fields
                if "extra_fields" in str(te):
                    logger.warning("ingest_file without extra_fields detected; using pipeline fallback")
                    ingestion_result = await _ingest_with_pipeline_fallback(file_path, extra_fields)
                else:
                    raise
            results.append(ingestion_result.model_dump())
        return {"documents": results}
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metadata/document-types")
async def list_document_types():
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id::text AS id,
                       COALESCE(code,'') AS code,
                       name,
                       description,
                       is_active
                FROM document_types
                WHERE is_active = TRUE
                ORDER BY name
                """
            )
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"list_document_types failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/metadata/document-types")
async def create_document_type(item: DocumentTypeIn):
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO document_types (code, name, description, is_active)
                VALUES ($1, $2, $3, COALESCE($4, TRUE))
                RETURNING id::text AS id,
                          COALESCE(code,'') AS code,
                          name,
                          description,
                          is_active
                """,
                item.code, item.name, item.description, item.is_active
            )
            return dict(row)
    except Exception as e:
        logger.error(f"create_document_type failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/metadata/document-types/{id}")
async def update_document_type(id: str, item: DocumentTypeIn):
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                UPDATE document_types
                SET code = $2,
                    name = $3,
                    description = $4,
                    is_active = COALESCE($5, is_active),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1::uuid
                RETURNING id::text AS id,
                          COALESCE(code,'') AS code,
                          name,
                          description,
                          is_active
                """,
                id, item.code, item.name, item.description, item.is_active
            )
            if not row:
                raise HTTPException(status_code=404, detail="Not found")
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update_document_type failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/metadata/document-types/{id}")
async def delete_document_type(id: str):
    try:
        async with db_pool.acquire() as conn:
            affected = await conn.fetchval("DELETE FROM document_types WHERE id = $1::uuid RETURNING 1", id)
            if not affected:
                raise HTTPException(status_code=404, detail="Not found")
            return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"delete_document_type failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metadata/org-units")
async def list_org_units():
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT u.id::text AS id,
                       COALESCE(u.code,'') AS code,
                       u.name,
                       u.parent_id::text AS parent_id,
                       p.name AS parent_name,
                       u.is_active,
                       u.image
                FROM org_units u
                LEFT JOIN org_units p ON p.id = u.parent_id
                WHERE u.is_active = TRUE
                ORDER BY u.name
                """
            )
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"list_org_units failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/metadata/org-units")
async def create_org_unit(item: OrgUnitIn):
    try:
        async with db_pool.acquire() as conn:
            # Resolve parent_id by ref if needed
            v_parent_id = item.parent_id
            if (not v_parent_id) and (item.parent_ref and item.parent_ref.strip()):
                ref = item.parent_ref.strip()
                q = "SELECT id::text FROM org_units WHERE id::text = $1 OR code = $1 OR name = $1 LIMIT 1"
                v_parent_id = await conn.fetchval(q, ref)

            row = await conn.fetchrow(
                """
                INSERT INTO org_units (code, name, parent_id, is_active)
                VALUES ($1, $2, $3::uuid, COALESCE($4, TRUE))
                RETURNING id::text AS id
                """,
                item.code,
                item.name,
                v_parent_id,
                item.is_active,
            )
            new_id = row["id"]
            # Optional re-parent existing child
            if item.child_ref and item.child_ref.strip():
                cref = item.child_ref.strip()
                await conn.execute(
                    """
                    UPDATE org_units
                    SET parent_id = $2::uuid,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id IN (
                        SELECT id FROM org_units WHERE id::text = $1 OR code = $1 OR name = $1 LIMIT 1
                    )
                    """,
                    cref, new_id
                )

            # Return full row with parent name
            out = await conn.fetchrow(
                """
                SELECT u.id::text AS id,
                       COALESCE(u.code,'') AS code,
                       u.name,
                       u.parent_id::text AS parent_id,
                       p.name AS parent_name,
                       u.is_active
                FROM org_units u
                LEFT JOIN org_units p ON p.id = u.parent_id
                WHERE u.id = $1::uuid
                """,
                new_id,
            )
            return dict(out)
    except Exception as e:
        logger.error(f"create_org_unit failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/metadata/org-units/{id}")
async def update_org_unit(id: str, item: OrgUnitIn):
    try:
        async with db_pool.acquire() as conn:
            # Resolve parent
            v_parent_id = item.parent_id
            if (not v_parent_id) and (item.parent_ref and item.parent_ref.strip()):
                ref = item.parent_ref.strip()
                v_parent_id = await conn.fetchval(
                    "SELECT id::text FROM org_units WHERE id::text = $1 OR code = $1 OR name = $1 LIMIT 1",
                    ref,
                )

            await conn.execute(
                """
                UPDATE org_units
                SET code = $2,
                    name = $3,
                    parent_id = NULLIF($4,'')::uuid,
                    is_active = COALESCE($5, is_active),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1::uuid
                """,
                id, item.code, item.name, v_parent_id or '', item.is_active,
            )

            # Optional child re-parent to this unit
            if item.child_ref and item.child_ref.strip():
                cref = item.child_ref.strip()
                await conn.execute(
                    """
                    UPDATE org_units
                    SET parent_id = $2::uuid,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id IN (
                        SELECT id FROM org_units WHERE id::text = $1 OR code = $1 OR name = $1 LIMIT 1
                    )
                    """,
                    cref, id,
                )

            row = await conn.fetchrow(
                """
                SELECT u.id::text AS id,
                       COALESCE(u.code,'') AS code,
                       u.name,
                       u.parent_id::text AS parent_id,
                       p.name AS parent_name,
                       u.is_active
                FROM org_units u
                LEFT JOIN org_units p ON p.id = u.parent_id
                WHERE u.id = $1::uuid
                """,
                id,
            )
            if not row:
                raise HTTPException(status_code=404, detail="Not found")
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update_org_unit failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/metadata/org-units/{id}")
async def delete_org_unit(id: str):
    try:
        async with db_pool.acquire() as conn:
            affected = await conn.fetchval("DELETE FROM org_units WHERE id = $1::uuid RETURNING 1", id)
            if not affected:
                raise HTTPException(status_code=404, detail="Not found")
            return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"delete_org_unit failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metadata/sites")
async def list_sites():
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id::text AS id,
                       name,
                       COALESCE(kind,'') AS kind,
                       is_active
                FROM sites
                WHERE is_active = TRUE
                ORDER BY name
                """
            )
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"list_sites failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/metadata/sites")
async def create_site(item: SiteIn):
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO sites (name, kind, is_active)
                VALUES ($1, $2, COALESCE($3, TRUE))
                RETURNING id::text AS id, name, COALESCE(kind,'') AS kind, is_active
                """,
                item.name, item.kind, item.is_active
            )
            return dict(row)
    except Exception as e:
        logger.error(f"create_site failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/metadata/sites/{id}")
async def update_site(id: str, item: SiteIn):
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                UPDATE sites
                SET name = $2,
                    kind = $3,
                    is_active = COALESCE($4, is_active),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1::uuid
                RETURNING id::text AS id, name, COALESCE(kind,'') AS kind, is_active
                """,
                id, item.name, item.kind, item.is_active
            )
            if not row:
                raise HTTPException(status_code=404, detail="Not found")
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update_site failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/metadata/sites/{id}")
async def delete_site(id: str):
    try:
        async with db_pool.acquire() as conn:
            affected = await conn.fetchval("DELETE FROM sites WHERE id = $1::uuid RETURNING 1", id)
            if not affected:
                raise HTTPException(status_code=404, detail="Not found")
            return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"delete_site failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metadata/equipment")
async def list_equipment():
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id::text AS id,
                       COALESCE(code,'') AS code,
                       name,
                       is_active
                FROM equipment
                WHERE is_active = TRUE
                ORDER BY COALESCE(code, name)
                """
            )
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"list_equipment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/metadata/equipment")
async def create_equipment(item: EquipmentIn):
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO equipment (code, name, is_active)
                VALUES ($1, $2, COALESCE($3, TRUE))
                RETURNING id::text AS id, COALESCE(code,'') AS code, name, is_active
                """,
                item.code, item.name, item.is_active
            )
            return dict(row)
    except Exception as e:
        logger.error(f"create_equipment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/metadata/equipment/{id}")
async def update_equipment(id: str, item: EquipmentIn):
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                UPDATE equipment
                SET code = $2,
                    name = $3,
                    is_active = COALESCE($4, is_active),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1::uuid
                RETURNING id::text AS id, COALESCE(code,'') AS code, name, is_active
                """,
                id, item.code, item.name, item.is_active
            )
            if not row:
                raise HTTPException(status_code=404, detail="Not found")
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update_equipment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/metadata/equipment/{id}")
async def delete_equipment(id: str):
    try:
        async with db_pool.acquire() as conn:
            affected = await conn.fetchval("DELETE FROM equipment WHERE id = $1::uuid RETURNING 1", id)
            if not affected:
                raise HTTPException(status_code=404, detail="Not found")
            return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"delete_equipment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metadata/keywords")
async def list_keywords():
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id::text AS id,
                       name,
                       is_active
                FROM keywords
                WHERE is_active = TRUE
                ORDER BY name
                """
            )
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"list_keywords failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Accounts metadata for author search (minimal payload)
@app.get("/metadata/accounts")
async def list_accounts_minimal():
    """Return minimal accounts list for lookups: id and display name.

    Used by frontend to map author_id -> author name for search filtering.
    """
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT
                    id::text       AS id,
                    COALESCE(NULLIF(TRIM(full_name), ''), username) AS name
                FROM accounts
                WHERE is_active = TRUE
                ORDER BY COALESCE(NULLIF(TRIM(full_name), ''), username)
                """
            )
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"list_accounts_minimal failed: {e}")
        # If accounts table missing, return empty list to keep frontend functional
        return []


# Optional: full accounts listing for admin/tools
@app.get("/accounts")
async def list_accounts_full():
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT
                    id::text       AS id,
                    username,
                    COALESCE(NULLIF(TRIM(full_name), ''), username) AS full_name,
                    department,
                    domain,
                    title,
                    role,
                    is_active,
                    created_at,
                    updated_at
                FROM accounts
                ORDER BY username
                """
            )
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"list_accounts_full failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/metadata/keywords")
async def create_keyword(item: KeywordIn):
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO keywords (name, is_active)
                VALUES ($1, COALESCE($2, TRUE))
                RETURNING id::text AS id, name, is_active
                """,
                item.name, item.is_active
            )
            return dict(row)
    except Exception as e:
        logger.error(f"create_keyword failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/metadata/keywords/{id}")
async def update_keyword(id: str, item: KeywordIn):
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                UPDATE keywords
                SET name = $2,
                    is_active = COALESCE($3, is_active),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1::uuid
                RETURNING id::text AS id, name, is_active
                """,
                id, item.name, item.is_active
            )
            if not row:
                raise HTTPException(status_code=404, detail="Not found")
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update_keyword failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/metadata/keywords/{id}")
async def delete_keyword(id: str):
    try:
        async with db_pool.acquire() as conn:
            affected = await conn.fetchval("DELETE FROM keywords WHERE id = $1::uuid RETURNING 1", id)
            if not affected:
                raise HTTPException(status_code=404, detail="Not found")
            return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"delete_keyword failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sessions/{session_id}")
async def get_session_info(session_id: str):
    """Get session information."""
    try:
        session = await get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return session
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}")
    
    return ErrorResponse(
        error=str(exc),
        error_type=type(exc).__name__,
        request_id=str(uuid.uuid4())
    )


# ----------------------------
# Document Versioning Endpoints
# ----------------------------

def _parse_version(v: Optional[str]) -> tuple[int, int]:
    try:
        if not v:
            return (1, 0)
        parts = str(v).strip().lower().replace('v', '').split('.')
        major = int(parts[0]) if len(parts) > 0 and parts[0].isdigit() else 1
        minor = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
        return (major, minor)
    except Exception:
        return (1, 0)


def _bump_version(current: Optional[str], bump: str) -> str:
    major, minor = _parse_version(current)
    if bump == 'major':
        return f"{major + 1}.0"
    # default minor
    return f"{major}.{minor + 1}"


async def _resolve_user_id_from_request(request: Request) -> Optional[str]:
    try:
        sess_id = request.headers.get("X-Session-Id") or request.headers.get("x-session-id")
        if sess_id:
            sess = await get_session(sess_id)
            if sess and sess.get("user_id"):
                return str(sess["user_id"])  # UUID
    except Exception:
        pass
    return None


async def _get_document_core(conn, document_id: str):
    row = await conn.fetchrow(
        """
        SELECT id::text AS id, title, source, content, metadata,
               document_type_id::text AS document_type_id,
               issuing_unit_id::text AS issuing_unit_id,
               site_id::text AS site_id,
               author_id::text AS author_id,
               created_at, updated_at
        FROM documents
        WHERE id = $1::uuid
        """, document_id)
    return row


@app.post("/documents/{document_id}/versions")
async def upload_new_version(
    document_id: str,
    request: Request,
    file: UploadFile = File(...),
    change_summary: str = Form(...),
    bump: str = Form("minor"),  # 'minor' or 'major'
    version: Optional[str] = Form(None),  # optional explicit version string
):
    """Upload a new version for an existing document.

    - Reads uploaded file as text.
    - Bumps version (minor/major).
    - Inserts a snapshot into document_versions.
    - Updates documents table with new content (+metadata.version).
    - Replaces chunks for this document.
    """
    if not change_summary or not change_summary.strip():
        raise HTTPException(status_code=400, detail="change_summary is required")

    # Resolve user id (creator of this version)
    created_by = await _resolve_user_id_from_request(request)

    # Read new content
    try:
        raw = await file.read()
        try:
            new_content = raw.decode("utf-8")
        except Exception:
            new_content = raw.decode("latin-1", errors="ignore")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")

    # Prepare chunker & embedder
    config = IngestionConfig()
    chunker = create_chunker(ChunkingConfig(
        chunk_size=config.chunk_size,
        chunk_overlap=config.chunk_overlap,
        max_chunk_size=config.max_chunk_size,
        use_semantic_splitting=config.use_semantic_chunking
    ))
    embedder = create_embedder()

    async with db_pool.acquire() as conn:
        async with conn.transaction():
            doc = await _get_document_core(conn, document_id)
            if not doc:
                raise HTTPException(status_code=404, detail="Document not found")

            # Compute next version
            meta = doc["metadata"]
            if isinstance(meta, str):
                try:
                    meta = json.loads(meta)
                except Exception:
                    meta = {}
            current_version = (meta or {}).get("version")
            # Ensure baseline (pre-update) snapshot exists in history
            try:
                prev_ver = current_version if (isinstance(current_version, str) and str(current_version).strip()) else "1.0"
                exists = await conn.fetchval(
                    "SELECT 1 FROM document_versions WHERE document_id=$1::uuid AND version=$2 LIMIT 1",
                    document_id, prev_ver
                )
                if not exists:
                    await conn.execute(
                        """
                        INSERT INTO document_versions (
                            document_id, version, change_summary, content, metadata,
                            file_path, file_mime, file_size, created_by
                        )
                        VALUES ($1::uuid, $2, $3, $4, $5::jsonb, $6, $7, $8, $9::uuid)
                        """,
                        document_id,
                        prev_ver,
                        "Initial version snapshot",
                        doc["content"] or "",
                        json.dumps(meta or {}),
                        (meta or {}).get("file_path"),
                        (meta or {}).get("last_upload_mime"),
                        (meta or {}).get("file_size"),
                        created_by,
                    )
                    if not current_version:
                        current_version = prev_ver
            except Exception as _e:
                logger.debug(f"Baseline snapshot check failed: {_e}")
            new_version = (version.strip() if isinstance(version, str) and version.strip() else _bump_version(current_version, bump))

            # Build updated metadata
            new_metadata = dict(meta or {})
            new_metadata["version"] = new_version
            # Keep optional file info for audits
            if file and file.filename:
                new_metadata["last_upload_filename"] = file.filename
                new_metadata["last_upload_mime"] = file.content_type
                new_metadata["file_path"] = file.filename
                try:
                    new_metadata["file_size"] = len(raw)
                except Exception:
                    pass

            # Chunk and embed
            title = doc["title"]
            source = doc["source"] or (file.filename if file and file.filename else "uploaded")
            chunks = await chunker.chunk_document(
                content=new_content,
                title=title,
                source=source,
                metadata=new_metadata
            )
            embedded_chunks = await embedder.embed_chunks(chunks)

            # Replace chunks for this document
            await conn.execute("DELETE FROM chunks WHERE document_id = $1::uuid", document_id)
            for ch in embedded_chunks:
                embedding_data = None
                if getattr(ch, "embedding", None):
                    embedding_data = "[" + ",".join(map(str, ch.embedding)) + "]"
                await conn.execute(
                    """
                    INSERT INTO chunks (document_id, content, embedding, chunk_index, metadata, token_count)
                    VALUES ($1::uuid, $2, $3::vector, $4, $5, $6)
                    """,
                    document_id,
                    ch.content,
                    embedding_data,
                    ch.index,
                    json.dumps(getattr(ch, "metadata", {})),
                    getattr(ch, "token_count", None),
                )

            # Insert version snapshot
            file_size = len(raw) if isinstance(raw, (bytes, bytearray)) else None
            await conn.execute(
                """
                INSERT INTO document_versions (
                    document_id, version, change_summary, content, metadata,
                    file_path, file_mime, file_size, created_by
                )
                VALUES ($1::uuid, $2, $3, $4, $5::jsonb, $6, $7, $8, $9::uuid)
                """,
                document_id,
                new_version,
                change_summary,
                new_content,
                json.dumps(new_metadata),
                file.filename if file else None,
                file.content_type if file else None,
                file_size,
                created_by,
            )

            # Update document row to current content/metadata
            await conn.execute(
                """
                UPDATE documents
                SET content = $2,
                    metadata = $3::jsonb,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1::uuid
                """,
                document_id,
                new_content,
                json.dumps(new_metadata),
            )

    return {"ok": True, "version": new_version}


@app.get("/documents/{document_id}/versions")
async def list_versions(document_id: str):
    try:
        async with db_pool.acquire() as conn:
            # Current doc row (to show current version at top)
            doc = await conn.fetchrow(
                "SELECT id::text AS id, metadata, updated_at FROM documents WHERE id = $1::uuid",
                document_id,
            )
            current_meta = {}
            if doc and doc["metadata"]:
                if isinstance(doc["metadata"], str):
                    try:
                        current_meta = json.loads(doc["metadata"]) or {}
                    except Exception:
                        current_meta = {}
                else:
                    current_meta = dict(doc["metadata"])
            current_version = current_meta.get("version")

            rows = await conn.fetch(
                """
                SELECT v.id::text AS version_id, v.version, v.change_summary, v.created_at,
                       v.created_by::text AS created_by,
                       COALESCE(a.full_name, a.username) AS created_by_name
                FROM document_versions v
                LEFT JOIN accounts a ON a.id = v.created_by
                WHERE v.document_id = $1::uuid
                ORDER BY v.created_at DESC
                """,
                document_id,
            )
            out = [dict(r) for r in rows]
            # Optionally include current version marker
            if current_version:
                out.insert(0, {
                    "version_id": None,
                    "version": current_version,
                    "change_summary": None,
                    "created_at": doc["updated_at"] if doc else None,
                    "created_by": None,
                    "created_by_name": None,
                    "is_current": True,
                })
            return out
    except Exception as e:
        logger.error(f"list_versions failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/documents/{document_id}/versions/{version_id}")
async def get_version(document_id: str, version_id: str):
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT v.id::text AS version_id, v.version, v.change_summary, v.content, v.metadata,
                       v.file_path, v.file_mime, v.file_size, v.created_at,
                       v.created_by::text AS created_by,
                       COALESCE(a.full_name, a.username) AS created_by_name
                FROM document_versions v
                LEFT JOIN accounts a ON a.id = v.created_by
                WHERE v.document_id = $1::uuid AND v.id = $2::uuid
                """,
                document_id, version_id,
            )
            if not row:
                raise HTTPException(status_code=404, detail="Version not found")
            data = dict(row)
            if isinstance(data.get("metadata"), str):
                try:
                    data["metadata"] = json.loads(data["metadata"]) or {}
                except Exception:
                    data["metadata"] = {}
            return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get_version failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class CompareRequest(BaseModel):
    left_version_id: Optional[str] = None
    right_version_id: Optional[str] = None
    left: Optional[str] = None  # e.g., 'current'
    right: Optional[str] = None # e.g., version id or 'current'


@app.post("/documents/{document_id}/versions/compare")
async def compare_versions(document_id: str, payload: CompareRequest):
    import difflib
    try:
        async with db_pool.acquire() as conn:
            # Resolve contents
            async def get_content(selector: Optional[str]) -> str:
                if not selector:
                    return ""
                if selector == 'current':
                    row = await conn.fetchrow("SELECT content FROM documents WHERE id=$1::uuid", document_id)
                    return row["content"] if row and row["content"] else ""
                # Else treat as version id
                row = await conn.fetchrow(
                    "SELECT content FROM document_versions WHERE document_id=$1::uuid AND id=$2::uuid",
                    document_id, selector
                )
                return row["content"] if row and row["content"] else ""

            left_sel = payload.left or payload.left_version_id or 'current'
            right_sel = payload.right or payload.right_version_id
            if not right_sel:
                raise HTTPException(status_code=400, detail="right version is required")

            left = await get_content(left_sel)
            right = await get_content(right_sel)

            left_lines = (left or "").splitlines(keepends=True)
            right_lines = (right or "").splitlines(keepends=True)
            diff = difflib.unified_diff(left_lines, right_lines, fromfile=str(left_sel), tofile=str(right_sel))
            return {"diff": "".join(diff)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"compare_versions failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/documents/{document_id}/versions/{version_id}/rollback")
async def rollback_version(document_id: str, version_id: str, request: Request):
    """Rollback by restoring the selected version as the current document (no new version created)."""
    # Prepare chunker & embedder
    config = IngestionConfig()
    chunker = create_chunker(ChunkingConfig(
        chunk_size=config.chunk_size,
        chunk_overlap=config.chunk_overlap,
        max_chunk_size=config.max_chunk_size,
        use_semantic_splitting=config.use_semantic_chunking
    ))
    embedder = create_embedder()

    async with db_pool.acquire() as conn:
        async with conn.transaction():
            # Get target version snapshot
            ver = await conn.fetchrow(
                """
                SELECT version, content, metadata
                FROM document_versions
                WHERE document_id=$1::uuid AND id=$2::uuid
                """,
                document_id, version_id,
            )
            if not ver:
                raise HTTPException(status_code=404, detail="Version not found")
            old_content = ver["content"] or ""
            old_meta = ver["metadata"]
            if isinstance(old_meta, str):
                try:
                    old_meta = json.loads(old_meta)
                except Exception:
                    old_meta = {}

            # Current doc for title/source
            doc = await _get_document_core(conn, document_id)
            if not doc:
                raise HTTPException(status_code=404, detail="Document not found")

            new_metadata = dict(old_meta or {})

            # Chunk and embed
            title = doc["title"]
            source = doc["source"] or "rollback"
            chunks = await chunker.chunk_document(
                content=old_content,
                title=title,
                source=source,
                metadata=new_metadata
            )
            embedded_chunks = await embedder.embed_chunks(chunks)

            # Replace chunks
            await conn.execute("DELETE FROM chunks WHERE document_id = $1::uuid", document_id)
            for ch in embedded_chunks:
                embedding_data = None
                if getattr(ch, "embedding", None):
                    embedding_data = "[" + ",".join(map(str, ch.embedding)) + "]"
                await conn.execute(
                    """
                    INSERT INTO chunks (document_id, content, embedding, chunk_index, metadata, token_count)
                    VALUES ($1::uuid, $2, $3::vector, $4, $5, $6)
                    """,
                    document_id,
                    ch.content,
                    embedding_data,
                    ch.index,
                    json.dumps(getattr(ch, "metadata", {})),
                    getattr(ch, "token_count", None),
                )

            # Update documents
            await conn.execute(
                """
                UPDATE documents
                SET content = $2,
                    metadata = $3::jsonb,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1::uuid
                """,
                document_id,
                old_content,
                json.dumps(new_metadata),
            )

    return {"ok": True, "version": ver["version"]}


# Development server
if __name__ == "__main__":
    uvicorn.run(
        "agent.api:app",
        host=APP_HOST,
        port=APP_PORT,
        reload=APP_ENV == "development",
        log_level=LOG_LEVEL.lower()
    )
