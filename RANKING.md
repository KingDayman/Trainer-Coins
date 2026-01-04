# Trainer Coins Ranking (Option A)

## Goal
Provide a public, wallet-based ranking for Trainer Coins holders.

## Ranking Rule
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
