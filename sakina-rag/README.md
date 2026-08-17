# Sakina AI - RAG Backend Service 🌿

An Egyptian Arabic Mental Wellness AI Companion RAG (Retrieval-Augmented Generation) backend powered by **FastAPI**, **LangChain**, **ChromaDB**, and **OpenRouter API**.

---

## 📁 Project Structure

```
sakina-rag/
├── app/
│   ├── main.py                # FastAPI entry point with CORS middleware
│   ├── config.py              # Application settings & environment variables
│   ├── api/
│   │   └── chat.py            # POST /chat endpoint
│   ├── ingestion/
│   │   ├── pdf_loader.py      # Extract text, page numbers, & source document names
│   │   ├── chunker.py         # Semantic text chunking & topic metadata tagging
│   │   └── ingest.py          # PDF ingestion pipeline script
│   ├── embeddings/
│   │   └── embedder.py        # HuggingFace multilingual embeddings model
│   ├── vectorstore/
│   │   └── chroma.py          # Persistent ChromaDB vector store & retrieval
│   ├── llm/
│   │   └── openrouter.py      # OpenRouter LLM completion client
│   └── prompts/
│       └── sakina_prompt.py   # Sakina Egyptian Arabic psychological prompt
├── knowledge/
│   └── pdfs/                  # Place your trusted psychological PDFs here
├── .env                       # Environment variables
├── requirements.txt           # Python dependencies
└── README.md                  # Project documentation
```

---

## 🛠️ 1. Installation

### Prerequisites
- Python 3.9+ installed on your system.

### Steps
1. Navigate to the `sakina-rag` directory:
   ```bash
   cd sakina-rag
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure your `.env` file:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_MODEL=openrouter/free
   CHROMA_DB_DIR=./chroma_db
   ```

---

## 📚 2. Adding PDFs & Running Ingestion Pipeline

1. Place all trusted psychological PDF files inside the directory:
   `knowledge/pdfs/`

2. Generate seed PDF (optional if adding custom PDFs):
   ```bash
   python create_seed_pdf.py
   ```

3. Run the automated ingestion script:
   ```bash
   python app/ingestion/ingest.py
   ```

   *This will:*
   - Load all PDF documents.
   - Extract page numbers, sources, and text.
   - Chunk text and assign topic metadata (*Anxiety, Depression, Stress, OCD, PTSD, Panic Attacks, Sleep Problems, Self Esteem, Grief, Social Anxiety*).
   - Generate embeddings and persist vectors into **ChromaDB**.

---

## 🚀 3. Running the FastAPI Server

Start the FastAPI application on port `8000`:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 🧪 4. Testing the `/chat` Endpoint

### Using cURL:

```bash
curl -X POST "http://localhost:8000/chat" \
     -H "Content-Type: application/json" \
     -d '{"message": "أنا حاسس بالقلق ومش عارف أعمل ايه"}'
```

### Response Format:

```json
{
  "answer": "يا هلا بيك يا صديقي، سلامة قلبك من القلق. الطبيعي جداً إننا نمر بظروف نحس فيها بتوتر أو قلق مفرط، وأنا هنا جنبك وعايز أسمعك من غير أي أحكام...\n\nبناءً على المعرفة النفسية المتاحة عن اضطراب القلق، تقدر تجرب تمرين تنفس هادي، شهيق 4 ثواني وزفير بطيء...",
  "sources": [
    {
      "source": "mental_health_rag_kb.pdf",
      "page": 2,
      "topic": "Anxiety"
    }
  ]
}
```
