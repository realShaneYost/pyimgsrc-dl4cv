#!/usr/bin/env python
import tensorflow as tf
import sys

print("=" * 60)
print("TensorFlow GPU Verification")
print("=" * 60)

# 1. Versions
print(f"\nPython version  : {sys.version}")
print(f"TensorFlow version: {tf.__version__}")

# 2. List physical devices
cpus = tf.config.list_physical_devices("CPU")
gpus = tf.config.list_physical_devices("GPU")

print(f"\nCPU devices: {len(cpus)}")
for d in cpus:
  print(f"  {d}")

print(f"\nGPU devices: {len(gpus)}")
for d in gpus:
  print(f"  {d}")

if not gpus:
  print("\n⚠  No GPU detected.")
  print("   Check that tensorflow-metal is installed:")
  print("   pip list | grep tensorflow-metal")
  sys.exit(1)

# 3. Run a matmul on the GPU
print("\nRunning matmul on GPU...")
with tf.device("/GPU:0"):
  a = tf.random.normal([2000, 2000])
  b = tf.random.normal([2000, 2000])
  c = tf.matmul(a, b)

print(f"  Result shape: {c.shape}")
print(f"  Result dtype: {c.dtype}")
print(f"  Executed on : {c.device}")
print(f"  Sample value: {c[0, 0].numpy():.4f}")

print("\n✅ GPU acceleration is working.")
