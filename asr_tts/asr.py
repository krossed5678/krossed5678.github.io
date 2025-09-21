"""Simple pluggable ASR helpers.

This module provides a convenience function `transcribe_bytes` which will try
multiple local/optional backends in order:

- Vosk (offline, recommended if model installed)
- speech_recognition + pocketsphinx (offline) if available
- speech_recognition + Google Web API (online) as a last resort (requires network)

The functions are defensive: if optional dependencies are missing they return
helpful error messages instead of crashing.
"""
from typing import Optional
import tempfile
import wave
import os


def _write_temp_wav(data: bytes) -> str:
    # Accept raw wav bytes and write to a temp file
    tf = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    tf.write(data)
    tf.flush()
    tf.close()
    return tf.name


def transcribe_bytes(audio_bytes: bytes, sample_rate: Optional[int] = None) -> str:
    """Transcribe raw WAV bytes to text.

    Returns the recognized text or raises RuntimeError with helpful instructions
    when no backend is available.
    """
    wav_path = _write_temp_wav(audio_bytes)
    try:
        # Try Vosk first
        try:
            from vosk import Model, KaldiRecognizer
            import json

            # Look for model in VOSK_MODEL_PATH env or ./models/vosk
            model_path = os.environ.get("VOSK_MODEL_PATH") or os.path.join(os.getcwd(), "models", "vosk")
            if not os.path.exists(model_path):
                raise RuntimeError(f"Vosk model not found at {model_path}; set VOSK_MODEL_PATH or install a model there.")

            wf = wave.open(wav_path, "rb")
            model = Model(model_path)
            rec = KaldiRecognizer(model, wf.getframerate())
            rec.SetWords(True)
            results = []
            while True:
                data = wf.readframes(4000)
                if len(data) == 0:
                    break
                if rec.AcceptWaveform(data):
                    res = json.loads(rec.Result())
                    results.append(res.get("text", ""))
            final = json.loads(rec.FinalResult())
            results.append(final.get("text", ""))
            text = " ".join([r for r in results if r])
            if text:
                return text
        except Exception as e:
            # swallow and try next backend
            vosk_err = e

        # Try SpeechRecognition (pocketsphinx or Google fallback)
        try:
            import speech_recognition as sr

            r = sr.Recognizer()
            with sr.AudioFile(wav_path) as source:
                audio = r.record(source)
            # pocketsphinx offline
            try:
                text = r.recognize_sphinx(audio)
                if text:
                    return text
            except Exception:
                # try online google as last resort
                try:
                    text = r.recognize_google(audio)
                    if text:
                        return text
                except Exception:
                    pass
        except Exception as e:
            sr_err = e

        # If we reached here none produced results
        msgs = []
        if 'vosk_err' in locals():
            msgs.append(f"Vosk: {vosk_err}")
        if 'sr_err' in locals():
            msgs.append(f"SpeechRecognition: {sr_err}")
        hint = "; ".join(msgs) if msgs else "No optional ASR backends available. Install 'vosk' or 'speechrecognition' + 'pocketsphinx'."
        raise RuntimeError(f"No working ASR backend found: {hint}")
    finally:
        try:
            os.remove(wav_path)
        except Exception:
            pass


__all__ = ["transcribe_bytes"]
