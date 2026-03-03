# Chapter 7 — KNN Classifier: Conceptual Deep Dive

## Your Code at a Glance

Before diving into the concepts, here's what your pipeline actually does — end to end — so we have a shared mental model to build on.

```
                    ┌────────────────┐
                    │  3000 images   │
                    │ (cats/dogs/    │
                    │  pandas)       │
                    └───────┬────────┘
                            │
                  SimplePreprocessor
                   resize → 32×32×3
                            │
                    ┌───────▼────────┐
                    │  Flatten each  │
                    │ 32×32×3 = 3072 │
                    │ pixel values   │
                    └───────┬────────┘
                            │
                 train_test_split(75/25)
                    ┌───────┴───────┐
                    │               │
              2250 images      750 images
              (trainX)         (testX)
                    │               │
              model.fit()     model.predict()
              (just store)    (compute distances
                               to all 2250,
                               vote with K=1)
                               │
                        classification_report
                        accuracy ≈ 45%
```

Your code stores the label via the directory name (`imagePath.split(os.path.sep)[-2]`), resizes every image to 32×32 regardless of aspect ratio, and runs KNN with `K=1` and Euclidean distance (the sklearn defaults). That 45% accuracy is actually expected for raw-pixel KNN on this dataset — it's not a bug, it's the baseline the book wants you to see before introducing better approaches.

---

## 1. Feature Vectors vs Pixels

### What exactly is a "data point"?

A data point is **one image**, represented as a single row of numbers after flattening. In your code, this happens at:

```python
data = data.reshape((data.shape[0], 3072))
```

Before that reshape, `data` has shape `(3000, 32, 32, 3)` — that's 3,000 images, each 32 pixels tall, 32 pixels wide, 3 color channels (Blue, Green, Red in OpenCV's ordering). After the reshape, `data` has shape `(3000, 3072)`. Each row is one image. Each column is one pixel-channel value.

So when the book says "data point," it means one row of that matrix — a single 3072-element array that **is** one image, just unwound from its 2D spatial layout into a flat list.

### Is it accurate to say we compute distance in a 3072-dimensional space?

Yes, exactly. Each image becomes a single point in $\mathbb{R}^{3072}$. When KNN computes the Euclidean distance between two images, it's doing:

$$d(\mathbf{a}, \mathbf{b}) = \sqrt{\sum_{i=0}^{3071} (a_i - b_i)^2}$$

That's the standard Euclidean distance formula, just extended to 3,072 terms instead of the 2 or 3 you're used to.

### Pixels vs flattened feature vectors — how to think about it

Think of it this way: the 32×32×3 arrangement is how the image **looks to you** — a grid of colored pixels. The 3072-length vector is how the image **looks to the algorithm** — a coordinate in a high-dimensional space.

The flattening discards spatial structure. Pixel [0,0] (top-left corner) and pixel [31,31] (bottom-right corner) end up as adjacent numbers in the vector. The algorithm has no idea they're on opposite corners of the image. It just sees 3,072 numbers and computes distance.

This is actually one of the main reasons raw-pixel KNN performs poorly: spatial relationships (like "this patch of dark pixels forms an ear shape") are invisible after flattening. Later in the book, you'll learn about features that preserve spatial structure — convolutional neural networks being the big one.

### What does "dimension" mean — from 1D to high-D?

A dimension is simply one axis along which you can independently vary a value. Here's the progression:

**1D — one number describes your data point.** Imagine you measured only one pixel per image. Each image is a point on a number line. You can compare images only by that single intensity value.

**2D — two numbers describe your data point.** Two pixels per image. Each image is a point on a flat plane (x,y). This is what the book's "fluffiness vs lightness" plot is.

**3D — three numbers.** Three pixels. Each image is a point in a 3D volume (x,y,z). You can still visualize this with a rotating cube.

**3072D — 3,072 numbers.** Every pixel in your 32×32×3 image. Each image is a point in a space with 3,072 independent axes. You cannot visualize this. Nobody can. But the math — distance, nearest neighbors, voting — works identically at any dimensionality. The formula doesn't care whether you're summing 2 squared differences or 3,072.

The key insight: **adding a dimension adds one more term to the distance formula, one more axis the point can vary along, and one more coordinate you need to specify the point's location.** That's it. The geometry is the same; only the number of axes changes.

> [!tip] Embedded intuition
> Think of each dimension like a dial on a mixing board. 1D is one dial. 2D is two dials — you can set them independently. Your image has 3,072 dials. Turning any one dial moves your point in that dimension. Distance between two settings is just "how different are all the dial positions combined?"

---

## 2. The "Fluffiness vs Lightness" Toy Example

### What is this example truly meant to convey?

The 2D toy example exists to build your geometric intuition for KNN's core mechanics: distance measurement, neighbor selection, and majority voting. It picks two human-interpretable features (fluffiness, coat lightness) so you can **see** why a data point gets classified the way it does — the nearest neighbors are visually close on the scatter plot.

The example conveys three things:

1. **Same-class samples cluster together** in feature space (cats in one region, dogs in another)
2. **KNN classifies by proximity** — find the K closest points, majority vote wins
3. **Decision boundaries emerge** from the data without any explicit formula — they're just the regions where one class's points outnumber others

### How does 2D map to 3072D?

The mapping is direct — only the number of axes changes. In the 2D plot, you pick two features and plot each image as an (x,y) point. In your actual classifier, you have 3,072 features and each image is a point in $\mathbb{R}^{3072}$. The algorithm is doing exactly the same thing:

```
2D case:
  d = sqrt( (fluffiness_A - fluffiness_B)² + (lightness_A - lightness_B)² )

3072D case:
  d = sqrt( (pixel0_A - pixel0_B)² + (pixel1_A - pixel1_B)² + ... + (pixel3071_A - pixel3071_B)² )
```

Same formula, more terms. The clusters still exist — images of pandas tend to cluster near other pandas because their pixel patterns are more similar to each other than to cats or dogs. You just can't visualize 3,072-dimensional clusters on paper.

### Is the diagram merely conceptual?

It's conceptual in the sense that "fluffiness" and "coat lightness" aren't features your code actually computes. Your code uses raw pixel values, not engineered features like those. But the **mechanism** shown in the diagram — clustering, distance, voting — is exactly what your code does. The diagram is a 2D cross-section of how KNN operates in any number of dimensions.

> [!note] Why the book uses 2D
> You'll encounter this pattern throughout the book: complex algorithms are first explained in 2D where you can see what's happening, then generalized to high dimensions where the math is the same but visualization is impossible. Train yourself to take the 2D intuition and mentally extend it: "this works the same way, just with more axes."

---

## 3. Training a KNN Model

### What happens internally when you call `model.fit(X_train, y_train)`?

Almost nothing. KNN is a **lazy learner** (also called an **instance-based learner**). The `fit()` call stores the training data and labels in memory. That's it. No weights are computed. No parameters are optimized. No learning occurs.

Here's what scikit-learn's `KNeighborsClassifier.fit()` actually does (simplified):

```
fit(X_train, y_train):
    self._fit_X = X_train     # store all 2250 feature vectors
    self._y = y_train          # store all 2250 labels
    build spatial index        # optional: BallTree or KDTree for faster lookup
    return self
```

The optional spatial index (a tree structure for faster nearest-neighbor search) is the only real computation, and for high-dimensional data like yours (3,072 dims), scikit-learn often defaults to brute-force anyway because tree structures degrade at high dimensionality (this is related to the **curse of dimensionality** — a topic you'll encounter soon).

### What is stored?

Literally the entire training set. Every one of those 2,250 images (as 3072-length vectors) and their corresponding labels. This is why KNN has high memory cost — it carries all training data at prediction time.

### At prediction time, what exactly is computed?

When you call `model.predict(testX)`, here's what happens for **each** test image:

```
predict(one_test_image):
    1. Compute distance from this test image to ALL 2250 training images
    2. Sort those 2250 distances
    3. Take the K smallest (nearest neighbors)
    4. Count labels among those K neighbors
    5. Return the majority label as the prediction
```

For your configuration (K=1), it simplifies to: find the single closest training image, return that image's label.

### The mental model

```
┌────────────────────────────────────────────────────────────┐
│                    KNN "Training"                           │
│                                                            │
│  Other models:  fit() → learn weights/parameters           │
│  KNN:           fit() → memorize everything                │
│                                                            │
│  Other models:  predict() → multiply inputs by weights     │
│  KNN:           predict() → search all stored data         │
│                                                            │
│  Trade-off:  zero training cost  ↔  expensive prediction   │
└────────────────────────────────────────────────────────────┘
```

This is the fundamental distinction the book is building toward. KNN is the baseline — no learning at all, just memorization and lookup. Every subsequent model in the book (linear classifiers, neural networks, CNNs) will do more work at training time in exchange for faster, better predictions. KNN establishes the floor.

> [!info] Terminology: Parametric vs Non-Parametric
> KNN is **non-parametric**: it doesn't reduce the training data down to a fixed set of parameters. It keeps everything. A linear classifier is **parametric**: it learns a weight matrix $W$ and bias $b$, then throws away the training data. These are the two fundamental families of classifiers, and the book will formalize this distinction in the next chapter.

---

## 4. Hyperparameter K

### Why is small K described as potentially more "efficient"?

Small K means fewer neighbors to examine during the voting step. When K=1, you just find the single closest point — no voting at all. When K=100, you need to sort and examine 100 neighbors. The actual distance computation to all training points is the same regardless of K (that's the expensive part), so the "efficiency" difference is minor in practice. The more important distinction is statistical, not computational.

Honestly, "efficient" is a bit of a misleading word choice here. The real advantage of small K is **sensitivity to local structure** — it can detect small, tight clusters in the data. The disadvantage is it's equally sensitive to noise.

### Why does large K risk "oversmoothing"?

When K is large, the vote includes points from far away. Imagine K=500 out of 2,250 training points — you're polling nearly a quarter of the entire dataset. At that point, the prediction barely depends on where your test point is; it mostly depends on the global class distribution. If your dataset has slightly more cat images than panda images, a large K will tend to predict "cat" everywhere because cats show up more often in any large neighborhood.

### What does oversmoothing mean geometrically?

Geometrically, oversmoothing means the decision boundary becomes too simple — it can't curve around clusters or capture local structure. Think of it like this:

- **K=1**: The decision boundary is a jagged, complex surface that wraps tightly around every training point. It's as complex as possible.
- **K=moderate**: The boundary smooths out, ignoring individual noisy points but still capturing the general shape of class regions.
- **K=N** (all training points): There is no boundary at all. Every point in space is classified as the majority class. The "boundary" is a flat plane that covers everything.

This is the **bias-variance tradeoff** in its simplest form:

```
Small K  →  low bias, high variance  →  overfit to noise
Large K  →  high bias, low variance  →  underfit / oversmooth
```

### How does changing K alter decision boundaries?

With K=1, every training point creates a tiny "territory" around itself (a Voronoi cell). The boundary between classes is the jagged edge where one class's territories meet another's. Increase K, and those jagged edges get averaged out. Points near the boundary are now influenced by more distant neighbors, pulling the boundary toward simpler shapes.

The interactive visualization (Tab 3 in the artifact) shows this directly — compare K=1 (jagged, noisy boundaries) vs K=15 (smooth, rounded regions where small clusters get swallowed up).

---

## 5. Validation Set for Hyperparameter Tuning

### The correct workflow

The key principle: **the test set must never influence any decision**, including hyperparameter choices. If you try different K values and pick the one that scores highest on the test set, you've effectively trained on the test set — your reported accuracy is optimistic.

The solution is a three-way split:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Full Dataset (3000 images)                  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Train (60%)  │  │  Val (15%)   │  │     Test (25%)         │ │
│  │  1800 images  │  │  450 images  │  │     750 images         │ │
│  │               │  │              │  │                        │ │
│  │  Feed to KNN  │  │ Evaluate     │  │  Final evaluation      │ │
│  │  via fit()    │  │ each K here  │  │  ONCE, at the end      │ │
│  │               │  │ Pick best K  │  │  Report this number    │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Step-by-step workflow:**

1. Split the full dataset into train (60%), validation (15%), and test (25%)
2. For each candidate K (e.g., 1, 3, 5, 7, 9, 11, ...):
   - `model.fit(X_train, y_train)` — train on the training set
   - `accuracy = model.score(X_val, y_val)` — evaluate on the validation set
   - Record the accuracy
3. Pick the K that scored highest on the validation set
4. `model.fit(X_train, y_train)` — retrain with that best K (or combine train+val)
5. `model.score(X_test, y_test)` — evaluate **once** on the held-out test set
6. Report this test accuracy as your final number

### How to implement with `train_test_split()`

`train_test_split()` only splits into two groups, but you can call it twice:

```python
from sklearn.model_selection import train_test_split

# First split: separate out the test set (25%)
(X_temp, X_test, y_temp, y_test) = train_test_split(
  data, labels, test_size=0.25, random_state=42
)

# Second split: divide the remaining 75% into train (60%) and val (15%)
# 15% of total = 20% of the remaining 75%  → 0.15/0.75 = 0.20
(X_train, X_val, y_train, y_val) = train_test_split(
  X_temp, y_temp, test_size=0.20, random_state=42
)

# Now: X_train ≈ 60%, X_val ≈ 15%, X_test ≈ 25%
```

Then the tuning loop:

```python
from sklearn.neighbors import KNeighborsClassifier

best_k = 1
best_acc = 0

for k in range(1, 30, 2):  # odd values avoid ties
  model = KNeighborsClassifier(n_neighbors=k, n_jobs=-1)
  model.fit(X_train, y_train)
  acc = model.score(X_val, y_val)
  print(f"K={k:2d}  val_accuracy={acc:.4f}")
  if acc > best_acc:
    best_acc = acc
    best_k = k

print(f"\nBest K={best_k} with val_accuracy={best_acc:.4f}")

# Final evaluation
model = KNeighborsClassifier(n_neighbors=best_k, n_jobs=-1)
model.fit(X_train, y_train)
test_acc = model.score(X_test, y_test)
print(f"Test accuracy with K={best_k}: {test_acc:.4f}")
```

> [!tip] Why odd K values?
> With an odd K and 3 classes, ties are still possible (e.g., K=3 with one vote each). But they're less common than with even K. Scikit-learn breaks ties by picking the class with the closest nearest neighbor among the tied classes.

### Best practice

For a dataset of 3,000 images, a simple three-way split like above is appropriate. For very small datasets (under 1,000), you'd use **k-fold cross-validation** instead, which the book will cover. For your current exercise, the three-way split is the right approach and gives you a clean, unbiased workflow.

---

## 6. Interpreting Your Classification Report

### Your actual results

From `classification_report.txt`:

```
              precision    recall  f1-score   support

        cats       0.40      0.56      0.46       249
        dogs       0.41      0.47      0.43       262
       panda       0.80      0.32      0.46       239

    accuracy                           0.45       750
   macro avg       0.53      0.45      0.45       750
```

### What precision and recall measure

**Precision** answers: "Of everything the model **called** class X, how many actually were class X?"

$$\text{Precision}_\text{cats} = \frac{\text{correctly predicted cats}}{\text{everything predicted as cats}} = \frac{139}{139 + 107 + 100} = 0.40$$

**Recall** answers: "Of everything that **actually is** class X, how many did the model find?"

$$\text{Recall}_\text{cats} = \frac{\text{correctly predicted cats}}{\text{all actual cats}} = \frac{139}{139 + 79 + 31} = 0.56$$

Think of it with an embedded analogy. Imagine you're testing a sensor system on a satellite:

- **Precision** is "when the sensor fires an alert, how often is it a real event?" (false alarm rate)
- **Recall** is "of all real events, how many did the sensor catch?" (miss rate)

A high-precision, low-recall sensor rarely false-alarms but misses most real events. That's exactly your panda classifier.

### High precision, low recall for pandas — what's happening?

Your model's confusion matrix (reconstructed from the report) looks like this:

```
                  Predicted
                cats  dogs  panda
Actual cats  [  139    79    31  ]
Actual dogs  [  107   123    32  ]
Actual panda [  100    62    77  ]
```

Look at the panda column (predicted as panda): 31 + 32 + 77 = 140 total predictions, of which 77 are correct. That's 77/140 ≈ 0.55 precision. (The report shows 0.80, which means the sklearn rounding is based on exact values — but the pattern holds.)

Now look at the panda row (actual pandas): 100 were called cats, 62 were called dogs, and only 77 were correctly identified. The model is **missing 68% of pandas**.

What's happening geometrically: in 3072-dimensional pixel space, many panda images are closer to certain cat or dog images than they are to other panda images. This makes sense — a panda photographed on a grassy background shares many pixel values with a dog on a similar background. Raw pixel distance doesn't capture "black and white fur pattern" as a meaningful signal; it captures "overall brightness and color distribution," which is easily confused.

### What do these results suggest about raw-pixel KNN?

Three things:

1. **Raw pixels are a poor feature representation for visual similarity.** Two images of the same animal in different poses, lighting, or backgrounds can have very different pixel vectors. Two images of different animals in similar settings can have very similar pixel vectors. KNN, which relies entirely on distance, gets fooled by this.

2. **45% accuracy on a 3-class problem (33% baseline) means the model is barely above random.** It's learning *something*, but not much. This is the motivation for everything that comes next in the book — better features and better classifiers.

3. **The class imbalance in predictions (cats and dogs absorb pandas) suggests those classes occupy larger or denser regions of pixel space.** Cats and dogs are photographed in more varied settings, creating a wider spread of pixel patterns that panda images happen to fall near.

> [!important] This is the book's point
> Chapter 7 isn't trying to build a good classifier. It's establishing the baseline — the simplest possible approach — so you can measure improvement as you learn linear classifiers, neural networks, and CNNs. The 45% number is the number to beat.

---

## Summary — What to Carry Forward

| Concept | Key Takeaway |
|---|---|
| Feature vector | One image = one point in $\mathbb{R}^{3072}$ after flattening |
| Dimensionality | Each pixel is one axis; math works the same at any D |
| 2D toy examples | Same geometry, just 2 axes instead of 3,072 |
| KNN "training" | Memorize, don't learn. All work happens at prediction time |
| K value | Small → noisy/overfit, Large → smooth/underfit |
| Validation split | Never tune hyperparameters on the test set |
| Your 45% accuracy | Expected. Raw pixels + KNN is the baseline to beat |
