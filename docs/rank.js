// TC mint (confirmed)
const TC_MINT = "7BfrU29e1GW9giEnTjF8DoHM9L3UdNSGNPEkd3Xgpump";

const RPC_URLS = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
  "https://solana.public-rpc.com",
];

// Tier thresholds (token amount, NOT $)
function getTier(balance) {
  if (balance >= 1_000_000) return "Legend";
  if (balance >= 500_000) return "Veteran";
  if (balance >= 100_000) return "Trainer";
  return "Rookie";
}

async function rpc(method, params) {
  let lastErr = null;

  for (const url of RPC_URLS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });

      clearTimeout(timeout);

      const data = await res.json();
      if (!res.ok) throw new Error(`RPC ${res.status} from ${url}`);
      if (data.error) throw new Error(`${data.error.message} (via ${url})`);

      return data.result;
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error("All RPC endpoints failed");
}

function setTierText(text) {
  const el = document.getElementById("tierOutput");
  if (el) el.textContent = text;
}

function setBalanceText(text) {
  const el = document.getElementById("balanceOutput");
  if (!el) return;
  el.textContent = text;
}

async function getTokenBalanceForOwner(owner) {
  // More reliable: fetch ALL token accounts, then filter locally by mint
  const result = await rpc("getTokenAccountsByOwner", [
    owner,
    { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
    { encoding: "jsonParsed" },
  ]);

  let total = 0;

  for (const acc of result?.value || []) {
    const info = acc?.account?.data?.parsed?.info;
    if (!info) continue;

    if (info.mint === TC_MINT) {
      const amountStr = info.tokenAmount?.uiAmountString;
      const amount = amountStr ? Number(amountStr) : 0;
      total += amount;
    }
  }

  return total;
}

async function refreshRank() {
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
    setBalanceText(`Balance error: ${err?.message || err}`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  refreshRank();

  // Re-check when wallet changes
  window.addEventListener("tc_wallet_changed", refreshRank);

  // Safety: re-check shortly after load (fixes mobile timing issues)
  setTimeout(refreshRank, 500);
});
