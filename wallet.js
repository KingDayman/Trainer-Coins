function shorten(addr) {
  if (!addr) return "";
  return addr.slice(0, 4) + "…" + addr.slice(-4);
}

function getProvider() {
  if ("solana" in window) {
    const provider = window.solana;
    if (provider?.isPhantom) return provider;
  }
  return null;
}

function setConnectedUI(publicKeyStr) {
  const status = document.getElementById("walletStatus");
  const connectBtn = document.getElementById("connectBtn");
  const disconnectBtn = document.getElementById("disconnectBtn");

  status.textContent = `Connected: ${shorten(publicKeyStr)}`;
  connectBtn.style.display = "none";
  disconnectBtn.style.display = "inline-block";
}

function setDisconnectedUI(message = "Not connected") {
  const status = document.getElementById("walletStatus");
  const connectBtn = document.getElementById("connectBtn");
  const disconnectBtn = document.getElementById("disconnectBtn");

  status.textContent = message;
  connectBtn.style.display = "inline-block";
  disconnectBtn.style.display = "none";
}

async function connectWallet() {
  const provider = getProvider();
  if (!provider) {
    setDisconnectedUI("Phantom not detected. Open in Phantom browser.");
    return;
  }

  try {
    const resp = await provider.connect();
    const pubkey = resp.publicKey?.toString() || provider.publicKey?.toString();
    if (!pubkey) throw new Error("No public key returned");
    localStorage.setItem("tc_wallet", pubkey);
    setConnectedUI(pubkey);
  } catch (err) {
    setDisconnectedUI("Connection cancelled.");
    console.error(err);
  }
}

async function disconnectWallet() {
  const provider = getProvider();
  try {
    await provider?.disconnect?.();
  } catch (err) {
    console.warn("Disconnect error:", err);
  }
  localStorage.removeItem("tc_wallet");
  setDisconnectedUI();
}

function restoreIfAvailable() {
  const saved = localStorage.getItem("tc_wallet");
  if (saved) setConnectedUI(saved);
}

document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectBtn");
  const disconnectBtn = document.getElementById("disconnectBtn");

  if (connectBtn) connectBtn.addEventListener("click", connectWallet);
  if (disconnectBtn) disconnectBtn.addEventListener("click", disconnectWallet);

  restoreIfAvailable();
});
