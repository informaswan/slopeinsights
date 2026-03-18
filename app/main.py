# app/main.py
from fastapi import FastAPI

app = FastAPI(title="PowderPass API")


@app.get("/health")
def health():
    return {"status": "ok"}
