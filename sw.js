// 一度開いたら、通信がなくてもひとり用で遊べるようにするためのキャッシュ。
// パスはこのファイルの場所からの相対（GitHub Pages の /bridge/ のようなサブフォルダでも動く）。
const CACHE = "bridge-v2";
const INDEX = new URL("./index.html", self.location).href;
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html", "./icon.svg"]))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  if (!sameOrigin && !url.hostname.endsWith("fonts.googleapis.com") && !url.hostname.endsWith("fonts.gstatic.com")) return;
  // ページ本体は新しいものを優先し、だめならキャッシュ。ほかはキャッシュ優先（JS・CSSは名前に版が入るので古いものは使われない）。
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(INDEX, cp)); return res; }).catch(() => caches.match(INDEX)));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok || res.type === "opaque") { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return res; })));
});
