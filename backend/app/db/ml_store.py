import pandas as pd
from typing import Optional

_ml_df: Optional[pd.DataFrame] = None

def load_ml_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    return df

def set_ml_df(df: pd.DataFrame) -> None:
    global _ml_df
    _ml_df = df

def get_ml_df() -> pd.DataFrame:
    if _ml_df is None:
        raise RuntimeError("ML Data not loaded. Check lifespan in main.py")
    return _ml_df

def unload_ml_df() -> None:
    global _ml_df
    _ml_df = None