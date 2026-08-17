import os
import glob
from app.ingestion.pdf_loader import load_pdf_file
from app.ingestion.chunker import chunk_documents
from app.vectorstore.chroma import get_vectorstore
from app.config import settings

def run_ingestion():
    pdf_dir = settings.KNOWLEDGE_BASE_DIR
    pdf_files = glob.glob(os.path.join(pdf_dir, "*.pdf"))
    
    if not pdf_files:
        print(f"⚠️ No PDF files found in '{pdf_dir}'. Please place PDF documents in knowledge/pdfs/")
        return

    print(f"📚 Found {len(pdf_files)} PDF file(s) for ingestion.")
    
    all_documents = []
    for pdf_path in pdf_files:
        print(f"📖 Loading: {pdf_path}")
        docs = load_pdf_file(pdf_path)
        all_documents.extend(docs)
        
    print(f"📄 Loaded {len(all_documents)} total pages.")
    
    chunks = chunk_documents(all_documents)
    print(f"🧩 Split into {len(chunks)} text chunks with metadata.")
    
    print("⏳ Storing vectors in ChromaDB...")
    vectorstore = get_vectorstore()
    vectorstore.add_documents(chunks)
    vectorstore.persist()
    print("✅ Ingestion successfully completed and saved to ChromaDB!")

if __name__ == "__main__":
    run_ingestion()
