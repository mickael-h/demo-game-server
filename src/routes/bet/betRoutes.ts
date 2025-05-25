import { Router, Request, Response } from 'express';
import { BetService } from './betService';
import { BetRequest } from '../types';

const ALLOWED_BETS = [1, 5, 10, 25, 50, 100];

const router = Router();
const betService = BetService.getInstance();

router.post('/place', (req: Request<{}, {}, BetRequest>, res: Response) => {
  try {
    const { amount, autowin, autolose, outcomeWeights } = req.body;

    if (!ALLOWED_BETS.includes(amount)) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }

    const result = betService.placeBet({ amount, autowin, autolose, outcomeWeights });
    res.json(result);
  } catch (error) {
    console.error('Error placing bet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/many-spins', (req: Request<{}, {}, BetRequest & { spins?: number }>, res: Response) => {
  try {
    const { amount, autowin, autolose, outcomeWeights, spins = 1000 } = req.body;

    if (!ALLOWED_BETS.includes(amount)) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }

    if (spins < 1 || spins > 10000000) {
      return res.status(400).json({ error: 'Invalid number of spins. Must be between 1 and 10000000' });
    }

    const results = betService.runManySpins(amount, { autowin, autolose, outcomeWeights }, spins);
    res.json(results);
  } catch (error) {
    console.error('Error running many spins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 
