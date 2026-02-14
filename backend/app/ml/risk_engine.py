import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any

def calculate_risk(ml_df: pd.DataFrame, dynamic_profile: Dict[str, float]) -> List[Dict[str, Any]]:
    metadata_cols = ['scientific_name', 'is_invasive', 'common_name', 'image_url']
    feature_cols = [c for c in ml_df.columns if c not in metadata_cols]
    
    matrix = ml_df[feature_cols].copy()
    
    target_vec = np.zeros((1, len(feature_cols)))
    for feature, value in dynamic_profile.items():
        if feature in feature_cols:
            idx = feature_cols.index(feature)
            target_vec[0, idx] = value
            
    scores = cosine_similarity(matrix, target_vec).flatten()
    
    results = ml_df[['scientific_name', 'is_invasive']].copy()
    if 'common_name' in ml_df.columns:
        results['common_name'] = ml_df['common_name']
    
    results['risk_score'] = scores
    
    top_risks = results.sort_values('risk_score', ascending=False).head(50)
    return top_risks.to_dict(orient='records')