'''
FastAPI application for the Invasive Species Tracker
'''

from fastapi import FastAPI
import uvicorn

# Create FastAPI app
app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Invasive Species Tracker API"}

@app.get("/api/v1/health")
def read_health():
    return {"message": "Healthy"}

@app.get("/api/v1/version")
def read_version():
    return {"message": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)