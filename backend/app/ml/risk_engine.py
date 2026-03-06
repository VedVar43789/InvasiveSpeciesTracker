import pandas as pd
import numpy as np
import json
import os
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any

def _load_feature_means() -> Dict[str, float]:
    """Load global feature means from feature_means.json for centering."""
    backend_dir = os.path.dirname(os.path.dirname(__file__))  # backend/app -> backend
    root_dir = os.path.dirname(backend_dir)  # backend -> root
    means_path = os.path.join(root_dir, "notebooks", "feature_means.json")
    
    if os.path.exists(means_path):
        try:
            with open(means_path, 'r') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def calculate_risk(ml_df: pd.DataFrame, dynamic_profile: Dict[str, float]) -> List[Dict[str, Any]]:
    # Use only the core 4 environmental features (matching notebook verification)
    # This prevents "ghost columns" (one-hot habits, light, growth_rates) from diluting scores
    feature_cols = [
        'growth_ph_minimum',
        'growth_ph_maximum',
        'growth_minimum_precipitation_mm',
        'native_region_count'
    ]
    
    # Verify all required features exist in the dataframe
    missing = [col for col in feature_cols if col not in ml_df.columns]
    if missing:
        raise ValueError(f"Required feature columns missing from CSV: {missing}")

    # CSV is already mean-centered, so use as-is
    matrix = ml_df[feature_cols].apply(pd.to_numeric, errors='coerce').fillna(0.0)
    
    # Load feature means for centering the incoming dynamic_profile
    feature_means = _load_feature_means()
    
    target_vec = np.zeros((1, len(feature_cols)), dtype=float)
    for feature, value in dynamic_profile.items():
        if feature in feature_cols:
            idx = feature_cols.index(feature)
            try:
                raw_value = float(value)
                # Center the raw input value by subtracting the global mean
                mean = feature_means.get(feature, 0.0)
                centered_value = raw_value - mean
                target_vec[0, idx] = centered_value
            except (TypeError, ValueError):
                # Ignore non-numeric dynamic values safely
                continue
            
    scores = cosine_similarity(matrix, target_vec).flatten()
    
    results = ml_df[['scientific_name', 'is_invasive', 'inat_taxon_id']].copy()
    if 'common_name' in ml_df.columns:
        results['common_name'] = ml_df['common_name']
    
    results['risk_score'] = scores
    
    # === ECOLOGICAL RISK MULTIPLIER ===
    # Apply heuristic boosts to prioritize aggressive invasive species
    
    # Invasive Boost: Species marked as invasive get 1.2x multiplier
    if 'is_invasive' in ml_df.columns:
        results.loc[ml_df['is_invasive'] == 1, 'risk_score'] *= 1.2
    
    # Growth Boost: Species with rapid growth get 1.1x multiplier
    if 'growth_rate_Rapid' in ml_df.columns:
        results.loc[ml_df['growth_rate_Rapid'] == 1, 'risk_score'] *= 1.1
    
    # Data Quality Penalty: Species with unknown ph_source get 0.9x penalty
    if 'ph_source' in ml_df.columns:
        results.loc[ml_df['ph_source'] == 'Unknown', 'risk_score'] *= 0.9
    
    # Clip scores to [0, 1.0] to ensure no score exceeds 100%
    results['risk_score'] = np.clip(results['risk_score'], 0.0, 1.0)
    
    top_risks = results.sort_values('risk_score', ascending=False)
    return top_risks.to_dict(orient='records')