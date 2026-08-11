import { WinningLine, PlayerSymbol } from '../types/game';

export * from '../logic/winChecker';

export interface WinCheckResult {
  winner: PlayerSymbol;
  line: WinningLine;
}
