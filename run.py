import uvicorn

if __name__ == "__main__":
    print("🚀 Starting Phone Price Tracker API...")
    print("📊 Dashboard will be available at: http://localhost:8000")
    print("📡 API docs available at: http://localhost:8000/docs")
    
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
