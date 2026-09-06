import os
import sys
import uvicorn
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import chromadb
from sentence_transformers import SentenceTransformer

from parsers import extract_document_content
from chunker import chunk_document_pages

# Configuration
CHROMA_PATH = os.environ.get(
    "CHROMA_PATH",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "chroma"))
)
os.makedirs(CHROMA_PATH, exist_ok=True)

COLLECTION_NAME = "prepai_study_docs"
MODEL_NAME = "all-MiniLM-L6-v2"

# Global state
state: Dict[str, Any] = {
    "model": None,
    "chroma_client": None,
    "collection": None
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load warm sentence-transformer and persistent Chroma client
    print(f"[RAG Engine] Loading embedding model '{MODEL_NAME}' into memory...")
    state["model"] = SentenceTransformer(MODEL_NAME)
    print(f"[RAG Engine] Initializing ChromaDB persistent client at: {CHROMA_PATH}")
    state["chroma_client"] = chromadb.PersistentClient(path=CHROMA_PATH)
    state["collection"] = state["chroma_client"].get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )
    print(f"[RAG Engine] Ready! Listening for RAG requests on port 8001.")
    yield
    print("[RAG Engine] Shutting down.")

app = FastAPI(title="PrepAI RAG Engine", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class IngestRequest(BaseModel):
    filePath: str
    fileType: str
    documentId: str
    userId: str
    originalFileName: str

class QueryRequest(BaseModel):
    query: str
    documentId: str
    userId: str
    topK: int = 5

class DeleteRequest(BaseModel):
    documentId: str
    userId: str

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "prepai-rag-engine",
        "model": MODEL_NAME,
        "chromaPath": CHROMA_PATH
    }

@app.post("/ingest")
def ingest_document(req: IngestRequest):
    if not state["model"] or not state["collection"]:
        raise HTTPException(status_code=500, detail="RAG Engine not initialized.")

    try:
        # Step 1: Text extraction
        pages_data = extract_document_content(req.filePath, req.fileType)
        page_count = len(pages_data)

        # Step 2: Semantic Chunking
        doc_meta = {
            "documentId": req.documentId,
            "userId": req.userId,
            "originalFileName": req.originalFileName
        }
        chunks = chunk_document_pages(pages_data, doc_meta)

        if not chunks:
            raise ValueError("No readable chunks could be created from this document.")

        # Step 3: Embeddings generation
        texts = [c["text"] for c in chunks]
        ids = [c["id"] for c in chunks]
        metadatas = [c["metadata"] for c in chunks]

        embeddings = state["model"].encode(
            texts,
            batch_size=32,
            show_progress_bar=False,
            normalize_embeddings=True
        ).tolist()

        # Step 4: Upsert into Chroma with strictly isolated metadata
        state["collection"].upsert(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas
        )

        return {
            "status": "READY",
            "documentId": req.documentId,
            "pageCount": page_count,
            "chunkCount": len(chunks)
        }

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"[RAG Engine] Error ingesting document {req.documentId}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@app.post("/query")
def query_document(req: QueryRequest):
    if not state["model"] or not state["collection"]:
        raise HTTPException(status_code=500, detail="RAG Engine not initialized.")

    if not req.query.strip():
        return {"chunks": []}

    try:
        # Generate question embedding
        query_emb = state["model"].encode(
            req.query,
            normalize_embeddings=True
        ).tolist()

        # Strict user and document isolation
        where_filter = {
            "$and": [
                {"userId": {"$eq": str(req.userId)}},
                {"documentId": {"$eq": str(req.documentId)}}
            ]
        }

        results = state["collection"].query(
            query_embeddings=[query_emb],
            n_results=max(1, min(req.topK, 15)),
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )

        chunks_out = []
        if results and results["documents"] and results["documents"][0]:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if results["metadatas"] else []
            dists = results["distances"][0] if results["distances"] else []

            for i in range(len(docs)):
                doc_text = docs[i]
                meta = metas[i] if i < len(metas) else {}
                dist = dists[i] if i < len(dists) else 1.0

                # Cosine similarity calculation: normalized embeddings with cosine space
                similarity = max(0.0, min(1.0, 1.0 - (dist / 2.0)))

                chunks_out.append({
                    "text": doc_text,
                    "similarity": round(similarity, 4),
                    "pageNumber": meta.get("pageNumber", 1),
                    "chunkIndex": meta.get("chunkIndex", i),
                    "section": meta.get("section", "Document Content"),
                    "sourceFileName": meta.get("sourceFileName", ""),
                    "metadata": meta
                })

        return {"chunks": chunks_out}

    except Exception as e:
        print(f"[RAG Engine] Error querying document {req.documentId}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to query document: {str(e)}")

@app.post("/delete")
def delete_document_vectors(req: DeleteRequest):
    if not state["collection"]:
        raise HTTPException(status_code=500, detail="RAG Engine not initialized.")

    try:
        where_filter = {
            "$and": [
                {"userId": {"$eq": str(req.userId)}},
                {"documentId": {"$eq": str(req.documentId)}}
            ]
        }

        state["collection"].delete(where=where_filter)
        return {"status": "deleted", "documentId": req.documentId}
    except Exception as e:
        print(f"[RAG Engine] Error deleting vectors for {req.documentId}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete document vectors: {str(e)}")

if __name__ == "__main__":
    port = int(os.environ.get("RAG_PORT", 8001))
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
