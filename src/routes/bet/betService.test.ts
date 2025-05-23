import { BetService } from './betService';
import { SLOT_SYMBOLS, SYMBOL_VALUES } from '../types';

describe('BetService', () => {
  let betService: BetService;

  beforeEach(() => {
    // Reset the singleton instance before each test
    (BetService as any).instance = undefined;
    betService = BetService.getInstance();
  });

  describe('placeBet', () => {
    it('should return a valid bet response with random symbols', () => {
      const result = betService.placeBet({ amount: 10 });
      
      expect(result).toHaveProperty('symbols');
      expect(result).toHaveProperty('betAmount', 10);
      expect(result).toHaveProperty('winAmount');
      expect(result).toHaveProperty('isWin');
      
      expect(result.symbols).toHaveLength(3);
      result.symbols.forEach(symbol => {
        expect(symbol).toBeGreaterThanOrEqual(0);
        expect(symbol).toBeLessThan(SLOT_SYMBOLS.length);
      });
    });

    it('should force a win when autowin is true', () => {
      const result = betService.placeBet({ amount: 10, autowin: true });
      
      expect(result.isWin).toBe(true);
      expect(result.symbols[0]).toBe(result.symbols[1]);
      expect(result.symbols[1]).toBe(result.symbols[2]);
      expect(result.winAmount).toBeGreaterThan(0);

      // Verify the symbols are valid
      const symbol = SLOT_SYMBOLS[result.symbols[0]];
      expect(SYMBOL_VALUES[symbol]).toBeDefined();
    });

    it('should force a loss when autolose is true', () => {
      const result = betService.placeBet({ amount: 10, autolose: true });
      
      expect(result.isWin).toBe(false);
      expect(result.symbols[0]).not.toBe(result.symbols[1]);
      expect(result.symbols[1]).not.toBe(result.symbols[2]);
      expect(result.symbols[0]).not.toBe(result.symbols[2]);
      expect(result.winAmount).toBe(0);

      // Verify all symbols are valid
      result.symbols.forEach(symbol => {
        expect(SLOT_SYMBOLS[symbol]).toBeDefined();
      });
    });

    it('should calculate correct win amount based on symbol values', () => {
      const result = betService.placeBet({ amount: 10, autowin: true });
      
      expect(result.isWin).toBe(true);
      const symbol = SLOT_SYMBOLS[result.symbols[0]];
      const expectedMultiplier = SYMBOL_VALUES[symbol];
      const expectedWinAmount = Math.floor(10 * expectedMultiplier);
      
      expect(result.winAmount).toBe(expectedWinAmount);
    });

    it('should return zero win amount for losing combinations', () => {
      const result = betService.placeBet({ amount: 10, autolose: true });
      
      expect(result.isWin).toBe(false);
      expect(result.winAmount).toBe(0);
    });
  });

  describe('runThousandSpins', () => {
    it('should return correct statistics for 1000 spins', () => {
      const amount = 5;
      const results = betService.runThousandSpins(amount);

      expect(results).toHaveProperty('totalSpins', 1000);
      expect(results).toHaveProperty('totalBetAmount', amount * 1000);
      expect(results).toHaveProperty('totalWinAmount');
      expect(results).toHaveProperty('expectation');
      expect(results).toHaveProperty('winRate');
      expect(results).toHaveProperty('returnToPlayer');

      // Verify calculations
      expect(results.expectation).toBe((results.totalWinAmount - results.totalBetAmount) / 1000);
      expect(results.winRate).toBeGreaterThanOrEqual(0);
      expect(results.winRate).toBeLessThanOrEqual(100);
      expect(results.returnToPlayer).toBe(results.totalWinAmount / results.totalBetAmount * 100);
    });

    it('should handle different bet amounts correctly', () => {
      const amounts = [1, 5, 20];
      
      for (const amount of amounts) {
        const results = betService.runThousandSpins(amount);
        expect(results.totalBetAmount).toBe(amount * 1000);
      }
    });

    it('should force all wins when autowin is true', () => {
      const amount = 5;
      const results = betService.runThousandSpins(amount, { autowin: true });

      expect(results.winRate).toBe(100);
      expect(results.totalWinAmount).toBeGreaterThan(0);
      expect(results.returnToPlayer).toBeGreaterThan(100);
    });

    it('should force all losses when autolose is true', () => {
      const amount = 5;
      const results = betService.runThousandSpins(amount, { autolose: true });

      expect(results.winRate).toBe(0);
      expect(results.totalWinAmount).toBe(0);
      expect(results.returnToPlayer).toBe(0);
      expect(results.expectation).toBe(-amount); // Expect to lose the bet amount each time
    });
  });
}); 
