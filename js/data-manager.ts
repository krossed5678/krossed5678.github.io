// Inlined data-manager.js — client-side lightweight storage/cache helpers
// @ts-nocheck

class DataManager {
	constructor(namespace = 'app') {
		this.namespace = namespace;
		this.memory = new Map();
	}

	key(key: string) { return `${this.namespace}:${key}`; }

	setItem(key: string, value: any) {
		try {
			const s = JSON.stringify(value);
			localStorage.setItem(this.key(key), s);
			this.memory.set(key, value);
			return true;
		} catch (e) { console.warn('setItem failed', e); return false; }
	}

	getItem(key: string, fallback: any = null) {
		if (this.memory.has(key)) return this.memory.get(key);
		try {
			const s = localStorage.getItem(this.key(key));
			if (!s) return fallback;
			const v = JSON.parse(s);
			this.memory.set(key, v);
			return v;
		} catch (e) { return fallback; }
	}

	removeItem(key: string) { localStorage.removeItem(this.key(key)); this.memory.delete(key); }

	clear() {
		for (const k of Object.keys(localStorage)) {
			if (k.startsWith(this.namespace + ':')) localStorage.removeItem(k);
		}
		this.memory.clear();
	}
}

(window as any).dataManager = new DataManager('krossed');

export {};
