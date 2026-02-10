# Vue Spreadsheet

A feature-rich, Excel-like spreadsheet application built with Vue 3, TypeScript, and TailwindCSS. Supports importing/exporting `.xlsx` files, cell formatting, shapes, formulas, and a multi-mode workflow (Designer, Operator, Manual).

## Tech Stack

- **Framework** — Vue 3 (Composition API) + TypeScript
- **State** — Pinia
- **Styling** — TailwindCSS v4
- **Icons** — lucide-vue-next
- **Excel I/O** — ExcelJS + JSZip
- **Build** — Vite 7
- **Package Manager** — Bun

## Architecture

Feature-Sliced Design (FSD):

```
src/
├── shared/
│   ├── types/index.ts            # All TypeScript interfaces & enums
│   ├── lib/excelService.ts       # Excel import/export (ExcelJS)
│   ├── lib/fileService.ts        # JSON project save/load
│   └── lib/formulaEngine.ts      # Formula evaluation (SUM, AVERAGE, IF, etc.)
├── features/
│   ├── spreadsheet/
│   │   ├── model/spreadsheetStore.ts   # Pinia store (sheets, cells, shapes, undo/redo)
│   │   ├── lib/useCellStyle.ts         # Cell CSS style builder
│   │   ├── lib/useMergeMap.ts          # Merge map composable
│   │   └── ui/
│   │       ├── SpreadsheetTable.vue    # Main table with virtual scrolling
│   │       ├── SpreadsheetCell.vue     # Individual cell (edit, select, config)
│   │       ├── ShapeLayer.vue          # Interactive shapes (move, resize, rotate)
│   │       ├── CellConfigModal.vue     # Designer mode cell configuration
│   │       ├── RibbonToolbar.vue       # Excel-like ribbon with tabs
│   │       ├── FormulaBar.vue          # Cell address + formula display
│   │       └── ribbon/                 # Ribbon tab groups
│   │           ├── FontGroup.vue       # Bold, Italic, Underline, Colors
│   │           ├── AlignmentGroup.vue  # H/V align, Wrap text
│   │           ├── CellsGroup.vue      # Merge/Unmerge
│   │           ├── BorderGroup.vue     # Border style, width, color
│   │           ├── InsertGroup.vue     # Insert shapes & images
│   │           ├── EditGroup.vue       # Undo/Redo
│   │           ├── ViewGroup.vue       # Gridlines, Zoom
│   │           ├── ModeGroup.vue       # App mode switcher
│   │           └── ProjectGroup.vue    # Import/Export/Save
│   └── theme/
│       ├── model/themeStore.ts         # Dark/Light/System theme
│       └── ui/ThemeToggle.vue
├── pages/
│   ├── home/HomeView.vue               # Landing page (drag-drop import)
│   └── editor/EditorView.vue           # Editor workspace
└── router/index.ts                     # Routes: / and /editor
```

## App Modes

| Mode         | Description                                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Manual**   | Direct Excel-like editing. Full ribbon toolbar with font, alignment, borders, insert, undo/redo.                                              |
| **Designer** | Click any cell to open the Cell Configuration modal. Define input types, validation rules, conditional logic, and role-based access per cell. |
| **Operator** | Users fill in configured form fields. Non-configured cells are disabled. Role-based access and conditional logic enforced.                    |

## Features

### Spreadsheet Core

- Import/export `.xlsx` files (ExcelJS)
- Multi-sheet support with tab navigation
- Cell selection (single + range drag)
- Inline cell editing with formula bar
- Column/row resize (drag handles)
- Merge/unmerge cells
- Undo/redo with full history stack

### Cell Formatting (Manual Mode)

- **Font** — Bold, Italic, Underline, Text color, Background color
- **Alignment** — Horizontal (left/center/right), Vertical (top/center/bottom), Wrap text
- **Borders** — All/Outer/Top/Bottom/Left/Right/None, Thin/Medium/Thick width, Custom color picker
- **Gridlines** — Toggle visibility

### Formula Engine

- Arithmetic: `+`, `-`, `*`, `/`
- Functions: `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, `ABS`, `ROUND`, `IF`
- Cell references: `A1`, `B2:D5` (ranges)

### Shapes & Images (Manual Mode)

- Insert shapes: Rectangle, Ellipse, Triangle
- Insert images from file
- **Interactive manipulation:**
  - Drag to move
  - 8-point resize handles
  - Rotate handle (free rotation)
  - Floating toolbar: Flip H/V, Rotate 90°, Opacity slider, Duplicate, Delete
  - Z-order: Bring Forward / Send Backward
- Shapes export to Excel as images

### Designer Mode

- Click any cell to open **Cell Configuration** modal
- **General tab** — Input type (Text, Number, Select, Toggle, Date, Symbol, Image), Field label, Placeholder, Required toggle
- **Rules tab** — Min/Max validation, Regex pattern, Custom error messages
- **Logic tab** — Conditional visibility (show field only if another field has a specific value)
- **Access tab** — Per-cell role permissions (Admin, Manager, Staff, Viewer)
- Visual indicators: blue triangle badge + border overlay on configured cells

### Operator Mode

- Non-configured cells are **disabled** (`cursor-not-allowed`), no grey overlay
- Configured cells render **native input widgets** based on type:
  - `text` → Text input with placeholder
  - `number` → Number input with min/max validation
  - `select` → Dropdown with configured options
  - `boolean` → iOS-style toggle switch
  - `date` → Native date picker
- **Required fields** marked with red asterisk (`*`) indicator
- **Role-based access** — Only cells matching the current user role are enabled
- **Conditional logic** — Fields shown only when dependency field has the required value
- **Role selector** in ribbon toolbar to simulate different user roles

### UI/UX

- Apple Design aesthetic with glassmorphism
- Dark/Light/System theme
- Responsive ribbon toolbar with contextual tabs per mode
- Smooth transitions and animations
- Keyboard shortcuts: `Ctrl+B`, `Ctrl+I`, `Ctrl+U`, `Delete`, `Escape`

## Getting Started

```sh
# Install dependencies
bun install

# Start dev server
bun dev

# Type check
bun run type-check

# Build for production
bun run build

# Lint
bun lint
```

## IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) (Chrome/Edge)
