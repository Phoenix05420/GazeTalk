"""
GazeTalk Backend — FastAPI server.
Provides AI sentence enhancement, word suggestions, health checks,
and WebSocket streaming for the React Native frontend.
"""
from fastapi import FastAPI, WebSocket, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
import uvicorn
import logging
import re

from utils import enhance_sentence, enhance_from_keywords
from suggestions import suggest, suggest_next_word
from ml_enhancer import load_model
from ml_translator import translate as nllb_translate
import asyncio

# ─── App Setup ─────────────────────────────────────────
app = FastAPI(
    title="GazeTalk Backend",
    description="AI-powered communication backend for eye-tracking keyboard",
    version="2.0.0",
)

@app.on_event("startup")
async def startup_event():
    logger.info("Triggering background ML model load...")
    asyncio.create_task(asyncio.to_thread(load_model))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger("gztalk.backend")

# ─── Request / Response Models ─────────────────────────

class EnhanceRequest(BaseModel):
    keywords: List[str] = Field(..., min_length=1, max_length=50, description="List of typed keywords")

class FusedEvent(BaseModel):
    gaze_x: float = Field(..., ge=0.0, le=1.0)
    gaze_y: float = Field(..., ge=0.0, le=1.0)
    gesture: str
    confidence: float = 0.0
    timestamp: Optional[int] = None

class EnhanceResponse(BaseModel):
    sentence: str
    ok: bool = True

class SuggestResponse(BaseModel):
    suggestions: List[str]

NLLB_CODE_PATTERN = re.compile(r'^[a-z]{2,5}_[A-Z][a-z]{2,4}$')
SUPPORTED_NLLB_CODES = {'eng_Latn', 'tam_Taml', 'mal_Mlym', 'kan_Knda'}

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000, description="Text to translate")
    src_lang: str = Field(..., min_length=1, max_length=20, description="Source NLLB language code (e.g. eng_Latn)")
    tgt_lang: str = Field(..., min_length=1, max_length=20, description="Target NLLB language code (e.g. tam_Taml)")

    @field_validator('src_lang', 'tgt_lang')
    @classmethod
    def validate_nllb_code(cls, v: str) -> str:
        if not NLLB_CODE_PATTERN.match(v):
            raise ValueError(f"Invalid NLLB code format: '{v}'. Expected pattern like 'eng_Latn'")
        return v

class TranslateResponse(BaseModel):
    translated_text: str
    ok: bool = True


# ─── Endpoints ─────────────────────────────────────────

@app.get('/health')
async def health():
    """Health check endpoint."""
    return {"status": "ok", "version": "2.0.0"}


@app.post('/enhance', response_model=EnhanceResponse)
async def enhance(req: EnhanceRequest):
    """Accepts a list of typed keywords from the React Native frontend
    and returns an AI-enhanced natural sentence.
    """
    try:
        # Validate individual keyword length
        for kw in req.keywords:
            if len(kw) > 100:
                raise HTTPException(status_code=400, detail="Keyword too long (max 100 chars)")

        sentence = enhance_from_keywords(req.keywords)
        return EnhanceResponse(sentence=sentence)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Enhancement error")
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/enhance/gaze', response_model=EnhanceResponse)
async def enhance_gaze(event: FusedEvent):
    """Gaze + gesture fusion endpoint.
    Converts gaze coordinates and gesture type into a natural sentence.
    """
    try:
        sentence = enhance_sentence(event.dict())
        return EnhanceResponse(sentence=sentence)
    except Exception as e:
        logger.exception("Gaze enhancement error")
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/suggest', response_model=SuggestResponse)
async def get_suggestions(
    partial: str = Query("", description="Partial word or full text to get suggestions for"),
    limit: int = Query(5, ge=1, le=10, description="Max number of suggestions"),
):
    """Returns word completion suggestions for partial input."""
    try:
        words = suggest_next_word(partial, limit)
        return SuggestResponse(suggestions=words)
    except Exception as e:
        logger.exception("Suggestion error")
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/translate', response_model=TranslateResponse)
async def translate_endpoint(req: TranslateRequest):
    """Translates text between languages using the NLLB model.
    Accepts source text and NLLB language codes for source/target.
    Falls back to returning original text if translation is unavailable.
    """
    try:
        translated = nllb_translate(req.text, req.src_lang, req.tgt_lang)
        return TranslateResponse(translated_text=translated)
    except Exception as e:
        logger.warning("Translation failed, returning original text: %s", e)
        return TranslateResponse(translated_text=req.text, ok=False)


@app.post('/admin/reload_model')
async def reload_model_endpoint(model_name: Optional[str] = None):
    """Reload ML model on the server."""
    try:
        from ml_enhancer import reload_model
        reload_model(model_name)
        return {"ok": True, "model": model_name or "default"}
    except Exception as e:
        logger.exception("Reload model failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket('/ws')
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time sentence streaming."""
    await websocket.accept()
    logger.info("WebSocket client connected")
    try:
        while True:
            data = await websocket.receive_json()
            if 'keywords' in data:
                sentence = enhance_from_keywords(data['keywords'])
            else:
                sentence = enhance_sentence(data)
            await websocket.send_json({"sentence": sentence})
    except Exception:
        logger.info("WebSocket client disconnected")
        await websocket.close()


if __name__ == '__main__':
    uvicorn.run('main:app', host='0.0.0.0', port=8000, reload=True)
