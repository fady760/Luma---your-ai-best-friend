import numpy as np
import logging

logger = logging.getLogger(__name__)

# Lazy initialization
_model = None

def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading sentence-transformers model (all-MiniLM-L6-v2)...")
            _model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Model loaded successfully.")
        except ImportError:
            logger.warning("sentence-transformers not installed.")
            return None
    return _model

def generate_embedding(text: str) -> bytes:
    """
    Generate an embedding for the given text and return it as bytes.
    """
    model = _get_model()
    if model is None:
        return b""
    
    # Generate embedding (numpy array of float32)
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding.tobytes()

def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    dot = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(dot / (norm1 * norm2))

def search_memories(query: str, memories: list, top_k: int = 5, threshold: float = 0.2) -> list:
    """
    Search a list of memories (which have an embedding bytes field)
    and return the top_k most relevant ones along with their scores.
    """
    model = _get_model()
    if model is None or not memories:
        return []

    query_embedding = model.encode(query, convert_to_numpy=True)
    
    results = []
    for memory in memories:
        if not memory.embedding:
            continue
            
        try:
            mem_vec = np.frombuffer(memory.embedding, dtype=np.float32)
            score = cosine_similarity(query_embedding, mem_vec)
            if score >= threshold:
                results.append({
                    "memory": memory,
                    "score": score
                })
        except Exception as e:
            logger.error(f"Error comparing embeddings for memory {memory.id}: {e}")
            continue

    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]
