# Components Documentation

![Query Builder component preview](./images/query-builder-preview.png)

## Component Architecture

This directory contains reusable, well-structured React components following best practices.

## Components

### CollapseButton

A reusable collapse/expand button component that can be used throughout the application.

**Location:** `src/components/CollapseButton/`

**Props:**
- `isExpanded` (boolean, required) - Whether the content is currently expanded
- `onToggle` (function, required) - Callback function when button is clicked
- `expandedLabel` (string, optional) - Label to show when expanded (default: 'Hide')
- `collapsedLabel` (string, optional) - Label to show when collapsed (default: 'Show')
- `className` (string, optional) - Additional CSS classes
- Additional button props are spread to the button element

**Usage Example:**
```jsx
import CollapseButton from './components/CollapseButton';

function MyComponent() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <CollapseButton
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      expandedLabel="Hide Details"
      collapsedLabel="Show Details"
    />
  );
}
```

### QueryBuilderController

A complete query builder controller that manages query state and provides a collapsible interface using the CollapseButton component.

**Location:** `src/components/QueryBuilderController/`

**Props:**
- `fields` (array, required) - Array of field definitions for the query builder
- `operators` (array, required) - Array of operator definitions
- `initialQuery` (object, optional) - Initial query state (default: `{ combinator: 'and', rules: [] }`)
- `onQueryChange` (function, optional) - Callback when query changes
- `label` (string, optional) - Label prefix for the button (default: 'Advanced filters')
- Additional props are passed to the underlying QueryBuilder component

**Usage Example:**
```jsx
import QueryBuilderController from './components/QueryBuilderController';

function MyComponent() {
  const fields = [
    { name: 'firstName', label: 'First Name' },
    { name: 'lastName', label: 'Last Name' },
  ];
  
  const operators = [
    { name: '=', label: '=' },
    { name: '!=', label: '!=' },
  ];
  
  const handleQueryChange = (query) => {
    console.log('Query changed:', query);
  };
  
  return (
    <QueryBuilderController
      fields={fields}
      operators={operators}
      label="Search Filters"
      onQueryChange={handleQueryChange}
    />
  );
}
```

## Utilities

### queryUtils.js

Utility functions for query operations located in `src/utils/queryUtils.js`:

- `countRules(query)` - Counts the number of rules in a query object
- `formatQueryString(query)` - Formats a query object into a readable string

## File Structure

```
src/
├── components/
│   ├── CollapseButton/
│   │   ├── CollapseButton.jsx
│   │   ├── CollapseButton.less
│   │   └── index.js
│   ├── QueryBuilderController/
│   │   ├── QueryBuilderController.jsx
│   │   ├── QueryBuilderController.less
│   │   ├── QueryBuilderController.query-builder.css
│   │   └── index.js
│   ├── index.js
│   └── README.md
└── utils/
    └── queryUtils.js
```

## Best Practices

1. **Component Isolation**: Each component is self-contained with its own styles and logic
2. **Reusability**: Components are designed to be reusable across the application
3. **PropTypes**: All components use PropTypes for type checking
4. **Documentation**: Components include JSDoc comments for better IDE support
5. **Separation of Concerns**: Business logic is separated from UI components
