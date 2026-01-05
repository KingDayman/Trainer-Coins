"use client";

import { useState } from "react";

export default function RankPage() {
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ balance: number; tier: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkRank() {
    setError(null);
    setData(null);

    const w = wallet.trim();
    if (!w) return setError("Enter a wallet address.");

    setLoading(true);
    try {
      const res = await fetch(`/api/balance?wallet=${encodeURIComponent(w)}`);
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json?.error || "Lookup failed.");
        return;
      }

      setData({ balance: Number(json.balance || 0), tier: String(json.tier || "") });
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 720 }}>
      <h1>Rank Lookup</h1>
      <p>Wallet → on-chain Trainer Coins balance → tier</p>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <input
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="Wallet address…"
          style={{ flex: 1, padding: "0.6rem" }}
        />
        <button onClick={checkRank} disabled={loading} style={{ padding: "0.6rem 1rem" }}>
          {loading ? "Checking…" : "Check"}
        </button>
      </div>

      {error && <p style={{ marginTop: "1rem" }}><b>Error:</b> {error}</p>}

      {data && (
        <div style={{ marginTop: "1.5rem", padding: "1rem", border: "1px solid #333", borderRadius: 12 }}>
          <p><b>Balance:</b> {data.balance}</p>
          <p><b>Tier:</b> {data.tier}</p>
        </div>
      )}
    </main>
  );
}
