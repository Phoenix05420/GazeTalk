"""
GazeTalk Backend — NLLB-based text translator.
Uses Meta's NLLB-200-distilled-600M model for high-quality translation
between English and Indian languages (Tamil, Malayalam, Kannada).

Model is loaded lazily on first request (not at import time).
"""
import os
import logging
import threading
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout

logger = logging.getLogger("gztalk.ml_translator")

DEFAULT_MODEL = os.environ.get('NLLB_MODEL', 'facebook/nllb-200-distilled-600M')
TRANSLATION_TIMEOUT = int(os.environ.get('NLLB_TIMEOUT', '15'))

_model_name = DEFAULT_MODEL
_model = None
_tokenizer = None
_loaded = False
_load_lock = threading.Lock()
_executor = ThreadPoolExecutor(max_workers=1)




def _do_load(model_name: str):
    global _model_name, _model, _tokenizer, _loaded

    import torch
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

    _model_name = model_name
    logger.info("Loading NLLB translation model '%s'...", _model_name)

    _tokenizer = AutoTokenizer.from_pretrained(_model_name, use_fast=True)
    _model = AutoModelForSeq2SeqLM.from_pretrained(_model_name)

    _model.eval()
    if torch.cuda.is_available():
        _model.to('cuda')
        logger.info("NLLB model loaded on CUDA")
    else:
        logger.info("NLLB model loaded on CPU")

    _loaded = True


def _ensure_loaded():
    global _loaded
    if _loaded:
        return
    with _load_lock:
        if _loaded:
            return
        try:
            _do_load(_model_name)
        except Exception as e:
            logger.exception("NLLB model load failed: %s", e)
            _loaded = False


def _translate(text: str, src_lang: str, tgt_lang: str) -> str:
    import torch

    _tokenizer.src_lang = src_lang
    inputs = _tokenizer(text, return_tensors='pt', padding=True)

    if torch.cuda.is_available():
        inputs = {k: v.to('cuda') for k, v in inputs.items()}

    forced_bos_token_id = _tokenizer.convert_tokens_to_ids(tgt_lang)

    with torch.no_grad():
        outputs = _model.generate(
            **inputs,
            forced_bos_token_id=forced_bos_token_id,
            max_new_tokens=200,
            do_sample=False,
        )

    return _tokenizer.decode(outputs[0], skip_special_tokens=True)


def translate(text: str, src_lang: str, tgt_lang: str) -> str:
    """Translate text from source language to target language using NLLB.
    Times out after TRANSLATION_TIMEOUT seconds and raises RuntimeError.

    Args:
        text: Text to translate
        src_lang: Source NLLB language code (e.g. 'eng_Latn')
        tgt_lang: Target NLLB language code (e.g. 'tam_Taml')

    Returns:
        Translated text
    """
    _ensure_loaded()

    if _model is None or _tokenizer is None:
        raise RuntimeError("NLLB translation model not available")

    if not text or not text.strip():
        return ''

    try:
        future = _executor.submit(_translate, text.strip(), src_lang, tgt_lang)
        return future.result(timeout=TRANSLATION_TIMEOUT)
    except FuturesTimeout:
        logger.warning("NLLB translation timed out after %ds", TRANSLATION_TIMEOUT)
        raise RuntimeError("Translation timed out")
    except Exception as e:
        logger.exception("NLLB translation error: %s", e)
        raise


def reload_model(model_name: str = None):
    """Reload the NLLB model (useful for admin endpoint)."""
    global _loaded, _model, _tokenizer
    with _load_lock:
        _loaded = False
        _model = None
        _tokenizer = None
        try:
            _do_load(model_name or DEFAULT_MODEL)
        except Exception as e:
            logger.exception("NLLB model reload failed: %s", e)
            raise
