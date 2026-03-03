#!/usr/bin/env python
# USAGE
#   Tune K across a range using a validation set:
#     ./knn.py --dataset ~/dl4cv/datasets/animals --tune
#
#   Run with a specific K (skips tuning, uses train/test only):
#     ./knn.py --dataset ~/dl4cv/datasets/animals --neighbors 7
#
#   Verbose output (show debug-level messages):
#     ./knn.py --dataset ~/dl4cv/datasets/animals --tune --verbose

import logging
import argparse

from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from lib.preprocessing import SimplePreprocessor
from lib.datasets import SimpleDatasetLoader
from imutils import paths


log = logging.getLogger(__name__)

# ── Split Ratios ─────────────────────────────────────────────
TRAIN_RATIO = 0.60
VAL_RATIO = 0.15
TEST_RATIO = 0.25


def main(dataset, neighbors, jobs, tune, power):
  # ── Load & Preprocess ───────────────────────────────────────
  log.info("loading images...")
  image_paths = list(paths.list_images(dataset))

  sp = SimplePreprocessor(32, 32)
  sdl = SimpleDatasetLoader(preprocessors=[sp])
  (data, labels) = sdl.load(image_paths, verbose=500)

  # Flatten: (N, 32, 32, 3) → (N, 3072)
  # Each row becomes one point in 3072-dimensional feature space
  data = data.reshape((data.shape[0], 32 * 32 * 3))

  log.info(f"feature matrix: {data.nbytes / (1024 * 1024):.1f} MB")
  log.info(f"{data.shape[0]} images, {data.shape[1]} features each")

  # Encode string labels ("cats", "dogs", "panda") → integers (0, 1, 2)
  le = LabelEncoder()
  labels = le.fit_transform(labels)
  log.debug(f"classes: {list(le.classes_)}")

  # ── Split Strategy ─────────────────────────────────────────
  #
  #   --tune OFF (default):
  #     ┌──────────────┐ ┌──────────────┐
  #     │  Train (75%)  │ │  Test (25%)  │
  #     └──────────────┘ └──────────────┘
  #
  #   --tune ON:
  #     ┌──────────────┐ ┌────────────┐ ┌──────────────┐
  #     │  Train (60%)  │ │  Val (15%) │ │  Test (25%)  │
  #     └──────────────┘ └────────────┘ └──────────────┘
  #
  # The test set is always 25% and always held out until final evaluation.
  # The validation set comes out of what would have been training data.

  if tune:
    # Step 1: carve off the test set (25%)
    (X_trainval, X_test, y_trainval, y_test) = train_test_split(
      data, labels,
      test_size=TEST_RATIO,
      random_state=42
    )

    # Step 2: split the remaining 75% into train (60%) and val (15%)
    #
    # We want val to be 15% of the TOTAL dataset.
    # After step 1, X_trainval is 75% of total.
    # So val needs to be 15/75 = 20% of X_trainval.
    val_fraction_of_trainval = VAL_RATIO / (TRAIN_RATIO + VAL_RATIO)

    (X_train, X_val, y_train, y_val) = train_test_split(
      X_trainval, y_trainval,
      test_size=val_fraction_of_trainval,
      random_state=42
    )

    log.info(f"split: train={len(X_train)}, val={len(X_val)}, test={len(X_test)}")

  else:
    # Simple two-way split (matches original book code)
    (X_train, X_test, y_train, y_test) = train_test_split(
      data, labels,
      test_size=TEST_RATIO,
      random_state=42
    )

    log.info(f"split: train={len(X_train)}, test={len(X_test)}")

  # ── Tune or Run ────────────────────────────────────────────
  if tune:
    log.info("tuning K on validation set...")

    # Collect results for every K so we can see the full picture.
    # Odd values only — reduces tie-breaking ambiguity with 3 classes.
    k_candidates = range(1, 32, 2)
    results = []

    for k in k_candidates:
      model = KNeighborsClassifier(n_neighbors=k, p=power, n_jobs=jobs)
      model.fit(X_train, y_train)
      val_acc = model.score(X_val, y_val)
      results.append((k, val_acc))
      log.info(f"K={k:2d}  val_accuracy={val_acc:.4f}")

    # Pick the K with the highest validation accuracy
    best_k, best_val_acc = max(results, key=lambda r: r[1])
    log.info(f"best K={best_k} (val_accuracy={best_val_acc:.4f})")

    # Final evaluation on the test set — this number is the one you report
    log.info(f"evaluating K={best_k} on held-out test set...")
    model = KNeighborsClassifier(n_neighbors=best_k, p=power, n_jobs=jobs)
    model.fit(X_train, y_train)
    print(classification_report(
      y_test, model.predict(X_test),
      target_names=le.classes_
    ))

  else:
    log.info(f"evaluating K={neighbors} on test set...")
    model = KNeighborsClassifier(n_neighbors=neighbors, p=power, n_jobs=jobs)
    model.fit(X_train, y_train)
    print(classification_report(
      y_test, model.predict(X_test),
      target_names=le.classes_
    ))


if __name__ == "__main__":
  ap = argparse.ArgumentParser()
  ap.add_argument("-d", "--dataset", required=True,
    help="path to input dataset")
  ap.add_argument("-k", "--neighbors", type=int, default=1,
    help="number of nearest neighbors (used when --tune is not set)")
  ap.add_argument("-j", "--jobs", type=int, default=-1,
    help="number of parallel jobs for distance computation (-1 = all cores)")
  ap.add_argument("-p", "--power", type=int, default=2,
    help="Minkowski power param: 1=Manhattan(L1), 2=Euclidean(L2)")
  ap.add_argument("--tune", action="store_true",
    help="enable K tuning with a validation set")
  ap.add_argument("-v", "--verbose", action="store_true",
    help="enable debug-level log output")
  args = ap.parse_args()

  logging.basicConfig(
    level=logging.DEBUG if args.verbose else logging.INFO,
    format="[%(levelname)s] %(message)s",
  )

  main(
    dataset=args.dataset,
    neighbors=args.neighbors,
    jobs=args.jobs,
    tune=args.tune,
    power=args.power,
  )
