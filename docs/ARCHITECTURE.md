# Architecture Overview

This document sketches the overall structure of the ANN service and the path data takes through the system. It is roughly one page and intended as a starting point for contributors.

## Directory layout

- **src/** – TypeScript sources.
  - **core/** – domain logic such as data preparation, model building, metrics and run persistence.
  - **routes/** – Express route handlers for dataset upload/generation, training, prediction and run queries.
  - **lib/** – small utilities (file helpers, ID generation).
  - **config.ts** – shared defaults like window size and epoch count.
- **public/** – static files served by the API including the dashboard.
- **tests/** and inline `*.test.ts` – Jest tests for core logic and HTTP endpoints.
- **data/** and **models/** (created at runtime) – hold uploaded/generated datasets and saved TensorFlow models.

## Data flow

1. **CSV input** – datasets are uploaded or generated through `/api/datasets` and saved under `data/`. Each request is validated and numeric series are extracted.
2. **Windowing** – `parseCSVToSeries` reads the raw CSV and `slidingWindow` turns the series into `x`/`y` pairs used for supervised learning.
3. **Training** – `trainModel` builds a small MLP and fits it on the training split. Train/validation/test indices are produced by `trainValTestSplit`.
4. **Testing & Metrics** – predictions on the held-out test set are compared with `computeAllMetrics`, producing RMS, absolute/relative error arrays and cumulative error.
5. **Run record** – metadata, metrics and the saved model path are written via `createRun`/`updateRun` in `runs.ts`.
6. **Dashboard** – `public/dashboard.html` fetches the latest run, plots actual vs. predicted values and displays headline metrics.

## Customising the model

`src/core/model.ts` contains `buildMLP`, which defines the network topology and calls `model.compile`. Adjust layer structure, activation functions or swap the optimizer here before invoking `trainModel`.

## Extending metrics

Add new metric functions in `src/core/metrics.ts` and export them from `computeAllMetrics`. Storing additional statistics automatically persists them with each run because `train.ts` writes the returned object to the run record.

## Adding dataset generators

`src/routes/datasets.ts` exposes both file upload and synthetic generators (`sine`, `duffing`). Implement another generator function, register it in the `/generate` route switch and ensure it caps length to `MAX_DATASET_LENGTH`. The route will save the resulting CSV and report the path for training.
