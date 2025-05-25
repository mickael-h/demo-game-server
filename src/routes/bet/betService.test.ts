import { BetService } from './betService';
import { SLOT_SYMBOLS, SYMBOL_VALUES, WinType } from '../types';

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
      expect(result).toHaveProperty('winType');
      
      expect(result.symbols).toHaveLength(3);
      result.symbols.forEach(symbol => {
        expect(symbol).toBeGreaterThanOrEqual(0);
        expect(symbol).toBeLessThan(SLOT_SYMBOLS.length);
      });
    });

    it('should force a win when autowin is true', () => {
      const result = betService.placeBet({ amount: 10, autowin: true });
      
      expect(result.isWin).toBe(true);
      expect(result.winType).toBe(WinType.THREE_OF_A_KIND);
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
      expect(result.winType).toBe(WinType.NO_WIN);
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
      // Mock Math.random to get a specific symbol
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.1); // This will give us the first symbol (🍒)

      const result = betService.placeBet({ amount: 10, autowin: true });
      
      expect(result.isWin).toBe(true);
      expect(result.winType).toBe(WinType.THREE_OF_A_KIND);
      const symbol = SLOT_SYMBOLS[result.symbols[0]];
      const expectedMultiplier = SYMBOL_VALUES[symbol];
      const expectedWinAmount = Math.floor(10 * expectedMultiplier);
      
      expect(result.winAmount).toBe(expectedWinAmount);

      // Restore original Math.random
      Math.random = originalRandom;
    });

    it('should handle two of a kind wins', () => {
      // Mock the random number generation to get two of a kind
      const originalRandom = Math.random;
      Math.random = jest.fn()
        .mockReturnValueOnce(0.1) // First symbol
        .mockReturnValueOnce(0.1) // Second symbol (same as first)
        .mockReturnValueOnce(0.5); // Third symbol (different)

      const result = betService.placeBet({ amount: 10 });
      
      expect(result.isWin).toBe(true);
      expect(result.winType).toBe(WinType.TWO_OF_A_KIND);
      expect(result.symbols[0]).toBe(result.symbols[1]);
      expect(result.symbols[0]).not.toBe(result.symbols[2]);
      
      const symbol = SLOT_SYMBOLS[result.symbols[0]];
      const expectedMultiplier = SYMBOL_VALUES[symbol] * 0.2; // Two of a kind pays 20% of three of a kind
      const expectedWinAmount = Math.floor(10 * expectedMultiplier);
      
      expect(result.winAmount).toBe(expectedWinAmount);

      // Restore original Math.random
      Math.random = originalRandom;
    });

    it('should verify win type is always present in response', () => {
      const result = betService.placeBet({ amount: 10 });
      expect(result).toHaveProperty('winType');
      expect(Object.values(WinType)).toContain(result.winType);
    });

    it('should verify win type matches isWin property', () => {
      const result = betService.placeBet({ amount: 10 });
      if (result.isWin) {
        expect([WinType.THREE_OF_A_KIND, WinType.TWO_OF_A_KIND]).toContain(result.winType);
      } else {
        expect(result.winType).toBe(WinType.NO_WIN);
      }
    });

    it('should verify win amount is zero for no win', () => {
      const result = betService.placeBet({ amount: 10, autolose: true });
      expect(result.winType).toBe(WinType.NO_WIN);
      expect(result.winAmount).toBe(0);
    });
  });

  describe('runManySpins', () => {
    it('should return correct statistics for default 1000 spins', () => {
      const amount = 5;
      const results = betService.runManySpins(amount);

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

    it('should handle custom number of spins', () => {
      const amount = 5;
      const spins = 500;
      const results = betService.runManySpins(amount, {}, spins);

      expect(results.totalSpins).toBe(spins);
      expect(results.totalBetAmount).toBe(amount * spins);
    });

    it('should handle different bet amounts correctly', () => {
      const amounts = [1, 5, 20];
      const spins = 100;
      
      for (const amount of amounts) {
        const results = betService.runManySpins(amount, {}, spins);
        expect(results.totalBetAmount).toBe(amount * spins);
      }
    });

    it('should force all wins when autowin is true', () => {
      const amount = 5;
      const spins = 100;
      const results = betService.runManySpins(amount, { autowin: true }, spins);

      expect(results.winRate).toBe(100);
      expect(results.totalWinAmount).toBeGreaterThan(0);
      expect(results.returnToPlayer).toBeGreaterThan(100);
      expect(results.totalSpins).toBe(spins);
    });

    it('should force all losses when autolose is true', () => {
      const amount = 5;
      const spins = 100;
      const results = betService.runManySpins(amount, { autolose: true }, spins);

      expect(results.winRate).toBe(0);
      expect(results.totalWinAmount).toBe(0);
      expect(results.returnToPlayer).toBe(0);
      expect(results.expectation).toBe(-amount); // Expect to lose the bet amount each time
      expect(results.totalSpins).toBe(spins);
    });
  });
}); 
