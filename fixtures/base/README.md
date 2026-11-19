# TaskFlow

A small project and task tracker: a dependency-free Node HTTP API plus a framework-free browser UI.

## Requirements

Node 22 or newer. There are no npm dependencies; nothing to install.

## Running

```sh
npm start          # API on http://localhost:3000 (PORT to change)
npm run serve:web  # UI on http://localhost:5173 (WEB_PORT to change)
npm test           # node:test suite, no network needed
npm run lint       # house rules from CONVENTIONS.md
```

The API keeps all data in memory and starts from a deterministic seed (5 users, 4 projects,
60 tasks, 30 comments, see `api/seed.js`). Restarting resets everything.

## Layout

| Path | What lives there |
| --- | --- |
| `api/server.js`, `api/router.js`, `api/routes.js` | HTTP server, tiny router, route table |
| `api/handlers/*.handler.js` | One file per resource; handlers receive `{ req, res, params, query, body, store }` |
| `api/store.js`, `api/seed.js` | In-memory data store and seed data |
| `api/lib/` | Errors, validation, pagination, query parsing, logger, dates, CSV, rate limiter |
| `web/components/` | Pure functions returning HTML strings (`render<Name>`) |
| `web/state/`, `web/api-client.js` | Tiny state container, selectors and the API client |
| `web/index.html`, `web/main.js`, `web/styles.css` | The page; `main.js` wires state, API and DOM events |
| `test/` | Tests (`*.test.js`); `test/helpers/app.js` starts the API on a random port |
| `docs/API.md` | Endpoint reference |
| `CONVENTIONS.md`, `scripts/lint.js` | House rules and the linter that enforces most of them |

## Contributing

Read `CONVENTIONS.md` first. Run `npm test` and `npm run lint` before you finish.
