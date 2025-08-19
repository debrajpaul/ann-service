# ANN Service

A lightweight Artificial Neural Network (ANN) service built with Node.js and TypeScript.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

### Available Scripts

- `npm run dev` – start the development server with automatic reloads.
- `npm run build` – compile TypeScript to JavaScript.
- `npm start` – run the compiled application from `dist`.
- `npm test` – execute the Jest test suite.
- `npm run lint` – lint source files with ESLint and Prettier.
- `npm run typecheck` – type-check the project without emitting files.

## Endpoints Overview

| Method | Endpoint   | Description                           |
| ------ | ---------- | ------------------------------------- |
| GET    | `/health`  | Health check endpoint.                |
| POST   | `/echo`    | Echoes back a validated `message`.    |
| POST   | `/upload`  | Accepts a CSV file for processing.    |

These routes are defined in `src/app.ts` and are meant as a starting point for building an ANN service. Static assets such as Chart.js can be served from a public directory as needed.

## Building & Running

```bash
npm run build
npm start
```

The server listens on port `3000` by default.
