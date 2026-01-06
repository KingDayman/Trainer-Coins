// ====== CONFIG (edit if needed) ======
const TC_MINT = "56hV4uhcLBjhvQhiA9yi5AsAS9AubDbpCHDCskf7pump";

// Tier thresholds (you can adjust anytime)
function getTier(balance) {
  if (balance >= 1_000_000) return "Legend";
  if (balance >= 500_000) return "Veteran";
  if (balance >= 100_000) return "Trainer";
  return "Rookie";
}

// Public Solana RPC endpoint (works, but can be rate-limited)
const RPC_URL = "https://api.mainnet-beta.solana.com";

// ====== Helpers ======
async function rpc(method, params) {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "RPC error");
  return data.result;
}

function setTierText(text) {
  const el = document.getElementById("tierOutput");
  if (el) el.textContent = text;
}

function setBalanceText(text) {
  const el = document.getElementById("balanceOutput");
  if (el) el.textContent = text;
}

async function getTokenBalanceForOwner(owner) {
  // Uses Solana JSON-RPC method getTokenAccountsByOwner with jsonParsed encoding
  const result = await rpc("getTokenAccountsByOwner", [
    owner,
    { mint: TC_MINT },
    { encoding: "jsonParsed" },
  ]);

  let total = 0;

  for (const acc of result?.value || []) {
    const info = acc?.account?.data?.parsed?.info;
    const amount = info?.tokenAmount?.uiAmount;
    if (typeof amount === "number") total += amount;
  }

  return total; // already UI amount (takes decimals into account)
}

async function refreshRank() {
  // Only run on pages that have the rank UI
  if (!document.getElementById("tierOutput")) return;

  const owner = window.TCWallet?.getAddress?.() || localStorage.getItem("tc_wallet");

  if (!owner) {
    setTierText("Connect your wallet to see your rank.");
    setBalanceText("Balance: —");
    return;
  }

  setTierText("Checking your TC balance…");
  setBalanceText("Balance: …");

  try {
    const bal = await getTokenBalanceForOwner(owner);
    const tier = getTier(bal);

    setTierText(`Rank: ${tier}`);
    setBalanceText(`Balance: ${bal.toLocaleString()} TC`);
  } catch (err) {
    console.error(err);
    setTierText("Rank: (error fetching balance)");
    setBalanceText("Balance: —");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Run once on load
  refreshRank();

  // Re-run every time the wallet connect UI changes state.
  // We'll hook into existing connect/disconnect by polling localStorage quickly + cheaply.
  // (Simple + works for now without refactoring wallet.js)
  let last = localStorage.getItem("tc_wallet");
  setInterval(() => {
    const now = localStorage.getItem("tc_wallet");
    if (now !== last) {
      last = now;
      refreshRank();
    }
  }, 800);
});
