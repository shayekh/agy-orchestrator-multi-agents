# Project: Cyberpunk Glassmorphism Tic-Tac-Toe

## Architecture
- Stack: React + TypeScript + Vite + Tailwind CSS
- Engine & Logic: `src/logic/` (`gameReducer.ts`, `minimax.ts`, `winChecker.ts`, `hintEngine.ts`)
- UI & Theme Components: `src/components/` (`GameBoard.tsx`, `WinningStrikeOverlay.tsx`, `Header.tsx`, `Controls.tsx`, `ThemeSelector.tsx`, `StatsModal.tsx`, `GameOverModal.tsx`, `HintBanner.tsx`)
- Audio Synthesizer: `src/audio/soundEngine.ts` (Zero-dependency Web Audio API)
- Particle FX: `src/effects/confetti.ts` (HTML5 Canvas 2D Fireworks Confetti)
- Persistence: `src/storage/persistence.ts` (`localStorage` stats & settings)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Game FSM & State Reducer | Pass-and-play local 2P & AI modes, move history, 2-ply undo | M1 | survey |
| 2 | Minimax AI Engine | Unbeatable Minimax + Alpha-Beta pruning on 3x3; depth-limited + heuristic on 4x4, 5x5 | M1 | survey |
| 3 | Win/Draw & Dynamic Grids | Sliding window win evaluator across 3x3, 4x4, 5x5 grids | M1 | survey |
| 4 | Tactical Hint Engine | Optimal next move calculation & hint banner display | M1 | survey |
| 5 | Glassmorphic UI Components | Modular GameBoard with SVG tokens, turn status header, controls, modals | M2 | survey |
| 6 | Winning Strike Line Overlay | Animated glowing laser line calculated precisely over winning sequence cells | M2 | survey |
| 7 | Theme Engine | 5 distinct themes (Cyberpunk Neon, Frost Glassmorphism, Retro Synthwave, Minimalist Gold, Cosmic Nebula) | M2 | survey |
| 8 | Procedural Web Audio Synth | Zero-dependency Web Audio API sound routines (marks, chimes, victory, draw, clicks, mute/volume) | M3 | survey |
| 9 | HTML5 Canvas Fireworks Confetti | 2D canvas confetti particle system with multi-directional launches on game victory | M3 | survey |
| 10 | Local Persistence & Analytics | Save stats (wins, losses, draws, win streaks, match history) & preferences in localStorage with Leaderboard modal | M4 | survey |
| 11 | Build & Code Integrity | Clean build (`npm run build`, `tsc --noEmit`), dev server verification, clean redundant files | M1-M5 | survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Game Engine & Minimax AI | Core FSM state machine, Minimax AI (3x3/4x4/5x5), 2-ply undo, hint engine, win evaluation | none | DONE |
| M2 | Glassmorphic UI & Theme Engine | App.tsx integration with GameBoard, SVG mark tokens, glowing laser strike line overlay, 5 CSS themes | M1 | DONE |
| M3 | Web Audio Synth & Particle Confetti | Sound engine integration, UI click/action sounds, Canvas fireworks on win | M1, M2 | DONE |
| M4 | Leaderboard Analytics & LocalStorage | LocalStorage integration for preferences & stats, StatsModal leaderboard analytics | M1, M2 | DONE |
| M5 | Final E2E Test Suite Pass & Adversarial Hardening | E2E opaque-box test suite (Tiers 1-4) & Tier 5 white-box adversarial coverage hardening | M1, M2, M3, M4 | DONE |

## Interface Contracts
### Logic ↔ UI Interface
- `GameState`: `board: CellContent[][]`, `boardSize: 3 | 4 | 5`, `mode: GameMode`, `currentPlayer: Player`, `winner: Winner`, `winningLine: [number, number][] | null`, `moveHistory: Move[]`, `hint: Move | null`, `theme: ThemeId`, `soundEnabled: boolean`, `volume: number`
- `soundEngine.ts`: `playClick()`, `playMove(player: 'X' | 'O')`, `playWin()`, `playDraw()`, `playHint()`, `playUndo()`, `setMuted(muted: boolean)`, `setVolume(vol: number)`
- `confetti.ts`: `triggerConfetti()`

## Code Layout
- `src/logic/` -> Core game reducer, win checker, minimax, hint engine
- `src/components/` -> UI components, game board, modals, overlays
- `src/audio/` -> Web Audio procedural sound engine
- `src/effects/` -> Canvas confetti system
- `src/storage/` -> LocalStorage persistence
- `src/index.css` -> Tailwind & theme CSS variables mapping
