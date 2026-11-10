import{pathToFileURL as Oe}from"url";import{join as z}from"path";import*as k from"fs";import*as C from"path";import*as oe from"esbuild";import{createHash as ee}from"crypto";function Z(e){let n=2166136261,t=typeof e=="string"?new TextEncoder().encode(e):e;for(let s=0;s<t.length;s++)n^=t[s],n=Math.imul(n,16777619);return(n>>>0).toString(36)}var G=C.join(process.cwd(),"dist"),E=null,te=new Map,ie=!1,F=!1;function ae(e){ie=e==="split",F=e==="sliced"}var ne="",se="";function re(){let e=Re;return ne!==""&&(e=e.replace("connect-src 'self'",`connect-src 'self' ${ne}`)),se!==""&&(e=e.replace("img-src 'self' data: https://fastly.picsum.photos",`img-src 'self' data: https://fastly.picsum.photos ${se}`)),e}function Q(e,n=G){if(ie)return null;let t=F&&e?C.join(n,"slices",`${e}.js`):C.join(n,"client.js");try{let s=k.statSync(t);if(F&&e){let a=te.get(e+"\0"+n);if(a&&a.mtimeMs===s.mtimeMs)return a.source;let c=k.readFileSync(t,"utf-8");return te.set(e+"\0"+n,{mtimeMs:s.mtimeMs,source:c}),c}return(!E||E.for!==n||E.mtimeMs!==s.mtimeMs)&&(E={for:n,mtimeMs:s.mtimeMs,source:k.readFileSync(t,"utf-8")}),E.source}catch{return F&&e?Q(null,n):null}}var B=null;function q(){try{let e=C.join(G,"client.js"),n=k.statSync(e);return(!B||B.mtimeMs!==n.mtimeMs)&&(B={mtimeMs:n.mtimeMs,v:Z(k.readFileSync(e))}),B.v}catch{return""}}function ce(){let e=q();return e?`/client.js?v=${e}`:"/client.js"}var D=null;function le(){let e=C.join(G,"styles.css");try{let n=k.statSync(e);return(!D||D.mtimeMs!==n.mtimeMs)&&(D={mtimeMs:n.mtimeMs,source:k.readFileSync(e,"utf-8")}),D.source}catch{return""}}var Y=`
// shell = false: the document's SSR content sits directly in <body> - no
// #app wrapper, no demo styles, so a real theme's CSS owns the document from
// the first byte (and a JS-less visitor never sees either). The bundle still
// runs, and it still needs its container: wrap the content once, here, before
// any theme script executes (module scripts run before DOMContentLoaded). The
// wrapper is a plain unstyled div, so the re-parent is visually inert; every
// later path - adoption, navigation, forms - is then the ordinary one.
let __app = document.getElementById('app');
if (!__app) {
  __app = document.createElement('div');
  __app.id = 'app';
  // scripts stay outside the wrapper, exactly where the dressed document
  // keeps them: the state element and the running module must survive a
  // navigation's innerHTML swap (they are the document's, not the route's).
  for (const node of Array.from(document.body.children)) {
    if (node.tagName !== 'SCRIPT') __app.appendChild(node);
  }
  document.body.appendChild(__app);
}
// Native View Transitions around client-side navigation (progressive:
// browsers without the API navigate normally, no polyfill, no CSS required).
// F35: stash the CURRENT entry's scroll position into its history state
// before a new push - the browser only restores scroll on full page loads; a
// pjax swap would land wherever the swap left it.
function __saveScroll() {
  try {
    const s = history.state || {};
    history.replaceState(Object.assign({}, s, { __rosezmScroll: window.scrollY }), '');
  } catch (e) { /* history state unavailable (file:// edge): best effort */ }
}
function __navigate(pathname, restore) {
  const paint = () => {
    const p = start(__app, pathname);
    if (restore) {
      // back/forward: restore the entry's scroll (top when it has none)
      const s = history.state || {};
      const y = typeof s.__rosezmScroll === 'number' ? s.__rosezmScroll : 0;
      return Promise.resolve(p).then(() => { window.scrollTo(0, y); }, () => { window.scrollTo(0, y); });
    }
    // a fresh navigation starts at the top, like a full page load
    window.scrollTo(0, 0);
    return p;
  };
  if (document.startViewTransition) {
    return document.startViewTransition(paint).updateCallbackDone;
  }
  return paint();
}
window.addEventListener('popstate', () => __navigate(window.location.pathname, true));
document.addEventListener('click', (e) => {
  const a = e.target.tagName === 'A' ? e.target : e.target.closest && e.target.closest('a');
  if (a && a.getAttribute('href') && a.getAttribute('href').startsWith('/')) {
    e.preventDefault();
    __saveScroll();
    history.pushState(null, '', a.getAttribute('href'));
    __navigate(window.location.pathname);
  }
});
// Prefetch the target route's full render (including $data) on hover, keyboard
// focus, or touch - the click that follows paints from cache: no await, no
// request. Other frameworks prefetch data only; rosezm prefetches the render
// because the inlined bundle already contains every route.
function __prefetchHandler(e) {
  const a = e.target.closest && e.target.closest('a[href^="/"]');
  if (a && prefetch) prefetch(a.getAttribute('href'), 'hover');
}
document.addEventListener('mouseover', __prefetchHandler);
document.addEventListener('focusin', __prefetchHandler);
document.addEventListener('touchstart', __prefetchHandler, { passive: true });
// Viewport + idle prefetch (viewport-triggered): once a link scrolls into view and the
// browser is idle, its route renders ahead of any interaction. trade-off: both
// APIs are feature-detected; without them the hover/focus/touch path above
// still covers every link.
if (prefetch && 'IntersectionObserver' in window && 'requestIdleCallback' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target); // one-shot per element; fresh links re-observe after nav
      requestIdleCallback(() => prefetch(e.target.getAttribute('href'), 'viewport'));
    }
  });
  // observing an already-observed element is a no-op, so re-sweeping is cheap
  const observeLinks = () => {
    for (const a of document.querySelectorAll('a[href^="/"]')) io.observe(a);
  };
  observeLinks();
  // navigation swaps the container's innerHTML: re-observe the fresh links
  const __rawNav = __navigate;
  __navigate = (p) => __rawNav(p).then(observeLinks, () => {});
}
// Progressive-enhancement forms: <form method="POST"> backed by a server
// action. With JS the submit is intercepted and handed to postForm (one
// request, in-place adopt). Without JS the browser performs the native POST
// and the server re-renders the page: the same form works with JavaScript
// disabled, which Server Actions in other frameworks do not.
document.addEventListener('submit', (e) => {
  const f = e.target;
  if (!f || f.tagName !== 'FORM' || f.hasAttribute('data-on-submit')) return;
  if ((f.getAttribute('method') || '').toLowerCase() !== 'post') return;
  e.preventDefault();
  postForm(new FormData(f));
});
// Dev seam: the live signal graph, readable as JSON. Three callers, one
// implementation: the dev server's reload bridge snapshots it before a
// rebuild-triggered reload so the edit lands on the state the developer had,
// and the devtools extension (devtools/) reads it the same way - the signal
// graph plus the prefetch counters, which is the whole observable state of a
// running page. Both are DIRECT references (no wrapper arrow): the names take
// no arguments, so the call is identical and every document that carries the
// bundle pays eleven bytes for the pair instead of forty.
window.__rosezm = { state: serializeState, prefetch: prefetchStats };
// initial=true: DOM is SSR output, resume state + wire markers (zero hydration).
// If the document was rendered for a DIFFERENT route (a static-file server's
// SPA fallback serves index.html for unknown paths), adopt nothing - let the
// client router render the requested route from scratch.
const __st = document.getElementById('__rosezm_state');
let __state = __st ? JSON.parse(__st.textContent || '{}') : {};
// The dev server's reload bridge hands the pre-reload signal graph back inside
// the next document (window.__rosezm_resume). The resumed values win over the
// fresh render's, but the ROUTE stays the one the server just rendered - and
// the route renders client-side from the bundle rather than adopting the SSR
// DOM, because a resumed list can be longer than the document's rows and
// adoption could not add them. Absent in every non-dev document.
const __resumed = window.__rosezm_resume ? JSON.parse(window.__rosezm_resume) : null;
if (__resumed) {
  const __route = __state.__route;
  __state = Object.assign(__state, __resumed);
  __state.__route = __route;
}
// A NOT-FOUND document (the server stamps __notFound onto its state) boots
// into the app's own 404 route: the URL matches no route - or a catch-all
// whose resolver threw notFound(), whose key sits null in the resumed state
// and whose template would dereference it into a 500. startNotFound paints
// the not-found route from the resumed state instead (zero requests).
if (__state.__notFound) {
  startNotFound(__app, window.location.pathname);
} else if (__resumed) {
  start(__app, window.location.pathname);
} else if (__state.__route === window.location.pathname) {
  // Lazy hydration (opt-in via export const lazyHydration = true in the root
  // layout): defer the initial wire() until the browser is idle so the SSR
  // paint is interactive-to-paint without blocking on the event wiring. Falls
  // back to eager wiring where requestIdleCallback is unavailable.
  if (window.__rosezmLazy && typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => start(__app, window.location.pathname, true));
  } else {
    start(__app, window.location.pathname, true);
  }
} else {
  start(__app, window.location.pathname);
}
`,M=null;function ue(){if(M===null)if(globalThis.__rosezm_SKIP_MINIFY)M=Y;else try{M=oe.transformSync(Y,{minify:!0}).code}catch{M=Y}return M}var Re="style-src 'unsafe-inline'; img-src 'self' data: https://fastly.picsum.photos; font-src 'self' data:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'",ke={"strict-transport-security":"max-age=31536000","x-content-type-options":"nosniff","x-frame-options":"DENY","referrer-policy":"strict-origin-when-cross-origin","permissions-policy":"accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), usb=(), xr-spatial-tracking=()"},L=null,J=null;function de(){let e=q();return(J===null||J.v!==e)&&(J={v:e,s:`
import { start, startNotFound, prefetch, postForm, prefetchStats, serializeState } from '${ce()}';
${ue()}`}),J.s}var V=null;function he(e){if(V!==null&&V.for===e)return V.out;let n=/\bexport\s*\{([^}]*)\}\s*;?\s*$/.exec(e),t=e,s="";n&&(t=e.slice(0,n.index)+e.slice(n.index+n[0].length),s=n[1].split(",").map(c=>{let l=c.split(" as ").map(u=>u.trim());return l.length===1||l[0]===l[1]?"":l[0]&&l[1]?`var ${l[1]} = ${l[0]};`:""}).join(""));let a=`
${t}
${s}
${ue()}`;return V={for:e,out:a},a}function W(){let e=new Uint8Array(16);crypto.getRandomValues(e);let n="";for(let t of e)n+=String.fromCharCode(t);return btoa(n)}function pe(e,n=""){let t={...ke};if(n)return t["Content-Security-Policy"]=`script-src 'nonce-${n}' 'strict-dynamic'; ${re()}`,t;if(!L||L.for!==e||L.v!==(e?"":q())){let s=e?`'sha256-${ee("sha256").update(he(e),"utf-8").digest("base64")}'${F?" 'self'":""}`:`'self' 'sha256-${ee("sha256").update(de(),"utf-8").digest("base64")}'`;L={for:e,v:e?"":q(),value:`script-src ${s}; ${re()}`}}return t["Content-Security-Policy"]=L.value,t}var me=`<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\u{1F339}</text></svg>">`,$e=`
    body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; }
    button { padding: 0.5rem 1rem; font-size: 1rem; margin-right: 0.5rem; }
    a { color: #e91e63; text-decoration: none; font-weight: bold; }
    a:hover { text-decoration: underline; }
    nav a { margin-right: 1rem; }
    .rh { border-bottom: 2px solid #e91e63; margin-bottom: 1.5rem; padding-bottom: 0.75rem; }
    .rb { font-size: 1.25rem; }
    .rn { display: inline-block; margin-left: 1.5rem; }
    .rf { margin-top: 2rem; color: #888; font-size: 0.85rem; }
    ::view-transition-old(root), ::view-transition-new(root) { animation-duration: .18s; }
  `;var fe=$e.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^"']+/g,e=>e[0]==='"'||e[0]==="'"?e:e.replace(/\s+/g," ").replace(/\s*([:;{},])\s*/g,"$1").trim()).trim();function Te(e){let n=new Map,t=[],s=new Map,a=(c,l)=>{n.has(c)||(n.set(c,l),t.push(c))};for(let c of e){for(let l of c.matchAll(/<title[^>]*>[\s\S]*?<\/title>/gi))a("title",l[0]);for(let l of c.matchAll(/<(\w+)((?:\s+[\w:-]+(?:=(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(?:\/>|>([\s\S]*?)<\/\1\s*>|>)/gi)){let u=l[1].toLowerCase();if(u==="title")continue;let y=l[2],b=v=>{let $=y.match(new RegExp(`\\s${v}=(?:"([^"]*)"|'([^']*)')`,"i"));return $?$[1]??$[2]:null},w=y.match(/\sid=(?:"([^"]*)"|'([^']*)')/i),o=b("name"),p=b("property"),r=b("rel"),m=b("charset"),h;o!==null?h=`${u}:${o}`:p!==null?h=`${u}:${p}`:r!==null?h=`${u}:${r}${xe(r,b)}`:m!==null?h=`${u}:${m}`:w?h=`${u}:${w[1]??w[2]}`:(h=`${u}:#${s.get(u)??0}`,s.set(u,(s.get(u)??0)+1)),h=h.replace(/"/g,"");let f=l[0].replace(/^<\w+/,v=>`${v} data-rosezm-head="${h}"`);a(h,f)}}return t.map(c=>n.get(c)).join(`
  `)}function xe(e,n){return/(^|\s)canonical(\s|$)/i.test(e)?"":`@${n("href")??n("type")??n("as")??""}`}function K(e,n=""){let t=n?` nonce="${n}"`:"";if(e)return`<script type="module"${t}>${he(e)}</script>`;let s=ce();return`${`<link rel="modulepreload" href="${s}" crossorigin>`}
<script type="module"${t} src="${s}" fetchpriority="high"></script>
<script type="module"${t}>${de()}</script>`}function ge(e=le(),n="en",t="",s=!0,a=""){let c=e?`
  <style>${e}</style>`:"",l=s&&!c?`
  <style>${fe}</style>`:"",u=s?`
  <div id="app">`:"";return`<!DOCTYPE html>
<html lang="${n}"${t?` dir="${t}"`:""}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="${a||"width=device-width, initial-scale=1.0"}">
  <title>rosezm</title>${l}${c}
  ${me}
</head>
<body>${u}`}function we(e,n,t,s=[],a=le(),c=!0,l="en",u="",y="",b=!0,w=""){let o=Te(s),p=y?o.replace(/<script\b([^>]*)>/gi,(P,x)=>/\bnonce=/.test(x)?P:`<script${x} nonce="${y}">`):o,r=` lang="${l}"${u?` dir="${u}"`:""}`,m="",h=p.replace(/<(html|body)\b([^>]*)>/gi,(P,x,i)=>{let d=i.replace(/\s*data-rosezm-head="[^"]*"/,"");return x==="html"?r=d:m=d,""}),f=/<title>/i.test(o)?"":"<title>rosezm</title>",v=/rel=["']?icon/i.test(o)?"":`
  ${me}`,$=h?`
  ${h}`:"",O=a?`
  <style>${a}</style>`:"",j=n.replace(/</g,"\\u003c"),X=c?`
  <script type="application/json" id="__rosezm_state">${j}</script>
  ${K(t,y)}`:"",g=c&&b?'<div id="app">':"",U=c&&b?"</div>":"",H=c&&b&&!O?`
  <style>${fe}</style>`:"";return`<!DOCTYPE html>
<html${r}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="${w||"width=device-width, initial-scale=1.0"}">${$}${v}
  ${f}${H}${O}
</head>
<body${m}>
  ${g}${e}${U}${X}
</body>
</html>`}function ye(e,n,t){let s=String(t("accept-language")??"").trim().toLowerCase(),a=n?.(e)??[];return a.length?[s,...a.map(c=>String(t(c)??"").trim())]:[s]}var N=[],A=null;globalThis.__rosezmOnShutdown=be;globalThis.__rosezmRunShutdownHooks=ve;function be(e,n){let t={name:e,fn:n};return N.push(t),()=>{let s=N.indexOf(t);s!==-1&&N.splice(s,1)}}function ve(e){return A||(A=(async()=>{let n=[];for(let t of N.slice())try{await t.fn(),n.push({name:t.name,ok:!0})}catch(s){let a=s instanceof Error?s.message:String(s);n.push({name:t.name,ok:!1,error:a}),console.error(`[rosezm] shutdown hook ${t.name} failed (${e}):`,a)}return n})().finally(()=>{A=null}),A)}function Ce(){return N.length}function He(e){let n=e.method;if(n!=="POST"&&n!=="PUT"&&n!=="PATCH"&&n!=="DELETE")return null;let t=e.headers.get("origin");if(t){let a;try{a=new URL(t).host}catch{return new Response("Cross-site request blocked (unparsable Origin header)",{status:403})}return a===new URL(e.url).host?null:new Response("Cross-site request blocked (Origin does not match Host)",{status:403})}let s=e.headers.get("sec-fetch-site");return s&&s!=="same-origin"&&s!=="same-site"&&s!=="none"?new Response(`Cross-site request blocked (sec-fetch-site: ${s})`,{status:403}):null}var _e=Promise.resolve(),Pe=e=>{let n=_e,t;return _e=new Promise(s=>{t=s}),n.then(e).finally(t)};function Ee(e){let n;try{n=new URL("/"+e.replace(/^\/+/,""),"http://localhost").pathname}catch{n=e.split("?")[0]}return n.startsWith("/")||(n="/"+n),n.replace(/\/+$/,"")||"/"}async function Je(e,n){let t=n?.server??await import(Oe(z(e,"server.js")).href),s=null,a="";if(n&&"client"in n)s=n.client??null;else try{s=await(await import("fs/promises")).readFile(z(e,"client.js"),"utf-8")}catch{s=null}s&&s.includes("chunks/")&&(s=null);let c=typeof t.sliceKeyFor=="function";c&&ae("sliced");let l=w=>c?Q(t.sliceKeyFor(w),e):s;if(n&&"styles"in n)a=n.styles??"";else try{a=await(await import("fs/promises")).readFile(z(e,"styles.css"),"utf-8")}catch{a=""}let u=new Set;if(n&&"broken"in n)u=new Set(n.broken);else try{u=new Set(JSON.parse(await(await import("fs/promises")).readFile(z(e,"broken.json"),"utf-8")))}catch{u=new Set}let y="";if(n&&"cspTail"in n)y=n.cspTail??"";else try{let w=JSON.parse(await(await import("fs/promises")).readFile(z(e,"headers.json"),"utf-8")),o=Object.entries(w.default??{}).find(([r])=>r.toLowerCase()==="content-security-policy")?.[1]??"",p=o.indexOf(";");p>0&&(y=o.slice(p+1).trim())}catch{y=""}let b=(w,o="")=>{let p={};for(let[m,h]of Object.entries(pe(l(w),o)))p[m.toLowerCase()]=h;if(y&&p["content-security-policy"]){let m=p["content-security-policy"].split(";")[0];p["content-security-policy"]=`${m}; ${y}`}p["cache-control"]||(p["cache-control"]="no-cache");let r=t.headersFor?.(w);if(r)for(let[m,h]of Object.entries(r))p[m.toLowerCase()]=h;return p};return async function(o){let p=He(o);if(p)return p;let{pathname:r,searchParams:m}=new URL(o.url),h=r.replace(/\/+$/,"")||"/";return h!==r?new Response(null,{status:308,headers:{location:h+new URL(o.url).search}}):Pe(async()=>{t.setQuery?.(Object.fromEntries(m));let f=t.hasRequestHooks||t.hasResponseHooks?{request:o,url:new URL(o.url),method:o.method,pathname:r,state:{}}:null;if(f){let i=await t.runRequestHooks(f);if(i)return t.runResponseHooks(f,i)}if(t.middleware){let i=await t.runMiddleware(o);if(i)return f?t.runResponseHooks(f,i):i}if(r==="/__rosezm/gate"&&o.method==="GET"){let i=m.get("path")||"/",d=i.indexOf("?"),T=Ee(d<0?i:i.slice(0,d))+(d<0?"":i.slice(d)),S=new Headers({"cache-control":"no-store","access-control-allow-origin":"*","content-type":"application/json; charset=utf-8"});if(!t.middleware)return new Response(null,{status:204,headers:S});try{let _=await t.runMiddleware(new Request(new URL(T,o.url),{method:"GET",headers:o.headers}));if(!_)return new Response(null,{status:204,headers:S});for(let I of _.headers.getSetCookie?.()??[])S.append("set-cookie",I);return new Response(JSON.stringify({redirect:_.headers.get("location")||"",status:_.status}),{status:200,headers:S})}catch(_){return new Response(JSON.stringify({error:_ instanceof Error?_.message:String(_)}),{status:500,headers:S})}}if(r==="/__rosezm/data"&&o.method==="GET"){let i=m.get("path")||"/";try{if(t.middleware){let T=await t.runMiddleware(new Request(new URL(i,o.url),{method:"GET",headers:o.headers}));if(T){let S=new Headers(T.headers);return S.set("access-control-allow-origin","*"),new Response(await T.arrayBuffer(),{status:T.status,headers:S})}}t.setQuery?.(Object.fromEntries(new URL("http://x"+i).searchParams));let d=await t.renderPage(i,void 0,{withState:!0}),R={};try{R=JSON.parse(d?.state||"{}")}catch{R={}}return new Response(JSON.stringify({path:i,status:d?.status??200,state:R}),{status:200,headers:{"content-type":"application/json; charset=utf-8","access-control-allow-origin":"*","cache-control":"no-store"}})}catch(d){return new Response(JSON.stringify({error:String(d?.message??d).slice(0,200)}),{status:500,headers:{"content-type":"application/json; charset=utf-8","access-control-allow-origin":"*"}})}}if(t.isApi(r)){if(o.method!=="GET"){let d=t.invalidateRenderCache;typeof d=="function"&&d()}let i=await t.handleApi(o.method,r,o);return f?t.runResponseHooks(f,i):i}let v=o.method==="POST"?await o.formData():void 0;if(v){let i=t.invalidateRenderCache;typeof i=="function"&&i()}if(!v&&!u.has(r)&&!t.isBuffered?.(r)&&t.canStream(r)&&!t.isNoJs(r)&&!o.headers.get("x-pjax")){let i=t.cspNonce?.(r)?W():"",d=new Response(null,{status:200,headers:{"content-type":"text/html; charset=utf-8",...b(r,i)}}),R=f?await t.runResponseHooks(f,d):d,T=new TextEncoder,S=new ReadableStream({async start(_){let I=t.docAttrs(r);await t.renderPageStream(r,Se=>_.enqueue(T.encode(Se)),ge(a,I.lang,I.dir,!t.shellOff?.(r)),K(l(r),i)),_.close()}});return new Response(S,{status:R.status,headers:R.headers})}let $=o.headers.get("cookie")||"",O=m.toString(),j=ye(r,t.hotVaryFor,i=>o.headers.get(i)).join("\0"),g=(!v&&t.isCachedRoute?.(r)?t.peekRenderCache?.(r,$,O,j):null)??(t.renderPageCached&&!v?await t.renderPageCached(r,$,O,j):await t.renderPage(r,v)),U=t.cspNonce?.(r)?W():"";if(g.redirect){let i=g.redirect,d=new URL(i,o.url),R=`<!DOCTYPE html><title>Redirecting</title><p>Redirecting to <a href="${i}">${i}</a>.</p>`;return new Response(R,{status:g.status??302,headers:{"content-type":"text/html; charset=utf-8",location:d.pathname+d.search}})}let H=we(g.html,g.state,l(r),g.head,a,g.csr!==!1,g.lang,g.dir,U,g.shell!==!1);o.headers.get("x-pjax")&&(H=Me(H));let P=new Headers({"content-type":"text/html; charset=utf-8",...b(r,U)});for(let i of g.setCookies??[])P.append("set-cookie",i);let x=new Response(H,{status:g.status??200,headers:P});return f?t.runResponseHooks(f,x):x})}}function Me(e){let n=e.indexOf('<main id="sk-main"');if(n<0)return e;let t=e.indexOf("</main>",n);if(t<0)return e;let s=e.slice(n,t+7),a=e.match(/<title>([\s\S]*?)<\/title>/i);return(a?a[0]:"")+s}export{Je as createEdgeHandler,be as onShutdown,ve as runShutdownHooks,Ce as shutdownHookCount};
