import { describe, it, expect } from 'vitest';
import { gameReducer, createInitialState } from '../gameReducer';
import { checkWinner, checkWin, checkDraw } from '../winChecker';
import { getHintMove } from '../hintEngine';
import { getBestMove } from '../minimax';
import { CellValue } from '../../types/game';

describe('Milestone M1 Game Engine & AI Verification', () => {

  describe('Win Evaluator (winChecker.ts)', () => {
    it('detects 3x3 horizontal win', () => {
      const board: CellValue[] = ['X', 'X', 'X', null, null, null, null, null, null];
      const res = checkWinner(board, 3, 3);
      expect(res.winner).toBe('X');
      expect(res.winningLine?.direction).toBe('HORIZONTAL');
    });

    it('detects 3x3 vertical win', () => {
      const board: CellValue[] = ['O', null, null, 'O', null, null, 'O', null, null];
      const res = checkWinner(board, 3, 3);
      expect(res.winner).toBe('O');
      expect(res.winningLine?.direction).toBe('VERTICAL');
    });

    it('detects 3x3 main diagonal win', () => {
      const board: CellValue[] = ['X', null, null, null, 'X', null, null, null, 'X'];
      const res = checkWinner(board, 3, 3);
      expect(res.winner).toBe('X');
      expect(res.winningLine?.direction).toBe('DIAGONAL_MAIN');
    });

    it('detects 3x3 sub diagonal win', () => {
      const board: CellValue[] = [null, null, 'O', null, 'O', null, 'O', null, null];
      const res = checkWinner(board, 3, 3);
      expect(res.winner).toBe('O');
      expect(res.winningLine?.direction).toBe('DIAGONAL_SUB');
    });

    it('detects 4x4 streak 4 win', () => {
      const board: CellValue[] = Array(16).fill(null);
      board[3] = 'X'; board[6] = 'X'; board[9] = 'X'; board[12] = 'X';
      const res = checkWinner(board, 4, 4);
      expect(res.winner).toBe('X');
      expect(res.winningLine?.direction).toBe('DIAGONAL_SUB');
    });

    it('detects 5x5 sliding window streak 4 diagonal win', () => {
      const board: CellValue[] = Array(25).fill(null);
      board[5] = 'X'; board[11] = 'X'; board[17] = 'X'; board[23] = 'X';
      const res = checkWinner(board, 5, 4);
      expect(res.winner).toBe('X');
      expect(res.winningLine?.direction).toBe('DIAGONAL_MAIN');
    });

    it('detects draw on full board', () => {
      const board: CellValue[] = [
        'X', 'O', 'X',
        'X', 'O', 'O',
        'O', 'X', 'X'
      ];
      expect(checkDraw(board, 3)).toBe(true);
    });
  });

  describe('Tactical Hint Engine (hintEngine.ts)', () => {
    it('returns Tier 1 immediate win', () => {
      const board: CellValue[] = ['X', 'X', null, 'O', 'O', null, null, null, null];
      const hint = getHintMove(board, 3, 'X');
      expect(hint?.score).toBe(100);
      expect(hint?.index).toBe(2);
    });

    it('returns Tier 2 defensive block', () => {
      const board: CellValue[] = ['O', 'O', null, 'X', null, null, null, null, null];
      const hint = getHintMove(board, 3, 'X');
      expect(hint?.score).toBe(90);
      expect(hint?.index).toBe(2);
    });

    it('returns Tier 3 center control when center is empty', () => {
      const board: CellValue[] = Array(9).fill(null);
      const hint = getHintMove(board, 3, 'X');
      expect(hint?.score).toBe(80);
      expect(hint?.index).toBe(4);
    });
  });

  describe('Game Reducer & FSM Edge Cases (gameReducer.ts)', () => {
    it('retains board size 4 after UNDO when game starts on 4x4', () => {
      let state = createInitialState({ boardSize: 4 });
      state = gameReducer(state, { type: 'START_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 });
      state = gameReducer(state, { type: 'UNDO_MOVE' });
      expect(state.board.length).toBe(16);
    });

    it('maintains correct turn for player X after 2-ply AI undo on 3-move history', () => {
      let state = createInitialState({ mode: 'AI_UNBEATABLE' });
      state = gameReducer(state, { type: 'START_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O (AI)
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X
      state = gameReducer(state, { type: 'UNDO_MOVE' }); // 2-ply undo
      expect(state.currentPlayer).toBe('X');
    });

    it('blocks UNDO_MOVE in terminal state (VICTORY / DRAW) preventing stats inflation', () => {
      let state = createInitialState({ mode: 'PVP_LOCAL' });
      state = gameReducer(state, { type: 'START_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 }); // X wins (Row 0)

      expect(state.status).toBe('VICTORY');
      expect(state.playerX.stats.wins).toBe(1);

      const stateAfterUndo = gameReducer(state, { type: 'UNDO_MOVE' });
      expect(stateAfterUndo).toEqual(state);
      expect(stateAfterUndo.status).toBe('VICTORY');
      expect(stateAfterUndo.playerX.stats.wins).toBe(1);
    });
  });
});
