"""Simple TTS helpers with offline + online fallbacks.

Provides `synthesize_text_to_mp3(text)` which returns MP3 bytes. Tries:
- pyttsx3 (offline) to write WAV and convert to MP3 if ffmpeg is available
- gTTS (Google) as a fallback (requires network)

The module is defensive: if optional libs are missing it raises RuntimeError
with guidance rather than crashing.
"""
from typing import Optional
import tempfile
import os


def synthesize_text_to_wav_bytes_pyttsx3(text: str) -> bytes:
    try:
        import pyttsx3
    except Exception as e:
        raise RuntimeError("pyttsx3 not installed: " + str(e))

    tf = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    tf.close()
    try:
        engine = pyttsx3.init()
        engine.save_to_file(text, tf.name)
        engine.runAndWait()
        with open(tf.name, 'rb') as f:
            return f.read()
    finally:
        try:
            os.remove(tf.name)
        except Exception:
            pass


def synthesize_text_to_mp3(text: str) -> bytes:
    # Prefer pyttsx3 offline path and convert to mp3 via ffmpeg if available
    try:
        wav = synthesize_text_to_wav_bytes_pyttsx3(text)
        # try to convert with ffmpeg (if present)
        import subprocess
        inf = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        outf = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        inf.close(); outf.close()
        try:
            with open(inf.name, 'wb') as f:
                f.write(wav)
            cmd = ['ffmpeg','-y','-i',inf.name,'-q:a','2',outf.name]
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            with open(outf.name,'rb') as f:
                return f.read()
        finally:
            try: os.remove(inf.name)
            except: pass
            try: os.remove(outf.name)
            except: pass
    except Exception:
        # fallback to gTTS
        try:
            from gtts import gTTS
            tf = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
            tf.close()
            t = gTTS(text=text, lang='en')
            t.save(tf.name)
            with open(tf.name,'rb') as f:
                data = f.read()
            try: os.remove(tf.name)
            except: pass
            return data
        except Exception as e:
            raise RuntimeError("No TTS backend available (pyttsx3/ffmpeg or gTTS) - " + str(e))


__all__ = ["synthesize_text_to_mp3"]
