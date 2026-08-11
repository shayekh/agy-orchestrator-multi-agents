import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../src/App';
import { soundEngine } from '../src/audio/soundEngine';
import * as confettiModule from '../src/effects/confetti';

describe('Tier 3 Cross-Feature Interactions', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * 1. Victory Trigger Chain:
   * Match win -> playWin() audio invocation -> triggerConfetti() canvas spawn -> player stat increment -> localStorage sync -> Victory Modal rendering.
   */
  it('executes full victory trigger chain on match win', async () => {
    const playWinSpy = vi.spyOn(soundEngine, 'playWin');
    const confettiSpy = vi.spyOn(confettiModule, 'triggerConfetti');

    const { container } = render(<App />);

    // Select 2-Player Local mode so both players are human controlled
    const pvpButton = screen.getByRole('button', { name: /2-PLAYER LOCAL/i });
    fireEvent.click(pvpButton);

    const startButton = screen.getByRole('button', { name: /ENTER ARENA/i });
    fireEvent.click(startButton);

    // Get 9 grid cells on 3x3 board
    const cells = container.querySelectorAll('[data-testid="game-board-grid"] button');
    expect(cells.length).toBe(9);

    // Play sequence: X at 0, O at 3, X at 1, O at 4, X at 2 (Row 1 win for X)
    fireEvent.click(cells[0]); // X
    fireEvent.click(cells[3]); // O
    fireEvent.click(cells[1]); // X
    fireEvent.click(cells[4]); // O
    fireEvent.click(cells[2]); // X -> WIN!

    // 1. playWin() audio invocation
    expect(playWinSpy).toHaveBeenCalledTimes(1);

    // 2. triggerConfetti() canvas spawn
    expect(confettiSpy).toHaveBeenCalledTimes(1);

    // 3. Victory Modal rendering in DOM
    expect(screen.getByText(/Claims Victory!/i)).toBeInTheDocument();
    expect(screen.getByText(/Cyber Champion Claims Victory!/i)).toBeInTheDocument();

    // 4 & 5. Player stat increment & localStorage sync
    const storedStatsRaw = localStorage.getItem('ultra_tictactoe_stats_v1');
    expect(storedStatsRaw).not.toBeNull();

    const storedStats = JSON.parse(storedStatsRaw!);
    expect(storedStats.playerX.wins).toBe(1);
    expect(storedStats.playerX.winStreak).toBe(1);
    expect(storedStats.playerO.wins).toBe(0);
  });

  /**
   * 2. AI Turn Input Locking:
   * During 350ms AI thinking window, user clicks on board cells are ignored (isAiTurn guard).
   */
  it('locks user inputs on board cells during the 350ms AI thinking window', () => {
    vi.useFakeTimers();

    const { container } = render(<App />);

    // Start match in default Unbeatable AI mode
    const startButton = screen.getByRole('button', { name: /ENTER ARENA/i });
    fireEvent.click(startButton);

    const cells = container.querySelectorAll('[data-testid="game-board-grid"] button');

    // Player X moves at index 0
    fireEvent.click(cells[0]);
    expect(cells[0]).toHaveTextContent('X');

    // Immediately try to click index 1 during 350ms AI thinking window
    fireEvent.click(cells[1]);

    // Cell 1 must remain empty because isAiTurn guard ignores clicks
    expect(cells[1]).toHaveTextContent('');

    // Advance timers by 350ms so AI completes thinking
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // AI has made its move ('O' placed in one cell), turn is back to X
    const occupiedCells = Array.from(cells).filter((c) => c.textContent !== '');
    expect(occupiedCells.length).toBe(2); // 1 X + 1 O
    expect(cells[1]).toHaveTextContent(''); // cell 1 was still ignored during AI window
  });

  /**
   * 3. Theme & Audio Mute Sync:
   * Toggling audio mute while changing theme mid-game preserves both audio mute state and theme data-theme attribute.
   */
  it('preserves both audio mute state and theme attribute when toggling mute and changing theme mid-game', () => {
    const { container } = render(<App />);

    // Mute sound via header button
    const muteButton = screen.getByTitle(/Mute Procedural Audio/i);
    fireEvent.click(muteButton);

    // Switch to Settings tab
    const settingsTab = screen.getByRole('button', { name: /Config/i });
    fireEvent.click(settingsTab);

    // Change theme dropdown to RETRO_ARCADE
    const themeSelect = screen.getByRole('combobox');
    fireEvent.change(themeSelect, { target: { value: 'RETRO_ARCADE' } });

    // Verify theme data attribute on root element
    const themeElement = container.querySelector('[data-theme]');
    expect(themeElement).toHaveAttribute('data-theme', 'RETRO_ARCADE');

    // Verify localStorage contains both updated theme and muted audio state
    const storedSettingsRaw = localStorage.getItem('ultra_tictactoe_settings_v1');
    expect(storedSettingsRaw).not.toBeNull();

    const storedSettings = JSON.parse(storedSettingsRaw!);
    expect(storedSettings.theme).toBe('RETRO_ARCADE');
    expect(storedSettings.audio.sfxEnabled).toBe(false);

    // Switch back to Arena tab and verify mute button state persists
    const arenaTab = screen.getByRole('button', { name: /^Arena$/i });
    fireEvent.click(arenaTab);

    const unmuteButton = screen.getByTitle(/Unmute Procedural Audio/i);
    expect(unmuteButton).toBeInTheDocument();
  });

  /**
   * 4. Hint Engine & Minimax Sync:
   * Requesting hint invokes Minimax -> plays playHint() sound -> renders cell ping -> displays hint recommendation banner.
   */
  it('invokes minimax hint engine, plays playHint sound, highlights cell with ping, and displays recommendation banner', () => {
    const playHintSpy = vi.spyOn(soundEngine, 'playHint');

    const { container } = render(<App />);

    // Start PvP Local match
    const pvpButton = screen.getByRole('button', { name: /2-PLAYER LOCAL/i });
    fireEvent.click(pvpButton);

    const startButton = screen.getByRole('button', { name: /ENTER ARENA/i });
    fireEvent.click(startButton);

    const cells = container.querySelectorAll('[data-testid="game-board-grid"] button');

    // Player X moves at index 0, Player O moves at index 4
    fireEvent.click(cells[0]); // X
    fireEvent.click(cells[4]); // O

    // Request tactical hint
    const hintButton = screen.getByRole('button', { name: /Hint/i });
    fireEvent.click(hintButton);

    // 1. playHint() sound invocation
    expect(playHintSpy).toHaveBeenCalledTimes(1);

    // 2. displays hint recommendation banner
    expect(screen.getByText(/Tactical Recommendation/i)).toBeInTheDocument();

    // 3. renders cell ping highlight ring
    const pingIndicator = container.querySelector('.animate-ping');
    expect(pingIndicator).not.toBeNull();
  });

  /**
   * 5. Board Resize Reset:
   * Changing board size mid-match from 3x3 to 4x4 resets game state to IDLE, resizes array to 16, updates win streak to 4, and clears active history.
   */
  it('resets game state to IDLE, resizes array to 16, updates streak requirement to 4, and clears history on board resize', () => {
    const { container } = render(<App />);

    // Start 3x3 match
    const startButton = screen.getByRole('button', { name: /ENTER ARENA/i });
    fireEvent.click(startButton);

    const cells3x3 = container.querySelectorAll('[data-testid="game-board-grid"] button');
    expect(cells3x3.length).toBe(9);

    // Make a move to start history
    fireEvent.click(cells3x3[0]);

    // Navigate to Config/Settings tab
    const settingsTab = screen.getByRole('button', { name: /Config/i });
    fireEvent.click(settingsTab);

    // Change board size to 4x4
    const size4x4Button = screen.getByRole('button', { name: /^4x4/i });
    fireEvent.click(size4x4Button);

    // Verify localStorage updated boardSize to 4 and streakToWin to 4
    const storedSettingsRaw = localStorage.getItem('ultra_tictactoe_settings_v1');
    expect(storedSettingsRaw).not.toBeNull();
    const storedSettings = JSON.parse(storedSettingsRaw!);
    expect(storedSettings.boardSize).toBe(4);
    expect(storedSettings.streakToWin).toBe(4);

    // Navigate back to Arena tab
    const arenaTab = screen.getByRole('button', { name: /^Arena$/i });
    fireEvent.click(arenaTab);

    // Game state is reset to IDLE ("ENTER ARENA" / "Select Mode & Begin" button present)
    const enterArenaButton = screen.getByRole('button', { name: /ENTER ARENA/i });
    expect(enterArenaButton).toBeInTheDocument();

    // Start new match on 4x4 board
    fireEvent.click(enterArenaButton);

    // Board resized to 16 cells (4x4) and history is cleared
    const cells4x4 = container.querySelectorAll('[data-testid="game-board-grid"] button');
    expect(cells4x4.length).toBe(16);
    Array.from(cells4x4).forEach((cell) => {
      expect(cell).toHaveTextContent('');
    });
  });

  /**
   * 6. 2-Ply Undo & Web Audio Sync:
   * Executing 2-ply undo plays playUndo() audio pitch sweep, pops 2 moves from history stack, and re-renders board without AI turn recursion loops.
   */
  it('executes 2-ply undo with playUndo audio sweep, pops 2 moves, and avoids AI turn recursion loops', () => {
    vi.useFakeTimers();

    const playUndoSpy = vi.spyOn(soundEngine, 'playUndo');

    const { container } = render(<App />);

    // Start match in AI mode
    const startButton = screen.getByRole('button', { name: /ENTER ARENA/i });
    fireEvent.click(startButton);

    const cells = container.querySelectorAll('[data-testid="game-board-grid"] button');

    // Move 1: Player X moves at index 0
    fireEvent.click(cells[0]);
    expect(cells[0]).toHaveTextContent('X');

    // Wait 350ms for AI response (Move 2)
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Board now has 2 moves (1 X and 1 O)
    const occupiedBeforeUndo = Array.from(cells).filter((c) => c.textContent !== '');
    expect(occupiedBeforeUndo.length).toBe(2);

    // Execute Undo
    const undoButton = screen.getByRole('button', { name: /Undo/i });
    fireEvent.click(undoButton);

    // 1. playUndo() audio invocation
    expect(playUndoSpy).toHaveBeenCalledTimes(1);

    // 2. Pops 2 moves from history stack, clearing board completely back to empty
    const occupiedAfterUndo = Array.from(cells).filter((c) => c.textContent !== '');
    expect(occupiedAfterUndo.length).toBe(0);

    // 3. Verify no AI recursion loop: advance time by 1000ms, AI should NOT automatically move since it is X's turn
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const occupiedAfterWait = Array.from(cells).filter((c) => c.textContent !== '');
    expect(occupiedAfterWait.length).toBe(0);
  });
});
