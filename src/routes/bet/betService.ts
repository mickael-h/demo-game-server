import { 
  SLOT_SYMBOLS, 
  SYMBOL_VALUES, 
  BetRequest, 
  BetResponse, 
  WinType,
  OutcomeWeights,
  SpinStats,
  SymbolWeights
} from '../types';

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

  private calculateWinAmount(multiplier: number, betAmount: number, winType: WinType): number {
    if (winType === WinType.NO_WIN) {
      return 0;
    }
    // Two of a kind pays 20% of the three of a kind value
    const winMultiplier = winType === WinType.THREE_OF_A_KIND ? multiplier : multiplier * 0.2; 
    return Math.floor(betAmount * winMultiplier);
  }

  private determineWinType(outcomeWeights?: OutcomeWeights): WinType {
    const wTrip = 1 * (outcomeWeights?.threeOfAKind ?? 1);
    const wPair = 3 * (this.symbols.length - 1) * (outcomeWeights?.twoOfAKind ?? 1);
    const wBust = (this.symbols.length - 1) * (this.symbols.length - 2) * (outcomeWeights?.noWin ?? 1);
    const totalWeights = wBust + wPair + wTrip;
    const winRoll = Math.floor(Math.random() * totalWeights);

    if (winRoll < wTrip) {
      return WinType.THREE_OF_A_KIND;
    } else if (winRoll < wTrip + wPair) {
      return WinType.TWO_OF_A_KIND;
    }
    return WinType.NO_WIN;
  }

  private selectWinningSymbol(symbolWeights?: SymbolWeights): number {
    // Create weights array, using provided weights or defaulting to 1
    const symbolWeightsArray = this.symbols.map((_, idx) => 
      symbolWeights?.[idx] ?? 1
    );
    
    const totalSymbolWeight = symbolWeightsArray.reduce((a, b) => a + b, 0);
    const symbolRoll = Math.floor(Math.random() * totalSymbolWeight);
    
    let weightSum = 0;
    for (let i = 0; i < this.symbols.length; i++) {
      weightSum += symbolWeightsArray[i];
      if (symbolRoll < weightSum) {
        return i;
      }
    }
    return 0;
  }

  private generateNoWinSymbols(symbolWeights?: SymbolWeights): { symbols: number[], winningSymbol: number } {
    const availableIndices = [...Array(this.symbols.length).keys()];
    const resultSymbols: number[] = [];
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      resultSymbols.push(availableIndices[randomIndex]);
      availableIndices.splice(randomIndex, 1);
    }
    return { symbols: resultSymbols, winningSymbol: 0 };
  }

  private generateTwoOfAKindSymbols(winningSymbol: number, symbolWeights?: SymbolWeights): { symbols: number[], winningSymbol: number } {
    const availableIndices = [...Array(this.symbols.length).keys()].filter(i => i !== winningSymbol);
    const randomIndex = Math.floor(Math.random() * availableIndices.length);
    const differentSymbol = availableIndices[randomIndex];
    
    const resultSymbols = [winningSymbol, winningSymbol, winningSymbol];
    const differentPosition = Math.floor(Math.random() * 3);
    resultSymbols[differentPosition] = differentSymbol;
    return { symbols: resultSymbols, winningSymbol };
  }

  private generateThreeOfAKindSymbols(winningSymbol: number): { symbols: number[], winningSymbol: number } {
    return { 
      symbols: [winningSymbol, winningSymbol, winningSymbol],
      winningSymbol 
    };
  }

  private generateSymbols(winType: WinType, symbolWeights?: SymbolWeights): { symbols: number[], winningSymbol: number } {
    if (winType === WinType.NO_WIN) {
      return this.generateNoWinSymbols(symbolWeights);
    }

    const winningSymbol = this.selectWinningSymbol(symbolWeights);

    if (winType === WinType.THREE_OF_A_KIND) {
      return this.generateThreeOfAKindSymbols(winningSymbol);
    }

    // TWO_OF_A_KIND case
    return this.generateTwoOfAKindSymbols(winningSymbol, symbolWeights);
  }

  public placeBet(request: BetRequest): BetResponse {
    const { amount: betAmount, autowin, autolose, outcomeWeights, symbolWeights } = request;
    let resultSymbols: number[];
    let winType: WinType;
    let winSymbol: number = 0;

    if (autowin) {
      // Force a win with three random identical symbols
      winSymbol = this.selectWinningSymbol(symbolWeights);
      resultSymbols = [winSymbol, winSymbol, winSymbol];
      winType = WinType.THREE_OF_A_KIND;
    } else if (autolose) {
      // Force a loss with three different random symbols
      const availableIndices = [...Array(this.symbols.length).keys()];
      resultSymbols = [];
      for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        resultSymbols.push(availableIndices[randomIndex]);
        availableIndices.splice(randomIndex, 1);
      }
      winType = WinType.NO_WIN;
    } else {
      winType = this.determineWinType(outcomeWeights);
      const { symbols, winningSymbol: generatedWinSymbol } = this.generateSymbols(winType, symbolWeights);
      resultSymbols = symbols;
      winSymbol = generatedWinSymbol;
    }

    const isWin = winType !== WinType.NO_WIN;
    const winAmount = this.calculateWinAmount(SYMBOL_VALUES[this.symbols[winSymbol]], betAmount, winType);

    return {
      symbols: resultSymbols,
      betAmount,
      winAmount,
      isWin,
      winType
    };
  }

  public runManySpins(
    amount: number, 
    options: Omit<BetRequest, 'amount'> = {}, 
    spins: number = 1000
  ): SpinStats {
    let totalWinAmount = 0;
    let totalWins = 0;
    const totalSpins = spins;

    for (let i = 0; i < totalSpins; i++) {
      const result = this.placeBet({ amount, ...options });
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
} 
