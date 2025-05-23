"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const SLOT_SYMBOLS = ["🍒", "🍊", "🍋", "🍇", "7️⃣", "💎"];
// Define win values for each symbol (multiplier of bet)
const SYMBOL_VALUES = {
    "🍒": 2, // Cherry - lowest value
    "🍊": 3, // Orange
    "🍋": 4, // Lemon
    "🍇": 5, // Grapes
    "7️⃣": 10, // Seven - high value
    "💎": 20, // Diamond - highest value
};
const router = express_1.default.Router();
/* GET home page. */
router.get('/', (_req, res) => {
    res.json({ message: 'Game Server API is running' });
});
/* POST bet endpoint */
router.post('/bet', (req, res) => {
    const { amount, autowin, autolose } = req.body;
    // Validate bet amount
    if (![1, 5, 20].includes(amount)) {
        return res.status(400).json({
            error: 'Invalid bet amount. Must be 1, 5, or 20.'
        });
    }
    let symbolIndices;
    if (autowin) {
        // All symbols the same (win)
        const winIndex = Math.floor(Math.random() * SLOT_SYMBOLS.length);
        symbolIndices = [winIndex, winIndex, winIndex];
    }
    else if (autolose) {
        // All symbols different (lose)
        // Pick 3 unique indices
        const indices = [0, 1, 2, 3, 4, 5];
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        symbolIndices = indices.slice(0, 3);
    }
    else {
        // Random
        symbolIndices = Array(3).fill(null).map(() => Math.floor(Math.random() * SLOT_SYMBOLS.length));
    }
    // Check if all symbols are the same
    const allSame = symbolIndices.every(index => index === symbolIndices[0]);
    // Calculate winnings
    let winAmount = 0;
    if (allSame) {
        const winSymbol = SLOT_SYMBOLS[symbolIndices[0]];
        const winMultiplier = SYMBOL_VALUES[winSymbol];
        winAmount = winMultiplier * amount;
    }
    res.json({
        symbols: symbolIndices,
        betAmount: amount,
        winAmount,
        isWin: allSame
    });
});
exports.default = router;
