# PIPELINE STATUS

- PDFs discovered: 11
- PDFs successfully processed: 11
- PDFs failed: 0
- pages processed: 60
- OCR-needed pages: 0
- chunks generated: 60
- duplicate chunks removed: 0
- vectors stored: 60
- embedding model: paraphrase-multilingual-MiniLM-L12-v2
- vector database: lightweight-numpy
- chunk size (chars): 2000
- chunk overlap (chars): 200
- tests passed: 7
- tests failed: 0

Files created:

- config/rag_config.yaml
- scripts/ingest_pdfs.py
- scripts/chunk_documents.py
- scripts/generate_embeddings.py
- scripts/validate_data.py
- scripts/run_pipeline.py
- scripts/inspect_pdfs.py
- scripts/generate_pipeline_status.py
- rag/embeddings.py
- rag/vectorstore.py
- README_RAG.md
- docs/API_CONTRACT.md
- PROJECT_INSPECTION.md

Files modified:

- config/rag_config.yaml (expected_pdf_count updated to match discovered files)

Files that should NOT be modified:

- data/raw/*.pdf (original PDFs)

Environment variables required:

- See .env.example for EMBEDDING_API_KEY and EMBEDDING_MODEL (optional)

Exact command to rebuild the pipeline:

python scripts/run_pipeline.py

Exact command to validate the pipeline:

python scripts/validate_data.py

Exact backend integration point:

Use rag.vectorstore.VectorStore.similarity_search(query_embedding, top_k, filter) to retrieve chunks with metadata