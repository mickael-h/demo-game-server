export const SLOT_SYMBOLS = ["🍒", "🍊", "🍋", "🍇", "7️⃣", "💎"] as const;

export const SYMBOL_VALUES: Record<string, number> = {
  "🍒": 2,    // Cherry - lowest value
  "🍊": 3,    // Orange
  "🍋": 4,    // Lemon
  "🍇": 5,    // Grapes
  "7️⃣": 10,   // Seven - high value
  "💎": 20,   // Diamond - highest value
};

export interface BetRequest {
  amount: number;
  autowin?: boolean;
  autolose?: boolean;
}

export interface BetResponse {
  symbols: number[];
  betAmount: number;
  winAmount: number;
  isWin: boolean;
} 
