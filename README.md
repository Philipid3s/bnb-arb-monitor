# bnb-arb-monitor

Minimal Node.js service and dashboard that compares CoinGecko reference prices with KyberSwap aggregator quotes on BNB Chain, and flags tokens where the price gap exceeds configured trading costs.

It is a signal checker for potential arbitrage, not a trading bot: it never signs or sends transactions.

## How it works

1. Loads the token watchlist from `tokens.js` (CAKE, WBNB, ETH, ADA, DOGE, DOT, XRP). At startup, each token's `decimals` is checked against the contract's on-chain `decimals()`; mismatches are logged and the on-chain value is used.
2. Fetches USD reference prices from CoinGecko (`/simple/price`), cached in memory for `CEX_CACHE_TTL_MS`. If CoinGecko fails, the last good prices are served for up to `CEX_MAX_STALE_MS` and marked `cexStale`.
3. Requests two KyberSwap quotes per token against the quote token (USDT by default), both sized at `QUOTE_NOTIONAL_USD`:
   - **sell** (token → USDT) gives the DEX `bid`: USDT received per token
   - **buy** (USDT → token) gives the DEX `ask`: USDT paid per token

   Quotes already include pool fees and price impact for that size.
4. Computes the spread for both directions and keeps the better one:

   ```text
   BUY_DEX_SELL_CEX: (cexPrice - ask) / ask * 100
   BUY_CEX_SELL_DEX: (bid - cexPrice) / cexPrice * 100
   ```

5. Derives `netSpread`, `suspect` and `isOpportunity`:

   ```text
   netSpread     = spread - TRADE_COST_PCT
   suspect       = |spread| > MAX_PLAUSIBLE_SPREAD_PCT
   isOpportunity = !suspect && spread > TRADE_COST_PCT + MIN_PROFIT_PCT
   ```

   A spread that large on liquid tokens almost always means bad data (wrong decimals, a stale price), so it is flagged for checking instead of reported as an opportunity.

The whole `/prices` result is cached for `PRICES_CACHE_TTL_MS` and shared by all clients; concurrent requests trigger a single upstream fetch.

### Limitations

- CoinGecko is an aggregated reference price, not an executable order book, and can lag the market.
- Gas, CEX fees, withdrawal/bridge costs and transfer time are only accounted for through `TRADE_COST_PCT`.
- The spread is valid for the quoted size only; larger trades get worse prices.
- Each refresh of the `/prices` cache makes two KyberSwap requests per token. Very short `PRICES_CACHE_TTL_MS` values can hit KyberSwap rate limits.
- CoinGecko's keyless API is rate-limited; set `COINGECKO_API_KEY` (free demo key) if you see 429 errors.

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

## Configuration

Settings are read from environment variables. A `.env` file in the project root is loaded automatically (via `dotenv`); variables already set in the environment take precedence over `.env`.

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `4000` | HTTP port |
| `DEX_CHAIN` | `bsc` | KyberSwap chain slug |
| `QUOTE_TOKEN_ADDRESS` | `0x55d3…7955` (USDT on BSC) | Token every price is quoted against |
| `QUOTE_TOKEN_DECIMALS` | `18` | Decimals of the quote token |
| `QUOTE_NOTIONAL_USD` | `1000` | USD size of each buy/sell quote |
| `KYBERSWAP_CLIENT_ID` | `bnb-arb-monitor` | Sent as `x-client-id` to identify this app to KyberSwap |
| `REQUEST_TIMEOUT_MS` | `5000` | Per-request timeout for upstream APIs |
| `RETRY_COUNT` | `2` | Retries on network errors, 408, 429 and 5xx |
| `CEX_CACHE_TTL_MS` | `15000` | CoinGecko price cache lifetime |
| `CEX_MAX_STALE_MS` | `300000` | How long the last good CoinGecko prices are served while CoinGecko fails |
| `COINGECKO_API_KEY` | _(empty)_ | Optional CoinGecko demo API key, sent as `x-cg-demo-api-key` |
| `PRICES_CACHE_TTL_MS` | `10000` | Lifetime of the shared `/prices` result cache |
| `BSC_RPC_URL` | `https://bsc-dataseed.bnbchain.org` | BSC JSON-RPC endpoint used for the startup decimals check |
| `MAX_PLAUSIBLE_SPREAD_PCT` | `20` | Spreads beyond this (in absolute value) are flagged `suspect` |
| `TRADE_COST_PCT` | `0.25` | Estimated round-trip trading cost, in percent |
| `MIN_PROFIT_PCT` | `0.1` | Minimum profit on top of costs to flag an opportunity, in percent |

## Endpoint

### `GET /prices`

Returns one entry per token. `dexes` is empty when both KyberSwap quotes failed; `bid` or `ask` is `null` when only one side failed.

```json
[
  {
    "token": "CAKE",
    "address": "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
    "cexPrice": 2.07,
    "cexStale": false,
    "dexes": [
      {
        "name": "KyberSwap",
        "website": "https://kyberswap.com",
        "notionalUsd": 1000,
        "bid": 2.073355,
        "ask": 2.078332,
        "price": 2.0758435,
        "direction": "BUY_CEX_SELL_DEX",
        "spread": 0.162,
        "netSpread": -0.088,
        "isOpportunity": false,
        "suspect": false
      }
    ]
  }
]
```

| Field | Description |
| --- | --- |
| `cexPrice` | CoinGecko USD price (`null` if CoinGecko failed and no recent price is cached) |
| `cexStale` | `true` when `cexPrice` is a fallback from a previous fetch because CoinGecko is failing |
| `bid` / `ask` | DEX sell / buy price in quote-token units per token |
| `price` | Mid of `bid` and `ask` (or whichever side is available) |
| `direction` | `BUY_DEX_SELL_CEX` or `BUY_CEX_SELL_DEX`, whichever has the better spread |
| `spread` | Gross edge of that direction, in percent |
| `netSpread` | `spread - TRADE_COST_PCT` |
| `isOpportunity` | `spread > TRADE_COST_PCT + MIN_PROFIT_PCT`, and not `suspect` |
| `suspect` | `true` when the spread is implausibly large (likely bad data) |

## Dashboard

The page at `/` shows the same data as a table (CEX, DEX bid, DEX ask, direction, spread, net spread, status). Status is **Opportunity**, **Neutral**, or **Check data** for suspect rows; a **stale** tag next to the CEX price means CoinGecko is failing and a cached price is shown. Use **Refresh** to reload, **Opportunity only** to filter, and **How it works** for an in-app summary of the method.

## Adding a token

Add an entry to `tokens.js` with its BSC `address`, `decimals` and `coingeckoId`. The startup check corrects wrong decimals and logs a warning; fix the value in `tokens.js` when you see one.

## Tests

```bash
npm test
```

## Docker

```bash
docker run -p 4000:4000 --env-file .env philipid3s/bnb-arb-monitor
```

`.env` is excluded from the image, so pass settings with `--env-file` or `-e`.

### Publish (GitHub Actions)

Workflow file: `.github/workflows/docker-publish.yml`

It publishes image `philipid3s/bnb-arb-monitor` on:
- push to `master` (`latest` + `sha` tag)
- push tag starting with `v` (for example `v1.0.0`)
- manual trigger (`workflow_dispatch`)

Required repository secrets:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

## Project Structure

- `server.js`: API setup and `/prices` route
- `getCexPrices.js`: CoinGecko fetch with cache and stale fallback
- `cache.js`: TTL cache helper with shared in-flight loads and optional stale fallback
- `getDexPrice.js`: KyberSwap bid/ask quote fetch + unit-safe pricing math
- `spread.js`: two-direction spread and opportunity evaluation
- `tokens.js`: token watchlist (address, decimals, CoinGecko id)
- `verifyTokens.js`: startup check of token decimals against the chain
- `config.js`: environment-driven runtime config (loads `.env`)
- `http.js`: shared timeout/retry HTTP helper
- `units.js`: bigint decimal conversion helpers
- `public/`: dashboard (static HTML/CSS/JS)
- `tests/`: unit and route tests
