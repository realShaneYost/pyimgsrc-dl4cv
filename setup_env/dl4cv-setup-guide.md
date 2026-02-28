# DL4CV Local Dev Environment — macOS Apple Silicon (M3 Max)

> **Target book:** PyImageSearch *Deep Learning for Computer Vision with Python*, 3rd Edition
> **Machine:** MacBook Pro, M3 Max, 48 GB RAM, ~685 GB free, macOS Tahoe 26.3 (arm64)
> **Approach:** Native install, Python venv, no Docker/VM/cloud
> **Date authored:** 2025-02-22

---

## 1. Compatibility Decision — Python Version

### Can you use your system Python 3.12.2?

**Yes — with a caveat.**

TensorFlow publishes native `macosx_12_0_arm64` wheels for Python 3.10, 3.11, and 3.12 (and 3.13 starting with TF 2.20). Your system Python 3.12.2 is technically compatible with the TensorFlow wheel.

**However**, the version of TensorFlow you should target is **not** the latest 2.20.0 — it's **2.18.1**. Here's why:

Apple's GPU acceleration plugin, `tensorflow-metal`, is what lets TensorFlow dispatch compute to your M3 Max GPU cores via the Metal API. The latest release of `tensorflow-metal` is **1.2.0** (January 2025). Multiple developers have confirmed on the Apple Developer Forums that `tensorflow-metal` 1.2.0 **fails to load** with TensorFlow versions above 2.18.1 due to a shared library linking mismatch (`_pywrap_tensorflow_internal.so`). The error manifests as a `NotFoundError` during `import tensorflow`.

The known-good, stable combination is:

| Component            | Version  | Notes                                        |
| -------------------- | -------- | -------------------------------------------- |
| Python               | 3.12.x   | Wheels exist for cp312 on arm64              |
| `tensorflow`         | 2.18.1   | Last version compatible with tensorflow-metal |
| `tensorflow-metal`   | 1.2.0    | Apple's Metal GPU plugin                     |

### Recommendation

**Use Python 3.12.x** (your system Python qualifies, but I recommend pyenv for isolation — explained next). Do **not** install the latest TensorFlow; pin to 2.18.1.

---

## 2. Python Installation via pyenv

Even though your system Python works, using `pyenv` gives you a clean, isolated CPython build that won't break if macOS updates change the system Python. Think of it like having your own toolchain — the system Python is Apple's; your pyenv Python is yours.

### 2.1 Prerequisites

```bash
# Install Xcode command-line tools (if not already present)
xcode-select --install

# Install Homebrew (if not already present)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install pyenv and build dependencies
brew install pyenv openssl readline sqlite3 xz zlib tcl-tk
```

### 2.2 Configure your shell

Add the following to your `~/.zshrc` (since macOS defaults to zsh):

```bash
# --- pyenv ---
export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

Then reload:

```bash
source ~/.zshrc
```

### 2.3 Install Python 3.12

```bash
# List available 3.12.x versions
pyenv install --list | grep '^\s*3\.12\.'

# Install the latest 3.12 patch (3.12.8 at time of writing — use whatever is newest)
pyenv install 3.12.8
```

> **What's happening under the hood:** pyenv downloads the CPython source tarball and compiles it natively on your M3 Max using Apple's Clang toolchain. The resulting binary is a true `arm64` binary — no Rosetta involved.

### 2.4 Set the version and verify

```bash
# Set 3.12.8 as the default for your user (writes to ~/.pyenv/version)
pyenv global 3.12.8

# Verify
python --version
# Expected: Python 3.12.8

which python
# Expected: /Users/<you>/.pyenv/shims/python
```

### 2.5 Create the project venv

```bash
# Create a project directory
mkdir -p ~/dev/dl4cv
cd ~/dev/dl4cv

# Create the virtual environment
python -m venv .venv

# Activate it
source .venv/bin/activate

# Verify you're in the venv
which python
# Expected: /Users/<you>/dev/dl4cv/.venv/bin/python

python --version
# Expected: Python 3.12.8

# Upgrade pip and setuptools inside the venv
pip install --upgrade pip setuptools wheel
```

> **PEP 405** (Python Virtual Environments) is the standard behind `venv`. The venv is just a directory with a `pyvenv.cfg` file that points back to your pyenv-installed base interpreter. All packages you install go into `.venv/lib/python3.12/site-packages/` — completely isolated from everything else.

---

## 3. Package Installation

### 3.1 Core install command

With your venv activated:

```bash
pip install \
  "tensorflow==2.18.1" \
  "tensorflow-metal==1.2.0" \
  opencv-python-headless \
  scikit-image \
  scikit-learn \
  numpy \
  matplotlib \
  pillow \
  imutils \
  tqdm \
  h5py \
  requests \
  scipy \
  pandas \
  jupyter \
  notebook
```

### 3.2 What each package is for

| Package                    | Role in DL4CV                                                        |
| -------------------------- | -------------------------------------------------------------------- |
| `tensorflow==2.18.1`       | Core DL framework; includes `tf.keras` (Keras 3.x bundled)          |
| `tensorflow-metal==1.2.0`  | Metal GPU acceleration plugin for Apple Silicon                      |
| `opencv-python-headless`   | Computer vision primitives (image I/O, transforms, drawing)          |
| `scikit-image`             | Additional image processing algorithms (segmentation, morphology)    |
| `scikit-learn`             | Classical ML (SVMs, k-NN, classification reports, train/test split)  |
| `numpy`                    | N-dimensional array library — the foundation everything sits on      |
| `matplotlib`               | Plotting training curves, visualizing images                         |
| `pillow`                   | Python Imaging Library fork — image file I/O                         |
| `imutils`                  | PyImageSearch convenience wrappers around OpenCV                     |
| `tqdm`                     | Progress bars for training loops and data loading                    |
| `h5py`                     | HDF5 file I/O for saving/loading model weights                      |
| `scipy`                    | Scientific computing utilities (used by scikit-image, scikit-learn)  |
| `pandas`                   | DataFrames for dataset manipulation and CSV handling                 |
| `jupyter` / `notebook`     | Interactive notebook environment for experiments                     |

### 3.3 Why `opencv-python-headless`?

There are multiple OpenCV packages on PyPI:

- `opencv-python` — includes GUI functions (`cv2.imshow`, etc.) that depend on Qt
- `opencv-python-headless` — same library, **no** GUI dependencies

On macOS, the headless variant avoids conflicts with your PySide6 Qt installation and builds cleanly. If you need `cv2.imshow()` for quick debugging, you can swap to `opencv-python` later, but for DL4CV scripts that save output images to disk, headless is the cleaner choice.

> **Ref:** OpenCV's PyPI package naming convention is documented at [github.com/opencv/opencv-python](https://github.com/opencv/opencv-python#installation-and-usage).

### 3.4 Wheels vs. source builds on Apple Silicon

All of the packages above publish pre-built wheels for `macosx_*_arm64`. This means `pip` downloads a binary `.whl` file and unpacks it — no compilation needed. A few years ago, many scientific Python packages required building from source on ARM Macs (especially `numpy`, `scipy`, `h5py`), but as of 2024–2025 this is no longer the case.

If you ever encounter a package that has no ARM wheel, you'll see pip fall back to downloading a `.tar.gz` source distribution and compiling. That's your signal to check if there's a known issue for that package on Apple Silicon.

### 3.5 Version pinning strategy

**After** you've confirmed everything installs and works (Section 6), freeze the exact versions:

```bash
pip freeze > requirements.txt
```

This captures every package and its transitive dependencies with exact pins (e.g., `numpy==1.26.4`). You can recreate this exact environment later with:

```bash
python -m venv .venv-copy
source .venv-copy/bin/activate
pip install -r requirements.txt
```

**Why pin after install, not before?** You want pip's dependency resolver to pick compatible versions for you first. TensorFlow has complex transitive dependency constraints (protobuf, grpcio, absl-py, etc.). If you try to hand-pin everything upfront, you'll likely create conflicts. Let the resolver do its job, then snapshot the result.

> **Ref:** PEP 440 defines the version specifier syntax. PEP 665 and PEP 751 cover lock file standards, though `pip freeze` remains the pragmatic choice for a single-venv project.

---

## 4. GPU Acceleration (Metal)

### 4.1 Should you enable GPU acceleration on M3 Max?

**Absolutely yes.** The M3 Max has a 40-core GPU with hardware-accelerated ray tracing and mesh shading, plus 48 GB of unified memory. The `tensorflow-metal` plugin lets TensorFlow dispatch operations (matrix multiplications, convolutions, etc.) to these GPU cores via Apple's Metal API instead of running everything on the CPU.

For the kinds of models in DL4CV (CNNs, ResNets, VGGNet, etc.), you'll see meaningful speedups — typically 2–3× faster than CPU-only on the same chip, depending on model size and batch size.

> **How unified memory works (intuitively):** On NVIDIA systems, the GPU has its own separate RAM and data must be copied from CPU RAM → GPU RAM before the GPU can work on it. On Apple Silicon, the CPU and GPU share the same physical memory pool. There's no copy — the GPU just reads from the same memory the CPU wrote to. This is why Apple calls it "unified." The practical benefit is that you can train on larger batches than a discrete GPU with the same VRAM, because your full 48 GB is accessible to both.

### 4.2 Installation

You already installed `tensorflow-metal==1.2.0` in Section 3.1. No additional steps are required — the plugin registers itself automatically when TensorFlow loads.

### 4.3 Verification script

Save this as `~/dev/dl4cv/verify_gpu.py`:

```python
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
```

Run it:

```bash
cd ~/dev/dl4cv
source .venv/bin/activate
python verify_gpu.py
```

**Expected output** (details will vary):

```
============================================================
TensorFlow GPU Verification
============================================================

Python version  : 3.12.8 (...)
TensorFlow version: 2.18.1

CPU devices: 1
  PhysicalDevice(name='/physical_device:CPU:0', device_type='CPU')

GPU devices: 1
  PhysicalDevice(name='/physical_device:GPU:0', device_type='GPU')

Running matmul on GPU...
  Result shape: (2000, 2000)
  Result dtype: <dtype: 'float32'>
  Executed on : /job:localhost/replica:0/task:0/device:GPU:0
  Sample value: -22.4173

✅ GPU acceleration is working.
```

> **Note:** You may see some informational log lines from Metal or TensorFlow on first import (about CPU feature guards, Metal device creation, etc.). These are normal and not errors.

### 4.4 What about `tf.keras`?

Starting with TensorFlow 2.16, Keras 3 is bundled directly inside the `tensorflow` package. You access it via:

```python
import tensorflow as tf

model = tf.keras.Sequential([
  tf.keras.layers.Dense(128, activation="relu"),
  tf.keras.layers.Dense(10, activation="softmax"),
])
```

There is **no** separate `keras` package you need to install. The DL4CV book's `from tensorflow.keras import ...` import style works correctly with TF 2.18.1.

> **Ref:** Keras 3 migration — see [keras.io/getting_started](https://keras.io/getting_started/) for the official transition notes. The `tf.keras` namespace remains the primary interface for TensorFlow users.

---

## 5. TFOD API and MXNet

### 5.1 MXNet — Defer (likely skip permanently)

**Do not install MXNet now.** Here's the situation:

- MXNet's last PyPI release (1.9.1) only ships a `macosx_10_13_x86_64` wheel — there is **no** ARM64 macOS wheel.
- The Apache MXNet project has been effectively retired. The GitHub repo is archived or minimally maintained.
- Building MXNet from source on Apple Silicon is a multi-hour ordeal with `MKLDNN` compile failures and no official support.
- The DL4CV book only uses MXNet in the **ImageNet bundle** for a few specific training scripts that leverage multi-GPU parallelism (which MXNet handled well at the time).

**What to do when you reach the ImageNet bundle:**

1. **Try running the scripts with TensorFlow/Keras equivalents.** The 3rd edition may already provide TF2 versions of the ImageNet training pipelines.
2. **If MXNet is strictly required for a particular script**, your best fallback is an AWS EC2 instance (p3.2xlarge or similar) with a Linux AMI where MXNet + NVIDIA GPU works out of the box. This is the one case where a cloud instance genuinely makes sense.
3. **For learning the concepts**, everything MXNet does in the book can be understood through TensorFlow equivalents. The network architectures are the same — only the training framework differs.

### 5.2 TensorFlow Object Detection API (TFOD API) — Defer

**Do not install the TFOD API now.** Reasons:

- TFOD API depends on `tf-models-official`, which in turn requires `tensorflow-text` and `tensorflow-io`. Both of these have historically had poor or broken Apple Silicon ARM64 support.
- The installation involves compiling protobuf definitions, adding `PYTHONPATH` entries, and has multiple points of failure that are unrelated to the DL4CV content itself.
- You won't encounter TFOD API chapters until well into the book.

**Pre-install these now to reduce friction later:**

```bash
# protobuf compiler — needed for TFOD API proto compilation
brew install protobuf

# Verify
protoc --version
# Expected: libprotoc 2x.x or higher
```

**When you reach the TFOD API chapters, do this:**

```bash
# Clone the TensorFlow Model Garden
cd ~/dev
git clone https://github.com/tensorflow/models.git tf-models
cd tf-models/research

# Compile the protos
protoc object_detection/protos/*.proto --python_out=.

# Copy the setup script and install
cp object_detection/packages/tf2/setup.py .
pip install .
```

If `tensorflow-text` or `tensorflow-io` fail to install (ARM64 wheel missing), check these resources:
- [github.com/sun1638650145/Libraries-and-Extensions-for-TensorFlow-for-Apple-Silicon](https://github.com/sun1638650145/Libraries-and-Extensions-for-TensorFlow-for-Apple-Silicon) — community-maintained ARM64 wheels
- Build `tensorflow-io` from source per the [StackOverflow workaround](https://stackoverflow.com/questions/70277737/cant-install-tensorflow-io-on-m1)

---

## 6. Final Verification Checklist

Save this as `~/dev/dl4cv/verify_all.py`:

```python
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
```

Run it:

```bash
cd ~/dev/dl4cv
source .venv/bin/activate
python verify_all.py
```

**Expected output:**

```
============================================================
DL4CV Environment Verification
============================================================

Python: 3.12.8 (...)

Package              Version         Status
-------------------------------------------------------
tensorflow           2.18.1          ✅ 1 GPU(s)
cv2 (OpenCV)         4.x.x           ✅
scikit-image         0.2x.x          ✅
scikit-learn         1.x.x           ✅
numpy                1.2x.x          ✅
matplotlib           3.x.x           ✅
Pillow               10.x.x          ✅
imutils              0.5.4           ✅
h5py                 3.x.x           ✅

============================================================
✅ All packages installed. Environment is ready for DL4CV.
============================================================
```

---

## Quick-Reference Command Sequence

For copy-paste convenience — the entire setup in order:

```bash
# 1. System prerequisites
xcode-select --install
brew install pyenv openssl readline sqlite3 xz zlib tcl-tk protobuf

# 2. Shell config (add to ~/.zshrc then reload)
cat << 'EOF' >> ~/.zshrc
# --- pyenv ---
export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
EOF
source ~/.zshrc

# 3. Install Python
pyenv install 3.12.8
pyenv global 3.12.8

# 4. Create project and venv
mkdir -p ~/dev/dl4cv && cd ~/dev/dl4cv
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip setuptools wheel

# 5. Install packages
pip install \
  "tensorflow==2.18.1" \
  "tensorflow-metal==1.2.0" \
  opencv-python-headless \
  scikit-image \
  scikit-learn \
  numpy \
  matplotlib \
  pillow \
  imutils \
  tqdm \
  h5py \
  requests \
  scipy \
  pandas \
  jupyter \
  notebook

# 6. Freeze versions
pip freeze > requirements.txt

# 7. Verify
python verify_gpu.py
python verify_all.py
```

---

## Troubleshooting Notes

### `import tensorflow` shows warnings about CPU instructions
This is normal. TensorFlow prints informational messages about SSE/AVX instructions that don't apply to ARM. They are harmless.

### `tensorflow-metal` fails to load with a `NotFoundError`
You likely have a TensorFlow version newer than 2.18.1 installed. Fix:
```bash
pip install "tensorflow==2.18.1" "tensorflow-metal==1.2.0" --force-reinstall
```

### GPU shows `0 MB memory`
Normal on Apple Silicon. Because of unified memory, TensorFlow reports 0 MB of dedicated GPU memory. The GPU is still being used — verify with Activity Monitor → GPU History while running a training job.

### `cv2.imshow()` doesn't work
You installed the headless variant. Either save images to disk (`cv2.imwrite()`), display in Jupyter (`matplotlib`), or switch packages:
```bash
pip uninstall opencv-python-headless
pip install opencv-python
```

### Keras version confusion
TF 2.18.1 bundles Keras 3.x. The DL4CV book was written for Keras 2.x API style, but `tf.keras` maintains backward compatibility. If you encounter a script that does `from keras.models import Sequential` (standalone Keras import), change it to `from tensorflow.keras.models import Sequential`.

---

## References

- [TensorFlow pip install guide](https://www.tensorflow.org/install/pip)
- [Apple Metal TensorFlow Plugin](https://developer.apple.com/metal/tensorflow-plugin/)
- [tensorflow-metal PyPI](https://pypi.org/project/tensorflow-metal/) — version compatibility table
- [Apple Developer Forums: tensorflow-metal tag](https://developer.apple.com/forums/tags/tensorflow-metal) — community bug reports
- [PEP 405 — Python Virtual Environments](https://peps.python.org/pep-0405/)
- [OpenCV-Python PyPI package docs](https://github.com/opencv/opencv-python#installation-and-usage)
- [Keras 3 migration guide](https://keras.io/getting_started/)
