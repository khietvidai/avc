/**
 * Cookie consent — storage contract, shared constants and the inline bootstrap.
 *
 * The record lives in localStorage under CONSENT_KEY. A tiny cookie
 * (CONSENT_COOKIE) mirrors it so a Cloudflare Worker can read the choice
 * server-side later without a rewrite. localStorage stays the source of truth
 * for the UI; the cookie is a projection.
 *
 * Public browser API, defined by CookieConsent.astro:
 *
 *   window.avcConsent = {
 *     get(): ConsentState | null,
 *     has(category): boolean,   // false when nothing has been chosen yet
 *     open(): void,             // open the cookie card
 *     accept(): void,
 *     deny(): void,
 *     save(categories): void,
 *   }
 *
 * Every persisted change dispatches CONSENT_EVENT on `document` (bubbling), and
 * a stored state is re-dispatched once on load. To gate a future analytics tag,
 * add an `is:inline` script in <head>:
 *
 *   if (window.avcConsent && window.avcConsent.has("analytics")) load();
 *   document.addEventListener("avc:consent", function (e) {
 *     if (e.detail.categories.analytics) load();
 *   });
 *
 * Both paths matter: the head script runs before the module defines the global,
 * so a returning visitor is served by the initial dispatch.
 */

export const CONSENT_KEY = "avc-consent";
export const CONSENT_COOKIE = "avc_consent";
export const CONSENT_EVENT = "avc:consent";

/** Bump to invalidate stored choices and re-prompt (e.g. after adding a vendor). */
export const CONSENT_VERSION = 1;

/** ePrivacy / CNIL guidance: ask again after 12 months. */
export const CONSENT_MAX_AGE_DAYS = 365;

export const CONSENT_CATEGORIES = ["necessary", "functional", "analytics", "marketing"] as const;

export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];

export type ConsentCategories = Record<ConsentCategory, boolean>;

export interface ConsentState {
	/** Schema version — see CONSENT_VERSION. */
	v: number;
	/** ISO timestamp of the choice. */
	ts: string;
	categories: ConsentCategories;
}

export interface AvcConsentApi {
	get(): ConsentState | null;
	has(category: ConsentCategory): boolean;
	open(): void;
	accept(): void;
	deny(): void;
	save(categories: Partial<ConsentCategories>): void;
}

/** Opt-in by default: only the necessary bucket starts on. Returns a fresh object. */
export function defaultCategories(): ConsentCategories {
	return { necessary: true, functional: false, analytics: false, marketing: false };
}

export function allGranted(): ConsentCategories {
	return { necessary: true, functional: true, analytics: true, marketing: true };
}

export function necessaryOnly(): ConsentCategories {
	return defaultCategories();
}

/**
 * Cookie payload: `<version>.<necessary><functional><analytics><marketing>`,
 * e.g. `1.1010`. Seven bytes, no personal data, trivial to parse in a Worker.
 */
export function consentCookieValue(state: ConsentState): string {
	const bits = CONSENT_CATEGORIES.map((name) => (state.categories[name] ? "1" : "0")).join("");
	return `${state.v}.${bits}`;
}

/**
 * ES5 IIFE injected with `is:inline` right after the banner markup.
 *
 * It must stay inline: bundled Astro scripts are deferred modules that this SSR
 * adapter appends after </html> (src/utils/html-w3c.ts moves them back before
 * </body>), so they run after the document is parsed. The banner therefore ships
 * `hidden` and is unhidden here, synchronously, during the same parse pass — no
 * flash for returning visitors, no late pop-in for first-time ones.
 *
 * Constants are interpolated from above so there is exactly one source of truth;
 * `is:inline` gets no bundling, no imports and no TypeScript.
 */
export const CONSENT_BOOTSTRAP_SCRIPT = `
(function () {
	var KEY = ${JSON.stringify(CONSENT_KEY)};
	var VERSION = ${CONSENT_VERSION};
	var MAX_AGE = ${CONSENT_MAX_AGE_DAYS} * 864e5;
	var state = null;

	try {
		var raw = localStorage.getItem(KEY);
		if (raw) {
			var parsed = JSON.parse(raw);
			if (
				parsed &&
				parsed.v === VERSION &&
				parsed.categories &&
				Date.now() - Date.parse(parsed.ts) < MAX_AGE
			) {
				state = parsed;
			}
		}
	} catch (err) {
		/* localStorage throws in Safari private browsing — treat as no choice. */
	}

	window.__avcConsent = state;
	document.documentElement.setAttribute("data-cc", state ? "set" : "pending");

	if (!state) {
		var el = document.getElementById("cc");
		if (el) {
			el.hidden = false;
		}
	}

	/* The card is interactive before the module boots. Queue early clicks and
	   let the module replay them, so a fast choice is never swallowed. */
	window.__avcQueue = [];
	document.addEventListener(
		"click",
		function (event) {
			if (window.avcConsent) return;
			var target = event.target;
			if (!target || !target.closest) return;
			var btn = target.closest("[data-cc-action]");
			if (!btn) return;
			event.preventDefault();
			window.__avcQueue.push(btn.getAttribute("data-cc-action"));
		},
		true,
	);
})();
`;

declare global {
	interface Window {
		avcConsent?: AvcConsentApi;
		__avcConsent?: ConsentState | null;
		__avcQueue?: string[];
	}
}
