import { projectState } from '../inspector/sanitizer';
// MAIN world: reuse the official client's responses. No requests, cookies or custom headers.
(() => {
    const marker = '__blockidle_companion_observer_v1__';
    const host = window as unknown as Record<string, unknown>;
    if (host[marker])
        return;
    host[marker] = true;
    const endpoint = (input: unknown) => {
        try {
            const url = new URL(input instanceof Request ? input.url : String(input), location.href);
            return url.origin === location.origin && url.pathname === '/api/estado';
        }
        catch {
            return false;
        }
    };
    const publish = (input: unknown) => {
        try {
            const state = projectState(input);
            window.postMessage({ channel: 'BLOCKIDLE_COMPANION_STATE_V1', state }, location.origin);
        }
        catch { /* Ignore responses that are not recognized state envelopes. */ }
    };
    const originalFetch = window.fetch;
    window.fetch = async function (...args: Parameters<typeof fetch>) {
        const response = await originalFetch.apply(this, args);
        if (endpoint(args[0]) && response.ok) {
            void response.clone().text().then(text => {
                if (text.length <= 8000000)
                    publish(JSON.parse(text));
            }).catch(() => { });
        }
        return response;
    };
    const originalOpen = XMLHttpRequest.prototype.open, originalSend = XMLHttpRequest.prototype.send;
    const matched = new WeakSet<XMLHttpRequest>();
    XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: unknown[]) {
        matched.delete(this);
        if (endpoint(url))
            matched.add(this);
        return (originalOpen as (...a: unknown[]) => void).apply(this, [method, url, ...rest]);
    };
    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
        if (matched.has(this))
            this.addEventListener('load', () => {
                try {
                    if (this.status >= 200 && this.status < 300) {
                        if (this.responseType === 'json')
                            publish(this.response);
                        else if ((this.responseType === '' || this.responseType === 'text') && this.responseText.length <= 8000000)
                            publish(JSON.parse(this.responseText));
                    }
                }
                catch { /* A malformed game response must not affect the game. */ }
            }, { once: true });
        return originalSend.call(this, body);
    };
})();
