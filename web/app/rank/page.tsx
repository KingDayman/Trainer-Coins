"use client";
import { useState } from "react";

export default function RankPage() {
  const [wallet, setWallet] = useState("");
  const [data, setData] = useState<any>(null);

  async function lookup() {
    const res = await fetch(`/api/balance?wallet=${wallet}`);
    setData(await res.json());
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Trainer Coins Rank</h1>
      <input
        placeholder="Solana wallet address"
        value={wallet}
        onChange={(e) => setWallet(e.target.value)}
      />
      <button onClick={lookup}>Check Rank</button>

      {data && (
        <pre style={{ marginTop: 16 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}
