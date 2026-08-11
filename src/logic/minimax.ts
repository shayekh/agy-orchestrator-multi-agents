import { CellValue, GameMode, PlayerSymbol, BoardSize } from '../types/game';
import { checkWinner, getAvailableMoves } from './winChecker';

export { getHintMove } from './hintEngine';

/**
 * Heuristic evaluation function for non-terminal board states (especially NxN >= 4x4)
 * Uses sliding window line pattern scanning (horizontal, vertical, diagonal 4-cell windows)
 * to evaluate open 3s, open 2s, threats, and center proximity.
 */
export function evaluateHeuristic(
  board: CellValue[],
  maxPlayer: PlayerSymbol,
  minPlayer: PlayerSymbol,
  size: number
): number {
  let score = 0;
  const windowLen = size >= 4 ? 4 : size;

  const evaluateWindow = (indices: number[]): number => {
    let maxCount = 0;
    let minCount = 0;

    for (const idx of indices) {
      if (board[idx] === maxPlayer) maxCount++;
      else if (board[idx] === minPlayer) minCount++;
    }

    // Blocked line if both players have marks
    if (maxCount > 0 && minCount > 0) return 0;

    if (maxCount > 0) {
      if (maxCount === 4) return 10000;
      if (maxCount === 3) return 500;
      if (maxCount === 2) return 50;
      if (maxCount === 1) return 10;
    }

    if (minCount > 0) {
      if (minCount === 4) return -10000;
      if (minCount === 3) return -600; // Heavier negative penalty to prioritize blocking opponent threats
      if (minCount === 2) return -50;
      if (minCount === 1) return -10;
    }

    return 0;
  };

  // 1. Horizontal windows
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - windowLen; c++) {
      const window: number[] = [];
      for (let i = 0; i < windowLen; i++) {
        window.push(r * size + (c + i));
      }
      score += evaluateWindow(window);
    }
  }

  // 2. Vertical windows
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - windowLen; r++) {
      const window: number[] = [];
      for (let i = 0; i < windowLen; i++) {
        window.push((r + i) * size + c);
      }
      score += evaluateWindow(window);
    }
  }

  // 3. Main Diagonal windows (\)
  for (let r = 0; r <= size - windowLen; r++) {
    for (let c = 0; c <= size - windowLen; c++) {
      const window: number[] = [];
      for (let i = 0; i < windowLen; i++) {
        window.push((r + i) * size + (c + i));
      }
      score += evaluateWindow(window);
    }
  }

  // 4. Sub Diagonal windows (/)
  for (let r = 0; r <= size - windowLen; r++) {
    for (let c = windowLen - 1; c < size; c++) {
      const window: number[] = [];
      for (let i = 0; i < windowLen; i++) {
        window.push((r + i) * size + (c - i));
      }
      score += evaluateWindow(window);
    }
  }

  // 5. Center Proximity Weight
  const centerIndex = Math.floor(size / 2);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const idx = r * size + c;
      if (board[idx] === null) continue;

      const distFromCenter = Math.abs(r - centerIndex) + Math.abs(c - centerIndex);
      const weight = Math.max(1, size - distFromCenter);

      if (board[idx] === maxPlayer) {
        score += weight * 2;
      } else if (board[idx] === minPlayer) {
        score -= weight * 2;
      }
    }
  }

  return score;
}

/**
 * Minimax recursive core with Alpha-Beta Pruning
 */
export function minimaxAlphaBeta(
  board: CellValue[],
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  maxPlayer: PlayerSymbol,
  minPlayer: PlayerSymbol,
  size: number,
  streakToWin: number,
  maxDepth: number
): { score: number; bestMove: number } {
  const result = checkWinner(board, size, streakToWin);

  // Terminal evaluation
  if (result.winner === maxPlayer) {
    return { score: 10000 - depth, bestMove: -1 };
  }
  if (result.winner === minPlayer) {
    return { score: depth - 10000, bestMove: -1 };
  }
  if (result.winner === 'DRAW') {
    return { score: 0, bestMove: -1 };
  }
  if (depth >= maxDepth) {
    return {
      score: evaluateHeuristic(board, maxPlayer, minPlayer, size),
      bestMove: -1,
    };
  }

  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) {
    return { score: 0, bestMove: -1 };
  }

  // Move ordering: evaluate center & near-center moves first for maximum alpha-beta pruning speed
  const center = Math.floor(size / 2);
  availableMoves.sort((a, b) => {
    const rA = Math.floor(a / size), cA = a % size;
    const rB = Math.floor(b / size), cB = b % size;
    const distA = Math.abs(rA - center) + Math.abs(cA - center);
    const distB = Math.abs(rB - center) + Math.abs(cB - center);
    return distA - distB;
  });

  let bestMove = availableMoves[0];

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of availableMoves) {
      board[move] = maxPlayer;
      const evalResult = minimaxAlphaBeta(
        board,
        depth + 1,
        false,
        alpha,
        beta,
        maxPlayer,
        minPlayer,
        size,
        streakToWin,
        maxDepth
      );
      board[move] = null;

      if (evalResult.score > maxEval) {
        maxEval = evalResult.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, maxEval);
      if (beta <= alpha) {
        break; // Alpha-Beta Cutoff
      }
    }
    return { score: maxEval, bestMove };
  } else {
    let minEval = Infinity;
    for (const move of availableMoves) {
      board[move] = minPlayer;
      const evalResult = minimaxAlphaBeta(
        board,
        depth + 1,
        true,
        alpha,
        beta,
        maxPlayer,
        minPlayer,
        size,
        streakToWin,
        maxDepth
      );
      board[move] = null;

      if (evalResult.score < minEval) {
        minEval = evalResult.score;
        bestMove = move;
      }
      beta = Math.min(beta, minEval);
      if (beta <= alpha) {
        break; // Alpha-Beta Cutoff
      }
    }
    return { score: minEval, bestMove };
  }
}

/**
 * Finds immediate winning move or immediate block move if available
 */
export function findImmediateWinOrBlock(
  board: CellValue[],
  player: PlayerSymbol,
  size: number,
  streakToWin: number
): { winMove: number | null; blockMove: number | null } {
  const opponent: PlayerSymbol = player === 'X' ? 'O' : 'X';
  const availableMoves = getAvailableMoves(board);

  let winMove: number | null = null;
  let blockMove: number | null = null;

  // Check for immediate win
  for (const move of availableMoves) {
    board[move] = player;
    if (checkWinner(board, size, streakToWin).winner === player) {
      winMove = move;
    }
    board[move] = null;
    if (winMove !== null) break;
  }

  // Check for immediate block
  for (const move of availableMoves) {
    board[move] = opponent;
    if (checkWinner(board, size, streakToWin).winner === opponent) {
      blockMove = move;
    }
    board[move] = null;
    if (blockMove !== null) break;
  }

  return { winMove, blockMove };
}

/**
 * Primary decision entry point for AI moves based on selected difficulty mode
 */
export function getBestMove(
  board: CellValue[],
  arg2: PlayerSymbol | BoardSize = 'O',
  arg3: GameMode = 'AI_UNBEATABLE',
  arg4?: BoardSize | PlayerSymbol,
  arg5?: number
): number {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return -1;

  let aiPlayer: PlayerSymbol = 'O';
  let mode: GameMode = 'AI_UNBEATABLE';
  let size: BoardSize = 3;

  if (typeof arg2 === 'number') {
    size = arg2 as BoardSize;
    mode = arg3;
    aiPlayer = (typeof arg4 === 'string' ? arg4 : 'O') as PlayerSymbol;
  } else {
    aiPlayer = arg2 as PlayerSymbol;
    mode = arg3;
    size = (typeof arg4 === 'number' ? arg4 : 3) as BoardSize;
  }

  const streakToWin = arg5 ?? (size === 3 ? 3 : 4);

  // 1. Easy Mode: 80% random, 20% tactical
  if (mode === 'AI_EASY') {
    if (Math.random() < 0.8) {
      const randomIndex = Math.floor(Math.random() * availableMoves.length);
      return availableMoves[randomIndex];
    }
  }

  // 2. Immediate Win / Block check for Medium & Hard & Unbeatable
  const { winMove, blockMove } = findImmediateWinOrBlock(board, aiPlayer, size, streakToWin);
  if (winMove !== null) return winMove;
  if (blockMove !== null) return blockMove;

  // 3. Medium Mode: 50% random / 50% minimax
  if (mode === 'AI_MEDIUM' && Math.random() < 0.5) {
    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    return availableMoves[randomIndex];
  }

  // 4. Hard / Unbeatable Mode with Minimax & Alpha-Beta Pruning
  const opponent: PlayerSymbol = aiPlayer === 'X' ? 'O' : 'X';

  // Search depth configuration: 3x3 depth 9, 4x4 depth 4, 5x5 depth 3
  let maxDepth = 9;
  if (size === 4) maxDepth = 3;
  if (size >= 5) maxDepth = 2;

  const result = minimaxAlphaBeta(
    [...board],
    0,
    true,
    -Infinity,
    Infinity,
    aiPlayer,
    opponent,
    size,
    streakToWin,
    maxDepth
  );

  return result.bestMove !== -1 ? result.bestMove : availableMoves[0];
}
