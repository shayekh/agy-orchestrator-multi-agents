# E2E Test Infra: Cyberpunk Glassmorphism Tic-Tac-Toe

## Test Philosophy
This test infrastructure follows an **opaque-box, requirement-driven** testing methodology. Tests interact with the application via public interfaces and DOM interactions rather than directly inspecting internal state variables or private implementation details.

Key principles:
1. **Behavior Verification**: Validate that user interactions trigger expected visual outputs, game state transitions, audio cues, and storage updates.
2. **Unbeatable AI Validation**: Guarantee via deterministic tests that the Minimax AI never loses on 3x3 grids under any move sequence.
3. **Resilience & Fault Tolerance**: Verify fallback mechanisms for browser APIs (Web Audio API, HTML5 Canvas, localStorage) under mocked environment constraints.

---

## Feature Inventory & Test Tier Mapping

| Feature # | Feature Name | Description | Target Test Tier | Source |
|-----------|--------------|-------------|------------------|--------|
| F1 | Game FSM & State Reducer | Pass-and-play local 2P & AI modes, move history, 2-ply undo | Tier 1 (Unit), Tier 2 (Integration) | PROJECT.md |
| F2 | Minimax AI Engine | Unbeatable Minimax + Alpha-Beta pruning on 3x3; depth-limited on 4x4, 5x5 | Tier 1 (Unit), Tier 3 (E2E) | PROJECT.md |
| F3 | Win/Draw & Dynamic Grids | Evaluator across 3x3, 4x4, 5x5 grids for horizontal, vertical, diagonal lines | Tier 1 (Unit), Tier 2 (Integration) | PROJECT.md |
| F4 | Tactical Hint Engine | Optimal next move calculation & hint banner display | Tier 1 (Unit), Tier 2 (Integration) | PROJECT.md |
| F5 | Glassmorphic UI Components | Modular GameBoard with SVG tokens, turn status header, controls, modals | Tier 2 (Integration), Tier 3 (E2E) | PROJECT.md |
| F6 | Winning Strike Line Overlay | Animated glowing laser line calculated over winning sequence cells | Tier 2 (Integration) | PROJECT.md |
| F7 | Theme Engine | 5 distinct visual themes (Cyberpunk Neon, Frost Glass, Retro Synthwave, Minimalist Gold, Cosmic Nebula) | Tier 2 (Integration), Tier 3 (E2E) | PROJECT.md |
| F8 | Procedural Web Audio Synth | Web Audio API sound routines (marks, chimes, victory, draw, clicks, mute/volume) | Tier 1 (Unit), Tier 2 (Integration) | PROJECT.md |
| F9 | HTML5 Canvas Fireworks Confetti | 2D canvas confetti particle system triggered on game victories | Tier 1 (Unit), Tier 2 (Integration) | PROJECT.md |
| F10 | Local Persistence & Analytics | Save stats (wins, losses, draws, streaks, history) & settings in localStorage with Leaderboard modal | Tier 1 (Unit), Tier 3 (E2E) | PROJECT.md |

---

## Test Architecture

### Stack & Tools
- **Test Runner**: [Vitest](https://vitest.dev/) (v2.1.0+) running in `jsdom` environment.
- **Component Testing**: `@testing-library/react` and `@testing-library/user-event` for user interaction simulation.
- **Mock Environment**: `vitest.setup.ts` providing stubs for:
  - `window.AudioContext` / `window.webkitAudioContext` (GainNode, OscillatorNode, BiquadFilterNode, AudioParam ramps)
  - `HTMLCanvasElement.prototype.getContext('2d')` (2D rendering context operations)
  - `window.requestAnimationFrame` and `window.cancelAnimationFrame`
  - In-memory `localStorage` fallback wrapper

### Directory Structure & Naming
- Configuration: `vitest.config.ts`
- Setup file: `vitest.setup.ts`
- Test files: Located in `tests/` directory following `tests/**/*.test.ts` or `tests/**/*.test.tsx` patterns.

---

## Coverage Thresholds & Strategy

1. **Tier 1 (Unit & Core Logic)**
   - Minimum **>= 5 test cases per feature module**.
   - Direct unit testing of `gameReducer`, `minimax`, `winChecker`, `hintEngine`, `soundEngine`, and `persistence`.

2. **Tier 2 (UI & Component Integration)**
   - Minimum **>= 5 test cases per UI feature module**.
   - Testing components in rendered DOM context: `GameBoard`, `Controls`, `ThemeSelector`, `StatsModal`, `WinningStrikeOverlay`.

3. **Tier 3 (E2E & Pairwise Integration Matrix)**
   - Pairwise matrix coverage across all combinations of:
     - Board Sizes: `3x3`, `4x4`, `5x5`
     - Game Modes: `2P Local`, `AI Easy`, `AI Medium`, `AI Hard (Unbeatable)`
     - Visual Themes: `Cyberpunk Neon`, `Frost Glassmorphism`, `Retro Synthwave`, `Minimalist Gold`, `Cosmic Nebula`

4. **Tier 4 (Realistic Workloads & Stress Testing)**
   - Full game session simulations (playing complete matches from start to finish).
   - Multi-play undo sequence stress tests (repeatedly placing and undoing moves).
   - High-speed user interaction tests (rapid clicks, rapid theme toggles).
