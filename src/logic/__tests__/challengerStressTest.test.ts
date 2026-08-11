import { describe, it, expect } from 'vitest';
import { gameReducer, createInitialState } from '../gameReducer';

describe('Challenger M1 Iteration 2 Stress Test Suite', () => {

  describe('Task 1: 4x4 and 5x5 Board Size & Length Preservation', () => {
    it('preserves size 4 and board length 16 through START_GAME, moves, UNDO_MOVE, and RESET_GAME', () => {
      let state = createInitialState({ boardSize: 4 });
      expect(state.size).toBe(4);
      expect(state.board.length).toBe(16);

      state = gameReducer(state, { type: 'START_GAME' });
      expect(state.size).toBe(4);
      expect(state.board.length).toBe(16);

      // Make 4 moves
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // O
      expect(state.board.length).toBe(16);
      expect(state.history.length).toBe(4);

      // Perform multiple undo calls
      state = gameReducer(state, { type: 'UNDO_MOVE' });
      expect(state.size).toBe(4);
      expect(state.board.length).toBe(16);

      state = gameReducer(state, { type: 'UNDO_MOVE' });
      expect(state.size).toBe(4);
      expect(state.board.length).toBe(16);

      state = gameReducer(state, { type: 'UNDO_MOVE' });
      expect(state.size).toBe(4);
      expect(state.board.length).toBe(16);

      state = gameReducer(state, { type: 'UNDO_MOVE' });
      expect(state.size).toBe(4);
      expect(state.board.length).toBe(16);
      expect(state.history.length).toBe(0);

      // Extra undo on empty history
      state = gameReducer(state, { type: 'UNDO_MOVE' });
      expect(state.size).toBe(4);
      expect(state.board.length).toBe(16);

      // Reset game
      state = gameReducer(state, { type: 'RESET_GAME' });
      expect(state.size).toBe(4);
      expect(state.board.length).toBe(16);
    });

    it('preserves size 5 and board length 25 through START_GAME, moves, UNDO_MOVE, and RESET_GAME', () => {
      let state = createInitialState({ boardSize: 5 });
      expect(state.size).toBe(5);
      expect(state.board.length).toBe(25);

      state = gameReducer(state, { type: 'START_GAME' });
      expect(state.size).toBe(5);
      expect(state.board.length).toBe(25);

      // Make moves
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 5 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 6 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 }); // X
      expect(state.board.length).toBe(25);
      expect(state.history.length).toBe(5);

      // Perform multiple undo calls
      state = gameReducer(state, { type: 'UNDO_MOVE' });
      expect(state.size).toBe(5);
      expect(state.board.length).toBe(25);

      state = gameReducer(state, { type: 'UNDO_MOVE' });
      expect(state.size).toBe(5);
      expect(state.board.length).toBe(25);

      state = gameReducer(state, { type: 'RESET_GAME' });
      expect(state.size).toBe(5);
      expect(state.board.length).toBe(25);
    });
  });

  describe('Task 2: 2-Ply Undo in AI Mode on Odd History Lengths (>= 3)', () => {
    it('returns turn X to Human player when undoing on history length 3', () => {
      let state = createInitialState({ mode: 'AI_UNBEATABLE' });
      state = gameReducer(state, { type: 'START_GAME' });

      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X (history len 1)
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O (history len 2)
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X (history len 3)
      expect(state.history.length).toBe(3);

      state = gameReducer(state, { type: 'UNDO_MOVE' }); // 2-ply undo -> removes index 1 (X) and index 4 (O)
      expect(state.history.length).toBe(1);
      expect(state.currentPlayer).toBe('X');
    });

    it('returns turn X to Human player when undoing on history length 5', () => {
      let state = createInitialState({ mode: 'AI_HARD' });
      state = gameReducer(state, { type: 'START_GAME' });

      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X (len 1)
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // O (len 2)
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X (len 3)
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O (len 4)
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 8 }); // X (len 5)
      expect(state.history.length).toBe(5);

      state = gameReducer(state, { type: 'UNDO_MOVE' }); // 2-ply undo -> removes len 5 & 4 -> new len 3
      expect(state.history.length).toBe(3);
      expect(state.currentPlayer).toBe('X');
    });
  });

  describe('Task 3: UNDO Blocked on Terminal States (VICTORY and DRAW)', () => {
    it('blocks UNDO_MOVE when state.status is VICTORY', () => {
      let state = createInitialState({ mode: 'PVP_LOCAL', boardSize: 3 });
      state = gameReducer(state, { type: 'START_GAME' });

      // X wins top row: (0, 3, 1, 4, 2)
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 }); // X (VICTORY)

      expect(state.status).toBe('VICTORY');
      expect(state.winner).toBe('X');
      const winCountBefore = state.playerX.stats.wins;

      // Attempt UNDO_MOVE
      const stateAfterUndo = gameReducer(state, { type: 'UNDO_MOVE' });

      expect(stateAfterUndo).toBe(state); // Reference equality check (blocked)
      expect(stateAfterUndo.status).toBe('VICTORY');
      expect(stateAfterUndo.winner).toBe('X');
      expect(stateAfterUndo.playerX.stats.wins).toBe(winCountBefore);
    });

    it('blocks UNDO_MOVE when state.status is DRAW', () => {
      let state = createInitialState({ mode: 'PVP_LOCAL', boardSize: 3 });
      state = gameReducer(state, { type: 'START_GAME' });

      /*
        Full draw board:
        X O X
        X O O
        O X X
      */
      const moves = [0, 1, 2, 4, 3, 5, 7, 6, 8];
      moves.forEach((idx) => {
        state = gameReducer(state, { type: 'MAKE_MOVE', index: idx });
      });

      expect(state.status).toBe('DRAW');
      expect(state.winner).toBe('DRAW');

      // Attempt UNDO_MOVE
      const stateAfterUndo = gameReducer(state, { type: 'UNDO_MOVE' });

      expect(stateAfterUndo).toBe(state); // Reference equality check (blocked)
      expect(stateAfterUndo.status).toBe('DRAW');
    });
  });
});
