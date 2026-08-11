import { CellValue, BoardSize, PlayerSymbol, HintResult } from '../types/game';
import { getAvailableMoves } from './winChecker';
import { minimaxAlphaBeta, findImmediateWinOrBlock } from './minimax';

/**
 * Hint Engine: Evaluates the current board and suggests the tactical best move with 4-tier prioritization
 * Tier 1: Immediate Win
 * Tier 2: Defensive Block
 * Tier 3: Center Control
 * Tier 4: Minimax Optimal Move
 */
export function getHintMove(
  board: CellValue[],
  arg2: BoardSize | PlayerSymbol = 3,
  arg3: PlayerSymbol | BoardSize = 'X',
  streakToWinParam?: number
): HintResult | null {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return null;

  let size: BoardSize = 3;
  let player: PlayerSymbol = 'X';

  if (typeof arg2 === 'number') {
    size = arg2 as BoardSize;
    player = (typeof arg3 === 'string' ? arg3 : 'X') as PlayerSymbol;
  } else {
    player = arg2 as PlayerSymbol;
    size = (typeof arg3 === 'number' ? arg3 : 3) as BoardSize;
  }

  const streakToWin = streakToWinParam ?? (size === 3 ? 3 : 4);
  const opponent: PlayerSymbol = player === 'X' ? 'O' : 'X';

  // Tier 1 & Tier 2: Immediate Win or Immediate Defensive Block
  const { winMove, blockMove } = findImmediateWinOrBlock(board, player, size, streakToWin);

  if (winMove !== null) {
    return {
      index: winMove,
      score: 100,
      explanation: 'Winning Move! Complete this line to secure victory immediately.',
    };
  }

  if (blockMove !== null) {
    return {
      index: blockMove,
      score: 90,
      explanation: 'Defensive Block! Stop opponent from completing their winning streak on the next turn.',
    };
  }

  // Tier 3: Center Control
  const centerRow = Math.floor(size / 2);
  const centerCol = Math.floor(size / 2);
  const centerIndex = centerRow * size + centerCol;
  if (board[centerIndex] === null) {
    return {
      index: centerIndex,
      score: 80,
      explanation: 'Control Center! Occupying the central grid square maximizes diagonal & straight attack vectors.',
    };
  }

  // Tier 4: Minimax Optimal Score Analysis
  let maxDepth = 9;
  if (size === 4) maxDepth = 4;
  if (size >= 5) maxDepth = 3;

  const result = minimaxAlphaBeta(
    [...board],
    0,
    true,
    -Infinity,
    Infinity,
    player,
    opponent,
    size,
    streakToWin,
    maxDepth
  );

  const bestIndex = result.bestMove !== -1 ? result.bestMove : availableMoves[0];

  return {
    index: bestIndex,
    score: result.score,
    explanation: 'Optimal Strategy! Minimax analysis calculated this square as your highest win-probability move.',
  };
}
