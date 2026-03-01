# bnb-arb-monitor

Minimal Node.js backend that compares CoinGecko reference prices with OpenOcean swap quotes on BNB Chain.

## Requirements

- Node.js 18+ (recommended)
- npm

## Install

```bash
npm install
```

## Run

```bash
npm start
```

Server default URL: `http://localhost:4000`
Frontend dashboard: `http://localhost:4000/`

## Endpoint

- `GET /prices`: returns token symbol, address, CoinGecko price, OpenOcean quote price, spread, net spread, and `isOpportunity`.

## Configuration

Create `.env` from `.env.example` in this project root, then adjust values if needed.

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

```env
PORT=4000
OPENOCEAN_CHAIN=bsc
QUOTE_TOKEN_ADDRESS=0x55d398326f99059fF775485246999027B3197955
QUOTE_AMOUNT=100
SLIPPAGE=1
GAS_PRICE=5
REQUEST_TIMEOUT_MS=5000
RETRY_COUNT=2
CEX_CACHE_TTL_MS=15000
TRADE_COST_PCT=0.25
MIN_PROFIT_PCT=0.1
```

`isOpportunity` is `true` when:

```text
spread > TRADE_COST_PCT + MIN_PROFIT_PCT
```

`netSpread` is:

```text
spread - TRADE_COST_PCT
```

## Tests

```bash
npm test
```

## Docker Publish (GitHub Actions)

Workflow file: `.github/workflows/docker-publish.yml`

It publishes image `philipid3s/bnb-arb-monitor` on:
- push to default branch (`latest` + `sha` tag)
- push tag starting with `v` (for example `v1.0.0`)
- manual trigger (`workflow_dispatch`)

Required repository secrets:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

## Project Structure

- `server.js`: API setup and `/prices` route
- `getCexPrices.js`: CoinGecko fetch + in-memory cache
- `getOpenOceanPrice.js`: OpenOcean quote fetch + unit-safe pricing math
- `tokens.js`: token watchlist
- `config.js`: environment-driven runtime config
- `http.js`: shared timeout/retry HTTP helper
- `units.js`: bigint decimal conversion helpers
- `tests/`: unit and route tests
