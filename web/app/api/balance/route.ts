import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

export const runtime = "nodejs";

const RPC_URL = "https://api.mainnet-beta.solana.com";
const MINT = new PublicKey("56hV4uhcLBjhvQhiA9yi5AsAS9AubDbpCHDCskf7pump");

// TODO: Replace these with your real thresholds from RANKING.md
function getTier(balance: number) {
  if (balance >= 1_000_000) return "Legend";
  if (balance >= 500_000) return "Veteran";
  if (balance >= 100_000) return "Trainer";
  return "Rookie";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = (searchParams.get("wallet") || "").trim();

  if (!wallet) {
    return NextResponse.json({ ok: false, error: "Missing wallet" }, { status: 400 });
  }

  let owner: PublicKey;
  try {
    owner = new PublicKey(wallet);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid wallet" }, { status: 400 });
  }

  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const resp = await connection.getParsedTokenAccountsByOwner(owner, { mint: MINT });

    // Sum all token accounts (important!)
    let balance = 0;
    for (const v of resp.value) {
      const info: any = v.account.data.parsed.info;
      const amt = Number(info?.tokenAmount?.uiAmount ?? 0);
      balance += amt;
    }

    return NextResponse.json({
      ok: true,
      wallet,
      mint: MINT.toBase58(),
      balance,
      tier: getTier(balance),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "RPC error" }, { status: 500 });
  }
}
