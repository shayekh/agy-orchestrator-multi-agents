import { CellValue, BoardSize, PlayerSymbol, WinningLine } from '../types/game';

export interface WinResult {
  winner: PlayerSymbol | 'DRAW' | null;
  winningLine: WinningLine | null;
}

/**
 * Evaluates the current board state and determines if a player has won or if it's a draw.
 */
export function checkWinner(
  board: CellValue[],
  size: number = 3,
  streakToWin: number = 3
): WinResult {
  const effectiveStreak = Math.min(streakToWin, size);

  // 1. Check Horizontal lines
  for (let row = 0; row < size; row++) {
    for (let col = 0; col <= size - effectiveStreak; col++) {
      const combo: number[] = [];
      const first = board[row * size + col];
      if (!first) continue;

      let isMatch = true;
      for (let i = 0; i < effectiveStreak; i++) {
        const idx = row * size + (col + i);
        combo.push(idx);
        if (board[idx] !== first) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        return {
          winner: first,
          winningLine: {
            combo,
            direction: 'HORIZONTAL',
          },
        };
      }
    }
  }

  // 2. Check Vertical lines
  for (let col = 0; col < size; col++) {
    for (let row = 0; row <= size - effectiveStreak; row++) {
      const combo: number[] = [];
      const first = board[row * size + col];
      if (!first) continue;

      let isMatch = true;
      for (let i = 0; i < effectiveStreak; i++) {
        const idx = (row + i) * size + col;
        combo.push(idx);
        if (board[idx] !== first) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        return {
          winner: first,
          winningLine: {
            combo,
            direction: 'VERTICAL',
          },
        };
      }
    }
  }

  // 3. Check Main Diagonal lines (\)
  for (let row = 0; row <= size - effectiveStreak; row++) {
    for (let col = 0; col <= size - effectiveStreak; col++) {
      const combo: number[] = [];
      const first = board[row * size + col];
      if (!first) continue;

      let isMatch = true;
      for (let i = 0; i < effectiveStreak; i++) {
        const idx = (row + i) * size + (col + i);
        combo.push(idx);
        if (board[idx] !== first) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        return {
          winner: first,
          winningLine: {
            combo,
            direction: 'DIAGONAL_MAIN',
          },
        };
      }
    }
  }

  // 4. Check Sub Diagonal lines (/)
  for (let row = 0; row <= size - effectiveStreak; row++) {
    for (let col = effectiveStreak - 1; col < size; col++) {
      const combo: number[] = [];
      const first = board[row * size + col];
      if (!first) continue;

      let isMatch = true;
      for (let i = 0; i < effectiveStreak; i++) {
        const idx = (row + i) * size + (col - i);
        combo.push(idx);
        if (board[idx] !== first) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        return {
          winner: first,
          winningLine: {
            combo,
            direction: 'DIAGONAL_SUB',
          },
        };
      }
    }
  }

  // 5. Check for empty cells (DRAW check)
  const isFull = board.every((cell) => cell !== null);
  if (isFull) {
    return { winner: 'DRAW', winningLine: null };
  }

  return { winner: null, winningLine: null };
}

/**
 * Contract Wrapper: Evaluates winning condition and returns WinningLine with winner property if a player won, else null.
 */
export function checkWin(
  board: CellValue[],
  size: BoardSize = 3,
  streakToWin?: number
): (WinningLine & { winner: PlayerSymbol; line: WinningLine }) | null {
  const targetStreak = streakToWin ?? (size === 3 ? 3 : 4);
  const result = checkWinner(board, size, targetStreak);
  if (result.winner === 'X' || result.winner === 'O') {
    const line = result.winningLine || { combo: [], direction: 'HORIZONTAL' };
    return {
      combo: line.combo,
      direction: line.direction,
      winner: result.winner,
      line: line,
    };
  }
  return null;
}

/**
 * Contract Wrapper: Checks if the game is a draw (all cells filled and no winner).
 */
export function checkDraw(board: CellValue[], size: BoardSize = 3): boolean {
  const isFull = board.every((cell) => cell !== null);
  if (!isFull) return false;
  const targetStreak = size === 3 ? 3 : 4;
  const result = checkWinner(board, size, targetStreak);
  return result.winner === 'DRAW' || result.winner === null;
}

/**
 * Utility: Checks if board is full
 */
export function isBoardFull(board: CellValue[]): boolean {
  return board.every((cell) => cell !== null);
}

/**
 * Returns an array of valid move indices (empty board positions)
 */
export function getAvailableMoves(board: CellValue[]): number[] {
  const moves: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      moves.push(i);
    }
  }
  return moves;
}
