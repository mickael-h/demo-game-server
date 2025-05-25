# Demo Game Server

A slot machine game server that provides betting functionality with configurable symbol weights and outcome probabilities.

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Place a Bet
```http
POST /bet/place
```

Places a single bet and returns the result.

**Request Body:**
```json
{
  "amount": number,           // Required: Bet amount (must be one of: 1, 5, 10, 25, 50, 100)
  "autowin": boolean,        // Optional: Force a win (three of a kind)
  "autolose": boolean,       // Optional: Force a loss (no win)
  "outcomeWeights": {        // Optional: Customize win type probabilities
    "threeOfAKind": number,  // Weight for three of a kind (must be positive, typically 0-1)
    "twoOfAKind": number,    // Weight for two of a kind (must be positive, typically 0-1)
    "noWin": number         // Weight for no win (must be positive, typically 0-1)
  },
  "symbolWeights": {         // Optional: Customize symbol probabilities
    "0": number,            // Weight for 🍒 (must be positive, typically 0-1)
    "1": number,            // Weight for 🍊 (must be positive, typically 0-1)
    "2": number,            // Weight for 🍋 (must be positive, typically 0-1)
    "3": number,            // Weight for 🍇 (must be positive, typically 0-1)
    "4": number,            // Weight for 7️⃣ (must be positive, typically 0-1)
    "5": number             // Weight for 💎 (must be positive, typically 0-1)
  }
}
```

**Response:**
```json
{
  "symbols": number[],      // Array of 3 symbol indices
  "betAmount": number,      // Amount bet
  "winAmount": number,      // Amount won (0 if no win)
  "isWin": boolean,         // Whether the bet was a win
  "winType": string         // "THREE_OF_A_KIND", "TWO_OF_A_KIND", or "NO_WIN"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid bet amount or weights
- `500 Internal Server Error`: Server error

#### Run Many Spins
```http
POST /bet/many-spins
```

Runs multiple spins and returns statistics.

**Request Body:**
```json
{
  "amount": number,           // Required: Bet amount (must be one of: 1, 5, 10, 25, 50, 100)
  "spins": number,           // Optional: Number of spins (default: 1000, max: 10000000)
  "autowin": boolean,        // Optional: Force all wins
  "autolose": boolean,       // Optional: Force all losses
  "outcomeWeights": {        // Optional: Customize win type probabilities
    "threeOfAKind": number,  // Weight for three of a kind (must be positive, typically 0-1)
    "twoOfAKind": number,    // Weight for two of a kind (must be positive, typically 0-1)
    "noWin": number         // Weight for no win (must be positive, typically 0-1)
  },
  "symbolWeights": {         // Optional: Customize symbol probabilities
    "0": number,            // Weight for 🍒 (must be positive, typically 0-1)
    "1": number,            // Weight for 🍊 (must be positive, typically 0-1)
    "2": number,            // Weight for 🍋 (must be positive, typically 0-1)
    "3": number,            // Weight for 🍇 (must be positive, typically 0-1)
    "4": number,            // Weight for 7️⃣ (must be positive, typically 0-1)
    "5": number             // Weight for 💎 (must be positive, typically 0-1)
  }
}
```

**Response:**
```json
{
  "totalSpins": number,     // Total number of spins
  "totalWinAmount": number, // Total amount won
  "totalBetAmount": number, // Total amount bet
  "expectation": number,    // Expected value per spin
  "winRate": number,        // Win rate as a percentage
  "returnToPlayer": number  // Return to player as a percentage
}
```

**Error Responses:**
- `400 Bad Request`: Invalid bet amount, number of spins, or weights
- `500 Internal Server Error`: Server error

### Symbol Values
The slot machine uses the following symbols with their respective values:
- 🍒 (Cherry): 2x
- 🍊 (Orange): 3x
- 🍋 (Lemon): 4x
- 🍇 (Grapes): 5x
- 7️⃣ (Seven): 10x
- 💎 (Diamond): 20x

### Win Types and Payouts
- **Three of a Kind**: All three symbols match
  - Payout: bet amount × symbol value
- **Two of a Kind**: Two symbols match
  - Payout: bet amount × symbol value × 0.2
- **No Win**: All symbols are different
  - Payout: 0

### Weight System
The game uses a weight system to control probabilities:

1. **Outcome Weights**: Control the probability of different win types
   - Each weight must be a positive number
   - Weights are typically kept between 0 and 1
   - Higher weights increase the probability of that outcome
   - Weights are relative to each other

2. **Symbol Weights**: Control the probability of each symbol appearing
   - Each weight must be a positive number
   - Weights are typically kept between 0 and 1
   - Higher weights increase the probability of that symbol
   - Weights are relative to each other

### Example Requests

#### Place a Bet with Custom Weights
```json
{
  "amount": 10,
  "outcomeWeights": {
    "threeOfAKind": 0.1,
    "twoOfAKind": 0.3,
    "noWin": 0.6
  },
  "symbolWeights": {
    "0": 0.2,  // 🍒
    "1": 0.2,  // 🍊
    "2": 0.2,  // 🍋
    "3": 0.2,  // 🍇
    "4": 0.1,  // 7️⃣
    "5": 0.1   // 💎
  }
}
```

#### Run Many Spins with Default Settings
```json
{
  "amount": 5,
  "spins": 1000
}
```

## Development

### Prerequisites
- Node.js 18.x
- npm

### Installation
```bash
npm install
```

### Running Tests
```bash
npm test
```

### Development Mode
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Production
```bash
npm start
``` 
