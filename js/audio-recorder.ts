// Inlined audio-recorder.js — small client audio recording helper
// @ts-nocheck

class AudioRecorder {
	private mediaStream: MediaStream | null = null;
	private mediaRecorder: MediaRecorder | null = null;
	private chunks: BlobPart[] = [];

	async start() {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('getUserMedia not available');
		this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
		this.mediaRecorder = new MediaRecorder(this.mediaStream as MediaStream);
		this.chunks = [];
		this.mediaRecorder.ondataavailable = (ev) => this.chunks.push(ev.data);
		this.mediaRecorder.start();
	}

	stop() {
		return new Promise<Blob>((resolve, reject) => {
			if (!this.mediaRecorder) return reject(new Error('not recording'));
			this.mediaRecorder.onstop = () => {
				const blob = new Blob(this.chunks, { type: 'audio/webm' });
				this.cleanup();
				resolve(blob);
			};
			this.mediaRecorder.stop();
		});
	}

	cleanup() {
		if (this.mediaStream) {
			for (const t of (this.mediaStream.getTracks() || [])) t.stop();
			this.mediaStream = null;
		}
		this.mediaRecorder = null;
		this.chunks = [];
	}
}

(window as any).audioRecorder = new AudioRecorder();

export {};
