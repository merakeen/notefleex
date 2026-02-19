# notefleex

notefleex is a markdown-first notes app for fast local note-taking.

![Vite.js logo](./public/vitejs.svg)

## project scope

### currently in scope

- create, edit, preview, search, and delete markdown notes
- persist notes in browser local storage
- sanitize rendered markdown for safer preview output
- run as a modern React single-page app with Vite

### currently out of scope

- user accounts and cloud sync
- server-side storage
- real-time collaboration
- offline sync conflict resolution

## product behavior

- notes are created with a generated id and default title
- note updates are autosaved to local storage
- notes are ordered by most recently updated
- sidebar supports title-based filtering
- each note can be opened in a modal preview
- markdown preview is sanitized before rendering

## tech stack

- React 18
- Vite 5
- Ant Design 5
- Showdown for markdown conversion
- DOMPurify for HTML sanitization
- Vitest + Testing Library for tests

## prerequisites

- Node.js 20+ (recommended)
- npm 10+

## local development

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` by default.

## scripts

- `npm run dev` starts the local dev server
- `npm run build` creates a production bundle in `dist/`
- `npm run preview` serves the production bundle locally
- `npm run test` runs tests once in CI mode
- `npm run test:watch` runs tests in watch mode

## test and release checks

Run these before opening a PR:

```bash
npm run test
npm run build
```

## project structure

```text
.
├── index.html
├── package.json
├── public/
└── src/
    ├── App.jsx
    ├── App.css
    ├── App.test.jsx
    ├── MarkdownInput.jsx
    ├── NoteDisplay.jsx
    ├── main.jsx
    ├── index.css
    └── setupTests.js
```

## data model

notefleex stores notes in local storage key `notefleex.notes.v2`.
A legacy key `notes` is read for backward compatibility.

Each note object:

```json
{
  "id": "string",
  "title": "string",
  "content": "string",
  "updatedAt": "ISO-8601 string"
}
```

## architecture notes

- `App.jsx` owns notes state, filtering, sorting, and modal state
- `MarkdownInput.jsx` is the editing surface for title and content
- `NoteDisplay.jsx` handles markdown to safe HTML rendering
- local storage writes are wrapped to avoid runtime crashes on quota/privacy limits

## development guidelines

- keep the brand name as `notefleex` (lowercase)
- prefer functional React components and hooks
- keep markdown rendering sanitized
- update tests when behavior changes
- keep UI text clear and user-focused

## known constraints

- notes are device/browser local only
- large bundle warning may appear during build due to UI library size
- no auth, permissions, or multi-user support

## roadmap candidates

- note tags and category filters
- import/export notes as markdown or json
- keyboard shortcuts and command palette
- optional cloud sync module

---

© 2026 [ikramagix](https://github.com/ikramagix) from [merakeen 𖦹 studio](https://merakeen.com)  
[ikramagix github](https://github.com/ikramagix) · [merakeen.com](https://merakeen.com)
