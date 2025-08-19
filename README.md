# ANN Service

A lightweight Artificial Neural Network (ANN) service built with Node.js and TypeScript.

## Quick start

```bash
npm install
npm run dev    # start server on http://localhost:3000
npm test       # run tests
```

## Dataset format

CSV with a single numeric column (one value per line, no header).

Example `data.csv`:

```
0.12
-0.08
0.34
```

Upload or generate data:

```bash
curl -F "file=@data.csv" http://localhost:3000/api/datasets/upload
curl -X POST http://localhost:3000/api/datasets/generate \
  -H "Content-Type: application/json" \
  -d '{"kind":"sine","length":100,"noise":0.1}'
```

## API reference

```bash
# health check
curl http://localhost:3000/health

# train a model
curl -X POST http://localhost:3000/api/train \
  -H "Content-Type: application/json" \
  -d '{"datasetPath":"data/example.csv","window":5,"epochs":50}'

# list runs and fetch metrics
curl http://localhost:3000/api/runs
curl http://localhost:3000/api/runs/<RUN_ID>

# predict the next value
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"runId":"<RUN_ID>","context":[0.1,0.2,0.3,0.4,0.5]}'
```

## Dashboard

Browse to `http://localhost:3000/dashboard` to view charts and metrics for the most recent run.

## Notes on metrics and windowing

Training samples are built using a sliding window: each window of `w` sequential values predicts the next value, yielding `series.length - w` examples. Splits default to 30 % train, 10 % validation, and the remainder test.

Metrics reported per run include root mean square error, absolute and relative percentage errors, and average cumulative error. These summarize prediction accuracy and bias over the evaluated sequence.

