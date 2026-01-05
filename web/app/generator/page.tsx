"use client";

import { useMemo, useState } from "react";

type Rarity = "common" | "rare" | "epic" | "legendary";

type Pool = {
  common: { id: string; name: string }[];
  rare: { id: string; name: string }[];
  epic: { id: string; name: string }[];
  legendary: { id: string; name: string }[];
};

type TeamPick = { id: string; name: string; rarity: Rarity };

function utcDateKey() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Deterministic hash -> float in [0,1)
function hash01(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function rarityLabel(r: Rarity) {
  return r === "common" ? "Common" : r === "rare" ? "Rare" : r === "epic" ? "Epic" : "Legendary";
}

// Trainer tiers are separate from rarity tiers.
// This function uses trainerTier to weight rarity odds.
function rollRarity(trainerTier: string, r: number): Rarity {
  // Default (lowest tiers)
  let w = { common: 0.70, rare: 0.22, epic: 0.07, legendary: 0.01 };

  const t = trainerTier.toLowerCase();

  // Tune these based on your actual tier names in RANKING.md
  // The logic below is intentionally flexible (substring matches).
  if (t.includes("trainer")) w = { common: 0.60, rare: 0.26, epic: 0.12, legendary: 0.02 };
  if (t.includes("veteran")) w = { common: 0.45, rare: 0.32, epic: 0.18, legendary: 0.05 };
  if (t.includes("legend")) w = { common: 0.30, rare: 0.33, epic: 0.25, legendary: 0.12 };

  const a = w.common;
  const b = a + w.rare;
  const c = b + w.epic;

  if (r < a) return "common";
  if (r < b) return "rare";
  if (r < c) return "epic";
  return "legendary";
}

async function loadPool(): Promise<Pool> {
  const res = await fetch("/data/pool.json", { cache: "force-cache" });
  if (!res.ok) throw new Error("Pool not found. Expected /public/data/pool.json");
  const pool = (await res.json()) as Pool;

  // light validation
  if (!pool.common || !pool.rare || !pool.epic || !pool.legendary) {
    throw new Error("pool.json missing rarity arrays");
  }
  return pool;
}

function pickFrom(pool: Pool, rarity: Rarity, r: number) {
  const arr = pool[rarity];
  if (!arr || arr.length === 0) return { id: "EMPTY", name: "(empty pool)" };
  const idx = Math.floor(r * arr.length);
  return arr[Math.min(idx, arr.length - 1)];
}

function shortWallet(w: string) {
  if (w.length <= 14) return w;
  return `${w.slice(0, 6)}...${w.slice(-4)}`;
}

export default function GeneratorPage() {
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);

  const [trainerTier, setTrainerTier] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [team, setTeam] = useState<TeamPick[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dateKey = useMemo(() => utcDateKey(), []);

  function downloadPng(dataUrl: string) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `trainer-coins-team-${dateKey}.png`;
    a.click();
  }

  function renderTrainerCard(args: {
    wallet: string;
    dateKey: string;
    trainerTier: string;
    balance: number;
    team: TeamPick[];
  }) {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 540;
    const ctx = canvas.getContext("2d")!;

    // background
    ctx.fillStyle = "#0b0b10";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // header
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px system-ui";
    ctx.fillText("Trainer Coins — Daily Team", 40, 70);

    ctx.font = "18px system-ui";
    ctx.fillStyle = "#c9c9c9";
    ctx.fillText(`Date (UTC): ${args.dateKey}`, 40, 110);
    ctx.fillText(`Wallet: ${shortWallet(args.wallet)}`, 40, 140);
    ctx.fillText(`Trainer Tier: ${args.trainerTier}`, 40, 170);
    ctx.fillText(`TC Balance: ${args.balance}`, 40, 200);

    // team
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px system-ui";
    ctx.fillText("Team (6):", 40, 245);

    const boxW = 280;
    const boxH = 78;
    const startX = 40;
    const startY = 270;
    const gapX = 20;
    const gapY = 18;

    args.team.forEach((m, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = startX + col * (boxW + gapX);
      const y = startY + row * (boxH + gapY);

      ctx.fillStyle = "#141427";
      ctx.fillRect(x, y, boxW, boxH);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px system-ui";
      ctx.fillText(`${i + 1}. ${m.name}`, x + 14, y + 32);

      ctx.fillStyle = "#c9c9c9";
      ctx.font = "16px system-ui";
      ctx.fillText(rarityLabel(m.rarity), x + 14, y + 58);
    });

    ctx.fillStyle = "#7a7a7a";
    ctx.font = "14px system-ui";
    ctx.fillText("kingdayman.github.io/Trainer-Coins", 40, 510);

    return canvas.toDataURL("image/png");
  }

  async function generateTeam() {
    setError(null);
    setTeam(null);
    setTrainerTier(null);
    setBalance(null);

    const w = wallet.trim();
    if (!w) return setError("Enter a wallet address.");

    setLoading(true);
    try {
      // 1) Fetch on-chain trainer tier + balance
      const res = await fetch(`/api/balance?wallet=${encodeURIComponent(w)}`);
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json?.error || "Balance lookup failed.");
        return;
      }

      const tTier = String(json.tier || "");
      const bal = Number(json.balance || 0);

      setTrainerTier(tTier);
      setBalance(bal);

      // 2) Load static pool (500 total)
      const pool = await loadPool();

      // 3) Deterministic daily roll + no duplicates
      const seedBase = `${w}|${dateKey}|trainercoins`;
      const used = new Set<string>();
      const out: TeamPick[] = [];

      for (let slot = 0; slot < 6; slot++) {
        const rRarity = hash01(`${seedBase}|rarity|${slot}`);
        const rarity = rollRarity(tTier, rRarity);

        let picked: { id: string; name: string } | null = null;

        // try a few times to avoid duplicates
        for (let tries = 0; tries < 12; tries++) {
          const rPick = hash01(`${seedBase}|pick|${slot}|${tries}`);
          const candidate = pickFrom(pool, rarity, rPick);

          if (!used.has(candidate.id)) {
            picked = candidate;
            break;
          }
        }

        // fallback (should be rare)
        if (!picked) {
          const rPick = hash01(`${seedBase}|pick|${slot}|fallback`);
          picked = pickFrom(pool, rarity, rPick);
        }

        used.add(picked.id);
        out.push({ id: picked.id, name: picked.name, rarity });
      }

      setTeam(out);

      // 4) Render & download trainer card
      const png = renderTrainerCard({
        wallet: w,
        dateKey,
        trainerTier: tTier,
        balance: bal,
        team: out,
      });

      downloadPng(png);
    } catch (e: any) {
      setError(e?.message || "Generator error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Team Generator</h1>
      <p>Daily team roll (6 slots). Trainer tier affects rarity odds. Trainer Card downloads as PNG.</p>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <input
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="Wallet address…"
          style={{ flex: 1, padding: "0.6rem" }}
        />
        <button onClick={generateTeam} disabled={loading} style={{ padding: "0.6rem 1rem" }}>
          {loading ? "Generating…" : "Generate Today’s Team"}
        </button>
      </div>

      {error && (
        <p style={{ marginTop: "1rem" }}>
          <b>Error:</b> {error}
        </p>
      )}

      {(trainerTier || balance !== null) && (
        <div style={{ marginTop: "1rem" }}>
          <p><b>Trainer Tier:</b> {trainerTier ?? "-"}</p>
          <p><b>TC Balance:</b> {balance ?? "-"}</p>
          <p><b>Daily Key (UTC):</b> {dateKey}</p>
        </div>
      )}

      {team && (
        <div style={{ marginTop: "1rem" }}>
          <h2>Today’s Team</h2>
          <ol>
            {team.map((m, idx) => (
              <li key={m.id + idx}>
                <b>{m.name}</b> ({m.id}) — {rarityLabel(m.rarity)}
              </li>
            ))}
          </ol>
          <p>Trainer Card auto-downloads when you generate.</p>
        </div>
      )}
    </main>
  );
}
