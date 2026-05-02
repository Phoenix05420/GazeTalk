import os
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, AutoModelForCausalLM

MODEL_NAME = os.environ.get('ML_MODEL', 'philschmid/flan-t5-small')
OUT_PATH = 'quantized_model.pt'

print(f'Loading model {MODEL_NAME} for quantization...')
try:
    try:
        model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
        is_seq2seq = True
    except Exception as e1:
        try:
            print(f'Failed to load {MODEL_NAME}: {e1}. Falling back to google/flan-t5-small')
            MODEL_NAME = 'google/flan-t5-small'
            model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
            is_seq2seq = True
        except Exception:
            print('Falling back to causal model google/flan-t5-small (causal)')
            model = AutoModelForCausalLM.from_pretrained('google/flan-t5-small')
            is_seq2seq = False

    model.cpu()
    print('Applying dynamic quantization (weights to int8 for Linear modules)...')
    quantized_model = torch.quantization.quantize_dynamic(
        model, {torch.nn.Linear}, dtype=torch.qint8
    )
    print('Saving quantized model to', OUT_PATH)
    torch.save(quantized_model, OUT_PATH)
    print('Quantization complete.')
except Exception as e:
    print('Quantization failed:', e)
    raise
