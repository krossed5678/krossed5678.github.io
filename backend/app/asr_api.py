from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
import io

router = APIRouter()

@router.post('/asr/transcribe')
async def transcribe(file: UploadFile = File(...)):
    data = await file.read()
    try:
        from asr_tts.asr import transcribe_bytes
        text = transcribe_bytes(data)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/asr/speak')
async def speak(body: dict):
    text = body.get('text')
    if not text:
        raise HTTPException(status_code=400, detail="text required")
    try:
        from asr_tts.tts import synthesize_text_to_mp3
        mp3 = synthesize_text_to_mp3(text)
        return StreamingResponse(io.BytesIO(mp3), media_type='audio/mpeg')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
