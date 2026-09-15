"""
SAKINA RAG RETRIEVAL EVALUATION BENCHMARK
=========================================
Runs rigorous evaluation on the active vector retrieval pipeline
using the curated ground-truth clinical dataset.

Calculates:
- Precision@3, Recall@3
- Precision@5, Recall@5
- Precision@10, Recall@10
- Mean Reciprocal Rank (MRR)
- Average Retrieval Latency

Outputs REAL calculated metrics to sakina-rag/eval/eval_results.json.
NEVER mocks or hardcodes results.
"""

import json
import time
import os
import sys
from datetime import datetime
from pathlib import Path

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from app.vectorstore.local_store import get_vectorstore, get_embedder

def evaluate_retrieval_benchmark():
    dataset_path = ROOT_DIR / "eval" / "eval_dataset.json"
    results_path = ROOT_DIR / "eval" / "eval_results.json"
    
    if not dataset_path.exists():
        print(f"Error: Evaluation dataset not found at {dataset_path}")
        return
        
    with open(dataset_path, "r", encoding="utf-8") as f:
        benchmark_queries = json.load(f)
        
    store = get_vectorstore()
    embedder = get_embedder()
    
    total_queries = len(benchmark_queries)
    print(f"Starting SAKINA Retrieval Benchmark on {total_queries} queries...")
    
    k_values = [3, 5, 10]
    hits_at_k = {k: 0 for k in k_values}
    precision_at_k = {k: 0.0 for k in k_values}
    reciprocal_ranks = []
    latencies = []
    per_query_results = []
    
    start_eval_time = time.time()
    
    for item in benchmark_queries:
        query_id = item["id"]
        query_text = item["query"]
        expected_doc = item["expected_document"]
        lang = item.get("language", "ar")
        
        t0 = time.perf_counter()
        query_emb = embedder.embed_texts([query_text])[0]
        results = store.similarity_search(query_emb, top_k=max(k_values))
        t_query = (time.perf_counter() - t0) * 1000
        latencies.append(t_query)
        
        retrieved_docs = []
        for m in results.get("metadatas", []):
            fname = m.get("filename", "")
            if fname:
                retrieved_docs.append(fname)
                
        # Find first rank of expected document (1-indexed)
        target_rank = None
        for r_idx, doc_name in enumerate(retrieved_docs):
            if doc_name == expected_doc:
                target_rank = r_idx + 1
                break
                
        # Calculate reciprocal rank
        if target_rank is not None:
            rr = 1.0 / target_rank
        else:
            rr = 0.0
        reciprocal_ranks.append(rr)
        
        # Calculate Hit and Precision at each K
        for k in k_values:
            top_k_docs = retrieved_docs[:k]
            matching_count = sum(1 for d in top_k_docs if d == expected_doc)
            
            if matching_count > 0:
                hits_at_k[k] += 1
                
            precision_at_k[k] += matching_count / k
            
        per_query_results.append({
            "id": query_id,
            "query": query_text,
            "language": lang,
            "expected_document": expected_doc,
            "first_rank": target_rank,
            "reciprocal_rank": round(rr, 4),
            "top_3_retrieved": retrieved_docs[:3],
            "latency_ms": round(t_query, 2)
        })
        
    total_eval_duration = time.time() - start_eval_time
    
    # Aggregate Metrics
    recall_scores = {f"Recall@{k}": round(hits_at_k[k] / total_queries, 4) for k in k_values}
    precision_scores = {f"Precision@{k}": round(precision_at_k[k] / total_queries, 4) for k in k_values}
    mrr_score = round(sum(reciprocal_ranks) / total_queries, 4)
    avg_latency = round(sum(latencies) / len(latencies), 2)
    
    summary = {
        "evaluation_name": "SAKINA Clinical RAG Benchmark",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "dataset_size": total_queries,
        "embedding_model": "paraphrase-multilingual-MiniLM-L12-v2",
        "vector_database": "Lightweight NumPy Store (267 chunks, 11 clinical PDFs)",
        "reranking_enabled": False,
        "reranking_status": "Not Enabled (Candidate Architecture Prepared)",
        "metrics": {
            "mrr": mrr_score,
            "recall_at_3": recall_scores["Recall@3"],
            "precision_at_3": precision_scores["Precision@3"],
            "recall_at_5": recall_scores["Recall@5"],
            "precision_at_5": precision_scores["Precision@5"],
            "recall_at_10": recall_scores["Recall@10"],
            "precision_at_10": precision_scores["Precision@10"],
            "avg_retrieval_latency_ms": avg_latency
        },
        "metric_definitions": {
            "Recall@K": "Proportion of queries where the verified ground-truth clinical document appeared in Top-K candidates.",
            "Precision@K": "Fraction of Top-K retrieved chunks that belong to the relevant document domain.",
            "MRR": "Mean Reciprocal Rank: average of 1/rank for the first relevant document retrieved."
        },
        "per_query_results": per_query_results
    }
    
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
        
    print("================ SAKINA EVALUATION RESULTS ================")
    print(f"Total Benchmark Queries: {total_queries}")
    print(f"Mean Reciprocal Rank (MRR): {mrr_score}")
    print(f"Recall@3: {recall_scores['Recall@3']} | Precision@3: {precision_scores['Precision@3']}")
    print(f"Recall@5: {recall_scores['Recall@5']} | Precision@5: {precision_scores['Precision@5']}")
    print(f"Recall@10: {recall_scores['Recall@10']} | Precision@10: {precision_scores['Precision@10']}")
    print(f"Average Retrieval Latency: {avg_latency} ms")
    print(f"Results saved to: {results_path}")
    print("===========================================================")
    return summary

if __name__ == "__main__":
    evaluate_retrieval_benchmark()
