from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import Optional, List
import pandas as pd
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()
from backend.data_loader import load_data

app = FastAPI(title="Phone Price Tracker API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (frontend)
app.mount("/static", StaticFiles(directory="frontend"), name="static")

# Load data once at startup
df = load_data()

@app.get("/")
async def root():
    """Serve the main HTML page"""
    return FileResponse("frontend/index.html")

@app.get("/api/models")
async def get_models():
    """Get list of all unique phone models"""
    models = df["model"].unique().tolist()
    return {"models": models}

@app.get("/api/data")
async def get_data(
    model: Optional[str] = None,
    color: Optional[str] = None,
    ram: Optional[str] = None,
    storage: Optional[str] = None
):
    """Get price data with optional filters"""
    filtered_df = df.copy()
    
    if model:
        filtered_df = filtered_df[filtered_df["model"] == model]
    if color:
        filtered_df = filtered_df[filtered_df["color"] == color]
    if ram:
        filtered_df = filtered_df[filtered_df["ram"] == ram]
    if storage:
        filtered_df = filtered_df[filtered_df["storage"] == storage]
    
    return filtered_df.to_dict(orient="records")

@app.get("/api/stats")
async def get_stats(
    model: Optional[str] = None,
    color: Optional[str] = None,
    ram: Optional[str] = None,
    storage: Optional[str] = None
):
    """Get statistics for filtered data"""
    filtered_df = df.copy()
    
    if model:
        filtered_df = filtered_df[filtered_df["model"] == model]
    if color:
        filtered_df = filtered_df[filtered_df["color"] == color]
    if ram:
        filtered_df = filtered_df[filtered_df["ram"] == ram]
    if storage:
        filtered_df = filtered_df[filtered_df["storage"] == storage]
    
    if filtered_df.empty:
        return {
            "min_price": 0,
            "max_price": 0,
            "avg_price": 0,
            "current_price": 0,
            "total_records": 0
        }
    
    # Get the most recent price
    filtered_df_sorted = filtered_df.sort_values("timestamp", ascending=False)
    current_price = filtered_df_sorted.iloc[0]["price"] if not filtered_df_sorted.empty else 0
    
    return {
        "min_price": float(filtered_df["price"].min()),
        "max_price": float(filtered_df["price"].max()),
        "avg_price": float(filtered_df["price"].mean()),
        "current_price": float(current_price),
        "total_records": len(filtered_df)
    }

@app.get("/api/price-history/{model}")
async def get_price_history(
    model: str,
    color: Optional[str] = None,
    ram: Optional[str] = None,
    storage: Optional[str] = None
):
    """Get price history for a specific model configuration"""
    filtered_df = df[df["model"] == model].copy()
    
    if color:
        filtered_df = filtered_df[filtered_df["color"] == color]
    if ram:
        filtered_df = filtered_df[filtered_df["ram"] == ram]
    if storage:
        filtered_df = filtered_df[filtered_df["storage"] == storage]
    
    # Group by date and get average price per day
    filtered_df["date"] = pd.to_datetime(filtered_df["timestamp"]).dt.date
    daily_avg = filtered_df.groupby("date")["price"].mean().reset_index()
    daily_avg["date"] = daily_avg["date"].astype(str)
    
    return daily_avg.to_dict(orient="records")

@app.get("/api/filters")
async def get_filter_options(model: Optional[str] = None):
    """Get available filter options"""
    filtered_df = df.copy()
    
    if model:
        filtered_df = filtered_df[filtered_df["model"] == model]
    
    return {
        "colors": sorted(filtered_df["color"].unique().tolist()),
        "ram": sorted(filtered_df["ram"].unique().tolist()),
        "storage": sorted(filtered_df["storage"].unique().tolist())
    }
