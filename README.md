# ChordBox: Professional Chord Sheet Generator

A professional-grade web-based chord sheet application built with React and Tailwind CSS. The tool assists musicians in drafting, transposing, and smartly formatting song structure, while enabling users to export pixel-perfect layouts natively into print-ready A4 JPG documents.

## Key Features
- **Dynamic Grid Formatting**: Build standard sheet music measure grids and construct repetitive phrases utilizing built-in repeat brackets. Expand or collapse measure lengths dynamically.
- **Auto-Transposition Engine**: Shift the entire sequence of chords up or down by semitones effortlessly. Provides visual transpose counts and scales relative root variations natively.
- **Responsive Adaptive Workspace**: Responsive editing environment that easily accommodates both desktop operations and mobile modifications using adaptive UI controls.
- **HQ Export Pipeline**: Compiles your interface layout locally into uncompressed, perfectly-spaced A4 JPG documents ready for printing natively via `html-to-image`.

## Architecture & Tech Stack
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS
- **Local Persistence**: Browser LocalStorage Integration
- **Rendering System**: `html-to-image`, `lucide-react`

## Quick Start

1. Install project dependencies:
```bash
npm install
```

2. Start the development server (Defaults to Port 5173):
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173` to launch the application.