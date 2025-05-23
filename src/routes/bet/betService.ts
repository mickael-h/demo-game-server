import { SLOT_SYMBOLS, SYMBOL_VALUES, BetRequest, BetResponse } from '../types';

export class BetService {
  private static instance: BetService;
  private readonly symbols: string[];

  private constructor() {
    this.symbols = [...SLOT_SYMBOLS];
  }

  public static getInstance(): BetService {
    if (!BetService.instance) {
      BetService.instance = new BetService();
    }
    return BetService.instance;
  }

  public placeBet(request: BetRequest): BetResponse {
    const { amount, autowin, autolose } = request;
    let symbols: number[];

    if (autowin) {
      // Force a win with three random identical symbols
      const randomSymbol = Math.floor(Math.random() * this.symbols.length);
      symbols = [randomSymbol, randomSymbol, randomSymbol];
    } else if (autolose) {
      // Force a loss with three different random symbols
      const availableIndices = [...Array(this.symbols.length).keys()];
      symbols = [];
      for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        symbols.push(availableIndices[randomIndex]);
        availableIndices.splice(randomIndex, 1);
      }
    } else {
      // Random spin
      symbols = Array.from({ length: 3 }, () => 
        Math.floor(Math.random() * this.symbols.length)
      );
    }

    const symbolValues = symbols.map(index => SYMBOL_VALUES[this.symbols[index]]);
    const isWin = this.checkWin(symbols);
    const winAmount = isWin ? this.calculateWinAmount(symbolValues, amount) : 0;

    return {
      symbols,
      betAmount: amount,
      winAmount,
      isWin
    };
  }

  public runThousandSpins(amount: number): {
    totalSpins: number;
    totalWinAmount: number;
    totalBetAmount: number;
    expectation: number;
    winRate: number;
    returnToPlayer: number;
  } {
    let totalWinAmount = 0;
    let totalWins = 0;
    const totalSpins = 1000;

    for (let i = 0; i < totalSpins; i++) {
      const result = this.placeBet({ amount });
      totalWinAmount += result.winAmount;
      if (result.isWin) {
        totalWins++;
      }
    }

    const totalBetAmount = amount * totalSpins;
    const expectation = (totalWinAmount - totalBetAmount) / totalSpins;
    const winRate = (totalWins / totalSpins) * 100;
    const returnToPlayer = totalWinAmount / totalBetAmount * 100;

    return {
      totalSpins,
      totalWinAmount,
      totalBetAmount,
      expectation,
      winRate,
      returnToPlayer
    };
  }

  private checkWin(symbols: number[]): boolean {
    return symbols.every(symbol => symbol === symbols[0]);
  }

  private calculateWinAmount(symbolValues: number[], betAmount: number): number {
    const multiplier = symbolValues[0]; // Use full symbol value as multiplier
    return Math.floor(betAmount * multiplier);
  }
} 
