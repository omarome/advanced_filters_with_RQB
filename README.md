# React Query Builder App

A React application featuring a collapsible advanced filters component using react-query-builder.

## Features

- Collapsible advanced filters interface
- Dynamic rule counting
- React Query Builder integration
- **Results table that updates in real-time based on applied filters**
- Modern UI with LESS styling
- Smooth animations and transitions

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm start
```

The app will be available at `http://localhost:5173` (or the port shown in the terminal).

![Query Builder component preview](./public/images/filter_with_suggestions.png)

## Usage

1. Click the "Advanced filters [X selected]" button to expand/collapse the query builder
2. Add rules using the "Add rule" and "Add group" buttons
3. The button label automatically updates to show the current number of selected rules
4. **The results table below automatically filters and displays matching records based on your rules**
5. Try different filters like:
   - `age > 30` to see users older than 30
   - `status = Active` to see only active users
   - `email contains example` to filter by email domain
   - Combine multiple rules with AND/OR logic

## Project Structure

```
├── src/
│   ├── App.jsx          # Main app component
│   ├── App.css          # App styles
│   ├── index.jsx        # Entry point
│   └── index.css        # Global styles
├── CollapsibleList.jsx  # Collapsible list component with query builder
├── CollapsibleList.less # Component styles
├── package.json         # Dependencies
└── vite.config.js       # Vite configuration
```
