# Team Generator Specification (MVP)

## Summary
The Trainer Coins Team Generator creates a 6-member “team” for a wallet once per day, based on the wallet’s on-chain Trainer Coins balance and the project’s rank tiers.

Output:
- Team (6 slots)
- Rarity distribution influenced by rank
- A shareable Trainer Card image (PNG)

---

## Inputs
- `walletAddress` (string)
- `dateKey` (YYYY-MM-DD, UTC)
- On-chain Trainer Coins token balance for `walletAddress`

---

## Core Rules

### 1) Team Size
- Always generate **6** slots:
  - Slot 1–6

### 2) Rarity Tiers (4)
- **Common**
- **Rare**
- **Epic**
- **Legendary**

Each slot rolls a rarity, then selects an item/unit from the pool for that rarity.

### 3) Daily Roll
- A wallet can generate **one team per day** (UTC).
- The same wallet + same date must always return the same team (deterministic).
- A new day produces a new team.

---

## Rank + Probability Weights
Rank is determined by balance using `RANKING.md`.

Rank influences rarity odds (weights). Example template (adjust anytime):

- Low tiers: Common-heavy
- Mid tiers: more Rare/Epic
- Top tiers: Epic/Legendary becomes realistic

Example weight sets (must sum to 100):
- Tier Group A (low):    C 70 / R 25 / E 5  / L 0
- Tier Group B (mid):    C 55 / R 30 / E 13 / L 2
- Tier Group C (high):   C 40 / R 35 / E 20 / L 5
- Tier Group D (top):    C 25 / R 35 / E 28 / L 12

Mapping from your rank tiers -> a Tier Group is defined in this doc.

---

## Deterministic Randomness (Anti-Rig)
To ensure fairness, the generator must be deterministic per wallet/day.

Seed format:
seed = SHA256(
  walletAddress + "|" + dateKey + "|" + tokenMintOrContract + "|" + "trainercoins"
)

- Use the seed to generate a reproducible PRNG stream.
- For each slot:
  1) roll rarity using weights
  2) pick an index from that rarity pool

No manual overrides.

---

## On-Chain Balance Source (MVP)
MVP reads the wallet’s Trainer Coins token balance on-chain.

Implementation options:
- Client-side RPC call (simpler, but exposes rate limits)
- Serverless endpoint (recommended) that queries RPC and returns balance

Recommended:
- `/api/balance?wallet=...` returns `{ balanceRaw, balanceUi }`

---

## Content Pools (Data)
Maintain a local data file for generator content:

`/web/data/pool.json`

Structure:
{
  "common": [{ "id": "...", "name": "...", "image": "..." }],
  "rare": [{...}],
  "epic": [{...}],
  "legendary": [{...}]
}

Each entry should have:
- id
- name
- optional flavor text
- image asset path (or URL)

---

## Output: Trainer Card Image (PNG)
Trainer Card is generated in-browser via Canvas (or serverless rendering later).

Card must include:
- Title: "Trainer Coins"
- Wallet (shortened): ABCD...WXYZ
- Date (UTC): YYYY-MM-DD
- Rank Tier name
- Balance (optional display)
- The 6 team members with rarity colors/badges
- Optional: small footer with site URL

Button:
- "Download Card" (exports PNG)
- "Copy Share Text" (copies team + link)

---

## UX Requirements
- Input: wallet address field
- CTA: "Generate Today's Team"
- Display: team grid (6 slots)
- Display: rank + rarity odds summary
- Error handling:
  - invalid wallet
  - balance fetch failure
  - rate limiting

---

## Abuse Controls (Recommended)
- Cache per wallet/day result in local storage
- If using serverless balance endpoint:
  - basic rate limit per IP
  - cache RPC response for short periods

---

## Future Enhancements (Post-MVP)
- Wallet connect
- Seasons (weekly/monthly) + daily
- Leaderboard integration
- Animated card styles
- Special events (limited pools)
