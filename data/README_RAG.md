Sakina AI — RAG Data Preparation

Overview

This repository contains a deterministic RAG data preparation pipeline for medical PDFs (Arabic + English). It extracts PDFs, chunks them, creates embeddings, and upserts into a vector store with idempotency.

Structure

- data/
  - raw/                 # original PDF copies (do not modify originals)
  - processed/
    - documents.jsonl
    - chunks.jsonl
    - metadata.json
  - reports/
    - ingestion_report.json
    - quality_report.json
  - vector_store/        # chroma persistent directory
  - failed/
    - failed_documents.json
- config/rag_config.yaml
- scripts/
  - inspect_pdfs.py
  - ingest_pdfs.py
  - chunk_documents.py
  - generate_embeddings.py
  - validate_data.py
  - run_pipeline.py
- rag/
  - embeddings.py
  - vectorstore.py
- .env.example
- README_RAG.md
- PROJECT_INSPECTION.md

Installation

1. Create a virtual environment (recommended):
   python -m venv .venv
   .\.venv\Scripts\activate

2. Install requirements:
   python -m pip install -r requirements.txt

Environment variables

- See .env.example. Do NOT commit secrets. If using external embedding APIs add keys to .env (not committed).

How to place PDFs

Place PDFs in data/raw/ (the pipeline will discover them). Original data files in the repository root data/ are preserved; pipeline copies into data/raw.

Run the pipeline

python scripts/run_pipeline.py

Validate dataset

python scripts/validate_data.py

Rebuild vector database

Delete data/vector_store/ or run a script to reset the collection (not included) then re-run run_pipeline.py

Backend integration

The backend should call rag retrieval interface to query for top-k documents. See docs/API_CONTRACT.md for the frontend contract.

Troubleshooting

- If missing dependencies: pip install -r requirements.txt
- If OCR needed pages are reported: enable OCR in config and plug OCRProvider implementation

Configuration

See config/rag_config.yaml for all tunable parameters (paths, chunk sizes, embedding model, retrieval settings)
