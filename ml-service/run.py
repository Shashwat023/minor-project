# ml-service/run.py
# Entry point — start the ml-service FastAPI server on port 8002.

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main2:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info",
    )
