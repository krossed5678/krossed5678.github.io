// @ts-nocheck
/**
 * legacy-features.ts
 * Small compatibility helpers for legacy behaviors preserved for migration.
 */

class LegacyFeatures {
	static noop() { /* intentionally empty for legacy placeholder */ }

	static warnIfUsed(featureName: string) {
		try { console.warn(`[LegacyFeatures] ${featureName} is legacy and should be migrated.`); } catch {}
	}
}

declare global { interface Window { LegacyFeatures?: typeof LegacyFeatures } }
(window as any).LegacyFeatures = LegacyFeatures;
export default LegacyFeatures;
export {};
