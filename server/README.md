# DefyShield - Smart Contract Security Audit Tool

DefyShield is a security audit tool for Solidity smart contracts on Lisk's EVM-compatible L2 Testnet. It provides static and dynamic analysis to detect vulnerabilities like reentrancy, access control flaws, gas inefficiencies, and logic errors.

## Features

- Static code analysis using Solidity AST parsing
- Dynamic analysis through Hardhat simulation
- Trust score calculation for contract security
- API endpoints for manual and automated audits
- Gelato automation integration

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
    ```bash
    npm install
    ```
3. Configure environment:
    ```bash
    cp .env.example .env
    # Edit .env with your settings
    ```

### Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## Configuration

DefyShield can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| LISK_RPC_URL | Lisk L2 Testnet RPC URL | http://localhost:8545 |
| API_KEY_ENABLED | Enable API key authentication | false |

## API Endpoints

### Audit Contract

```
POST /api/audit
```

Request body:
```json
{
  "source": "contract source code or file path",
  "address": "optional deployed contract address"
}
```

Response:
```json
{
  "trustScore": 85,
  "vulnerabilities": [
     {
        "type": "reentrancy",
        "severity": "high",
        "location": "line 42"
     }
  ]
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.