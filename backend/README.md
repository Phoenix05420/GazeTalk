GazeTalk Backend

This is a simple FastAPI backend used by the GazeTalk prototype. It provides:
- POST /enhance : accept fused events and return an enhanced sentence
- WebSocket /ws : accept fused events and stream back enhanced sentences

Quick start:

1. Create a virtualenv and install deps:
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt

2. Run locally:
   uvicorn backend.main:app --reload

3. Build Docker image:
   docker build -t gazetalk-backend ./backend

Notes:
- The current enhancer is a lightweight rule-based function in utils.py. Replace with an ML model or call to a larger LM for better quality.
- Keep latency low: prefer short HTTP or WebSocket messages and batch if necessary.
