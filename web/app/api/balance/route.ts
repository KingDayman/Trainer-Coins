import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const MINT = new PublicKey("56hV4uhcLBjhvQhiA9yi5AsAS9AubDbpCHDCskf7pump");

function getTier(balance: number) {
  if (balance >= 1_000_000) return "Legend";
  if (balance >= 500_000) return "Veteran";
  if (balance >= 100_000) return "Trainer";
  return "Rookie";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");
    if (!wallet) {
      return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
    }

    const owner = new PublicKey(wallet);
    const connection = new Connection("https://api.mainnet-beta.solana.com");
    const resp = await connection.getParsedTokenAccountsByOwner(owner, { mint: MINT });

    let balance = 0;
    const acc = resp.value[0];
    if (acc) {
      const info: any = acc.account.data.parsed.info;
      balance = Number(info.tokenAmount.uiAmount || 0);
    }

    return NextResponse.json({
      wallet,
      balance,
      tier: getTier(balance),
    });
  } catch {
    return NextResponse.json({ error: "Invalid wallet" }, { status: 500 });
  }
}
