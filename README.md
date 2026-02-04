# Ralph Todo App

A full-stack todo application built with Express, React, and PostgreSQL.

## Prerequisites

- Node.js (v18+)
- PostgreSQL

## Project Structure

```
server/   Express REST API (TypeScript)
client/   React frontend (Vite + TypeScript)
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the database

Create a PostgreSQL database:

```bash
createdb ralph_todos
```

Copy the example environment file and adjust if needed:

```bash
cp server/.env.example server/.env
```

The defaults in `.env.example` assume PostgreSQL is running locally on port 5432 with user `postgres`.

### 3. Initialize the schema

```bash
psql -d ralph_todos -f server/src/schema.sql
```

### 4. Run the app

Start the server:

```bash
npm run dev --workspace=server
```

Start the client (in a separate terminal):

```bash
npm run dev --workspace=client
```

The client proxies API requests to the server at `http://localhost:3001`.

## Testing

Run all root-level tests:

```bash
npm test
```

Run server tests:

```bash
npm test --workspace=server
```

Run client tests:

```bash
npm test --workspace=client
```
