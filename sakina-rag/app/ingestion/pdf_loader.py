import os
from typing import List
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document

def load_pdf_file(pdf_path: str) -> List[Document]:
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found at: {pdf_path}")
    
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()
    
    doc_name = os.path.basename(pdf_path)
    for idx, doc in enumerate(documents):
        doc.metadata["source"] = doc_name
        # Page numbers 1-indexed
        doc.metadata["page"] = doc.metadata.get("page", idx) + 1
        
    return documents
