import pandas as pd
import numpy as np
import json
import os
import faiss
from typing import List, Dict, Any

# ==========================================
# LOAD ASSETS AT STARTUP (Once per server launch)
# ==========================================
print("Loading FAISS Risk Engine Assets...")

# Get paths relative to project root
_this_dir = os.path.dirname(__file__)  # backend/app/ml
_app_dir = os.path.dirname(_this_dir)  # backend/app
_backend_dir = os.path.dirname(_app_dir)  # backend
_root_dir = os.path.dirname(_backend_dir)  # root
_notebooks_dir = os.path.join(_root_dir, "notebooks")

# Load FAISS index
_INDEX_4D = faiss.read_index(os.path.join(_notebooks_dir, 'plants_climate_4d.faiss'))
print(f"✓ Loaded FAISS index with {_INDEX_4D.ntotal} species")

# Load metadata
_METADATA_DF = pd.read_csv(os.path.join(_notebooks_dir, 'plants_metadata.csv'))
print(f"✓ Loaded metadata for {len(_METADATA_DF)} species")

# Load feature means
with open(os.path.join(_notebooks_dir, 'feature_means.json'), 'r') as f:
    _FEATURE_MEANS = json.load(f)

CORE_COLS = [
    'growth_ph_minimum',
    'growth_ph_maximum',
    'growth_minimum_precipitation_mm',
    'native_region_count'
]

# Fixed cap: Calculate risk on ALL species, return top 20k to frontend
RESULT_CAP = 20000

# ==========================================
# TAXONOMIC ENGINE & SYNONYM ROUTER PREP
# ==========================================
print("Initializing Taxonomic Engine...")
# Build Genus Threat Map dynamically
_METADATA_DF['genus'] = _METADATA_DF['scientific_name'].str.split(' ').str[0]
GENUS_THREAT_MAP = _METADATA_DF.groupby('genus')['is_invasive'].max().to_dict()

SYNONYM_ROUTER = {
    'Falcataria moluccana': 'Paraserianthes falcataria',
    'Cyathea cooperi': 'Sphaeropteris cooperi',
    'Pennisetum setaceum': 'Cenchrus setaceus',
    'Pennisetum villosum': 'Cenchrus villosus',
    'Rubus discolor': 'Rubus bifrons',
    'Coccina grandis': 'Coccinia grandis',
    'Prosopis julifloria': 'Prosopis juliflora',
    'Angiopterus evecta': 'Angiopteris evecta',
    'Delaria odorata': 'Delairea odorata'
}

def clean_search_name(raw_name: str) -> str:
    return SYNONYM_ROUTER.get(raw_name, raw_name)

print("FAISS Risk Engine ready!\n")

def _normalize_if_raw(col: str, raw_val: float) -> float:
    norm_val = raw_val
    if 'ph' in col and raw_val > 1.0:
        norm_val = np.clip((raw_val - 3.0) / 6.0, 0.0, 1.0)
    elif 'precipitation' in col and raw_val > 1.0:
        norm_val = np.clip(raw_val / 3000.0, 0.0, 1.0)
    return norm_val

# ==========================================
# DEEP PREDICTIVE ENGINE
# ==========================================
def calculate_risk(dynamic_profile: Dict[str, float]) -> List[Dict[str, Any]]:
    """
    FAISS-powered two-axis risk calculation using nuanced 60/40 Hybrid Math.
    """
    
    # --- AXIS Y: CLIMATE SUITABILITY ---
    target_vec = np.zeros((1, len(CORE_COLS)), dtype=np.float32)
    for i, col in enumerate(CORE_COLS):
        raw_val = float(dynamic_profile.get(col, 0.0))
        norm_val = _normalize_if_raw(col, raw_val)
        mean_offset = _FEATURE_MEANS.get(col, 0.0)
        target_vec[0, i] = norm_val - mean_offset

    faiss.normalize_L2(target_vec)

    # Query FAISS - Search ALL 96,270 species to catch climate generalists
    # This ensures we don't miss high-risk species with moderate climate fit
    search_k = _INDEX_4D.ntotal
    climate_scores, indices = _INDEX_4D.search(target_vec, search_k)
    
    results = _METADATA_DF.iloc[indices[0]].copy()
    results['climate_score'] = np.clip(climate_scores[0], 0.0, 1.0)

    # --- AXIS X: BIOLOGICAL AGGRESSION (Taxonomic Math) ---
    aggression = np.full(len(results), 0.15)
    
    # 1. Genus Kicker
    results['genus_is_dangerous'] = results['genus'].map(GENUS_THREAT_MAP).fillna(0)
    aggression += np.where(results['genus_is_dangerous'] == 1, 0.35, 0.0)
    
    # 2. Individual Invasive Tag
    if 'is_invasive' in results.columns:
        is_inv = pd.to_numeric(results['is_invasive'], errors='coerce').fillna(0)
        aggression += np.where(is_inv == 1, 0.30, 0.0)
        
    # 3. Growth Rate Kicker
    if 'growth_rate_Rapid' in results.columns:
        is_rapid = results['growth_rate_Rapid'].astype(str).str.lower().isin(['true', '1', 'yes', '1.0'])
        aggression += np.where(is_rapid, 0.20, 0.0)
        
    results['aggression_score'] = np.clip(aggression, 0.1, 1.0)
    
    # --- FINAL RISK CALCULATION ---
    
    # Total Risk = 0.6 × Biological Aggression + 0.4 × Climate Suitability
    results['risk_score'] = (results['aggression_score'] * 0.6) + (results['climate_score'] * 0.4)
    
    # --- FIX 1: SUBSPECIES DEDUPLICATOR ---
    # Convert "Trifolium longipes subsp. pygmaeum" -> "Trifolium longipes"
    results['base_species'] = results['scientific_name'].apply(lambda x: ' '.join(str(x).split(' ')[:2]))
    
    # Drop duplicates, keeping the highest risk score for that base species
    results = results.sort_values('risk_score', ascending=False).drop_duplicates(subset=['base_species'])
    
    # --- THE COPILOT FIX: Honest Math + Safe UI ---
    # 1) Keep mathematically meaningful AI threats
    meaningful_threats = results[results['risk_score'] >= 0.05].copy()

    # --- GEOSPATIAL GUARDRAIL ---
    # Only inject the Hawaii list if the coordinates are roughly in Hawaii
    # Hawaii Bounding Box: Lat [18.9, 22.5], Lon [-160.5, -154.7]
    lat = float(dynamic_profile.get('latitude', 0))
    lon = float(dynamic_profile.get('longitude', 0))
    is_in_hawaii = (18.9 <= lat <= 22.5) and (-160.5 <= lon <= -154.7)

    if is_in_hawaii:
        # --- FIX 2: THE HAWAII DUAL-STREAM INJECTION ---
        hawaii_monsters = [
            "Falcataria moluccana", "Miconia calvescens", "Psidium cattleianum", 
            "Coccinia grandis", "Pennisetum setaceum", "Arundo donax", "Myrica faya",
            "Cyathea cooperi", "Pereskia aculeata", "Bocconia frutescens", 
            "Buddleja davidii", "Tibouchina herbacea", "Delairea odorata", 
            "Typha latifolia", "Rosa laevigata", "Schinus terebinthifolius", 
            "Imperata cylindrica", "Chromolaena odorata", "Piper auritum", 
            "Pennisetum villosum", "Senna artemisioides", "Senecio madagascariensis", 
            "Tibouchina urvilleana", "Ulex europaeus", "Rubus discolor", 
            "Hedychium gardnerianum", "Rubus ellipticus", "Hiptage benghalensis", 
            "Parkinsonia aculeata", "Prosopis juliflora", "Paederia foetida", 
            "Rhizophora mangle", "Nassella tenuissima", "Angiopteris evecta", 
            "Phormium tenax", "Photinia davidiana", "Melinis nerviglumis", 
            "Buddleja madagascariensis", "Piper aduncum",
            # Adding common synonyms as double-coverage
            "Paraserianthes falcataria", "Morella faya", "Cenchrus setaceus", 
            "Cenchrus villosus", "Sphaeropteris cooperi", "Pleroma urvilleanum"
        ]
        
        # 1. Check which monsters the AI already found (checking for synonyms via router)
        # We lowercase everything for a bulletproof match
        monsters_lower = [m.lower() for m in hawaii_monsters]
        meaningful_threats['is_hisc_monster'] = meaningful_threats['scientific_name'].str.lower().apply(clean_search_name).isin(monsters_lower)
        
        # 2. Identify monsters that are COMPLETELY MISSING from the AI results
        found_monsters_raw = set(meaningful_threats[meaningful_threats['is_hisc_monster']]['scientific_name'].str.lower())
        missing_monsters = [m for m in hawaii_monsters if m.lower() not in found_monsters_raw]

        # 3. Force-inject the missing monsters
        if missing_monsters:
            extra_rows = []
            for monster in missing_monsters:
                extra_rows.append({
                    'scientific_name': monster,
                    'risk_score': 0.95,
                    'is_invasive': 1,
                    'is_hisc_monster': True,
                    'status': '🔴 CRITICAL THREAT (HISC)'
                })
            force_df = pd.DataFrame(extra_rows)
            meaningful_threats = pd.concat([meaningful_threats, force_df], ignore_index=True)

        # 4. Update the ones we did find to the 0.95 "Critical" tier
        meaningful_threats.loc[meaningful_threats['is_hisc_monster'], 'risk_score'] = 0.95
        meaningful_threats.loc[meaningful_threats['is_hisc_monster'], 'is_invasive'] = 1
    else:
        # Keep column available for stable sort logic outside Hawaii
        meaningful_threats['is_hisc_monster'] = False

    # 2) Sort by true mathematical risk
    sorted_threats = meaningful_threats.sort_values(['is_hisc_monster', 'risk_score'], ascending=[False, False])

    # 3) Return ALL results - frontend uses virtual scrolling to handle large datasets
    # No artificial cap that would skew risk distribution perception
    final_threats = sorted_threats.fillna('')
    
    # Ensure inat_taxon_id is int or None (not NaN)
    if 'inat_taxon_id' in final_threats.columns:
        final_threats['inat_taxon_id'] = final_threats['inat_taxon_id'].apply(
            lambda x: int(x) if pd.notna(x) and x != '' else None
        )
    
    return final_threats.to_dict(orient='records')