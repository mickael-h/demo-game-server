import { Router, Request, Response } from "express";
import betRoutes from "./bet/betRoutes";

const router = Router();

// Root route with API documentation
router.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Demo Game Server",
    version: "1.0.0",
    description:
      "A slot machine game server with configurable symbol weights and outcome probabilities",
    endpoints: {
      "/bet/place": {
        method: "POST",
        description: "Place a single bet",
        body: {
          amount: "number (1, 5, 10, 25, 50, 100)",
          autowin: "boolean (optional)",
          autolose: "boolean (optional)",
          outcomeWeights: "object (optional)",
          symbolWeights: "object (optional)",
        },
      },
      "/bet/many-spins": {
        method: "POST",
        description: "Run multiple spins and get statistics",
        body: {
          amount: "number (1, 5, 10, 25, 50, 100)",
          spins: "number (optional, default: 1000, max: 10000000)",
          autowin: "boolean (optional)",
          autolose: "boolean (optional)",
          outcomeWeights: "object (optional)",
          symbolWeights: "object (optional)",
        },
      },
    },
    symbols: {
      "🍒": "Cherry (2x)",
      "🍊": "Orange (3x)",
      "🍋": "Lemon (4x)",
      "🍇": "Grapes (5x)",
      "7️⃣": "Seven (10x)",
      "💎": "Diamond (20x)",
    },
    winTypes: {
      THREE_OF_A_KIND: "All three symbols match (payout: bet × symbol value)",
      TWO_OF_A_KIND: "Two symbols match (payout: bet × symbol value × 0.2)",
      NO_WIN: "All symbols are different (payout: 0)",
    },
  });
});

router.use("/bet", betRoutes);

export default router;
