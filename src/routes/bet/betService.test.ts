import { BetService } from './betService';
import { SLOT_SYMBOLS, SYMBOL_VALUES, WinType } from '../types';

describe('BetService', () => {
  let betService: BetService;
  let originalRandom: () => number;

  beforeEach(() => {
    // Reset the singleton instance before each test
    (BetService as any).instance = undefined;
    betService = BetService.getInstance();
    // Store original Math.random
    originalRandom = Math.random;
  });

  afterEach(() => {
    // Restore original Math.random after each test
    Math.random = originalRandom;
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
      // Override Math.random to get a specific symbol
      Math.random = () => 0.1; // This will give us the first symbol (🍒)

      const result = betService.placeBet({ amount: 10, autowin: true });
      
      expect(result.isWin).toBe(true);
      expect(result.winType).toBe(WinType.THREE_OF_A_KIND);
      const symbol = SLOT_SYMBOLS[result.symbols[0]];
      const expectedMultiplier = SYMBOL_VALUES[symbol];
      const expectedWinAmount = Math.floor(10 * expectedMultiplier);
      
      expect(result.winAmount).toBe(expectedWinAmount);
    });

    it('should handle two of a kind wins', () => {
      // Override Math.random to control the two of a kind outcome deterministically
      let call = 0;
      Math.random = () => {
        call++;
        if (call === 1) return 0.2; // select TWO_OF_A_KIND (should be in the two of a kind range)
        if (call === 2) return 0.0; // select winning symbol (index 0)
        if (call === 3) return 1.0; // select different symbol (last index)
        if (call === 4) return 0.0; // differentPosition = 0 (first position is different)
        return 0.0;
      };

      const result = betService.placeBet({ amount: 10 });

      expect(result.isWin).toBe(true);
      expect(result.winType).toBe(WinType.TWO_OF_A_KIND);

      // Find which symbol is the odd one out
      const [a, b, c] = result.symbols;
      expect(
        (a === b && a !== c) ||
        (a === c && a !== b) ||
        (b === c && b !== a)
      ).toBe(true);

      // The winning symbol is the one that appears twice
      const counts = [a, b, c].reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      const winningSymbol = Number(Object.keys(counts).find(k => counts[Number(k)] === 2));

      const symbol = SLOT_SYMBOLS[winningSymbol];
      const expectedMultiplier = SYMBOL_VALUES[symbol] * 0.2;
      const expectedWinAmount = Math.floor(10 * expectedMultiplier);

      expect(result.winAmount).toBe(expectedWinAmount);
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

    it('should respect custom symbol weights', () => {
      // Override Math.random to control both win type and symbol selection
      let call = 0;
      Math.random = () => {
        call++;
        if (call === 1) return 0.2; // select TWO_OF_A_KIND
        if (call === 2) return 0.0; // select first symbol (due to weights)
        if (call === 3) return 0.5; // select different symbol (middle index)
        if (call === 4) return 0.0; // differentPosition = 0
        return 0.0;
      };

      // Set weight of first symbol (🍒) to 10 and others to 1, using indexes
      const symbolWeights = {
        0: 10, // 🍒
        1: 1,  // 🍊
        2: 1,  // 🍋
        3: 1,  // 🍇
        4: 1,  // 7️⃣
        5: 1   // 💎
      };

      const result = betService.placeBet({ amount: 10, symbolWeights });
      
      expect(result.isWin).toBe(true);
      expect(result.winType).toBe(WinType.TWO_OF_A_KIND);
      
      // Find which symbol appears twice
      const [a, b, c] = result.symbols;
      const winningSymbol = a === b ? a : b === c ? b : a;
      expect(winningSymbol).toBe(0); // First symbol (🍒) should be selected
    });

    it('should handle missing symbol weights gracefully', () => {
      // Override Math.random to always select the first symbol
      let call = 0;
      Math.random = () => {
        call++;
        if (call === 1) return 0.2; // select TWO_OF_A_KIND
        if (call === 2) return 0.0; // select first symbol
        if (call === 3) return 1.0; // select different symbol
        if (call === 4) return 0.0; // differentPosition = 0
        return 0.0;
      };

      // Only specify weight for one symbol (index 0)
      const symbolWeights = {
        0: 10
      };

      const result = betService.placeBet({ amount: 10, symbolWeights });
      
      expect(result.isWin).toBe(true);
      expect(result.winType).toBe(WinType.TWO_OF_A_KIND);
      // Should still work, with unspecified symbols defaulting to weight 1
    });

    it('should handle zero weights correctly', () => {
      // Override Math.random to always select the second symbol
      let call = 0;
      Math.random = () => {
        call++;
        if (call === 1) return 0.2; // select TWO_OF_A_KIND
        if (call === 2) return 0.5; // select second symbol (due to weights)
        if (call === 3) return 1.0; // select different symbol
        if (call === 4) return 0.0; // differentPosition = 0
        return 0.0;
      };

      // Set weight of first symbol to 0 and others to 1, using indexes
      const symbolWeights = {
        0: 0, // 🍒
        1: 1, // 🍊
        2: 1, // 🍋
        3: 1, // 🍇
        4: 1, // 7️⃣
        5: 1  // 💎
      };

      const result = betService.placeBet({ amount: 10, symbolWeights });
      
      expect(result.isWin).toBe(true);
      expect(result.winType).toBe(WinType.TWO_OF_A_KIND);
      expect(result.symbols[0]).not.toBe(0); // First symbol (🍒) should never be selected
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

    it('should respect symbol weights in many spins', () => {
      // Override Math.random to always select the first symbol
      let call = 0;
      Math.random = () => {
        call++;
        if (call === 1) return 0.2; // select TWO_OF_A_KIND
        if (call === 2) return 0.0; // select first symbol (due to weights)
        if (call === 3) return 1.0; // select different symbol
        if (call === 4) return 0.0; // differentPosition = 0
        return 0.0;
      };

      const symbolWeights = {
        0: 10, // 🍒
        1: 1,  // 🍊
        2: 1,  // 🍋
        3: 1,  // 🍇
        4: 1,  // 7️⃣
        5: 1   // 💎
      };

      const results = betService.runManySpins(10, { symbolWeights }, 100);
      
      expect(results.totalSpins).toBe(100);
      expect(results.winRate).toBeGreaterThan(0);
      expect(results.returnToPlayer).toBeGreaterThan(0);
    });
  });
}); 
