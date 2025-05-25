import request from 'supertest';
import express from 'express';
import betRoutes from './betRoutes';
import { BetService } from './betService';
import { WinType } from '../types';

// Mock the BetService
jest.mock('./betService', () => {
  const mockPlaceBet = jest.fn();
  const mockRunManySpins = jest.fn();
  return {
    BetService: {
      getInstance: jest.fn().mockReturnValue({
        placeBet: mockPlaceBet,
        runManySpins: mockRunManySpins
      })
    }
  };
});

describe('Bet Routes', () => {
  let app: express.Application;
  let mockPlaceBet: jest.Mock;
  let mockRunManySpins: jest.Mock;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/bet', betRoutes);
    
    // Get the mock functions
    mockPlaceBet = (BetService.getInstance() as any).placeBet;
    mockRunManySpins = (BetService.getInstance() as any).runManySpins;
    mockPlaceBet.mockClear();
    mockRunManySpins.mockClear();
  });

  describe('POST /api/bet/place', () => {
    it('should return 400 for invalid bet amount', async () => {
      const response = await request(app)
        .post('/api/bet/place')
        .send({ amount: 0 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid bet amount');
      expect(mockPlaceBet).not.toHaveBeenCalled();
    });

    it('should return 400 for negative bet amount', async () => {
      const response = await request(app)
        .post('/api/bet/place')
        .send({ amount: -10 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid bet amount');
      expect(mockPlaceBet).not.toHaveBeenCalled();
    });

    it('should return 400 for missing bet amount', async () => {
      const response = await request(app)
        .post('/api/bet/place')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid bet amount');
      expect(mockPlaceBet).not.toHaveBeenCalled();
    });

    it('should successfully place a bet', async () => {
      const mockBetResponse = {
        symbols: [0, 0, 0],
        betAmount: 5,
        winAmount: 10,
        isWin: true,
        winType: WinType.THREE_OF_A_KIND
      };

      mockPlaceBet.mockReturnValue(mockBetResponse);

      const response = await request(app)
        .post('/api/bet/place')
        .send({ amount: 5 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBetResponse);
      expect(mockPlaceBet).toHaveBeenCalledWith({ amount: 5 });
    });

    it('should handle two of a kind win', async () => {
      const mockBetResponse = {
        symbols: [0, 0, 1],
        betAmount: 5,
        winAmount: 2,
        isWin: true,
        winType: WinType.TWO_OF_A_KIND
      };

      mockPlaceBet.mockReturnValue(mockBetResponse);

      const response = await request(app)
        .post('/api/bet/place')
        .send({ amount: 5 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBetResponse);
      expect(mockPlaceBet).toHaveBeenCalledWith({ amount: 5 });
    });

    it('should handle server errors gracefully', async () => {
      mockPlaceBet.mockImplementation(() => {
        throw new Error('Test error');
      });

      const response = await request(app)
        .post('/api/bet/place')
        .send({ amount: 5 });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(mockPlaceBet).toHaveBeenCalledWith({ amount: 5 });
    });
  });

  describe('POST /api/bet/many-spins', () => {
    it('should return 400 for invalid bet amount', async () => {
      const response = await request(app)
        .post('/api/bet/many-spins')
        .send({ amount: 0 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid bet amount');
      expect(mockRunManySpins).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid number of spins', async () => {
      const response = await request(app)
        .post('/api/bet/many-spins')
        .send({ amount: 5, spins: 0 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid number of spins. Must be between 1 and 10000000');
      expect(mockRunManySpins).not.toHaveBeenCalled();
    });

    it('should return 400 for too many spins', async () => {
      const response = await request(app)
        .post('/api/bet/many-spins')
        .send({ amount: 5, spins: 10000001 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid number of spins. Must be between 1 and 10000000');
      expect(mockRunManySpins).not.toHaveBeenCalled();
    });

    it('should accept maximum allowed spins', async () => {
      const mockResults = {
        totalSpins: 100000,
        totalWinAmount: 500000,
        totalBetAmount: 500000,
        expectation: 0,
        winRate: 10,
        returnToPlayer: 100
      };

      mockRunManySpins.mockReturnValue(mockResults);

      const response = await request(app)
        .post('/api/bet/many-spins')
        .send({ amount: 5, spins: 100000 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
      expect(mockRunManySpins).toHaveBeenCalledWith(5, {}, 100000);
    });

    it('should successfully run spins with default count', async () => {
      const mockResults = {
        totalSpins: 1000,
        totalWinAmount: 5000,
        totalBetAmount: 5000,
        expectation: 0,
        winRate: 10,
        returnToPlayer: 100
      };

      mockRunManySpins.mockReturnValue(mockResults);

      const response = await request(app)
        .post('/api/bet/many-spins')
        .send({ amount: 5 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
      expect(mockRunManySpins).toHaveBeenCalledWith(5, {}, 1000);
    });

    it('should successfully run spins with custom count', async () => {
      const mockResults = {
        totalSpins: 500,
        totalWinAmount: 2500,
        totalBetAmount: 2500,
        expectation: 0,
        winRate: 10,
        returnToPlayer: 100
      };

      mockRunManySpins.mockReturnValue(mockResults);

      const response = await request(app)
        .post('/api/bet/many-spins')
        .send({ amount: 5, spins: 500 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
      expect(mockRunManySpins).toHaveBeenCalledWith(5, {}, 500);
    });

    it('should handle autowin option', async () => {
      const mockResults = {
        totalSpins: 100,
        totalWinAmount: 1000,
        totalBetAmount: 500,
        expectation: 5,
        winRate: 100,
        returnToPlayer: 200
      };

      mockRunManySpins.mockReturnValue(mockResults);

      const response = await request(app)
        .post('/api/bet/many-spins')
        .send({ amount: 5, autowin: true, spins: 100 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
      expect(mockRunManySpins).toHaveBeenCalledWith(5, { autowin: true }, 100);
    });

    it('should handle autolose option', async () => {
      const mockResults = {
        totalSpins: 100,
        totalWinAmount: 0,
        totalBetAmount: 500,
        expectation: -5,
        winRate: 0,
        returnToPlayer: 0
      };

      mockRunManySpins.mockReturnValue(mockResults);

      const response = await request(app)
        .post('/api/bet/many-spins')
        .send({ amount: 5, autolose: true, spins: 100 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
      expect(mockRunManySpins).toHaveBeenCalledWith(5, { autolose: true }, 100);
    });

    it('should handle server errors gracefully', async () => {
      mockRunManySpins.mockImplementation(() => {
        throw new Error('Test error');
      });

      const response = await request(app)
        .post('/api/bet/many-spins')
        .send({ amount: 5 });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(mockRunManySpins).toHaveBeenCalledWith(5, {}, 1000);
    });
  });
}); 
