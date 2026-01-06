// ====== CONFIG (edit if needed) ======
const TC_MINT = "7BfrU29e1GW9giEnTjF8DoHM9L3UdNSGNPEkd3Xgpump";

// Tier thresholds (you can adjust anytime)
function getTier(balance) {
  if (balance >= 1_000_000) return "Legend";
  if (balance >= 500_000) return "Veteran";
  if (balance >= 100_000) return "Trainer";
  return "Rookie";
}

// Public Solana RPC endpoint (works, but can be rate-limited)
const RPC_URLS = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
  "https://solana.public-rpc.com"
];

// ====== Helpers ======
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

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(`RPC ${res.status} from ${url}`);
      }
      if (data.error) {
        throw new Error(`${data.error.message || "RPC error"} (via ${url})`);
      }

      return data.result;
    } catch (err) {
      lastErr = err;
      // try next URL
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

  // If caller passed just a number/string, format it consistently
  if (typeof text === "number") {
    el.textContent = `Balance: ${text.toLocaleString()} TC`;
    return;
  }

  // If caller passed a full message, still show it
  el.textContent = text.startsWith("Balance:") ? text : `Balance: ${text}`;
}
async function getTokenBalanceForOwner(owner) {
  try {
    // Derive the Associated Token Account (ATA)
    const result = await rpc("getTokenAccountsByOwner", [
      owner,
      {
        mint: TC_MINT,
      },
      {
        encoding: "jsonParsed",
      },
    ]);

    if (!result?.value || result.value.length === 0) {
      return 0;
    }

    const acc = result.value[0];
    const info = acc.account.data.parsed.info;
    const amountStr = info.tokenAmount.uiAmountString;

    return amountStr ? Number(amountStr) : 0;
  } catch (err) {
    console.error("Balance lookup failed:", err);
    return 0;
  }
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
const amountStr = info?.tokenAmount?.uiAmountString;
const amount = amountStr ? Number(amountStr) : 0;
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
