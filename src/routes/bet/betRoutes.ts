import { Router, Request, Response } from 'express';
import { BetService } from './betService';
import { BetRequest } from '../types';

const router = Router();
const betService = BetService.getInstance();

router.post('/place', (req: Request<{}, {}, BetRequest>, res: Response) => {
  try {
    const { amount, autowin, autolose } = req.body;

    if (![1, 5, 20].includes(amount)) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }

    const result = betService.placeBet({ amount, autowin, autolose });
    res.json(result);
  } catch (error) {
    console.error('Error placing bet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/thousand-spins', (req: Request<{}, {}, BetRequest>, res: Response) => {
  try {
    const { amount, autowin, autolose } = req.body;

    if (![1, 5, 20].includes(amount)) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }

    const results = betService.runThousandSpins(amount, { autowin, autolose });
    res.json(results);
  } catch (error) {
    console.error('Error running thousand spins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 
