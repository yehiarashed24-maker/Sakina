POST /api/chat

Request (JSON):
{
  "message": "...",
  "conversation_id": "...",
  "top_k": 5
}

Response (JSON):
{
  "answer": "...",
  "sources": [
    {
      "filename": "filename.pdf",
      "page": 3,
      "chunk_id": "...",
      "score": 0.91
    }
  ],
  "scope": "mental_health",
  "confidence": 0.0
}

Notes:
- The backend should call the vectorstore retrieval layer to obtain top-k chunks and then pass those chunks to the LLM with their metadata (filename, page, chunk_id) so that answers include explicit citations.
- The "scope" field indicates the domain. Keep scope detection separate from ingestion.
- Do NOT fabricate page numbers — use the metadata stored with each chunk.
