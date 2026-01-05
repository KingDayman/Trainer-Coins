[Home](index.md) | [Ranking](RANKING.md) | [Team Generator](team-generator.md)

---# Trainer Coins Ranking 

## Goal
Provide a public, wallet-based ranking for Trainer Coins holders.

## Ranking Rule
## Tier Thresholds (MVP 1)

Tiers are based on current TC token balance:

- 0 – 99,999  = Rookie
- 100,000 – 499,999 = Trainer
- 500,000 – 999,999 = Veteran
- 1,000,000+ = Legend
- Rank is determined by **current TC token balance** for a wallet.
- Higher balance = higher rank.
- Ties are allowed (or broken by wallet address as a deterministic fallback).

## Inputs
- Wallet address (Solana)
- TC token mint address

## Output
- Wallet TC balance
- Rank tier (based on thresholds)
- Global rank position (optional for MVP)

## Notes
- First MVP can show: balance + tier.
- Full leaderboard can come later.
