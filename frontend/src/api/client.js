// @ts-nocheck
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

export async function scanRisk({
  lat,
  lng,
  biome_context = null,
  is_urban = false,
  radius_km = 50,
}) {
  return request('/risk/scan', {
    method: 'POST',
    body: JSON.stringify({ lat, lng, biome_context, is_urban, radius_km }),
  });
}

export async function getSpeciesByLocation({ scientific_name }) {
  const params = new URLSearchParams({
    scientific_name: String(scientific_name),
  });
  return request(`/species/catalog/lookup?${params}`);
}

export async function getINatTaxonProfile(inat_taxon_id) {
  if (!inat_taxon_id) return null;
  const res = await fetch(`https://api.inaturalist.org/v1/taxa/${encodeURIComponent(String(inat_taxon_id))}`);
  if (!res.ok) return null;
  const data = await res.json();
  const taxon = data?.results?.[0];
  if (!taxon) return null;

  return {
    source: 'inat',
    hero_image_url: taxon?.default_photo?.medium_url || null,
    story: taxon?.wikipedia_summary || null,
    subtitle: taxon?.iconic_taxon_name ? `${taxon.iconic_taxon_name} taxon` : null,
    introduced: Boolean(taxon?.introduced),
    native: Boolean(taxon?.native),
    threatened: Boolean(taxon?.threatened),
    observations_count: typeof taxon?.observations_count === 'number' ? taxon.observations_count : null,
    preferred_common_name: taxon?.preferred_common_name || null,
  };
}

export async function getWikipediaSummary(scientific_name) {
  if (!scientific_name) return null;
  const title = String(scientific_name).trim().replace(/\s+/g, '_');
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
  if (!res.ok) return null;
  const data = await res.json();

  return {
    source: 'wikipedia',
    hero_image_url: data?.thumbnail?.source || null,
    story: data?.extract || null,
    subtitle: data?.description || null,
    introduced: null,
    native: null,
    threatened: null,
    observations_count: null,
    preferred_common_name: null,
  };
}

export async function getTrefleTraits(scientific_name) {
  if (!scientific_name) return null;
  
  try {
    // Call backend proxy endpoint using API_BASE (respects environment config)
    const res = await fetch(
      `${API_BASE}/species/external/trefle-traits?scientific_name=${encodeURIComponent(String(scientific_name))}`
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Failed to fetch traits from backend:", error);
    return null;
  }
}

export async function getSpeciesWithRisk({
  scientific_name,
  lat,
  lng,
  radius_km = 50,
  biome_context = null,
  is_urban = false,
}) {
  const params = new URLSearchParams({
    scientific_name: String(scientific_name),
    lat: String(lat),
    lng: String(lng),
    radius_km: String(radius_km),
  });
  if (biome_context) params.append('biome_context', biome_context);
  if (is_urban) params.append('is_urban', String(is_urban));
  return request(`/species/scan/lookup?${params}`);
}

export async function healthCheck() {
  return request('/health');
}
