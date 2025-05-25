import { Router, Request, Response } from "express";
import { BetService, InvalidWeightsError } from "./betService";
import { BetRequest } from "../types";

const ALLOWED_BETS = [1, 5, 10, 25, 50, 100];

const router = Router();
const betService = BetService.getInstance();

router.post("/place", (req: Request, res: Response) => {
  try {
    const { amount, autowin, autolose, outcomeWeights, symbolWeights } = req.body;

    if (!ALLOWED_BETS.includes(amount)) {
      return res.status(400).json({ error: "Invalid bet amount" });
    }

    const result = betService.placeBet({
      amount,
      autowin,
      autolose,
      outcomeWeights,
      symbolWeights,
    });
    res.json(result);
  } catch (error: unknown) {
    console.error("Error placing bet:", error);
    if (error instanceof InvalidWeightsError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

router.post("/many-spins", (req: Request, res: Response) => {
  try {
    const { amount, autowin, autolose, outcomeWeights, symbolWeights, spins = 1000 } = req.body;

    if (!ALLOWED_BETS.includes(amount)) {
      return res.status(400).json({ error: "Invalid bet amount" });
    }

    if (typeof spins !== "number" || spins < 1 || spins > 10000000) {
      return res
        .status(400)
        .json({ error: "Invalid number of spins. Must be between 1 and 10000000" });
    }

    const results = betService.runManySpins(
      amount,
      { autowin, autolose, outcomeWeights, symbolWeights },
      spins
    );
    res.json(results);
  } catch (error: unknown) {
    console.error("Error running many spins:", error);
    if (error instanceof InvalidWeightsError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default router;
