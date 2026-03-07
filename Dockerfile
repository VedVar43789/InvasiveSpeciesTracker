FROM python:3.10-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY notebooks/ ./notebooks/

# Replace LFS pointer with real FAISS index from Supabase
RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/* \
  && curl -L -o /app/notebooks/plants_climate_4d.faiss \
    "https://kvffocupazyduunrsayh.supabase.co/storage/v1/object/public/invasivespecies/plants_climate_4d.faiss"

RUN curl -L -o /app/notebooks/plants_metadata.csv \
    "https://kvffocupazyduunrsayh.supabase.co/storage/v1/object/public/invasivespecies/plants_metadata.csv"

WORKDIR /app/backend

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]