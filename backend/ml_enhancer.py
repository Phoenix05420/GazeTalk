"""
GazeTalk Backend — ML-based sentence enhancer.
Uses a HuggingFace seq2seq or causal model to turn keywords into natural sentences.

Model is loaded lazily on first request (not at import time) to keep startup fast.
"""
import os
import logging
import threading
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout

logger = logging.getLogger("gztalk.ml_enhancer")

# Configurable model via environment variable
DEFAULT_MODEL = os.environ.get('ML_MODEL', 'google/flan-t5-small')
GENERATION_TIMEOUT = int(os.environ.get('ML_TIMEOUT', '8'))  # seconds

_model_name = DEFAULT_MODEL
_tokenizer = None
_model = None
_is_seq2seq = False
_loaded = False
_load_lock = threading.Lock()
_executor = ThreadPoolExecutor(max_workers=1)


def _do_load(model_name: str):
    """Internal: actually load the model (called inside lock)."""
    global _model_name, _tokenizer, _model, _is_seq2seq, _loaded

    # Import here to avoid import-time crash if torch/transformers missing
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM, AutoModelForSeq2SeqLM

    _model_name = model_name
    logger.info("Loading ML enhancer model '%s'...", _model_name)

    # Prefer quantized serialized model if present
    quant_path = os.path.join(os.path.dirname(__file__), 'quantized_model.pt')
    if os.path.exists(quant_path):
        logger.info("Loading quantized model from %s", quant_path)
        _model = torch.load(quant_path, map_location='cpu')
        _tokenizer = AutoTokenizer.from_pretrained(_model_name, use_fast=True)
        _is_seq2seq = hasattr(_model, 'generate')
    else:
        # Try Seq2Seq first (e.g., flan-t5); fall back to causal LM
        try:
            _tokenizer = AutoTokenizer.from_pretrained(_model_name, use_fast=True)
            _model = AutoModelForSeq2SeqLM.from_pretrained(_model_name)
            _is_seq2seq = True
        except Exception:
            _tokenizer = AutoTokenizer.from_pretrained(_model_name, use_fast=True)
            _model = AutoModelForCausalLM.from_pretrained(_model_name)
            _is_seq2seq = False

    _model.eval()
    if torch.cuda.is_available():
        _model.to('cuda')
        logger.info("Model loaded on CUDA")
    else:
        logger.info("Model loaded on CPU")

    _loaded = True


def _ensure_loaded():
    """Lazy-load model on first call."""
    global _loaded
    if _loaded:
        return
    with _load_lock:
        if _loaded:
            return
        try:
            _do_load(_model_name)
        except Exception as e:
            logger.exception("Model load failed: %s", e)
            _loaded = False


def load_model(model_name: str = None):
    """Public API: (re-)load a specific model."""
    global _loaded
    with _load_lock:
        _loaded = False
        _do_load(model_name or DEFAULT_MODEL)


def reload_model(model_name: str = None):
    """Alias for load_model — used by admin endpoint."""
    load_model(model_name)


def _generate(prompt: str) -> str:
    """Run model inference (called in thread pool for timeout support)."""
    import torch

    inputs = _tokenizer(prompt, return_tensors='pt')
    if torch.cuda.is_available():
        inputs = {k: v.to('cuda') for k, v in inputs.items()}

    with torch.no_grad():
        outputs = _model.generate(**inputs, max_new_tokens=50, do_sample=False)

    text = _tokenizer.decode(outputs[0], skip_special_tokens=True)
    if 'Corrected:' in text:
        return text.split('Corrected:')[-1].strip()
    if 'Sentence:' in text:
        return text.split('Sentence:')[-1].strip()
    return text.strip()


def enhance_sentence_ml(keywords: list[str]) -> str:
    """Generate a short natural sentence from keywords using the loaded model.
    Times out after GENERATION_TIMEOUT seconds and raises RuntimeError.
    """
    _ensure_loaded()

    if _tokenizer is None or _model is None:
        raise RuntimeError("ML model not available")

    # Use a direct grammar correction prompt that works well with flan-t5
    text = ' '.join(keywords)
    prompt = f"Fix grammar: {text}.\nCorrected:"

    try:
        future = _executor.submit(_generate, prompt)
        return future.result(timeout=GENERATION_TIMEOUT)
    except FuturesTimeout:
        logger.warning("ML generation timed out after %ds", GENERATION_TIMEOUT)
        raise RuntimeError("Generation timed out")
    except Exception as e:
        logger.exception("ML generation error: %s", e)
        raise
