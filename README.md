## Smart Filter Hub

A production-ready React application for dynamic data filtering, built on top of [React Query Builder](https://react-querybuilder.js.org/). It connects to a Spring Boot backend for live data and field definitions, with automatic fallback to local mock data when the API is unavailable.

![Query Builder component preview](./public/images/screenshot_dark_mode.png)

### Features

- **Paginated results table** — dynamic pagination with total item count and responsive navigation
- **Auto-initial rule** — filter panel automatically adds the first field rule when expanded if empty
- **Global Dark/Light Mode** — seamless theme switching in the header and auth pages with persistence
- **Dynamic field definitions** — fields, operators, and types are fetched from the backend (`/api/variables`)
- **Autocomplete value editor** — type-ahead suggestions extracted from live data with keyboard navigation
- **Type-aware validation** — cross-cutting sanitization and RQB-compatible field validators
- **Collapsible filter panel** — toggle button with active rule count and click-outside dismissal
- **Floating UI positioning** — robust, viewport-aware positioning for suggestion portals
- **Graceful API fallback** — automatic mock data fallback with notification banner
- **Accessible** — full ARIA compliance and keyboard-only navigation support

### Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 / Vite 5 |
| UI Components | [@mui/material](https://mui.com/material-ui/) |
| Query Builder | [react-querybuilder](https://react-querybuilder.js.org/) v7 |
| Positioning | [@floating-ui/react](https://floating-ui.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Styling | LESS with CSS Variables (Theming) |
| State | Custom Context (Auth & Theme) |
| Package Manager | pnpm |

### Setup

1. **Install dependencies**

```bash
pnpm install
```

2. **Start the backend** (optional — the app falls back to mock data if unavailable)

The Spring Boot backend should be running at `http://localhost:8080` with these endpoints:
- `GET /api/users` — user data
- `GET /api/variables` — field definitions (name, label, type, offset)

3. **Start the development server**

```bash
pnpm start
```

The app will be available at `http://localhost:5173` (or the port shown in the terminal).

### Environment Variables

The application uses Vite environment variables (prefixed with `VITE_`). These can be set in a `.env` file for local development or in your deployment platform (Netlify, Vercel, etc.).

| Name | Description | Default |
|------|-------------|---------|
| `VITE_API_BASE_URL` | Base URL for the backend API. Should include `/api` suffix if using proxy. | `/api` |
| `VITE_API_USERNAME` | HTTP Basic auth username for API requests. Leave blank to disable authentication. | *(none)* |
| `VITE_API_PASSWORD` | HTTP Basic auth password for API requests. | *(none)* |
| `VITE_APP_TITLE` | Text displayed in the header. | `Smart Filter Hub` |
| `VITE_BANNER_DURATION` | Milliseconds before the live/mock notification banner auto-dismisses. | `3000` |

In Netlify, define the variables under **Site settings → Build & deploy → Environment**. Do **not** commit a `.env` file containing secrets; configure them via the platform or local tooling.

> **Note:** the Netlify secrets scanner will ignore keys listed in the `SECRETS_SCAN_OMIT_KEYS` build variable. Add `VITE_API_USERNAME` and `VITE_API_PASSWORD` there if you prefer the scanner to skip them.


### Usage

1. On startup, a **notification banner** indicates connection status. It auto-dismisses after 3 seconds.
2. Toggle between **Dark and Light mode** using the sun/moon icon in the top header.
3. Click the **"Advanced filters"** button to expand the query builder.
   - If empty, the first field rule is added automatically to get you started.
   - The button label shows the current active rule count.
4. For text fields, start typing to see **autocomplete suggestions**.
5. The **results table** updates in real-time. Use the **pagination controls** at the bottom to navigate large datasets.
6. Use the **"not"** toggle on any rule or group to negate results.

Example filters to try:

- `age > 30` — users older than 30
- `status = Active` — only active users
- `email contains example` — filter by email domain
- `nickname null` — users without a nickname
- `isOnline = True` — only online users
- Combine multiple rules with AND/OR logic and nested groups

### Project Structure

```text
├── CollapsibleList.js                    # Page-level shell: data fetching, query state, fields
├── src/
│   ├── App.js                            # Main application shell with routing
│   ├── config/
│   │   └── queryConfig.js                # Field definitions and operator sets
│   ├── context/
│   │   ├── AuthProvider.js               # Authentication state & OAuth handling
│   │   └── ThemeContext.js               # Dark/Light mode engine (MUI + LESS)
│   ├── components/
│   │   ├── Layout/                       # Shell components (Header, Sidebar, Analytics)
│   │   ├── LoginPage/                    # OAuth & Email/Password entry
│   │   ├── RegisterPage/                 # User registration
│   │   ├── ProfileView/                  # User account settings
│   │   ├── QueryBuilderController/       # Collapsible RQB wrapper
│   │   ├── AutocompleteValueEditor/      # Optimized custom editor
│   │   ├── DataSourceBanner/             # Live/Mock status notifications
│   │   └── ResultsTable/                 # Paginated data display
│   ├── services/
│   │   └── userApi.js                    # API client (Axios/Fetch)
│   ├── utils/
│   │   ├── queryFilter.js                # Client-side filtering logic
│   │   └── validators/                   # Type-safe validation modules
│   └── styles/
│       ├── variables.less                # CSS variables & design tokens
│       └── ...                           # Component-specific styles
├── package.json
└── vite.config.js
```

### Architecture Decisions

| Decision | Rationale |
|---|---|
| **Controlled query mode** | `CollapsibleList` owns the query state; `QueryBuilderController` is a pure presentational wrapper |
| **Per-field operators** | Each field declares its own operators via `field.operators` — no top-level `operators` prop or `getOperators` callback |
| **RQB validation flow** | Validators follow the `(rule) => result` signature; `AutocompleteValueEditor` reads `props.validation` instead of re-running the validator |
| **Floating UI for positioning** | Replaces manual `getBoundingClientRect` + `rAF` with a battle-tested positioning library; rendered via `createPortal` to avoid overflow clipping |
| **Separated validators** | Each type (string, number, email) has its own module; `sanitize.js` is a cross-cutting concern composed into all validators |
| **API fallback** | `try/catch` around `Promise.all` in `useEffect`; on failure, mock data is used seamlessly |

### Future Automated Test Ideas

- **Collapsible panel** — verify toggle, rule count label, click-outside dismissal
- **Autocomplete** — verify suggestions appear on typing, keyboard/mouse selection, clear button behavior
- **Suggestions positioning** — verify no clipping on scroll, portal renders correctly
- **Validation** — verify inline error messages for invalid inputs (SQL patterns, empty fields, negative numbers for unsigned types, invalid emails)
- **Operators** — verify all operators (`=`, `!=`, `<`, `>`, `contains`, `doesNotContain`, `beginsWith`, `doesNotBeginWith`, `endsWith`, `doesNotEndWith`, `between`, `notBetween`, `null`, `notNull`) filter correctly
- **Boolean/select fields** — verify radio buttons for boolean, dropdown for status, correct operator restrictions
- **NOT toggle** — verify negation works at any nesting level
- **API fallback** — verify banner shows "live" or "mock" depending on backend availability
- **Accessibility** — verify ARIA attributes, focus order, keyboard-only usage
