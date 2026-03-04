# notefleex

notefleex is a privacy-first, markdown-first notes app for fast local note-taking.

![Vite.js logo](./public/vitejs.svg)

## project scope

### currently in scope

- create, edit, preview, search, pin, archive, and delete markdown notes
- organize notes with tags and color accents
- manage multiple local vaults (plain or password-encrypted)
- import and export notes as JSON backup files
- persist vaults, notes, and theme preference in browser local storage
- sanitize rendered markdown for safer preview output
- run as a modern React single-page app with PWA service worker updates

### currently out of scope

- user accounts and cloud sync
- server-side storage
- real-time collaboration
- password recovery for encrypted vaults
- cross-device sync conflict resolution

## product behavior

- first run migrates legacy note keys into the default vault
- notes are created with a generated id, default title, and timestamp metadata
- note updates are autosaved to the active vault (encrypted or plain)
- notes are ordered with pinned notes first, then by most recently updated
- sidebar supports mode filters (`all`, `pinned`, `archived`) and search across title, content, and tags
- notes can be tagged, pinned, archived, previewed, imported, and exported
- dark/light theme preference is persisted locally
- markdown preview is sanitized before rendering
- app shows an update banner when a new service worker version is available

## tech stack

- React 18
- Vite 7
- Vite Plugin PWA (Workbox `generateSW`)
- Ant Design 5
- Showdown for markdown conversion
- DOMPurify for HTML sanitization
- Web Crypto API (PBKDF2 + AES-GCM) for vault encryption
- Vitest + Testing Library for tests
- Vercel Analytics integration

## prerequisites

- Node.js `^20.19.0` or `>=22.12.0`
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
├── vite.config.mjs
├── public/
└── src/
    ├── App.jsx
    ├── App.css
    ├── App.test.jsx
    ├── MarkdownInput.jsx
    ├── MarkdownTutorial.jsx
    ├── NoteDisplay.jsx
    ├── VaultManager.jsx
    ├── vaultCrypto.js
    ├── main.jsx
    ├── index.css
    └── setupTests.js
```

## data model

notefleex stores vault state in browser local storage.

- `notefleex.vaults.v1` stores vault registry metadata
- `notefleex.vault.<vaultId>` stores vault payload
- `notefleex.theme.v1` stores theme mode (`light` or `dark`)

legacy keys are read for migration/backward compatibility:

- `notefleex.notes.v3`
- `notefleex.notes.v2`
- `notes`

vault payload shape:

- unencrypted vault: `{ "encrypted": false, "notes": [...] }`
- encrypted vault: `{ "encrypted": true, "iv": "base64", "data": "base64" }`

Each note object:

```json
{
  "id": "string",
  "title": "string",
  "content": "string",
  "tags": ["string"],
  "pinned": false,
  "archived": false,
  "color": "hex-color string",
  "createdAt": "ISO-8601 string",
  "updatedAt": "ISO-8601 string"
}
```

## architecture notes

- `App.jsx` owns vault lifecycle, note state, filtering, sorting, import/export, theme, and modal state
- `VaultManager.jsx` provides vault switch/create/unlock flows
- `vaultCrypto.js` handles PBKDF2 key derivation and AES-GCM encrypt/decrypt helpers
- `MarkdownInput.jsx` is the editing surface for title, content, tags, and note actions
- `MarkdownTutorial.jsx` provides the in-app markdown basics guide
- `NoteDisplay.jsx` handles markdown to safe HTML rendering
- local storage writes are wrapped to avoid runtime crashes on quota/privacy limits

## development guidelines

- keep the brand name as `notefleex` (lowercase)
- prefer functional React components and hooks
- keep markdown rendering sanitized
- keep vault encryption/decryption logic in `vaultCrypto.js`
- preserve storage migration compatibility when changing note or vault schemas
- update tests when behavior changes
- keep UI text clear and user-focused

## known constraints

- notes are tied to a single browser profile/device unless manually exported/imported
- deleting a vault permanently removes its local payload
- no password recovery exists for encrypted vaults
- encrypted vault keys live only in memory while unlocked
- large bundle warning may appear during build due to UI library size
- no auth, permissions, or multi-user support

## roadmap candidates

- keyboard shortcuts and command palette
- vault password change/re-key flow
- note history or restore snapshots
- optional cloud sync module (end-to-end encrypted)

---

© 2026 [merakeen 𖦹 studio](https://merakeen.com)
