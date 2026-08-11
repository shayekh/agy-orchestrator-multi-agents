# 🎮 Ultra Tic-Tac-Toe (Cyberpunk Glassmorphic Edition)

An ultra-polished, feature-rich, and visually stunning Tic-Tac-Toe web application built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**. Featuring responsive cyberpunk glassmorphism aesthetics, an unbeatable Minimax AI, procedural sound effects, and persistent local stats tracking.

---

## ✨ Features

- **🧠 Unbeatable Minimax AI**: Play against an AI featuring Alpha-Beta pruning. Fully unbeatable on a 3x3 grid (guarantees a win or draw) and highly tactical with depth-limiting and heuristic evaluations on 4x4 and 5x5 grids.
- **📐 Dynamic Board Dimensions**: Supports traditional `3x3`, `4x4`, and `5x5` grid layouts with automatic dynamic win/draw detection.
- **🎨 5 Visual Glassmorphic Themes**: Change atmosphere instantly with curated, rich palettes:
  - *Cyberpunk Neon* (Default)
  - *Frost Glassmorphism*
  - *Retro Synthwave*
  - *Minimalist Gold*
  - *Cosmic Nebula*
- **🔊 Procedural Web Audio Synth**: Synthesizes real-time sound effects (placing marks, win chimes, draws, UI clicks) dynamically without external audio assets.
- **🎆 HTML5 Canvas Confetti Fireworks**: Renders responsive 2D physics-based particle celebrations on match victories.
- **📊 Leaderboard & Local Persistence**: Stores your settings, active theme, and cumulative game stats (wins, losses, win-streaks, match histories) locally via `localStorage`.
- **💡 Tactical Hint Engine**: Identifies the mathematically optimal move on command with detailed explanations.

---

## 🛠️ Tech Stack

- **Framework**: React 18 & TypeScript
- **Styling**: Tailwind CSS & Framer Motion
- **Build Tool**: Vite
- **Testing**: Vitest & React Testing Library (with custom mock stubs for AudioContext & Canvas)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v16.0.0 or higher recommended).

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/shayekh/agy-orchestrator-multi-agents.git
   cd tictac-agy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   Open your browser to the local address displayed (typically `http://localhost:3000`).

### 🧪 Running Tests

Ensure all logic, stubs, and components pass the requirements:
```bash
npm test
```

### 📦 Building for Production

Compile a clean production build with type checking:
```bash
npm run build
```
