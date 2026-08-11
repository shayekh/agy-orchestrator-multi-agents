import { CellValue, BoardSize, PlayerSymbol, GameMode } from '../types/game';
import { getBestMove } from '../logic/minimax';

export * from '../logic/minimax';

/**
 * Legacy wrapper: Computes the optimal move for AI based on difficulty mode
 */
export function getAIMove(
  board: CellValue[],
  size: BoardSize,
  streakToWin: number,
  aiSymbol: PlayerSymbol,
  mode: GameMode
): number {
  return getBestMove(board, aiSymbol, mode, size, streakToWin);
}
