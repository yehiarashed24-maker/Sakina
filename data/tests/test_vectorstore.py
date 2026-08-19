from rag.vectorstore import VectorStore


def test_vectorstore_count():
    vs = VectorStore('data/vector_store')
    c = vs.count()
    assert isinstance(c, int)
