# notefleex

notefleexis a markdown-first notes app built with React + Ant Design.
It stores notes in browser local storage and now uses a modern Vite toolchain.

## What was upgraded

- Migrated build tooling from Create React App (`react-scripts`) to Vite.
- Refactored class components to functional components + React hooks.
- Added safer markdown rendering using `DOMPurify` + `showdown`.
- Improved note workflow with:
  - search by title
  - delete actions
  - automatic saving
  - empty states
  - cleaner responsive layout
- Replaced stale CRA test scaffolding with Vitest + Testing Library tests.

## Tech stack

- React 18
- Vite
- Ant Design
- Showdown
- DOMPurify
- Vitest + Testing Library

## Run locally

```bash
npm install
npm run dev
```

Open the local URL from Vite output (usually `http://localhost:5173`).

## Scripts

- `npm run dev`: start development server
- `npm run build`: production build
- `npm run preview`: preview production build
- `npm run test`: run unit tests once
- `npm run test:watch`: run tests in watch mode

## Data model

Notes are persisted in local storage using key `notefleex.notes.v2`.
Each note stores:

- `id`
- `title`
- `content`
- `updatedAt`
