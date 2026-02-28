#!/usr/bin/env python
import sys

print("=" * 60)
print("DL4CV Environment Verification")
print("=" * 60)
print(f"\nPython: {sys.version}\n")

checks = []

# --- TensorFlow ---
try:
  import tensorflow as tf
  ver = tf.__version__
  gpus = tf.config.list_physical_devices("GPU")
  gpu_status = f"✅ {len(gpus)} GPU(s)" if gpus else "⚠  CPU only"
  checks.append(("tensorflow", ver, gpu_status))
except ImportError as e:
  checks.append(("tensorflow", "MISSING", f"❌ {e}"))

# --- OpenCV ---
try:
  import cv2
  checks.append(("cv2 (OpenCV)", cv2.__version__, "✅"))
except ImportError as e:
  checks.append(("cv2 (OpenCV)", "MISSING", f"❌ {e}"))

# --- scikit-image ---
try:
  import skimage
  checks.append(("scikit-image", skimage.__version__, "✅"))
except ImportError as e:
  checks.append(("scikit-image", "MISSING", f"❌ {e}"))

# --- scikit-learn ---
try:
  import sklearn
  checks.append(("scikit-learn", sklearn.__version__, "✅"))
except ImportError as e:
  checks.append(("scikit-learn", "MISSING", f"❌ {e}"))

# --- numpy ---
try:
  import numpy as np
  checks.append(("numpy", np.__version__, "✅"))
except ImportError as e:
  checks.append(("numpy", "MISSING", f"❌ {e}"))

# --- matplotlib ---
try:
  import matplotlib
  checks.append(("matplotlib", matplotlib.__version__, "✅"))
except ImportError as e:
  checks.append(("matplotlib", "MISSING", f"❌ {e}"))

# --- pillow ---
try:
  import PIL
  checks.append(("Pillow", PIL.__version__, "✅"))
except ImportError as e:
  checks.append(("Pillow", "MISSING", f"❌ {e}"))

# --- imutils ---
try:
  import imutils
  checks.append(("imutils", imutils.__version__, "✅"))
except ImportError as e:
  checks.append(("imutils", "MISSING", f"❌ {e}"))

# --- h5py ---
try:
  import h5py
  checks.append(("h5py", h5py.__version__, "✅"))
except ImportError as e:
  checks.append(("h5py", "MISSING", f"❌ {e}"))

# --- Print results ---
print(f"{'Package':<20} {'Version':<15} {'Status'}")
print("-" * 55)
for name, ver, status in checks:
  print(f"{name:<20} {ver:<15} {status}")

print("\n" + "=" * 60)
all_ok = all("MISSING" not in c[1] for c in checks)
if all_ok:
  print("✅ All packages installed. Environment is ready for DL4CV.")
else:
  print("❌ Some packages are missing. See above.")
print("=" * 60)
