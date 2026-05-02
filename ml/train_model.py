"""
GazeTalk ASL Hand Sign Classifier — Training Script
Trains a lightweight CNN on the Sign Language MNIST dataset.
Exports to Keras .h5 and a raw JSON weights file for browser use.
"""
import os
import json
import numpy as np
import pandas as pd

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "asl_model.h5")
TFJS_DIR = os.path.join(BASE_DIR, "tfjs_model")

# Label map: index -> letter
# Sign Language MNIST labels: 0-24 (skipping 9 for J, 25 for Z is not in the CSV)
LABEL_MAP = {i: chr(65 + i) for i in range(25)}
# Note: Label 9 will be "J" but it's not present in the data. 
# Labels in CSV are 0-8, 10-24. Max label is 24, so we need 25 classes.
NUM_CLASSES = 25

def download_dataset():
    print("📥 Downloading Sign Language MNIST dataset...")
    import kagglehub
    path = kagglehub.dataset_download("datamunge/sign-language-mnist")
    print(f"   Downloaded to: {path}")
    return path

def load_data(kaggle_path):
    print("📊 Loading dataset...")
    train_file = test_file = None
    for root, dirs, files in os.walk(kaggle_path):
        for f in files:
            if 'train' in f.lower() and f.endswith('.csv'):
                train_file = os.path.join(root, f)
            elif 'test' in f.lower() and f.endswith('.csv'):
                test_file = os.path.join(root, f)
    if not train_file or not test_file:
        raise FileNotFoundError(f"CSV files not found in {kaggle_path}")
    print(f"   Train: {train_file}")
    print(f"   Test:  {test_file}")

    train_df = pd.read_csv(train_file)
    test_df = pd.read_csv(test_file)

    y_train = train_df.iloc[:, 0].values
    X_train = train_df.iloc[:, 1:].values.reshape(-1, 28, 28, 1).astype('float32') / 255.0
    y_test = test_df.iloc[:, 0].values
    X_test = test_df.iloc[:, 1:].values.reshape(-1, 28, 28, 1).astype('float32') / 255.0

    # TF imports
    from tensorflow import keras
    y_train = keras.utils.to_categorical(y_train, NUM_CLASSES)
    y_test = keras.utils.to_categorical(y_test, NUM_CLASSES)

    print(f"   Train: {X_train.shape[0]} samples | Test: {X_test.shape[0]} samples")
    return X_train, y_train, X_test, y_test

def build_model():
    print("🧠 Building CNN model...")
    from tensorflow.keras import layers
    from tensorflow import keras

    model = keras.Sequential([
        layers.Input(shape=(28, 28, 1)),
        layers.Conv2D(32, (3,3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(32, (3,3), activation='relu', padding='same'),
        layers.MaxPooling2D((2,2)),
        layers.Dropout(0.25),

        layers.Conv2D(64, (3,3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3,3), activation='relu', padding='same'),
        layers.MaxPooling2D((2,2)),
        layers.Dropout(0.25),

        layers.Conv2D(128, (3,3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2,2)),
        layers.Dropout(0.3),

        layers.Flatten(),
        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.4),
        layers.Dense(NUM_CLASSES, activation='softmax')
    ])

    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    model.summary()
    return model

def train(model, X_train, y_train, X_test, y_test):
    print("\n🚀 Training model...")
    from tensorflow.keras.preprocessing.image import ImageDataGenerator

    datagen = ImageDataGenerator(
        rotation_range=10, width_shift_range=0.1,
        height_shift_range=0.1, zoom_range=0.1,
    )
    datagen.fit(X_train)

    model.fit(
        datagen.flow(X_train, y_train, batch_size=128),
        epochs=15, validation_data=(X_test, y_test), verbose=1
    )

    loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
    print(f"\n✅ Final Test Accuracy: {accuracy*100:.2f}%")
    print(f"   Final Test Loss:     {loss:.4f}")
    return accuracy

def export_tfjs(model):
    """Export model weights as raw numpy arrays in a format loadable by TF.js."""
    print(f"\n📦 Exporting model for TensorFlow.js...")
    os.makedirs(TFJS_DIR, exist_ok=True)

    # Try tensorflowjs_converter first
    try:
        import subprocess
        result = subprocess.run(
            ['tensorflowjs_converter', '--input_format', 'keras', MODEL_PATH, TFJS_DIR],
            capture_output=True, text=True, timeout=120
        )
        if result.returncode == 0:
            print("   ✅ TF.js model exported via tensorflowjs_converter")
            for f in os.listdir(TFJS_DIR):
                sz = os.path.getsize(os.path.join(TFJS_DIR, f))
                print(f"      {f} ({sz/1024:.1f} KB)")
            return True
    except Exception as e:
        print(f"   ⚠️ tensorflowjs_converter not available: {e}")

    # Fallback: Save as SavedModel and export weights as raw binary
    print("   Using fallback: exporting raw weights...")
    saved_model_dir = os.path.join(BASE_DIR, "saved_model")
    model.export(saved_model_dir)

    # Export weights as numpy binary for custom JS loader
    weights_info = []
    all_weights = bytearray()
    for layer in model.layers:
        for w in layer.get_weights():
            w_flat = w.astype(np.float32).flatten()
            offset = len(all_weights)
            all_weights.extend(w_flat.tobytes())
            weights_info.append({
                "name": layer.name,
                "shape": list(w.shape),
                "dtype": "float32",
                "offset": offset,
                "size": len(w_flat) * 4
            })

    # Save binary weights
    weights_path = os.path.join(TFJS_DIR, "weights.bin")
    with open(weights_path, 'wb') as f:
        f.write(bytes(all_weights))
    print(f"   💾 Weights: {len(all_weights)/1024:.1f} KB")

    # Save model topology + weights manifest
    topology = {
        "format": "gazetalk_custom",
        "num_classes": NUM_CLASSES,
        "input_shape": [28, 28, 1],
        "labels": LABEL_MAP,
        "weights": weights_info,
        "weights_file": "weights.bin",
        "architecture": "CNN_BN_Dropout"
    }
    manifest_path = os.path.join(TFJS_DIR, "model.json")
    with open(manifest_path, 'w') as f:
        json.dump(topology, f, indent=2)
    print(f"   📝 Manifest saved")
    return True

def save_labels():
    os.makedirs(TFJS_DIR, exist_ok=True)
    label_path = os.path.join(TFJS_DIR, "labels.json")
    with open(label_path, 'w') as f:
        json.dump(LABEL_MAP, f)
    print(f"   📝 Label map saved to {label_path}")

def main():
    print("=" * 50)
    print("  GazeTalk ASL Model Training Pipeline")
    print("=" * 50)

    kaggle_path = download_dataset()
    X_train, y_train, X_test, y_test = load_data(kaggle_path)
    model = build_model()
    accuracy = train(model, X_train, y_train, X_test, y_test)

    print(f"\n💾 Saving Keras model to {MODEL_PATH}...")
    model.save(MODEL_PATH)

    export_tfjs(model)
    save_labels()

    print(f"\n🎉 Pipeline complete!")
    print(f"   Model accuracy: {accuracy*100:.2f}%")
    print(f"   Keras model:    {MODEL_PATH}")
    print(f"   TF.js model:    {TFJS_DIR}")

if __name__ == "__main__":
    main()
