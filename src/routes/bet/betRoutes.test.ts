import request from 'supertest';
import express from 'express';
import betRoutes from './betRoutes';
import { BetService } from './betService';

// Mock the BetService
jest.mock('./betService', () => {
  const mockPlaceBet = jest.fn();
  const mockRunThousandSpins = jest.fn();
  return {
    BetService: {
      getInstance: jest.fn().mockReturnValue({
        placeBet: mockPlaceBet,
        runThousandSpins: mockRunThousandSpins
      })
    }
  };
});

describe('Bet Routes', () => {
  let app: express.Application;
  let mockPlaceBet: jest.Mock;
  let mockRunThousandSpins: jest.Mock;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/bet', betRoutes);
    
    // Get the mock functions
    mockPlaceBet = (BetService.getInstance() as any).placeBet;
    mockRunThousandSpins = (BetService.getInstance() as any).runThousandSpins;
    mockPlaceBet.mockClear();
    mockRunThousandSpins.mockClear();
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
        isWin: true
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

  describe('POST /api/bet/thousand-spins', () => {
    it('should return 400 for invalid bet amount', async () => {
      const response = await request(app)
        .post('/api/bet/thousand-spins')
        .send({ amount: 0 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid bet amount');
      expect(mockRunThousandSpins).not.toHaveBeenCalled();
    });

    it('should successfully run thousand spins', async () => {
      const mockResults = {
        totalSpins: 1000,
        totalWinAmount: 5000,
        totalBetAmount: 5000,
        expectation: 0,
        winRate: 10,
        returnToPlayer: 100
      };

      mockRunThousandSpins.mockReturnValue(mockResults);

      const response = await request(app)
        .post('/api/bet/thousand-spins')
        .send({ amount: 5 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
      expect(mockRunThousandSpins).toHaveBeenCalledWith(5, {});
    });

    it('should handle autowin option', async () => {
      const mockResults = {
        totalSpins: 1000,
        totalWinAmount: 10000,
        totalBetAmount: 5000,
        expectation: 5,
        winRate: 100,
        returnToPlayer: 200
      };

      mockRunThousandSpins.mockReturnValue(mockResults);

      const response = await request(app)
        .post('/api/bet/thousand-spins')
        .send({ amount: 5, autowin: true });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
      expect(mockRunThousandSpins).toHaveBeenCalledWith(5, { autowin: true });
    });

    it('should handle autolose option', async () => {
      const mockResults = {
        totalSpins: 1000,
        totalWinAmount: 0,
        totalBetAmount: 5000,
        expectation: -5,
        winRate: 0,
        returnToPlayer: 0
      };

      mockRunThousandSpins.mockReturnValue(mockResults);

      const response = await request(app)
        .post('/api/bet/thousand-spins')
        .send({ amount: 5, autolose: true });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
      expect(mockRunThousandSpins).toHaveBeenCalledWith(5, { autolose: true });
    });

    it('should handle server errors gracefully', async () => {
      mockRunThousandSpins.mockImplementation(() => {
        throw new Error('Test error');
      });

      const response = await request(app)
        .post('/api/bet/thousand-spins')
        .send({ amount: 5 });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(mockRunThousandSpins).toHaveBeenCalledWith(5, {});
    });
  });
}); 
