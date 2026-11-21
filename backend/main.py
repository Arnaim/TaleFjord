
import os
import json
import asyncio
import tempfile

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from transcriber import transcribe_audio

app = FastAPI(title="TaleFjord API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "TaleFjord API is running!"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/api/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language: str = Form("auto"),
    model: str = Form("base")
):
    if model not in ["tiny", "base", "small"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid model selection"
        )

    suffix = os.path.splitext(file.filename or "")[1] or ".tmp"
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp:
            temp_path = temp.name
            content = await file.read()
            temp.write(content)

    finally:
        await file.close()

    async def event_stream():
        queue = asyncio.Queue()
        loop = asyncio.get_running_loop()

        def report_progress(progress):
            loop.call_soon_threadsafe(
                queue.put_nowait,
                {"progress": progress}
            )

        async def run_transcription():
            try:
                result = await asyncio.to_thread(
                    transcribe_audio,
                    temp_path,
                    model,
                    None if language == "auto" else language,
                    report_progress
                )

                await queue.put({"complete": result})

            except Exception as error:
                await queue.put({"error": str(error)})

            finally:
                await queue.put(None)

        task = asyncio.create_task(run_transcription())

        try:
            while True:
                message = await queue.get()

                if message is None:
                    break

                yield f"data: {json.dumps(message)}\n\n"

        finally:
            if not task.done():
                task.cancel()

            await asyncio.gather(task, return_exceptions=True)

            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

        yield "data: {\"finished\": true}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )
