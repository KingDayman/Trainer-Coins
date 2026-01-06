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
  const addrLine = document.getElementById("walletAddress");
  const connectBtn = document.getElementById("connectBtn");
  const disconnectBtn = document.getElementById("disconnectBtn");

  if (status) status.textContent = `Connected: ${shorten(publicKeyStr)}`;
  if (addrLine) addrLine.textContent = publicKeyStr;

  if (connectBtn) connectBtn.style.display = "none";
  if (disconnectBtn) disconnectBtn.style.display = "inline-block";

  window.dispatchEvent(new Event("tc_wallet_changed"));
}

function setDisconnectedUI(message = "Not connected") {
  const status = document.getElementById("walletStatus");
  const addrLine = document.getElementById("walletAddress");
  const connectBtn = document.getElementById("connectBtn");
  const disconnectBtn = document.getElementById("disconnectBtn");

  if (status) status.textContent = message;
  if (addrLine) addrLine.textContent = "";

  if (connectBtn) connectBtn.style.display = "inline-block";
  if (disconnectBtn) disconnectBtn.style.display = "none";

  window.dispatchEvent(new Event("tc_wallet_changed"));
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
    console.error(err);
    setDisconnectedUI("Connection cancelled.");
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
  else setDisconnectedUI();
}

window.TCWallet = {
  getAddress: () => localStorage.getItem("tc_wallet"),
};

document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectBtn");
  const disconnectBtn = document.getElementById("disconnectBtn");

  if (connectBtn) connectBtn.addEventListener("click", connectWallet);
  if (disconnectBtn) disconnectBtn.addEventListener("click", disconnectWallet);

  restoreIfAvailable();
});
