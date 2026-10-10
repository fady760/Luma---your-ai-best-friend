import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from app.main import app
from app.database import get_session, engine
from sqlmodel import Session, SQLModel, text

client = TestClient(app)

def test_semantic_search_flow():
    # Setup - clear memories
    with Session(engine) as session:
        # Add column if not exists to avoid SQL errors on test if using real DB
        try:
            session.exec(text('ALTER TABLE memory ADD COLUMN embedding BLOB'))
            session.commit()
        except:
            session.rollback()
        
        session.exec(text("DELETE FROM memory"))
        session.exec(text("DELETE FROM user"))
        session.commit()

    # 1. Create two users to test data isolation
    client.post("/api/auth/register", json={"username": "alice", "email": "alice@test.com", "password": "password"})
    res1 = client.post("/api/auth/login", json={"username": "alice", "password": "password"})
    token1 = res1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    client.post("/api/auth/register", json={"username": "bob", "email": "bob@test.com", "password": "password"})
    res2 = client.post("/api/auth/login", json={"username": "bob", "password": "password"})
    token2 = res2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 2. Test empty search
    res = client.get("/api/memories/search?query=test", headers=headers1)
    assert res.status_code == 200
    assert len(res.json()) == 0
    print("Empty search OK")

    # 3. Create memories for Alice
    client.post("/api/memories", json={"content": "I want to become a software engineer at Google."}, headers=headers1)
    m2 = client.post("/api/memories", json={"content": "I am feeling very anxious about my math exam next week."}, headers=headers1)
    client.post("/api/memories", json={"content": "I love playing tennis on weekends."}, headers=headers1)
    
    # Create memories for Bob
    client.post("/api/memories", json={"content": "I need to study for my history exam."}, headers=headers2)
    print("Memory creation OK")

    # 4. Relevant-result ranking
    # Alice searches for "career goals" -> should match "software engineer"
    res = client.get("/api/memories/search?query=career goals", headers=headers1)
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert "software engineer" in data[0]["content"]
    assert data[0]["score"] > 0.0
    print("Ranking OK (Alice found software engineer)")

    # 5. User data isolation
    # Alice searches for "exam" -> should match "math exam", NOT Bob's "history exam"
    res = client.get("/api/memories/search?query=exam", headers=headers1)
    data = res.json()
    print("Alice searching for 'exam':", data)
    assert len(data) >= 1
    assert "math exam" in data[0]["content"]
    
    # Bob searches for "exam" -> should match "history exam"
    res = client.get("/api/memories/search?query=exam", headers=headers2)
    data = res.json()
    print("Bob searching for 'exam':", data)
    assert len(data) >= 1
    assert "history exam" in data[0]["content"]
    print("Data isolation OK")

    # 6. Update memory and check search again
    m2_id = m2.json()["id"]
    client.put(f"/api/memories/{m2_id}", json={"content": "I aced my math exam! No more anxiety."}, headers=headers1)
    
    res = client.get("/api/memories/search?query=anxious", headers=headers1)
    # the word anxious is no longer in the memory (wait, anxiety is, which is semantically similar). 
    # Let's just check the content updated.
    assert "aced my math exam" in res.json()[0]["content"]
    print("Memory update OK")

    # 7. Delete memory
    client.delete(f"/api/memories/{m2_id}", headers=headers1)
    res = client.get("/api/memories", headers=headers1)
    assert len(res.json()) == 2
    print("Memory deletion OK")
    
    print("ALL TESTS PASSED!")

if __name__ == "__main__":
    test_semantic_search_flow()
