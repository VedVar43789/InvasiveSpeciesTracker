const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function scanRisk({ lat, lng, biome_context, is_urban, radius_km = 50 }) {
  return request('/risk/scan', {
    method: 'POST',
    body: JSON.stringify({ lat, lng, biome_context, is_urban, radius_km }),
  });
}

export async function getSpeciesByLocation({ latitude, longitude, radius_km = 5, limit = 50 }) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radius_km: String(radius_km),
    limit: String(limit),
  });
  return request(`/species/by-location?${params}`);
}

export async function healthCheck() {
  return request('/health');
}
