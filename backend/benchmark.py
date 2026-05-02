import time
import os
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, AutoModelForCausalLM
import torch
from statistics import mean, stdev
from difflib import SequenceMatcher

MODEL_NAME = os.environ.get('ML_MODEL', 'google/flan-t5-small')
SAMPLES = [
    {'keywords': ['hello', 'at (0.33, 0.66)'], 'ref': 'Hello at (0.33, 0.66)'},
    {'keywords': ['stop', 'at (0.50, 0.50)'], 'ref': 'Stop at (0.50, 0.50)'},
    {'keywords': ['good', 'at (0.20, 0.80)'], 'ref': 'Good at (0.20, 0.80)'},
    {'keywords': ['look', 'at (0.10, 0.90)'], 'ref': 'Look at (0.10, 0.90)'},
    {'keywords': ['hello', 'friend'], 'ref': 'Hello friend'},
]
TRIALS = 5


def load_model(model_name, device):
    print(f"Loading model {model_name} on {device}")
    tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=True)
    # Try seq2seq then causal
    try:
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
        is_seq2seq = True
    except Exception:
        model = AutoModelForCausalLM.from_pretrained(model_name)
        is_seq2seq = False
    model.eval()
    model.to(device)
    return tokenizer, model, is_seq2seq


def generate_sentence(tokenizer, model, is_seq2seq, keywords, device):
    prompt = f"Convert these keywords into one natural, concise, user-intended sentence: {', '.join(keywords)}\nSentence:"
    inputs = tokenizer(prompt, return_tensors='pt')
    inputs = {k: v.to(device) for k, v in inputs.items()}
    with torch.no_grad():
        outputs = model.generate(**inputs, max_new_tokens=50, do_sample=False)
    text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    if 'Sentence:' in text:
        return text.split('Sentence:')[-1].strip()
    return text.strip()


def similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()


def benchmark(device):
    try:
        tokenizer, model, is_seq2seq = load_model(MODEL_NAME, device)
    except Exception as e:
        print(f"Failed to load model on {device}: {e}")
        return None

    latencies = []
    qualities = []
    outputs = []

    for t in range(TRIALS):
        for s in SAMPLES:
            start = time.time()
            sent = generate_sentence(tokenizer, model, is_seq2seq, s['keywords'], device)
            end = time.time()
            ms = (end - start) * 1000
            latencies.append(ms)
            sim = similarity(sent, s['ref'])
            qualities.append(sim)
            outputs.append({'keywords': s['keywords'], 'ref': s['ref'], 'out': sent, 'latency_ms': ms, 'sim': sim})
            print(f"Device={device} Trial={t+1} Sample={s['keywords']} Latency={ms:.1f}ms Sim={sim:.2f} Out='{sent}'")

    return {
        'device': device,
        'avg_latency_ms': mean(latencies),
        'std_latency_ms': stdev(latencies) if len(latencies)>1 else 0.0,
        'avg_quality': mean(qualities),
        'details': outputs
    }


def main():
    results = []
    # CPU benchmark
    res_cpu = benchmark('cpu')
    if res_cpu:
        results.append(res_cpu)

    # GPU benchmark if available
    if torch.cuda.is_available():
        res_gpu = benchmark('cuda')
        if res_gpu:
            results.append(res_gpu)
    else:
        print('CUDA not available on this machine; skipping GPU benchmark')

    print('\nSummary:')
    for r in results:
        print(f"Device: {r['device']} Avg latency: {r['avg_latency_ms']:.1f}ms (±{r['std_latency_ms']:.1f}) Avg quality(sim): {r['avg_quality']:.3f}")

if __name__ == '__main__':
    main()
