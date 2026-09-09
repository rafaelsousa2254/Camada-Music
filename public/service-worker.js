const CACHE_NAME = "camadaplay-v2";
const PRECACHE = ["/", "/CamadaPlay.html", "/style.css", "/script.js", "/manifest.json", "/assets/icon-192.svg", "/assets/icon-512.svg"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});

self.addEventListener("media-play", (event) => {
    event.waitUntil(self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "MEDIA_COMMAND", command: "play" }));
    }));
});

self.addEventListener("media-pause", (event) => {
    event.waitUntil(self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "MEDIA_COMMAND", command: "pause" }));
    }));
});

self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SET_MEDIA_METADATA") {
        self.registration.mediaSession?.setPositionState?.(event.data.state);
    }
});
