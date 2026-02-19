const API_BASE = (() => {
  const origin = window.location.origin;
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return origin.replace(':5000', ':3001');
  }
  return origin;
})();

function getStoredUserId() {
  try {
    const stored = localStorage.getItem('discordUser');
    if (stored) return JSON.parse(stored).id;
  } catch {}
  return null;
}

async function apiCall(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const userId = getStoredUserId();
  const headers = {
    'Content-Type': 'application/json',
    ...(userId ? { 'X-User-Id': userId } : {}),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error ${res.status}`);
  }
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
  return data;
}

export async function getPricing() {
  return apiCall('/api/gbux/pricing');
}

export async function createWallet(userId) {
  return apiCall('/api/gbux/wallet/create', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function getWallet(userId) {
  return apiCall(`/api/gbux/wallet/${userId}`);
}

export async function getBalance(address) {
  return apiCall(`/api/gbux/balance/${address}`);
}

export async function purchasePackage(userId, packageId, walletAddress) {
  return apiCall('/api/gbux/purchase', {
    method: 'POST',
    body: JSON.stringify({ userId, packageId, walletAddress }),
  });
}

export async function checkAccess(walletAddress, feature) {
  return apiCall('/api/gbux/check-access', {
    method: 'POST',
    body: JSON.stringify({ walletAddress, feature }),
  });
}

export const FEATURE_NAMES = {
  ai_generation: 'AI Game Generation',
  deployment: 'Game Deployment',
  ai_editor_session: 'AI Editor Session',
  image_generation: 'Image Generation',
  custom_theme: 'Custom Theme',
};
