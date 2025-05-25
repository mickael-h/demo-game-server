export const SLOT_SYMBOLS = ["🍒", "🍊", "🍋", "🍇", "7️⃣", "💎"] as const;

export const SYMBOL_VALUES: Record<string, number> = {
  "🍒": 2, // Cherry - lowest value
  "🍊": 3, // Orange
  "🍋": 4, // Lemon
  "🍇": 5, // Grapes
  "7️⃣": 10, // Seven - high value
  "💎": 20, // Diamond - highest value
};

export enum WinType {
  NO_WIN = "NO_WIN",
  TWO_OF_A_KIND = "TWO_OF_A_KIND",
  THREE_OF_A_KIND = "THREE_OF_A_KIND",
}

export interface OutcomeWeights {
  threeOfAKind?: number;
  twoOfAKind?: number;
  noWin?: number;
}

export interface SymbolWeights {
  [index: number]: number;
}

export interface BetRequest {
  amount: number;
  autowin?: boolean;
  autolose?: boolean;
  outcomeWeights?: OutcomeWeights;
  symbolWeights?: SymbolWeights;
}

export interface BetResponse {
  symbols: number[];
  betAmount: number;
  winAmount: number;
  isWin: boolean;
  winType: WinType;
}

export interface SpinStats {
  totalSpins: number;
  totalWinAmount: number;
  totalBetAmount: number;
  expectation: number;
  winRate: number;
  returnToPlayer: number;
  standardDeviation: number;
}
