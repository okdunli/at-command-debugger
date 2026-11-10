import*as C from"fs";import*as x from"path";import*as js from"os";import{pathToFileURL as Sr,fileURLToPath as Bt}from"url";import*as ot from"esbuild";var j=class extends Error{code;file;line;hint;constructor(s,n,t={}){super(n),this.name="RoseError",this.code=s,this.file=t.file,this.line=t.line,this.hint=t.hint}info(){let s={code:this.code};return this.file!==void 0&&(s.file=this.file),this.line!==void 0&&(s.line=this.line),s.message=this.message,this.hint!==void 0&&(s.hint=this.hint),s}};function St(e,s){let n=1,t=Math.min(s,e.length);for(let r=0;r<t;r++)e[r]===`
`&&n++;return n}function Ce(e,s){return s&&s.index!==void 0?St(e,s.index):void 0}function ur(e){return e instanceof j?e.info():{code:"E-UNKNOWN",message:e instanceof Error?e.message:String(e)}}function dr(e,s,n={}){let t=Math.max(0,n.radius??1),r=e.split(`
`),i=Math.max(1,s-t),o=Math.min(r.length,s+t),h=String(o).length,u=[];for(let c=i;c<=o;c++){let f=r[c-1]??"";u.push(`  ${String(c).padStart(h)} | ${f}`),c===s&&n.column!==void 0&&u.push(`  ${" ".repeat(h)} | ${" ".repeat(Math.max(0,n.column-1))}^`)}return u.join(`
`)}function hr(e,s){return`$setState('${e}', ${s})`}function fr(e){if(!e)return[];let s=[];for(let n of e.matchAll(/\b(?:let|const|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=;\n]*)?=\s*\$derived\b/g))s.includes(n[1])||s.push(n[1]);return s}function pr(e){let s="",n=0;for(;n<e.length;){let t=e[n];if(t==="/"&&(e[n+1]==="/"||e[n+1]==="*")){let r=e[n+1]==="/"?e.indexOf(`
`,n)<0?e.length:e.indexOf(`
`,n):e.indexOf("*/",n)<0?e.length:e.indexOf("*/",n)+2;s+=e.slice(n,r).replace(/[^\n]/g," "),n=r;continue}if(t==="'"||t==='"'||t==="`"){let r=n+1;for(;r<e.length&&e[r]!==t;)e[r]==="\\"?r+=2:r++;r=Math.min(r+1,e.length),s+=t+" ".repeat(Math.max(0,r-n-2))+(r-n>1?t:""),n=r;continue}s+=t,n++}return s}function Zn(e){if(!e)return null;let s=pr(e);for(let n of fr(e))if(new RegExp(`(?<![\\w$.]|\\b(?:let|const|var)\\s{1,4})\\b${n}\\s*(?:\\+\\+|--|\\+=|-=|\\*=|/=|%=|=(?!=))|(?:\\+\\+|--)(?:\\s{1,4})${n}\\b(?![\\w$.])`).test(s))return n;return null}var gr=["+=","-=","*=","/=","%="],Gn=[/[(,.<>=!&|+\-*/%?:]$/,/(?:&&|\|\||=>|\.\.)$/];function Xn(e,s){if(!e)return e;let n=i=>i.replace(/=/g,""),t="",r=0;for(;r<e.length;){let i=e.indexOf("{",r);if(i<0){t+=n(e.slice(r));break}t+=n(e.slice(r,i));let o=mr(e,i);if(o<0){t+=n(e.slice(i));break}t+=e.slice(i,o),r=o}return _n(t,s).replace(/\u0001/g,"=")}function mr(e,s){let n=0;for(let t=s;t<e.length;t++){let r=e[t];if(r==='"'||r==="'"||r==="`"){for(t++;t<e.length;t++)if(e[t]==="\\")t++;else if(e[t]===r)break;continue}if(r==="{")n++;else if(r==="}"&&--n===0)return t+1}return-1}function _n(e,s,n=hr){if(!e)return e;let t=/(?:^|[^\w$])(?:let|const|var|function|class|new|case|import|export|interface|type)\s+$/,r=/(?:^|[^\w$])case[^:;{}]*:\s*$|(?:^|[^\w$])default\s*:\s*$/,i=g=>t.test(g)||r.test(g),o=g=>!!g&&/[A-Za-z_$]/.test(g),h="",u="",c=(g,_)=>{if(h+=g,!_)return;let w=g.replace(/\s+$/,"");w&&(u=(u+w).slice(-64))},f=()=>u.endsWith("=>")?"=>":u.replace(/\s+$/,"").slice(-1),a=0,l=g=>{let _=e[g],w=g+1;for(;w<e.length&&e[w]!==_;){if(e[w]==="\\"){w+=2;continue}if(_==="`"&&e[w]==="$"&&e[w+1]==="{"){let $=1;for(w+=2;w<e.length&&$>0;)e[w]==="{"?$++:e[w]==="}"&&$--,w++;continue}w++}return Math.min(w+1,e.length)},p=g=>{let _=g,w=0;for(;_<e.length;){let $=e[_];if($==="'"||$==='"'||$==="`"){_=l(_);continue}if($==="/"&&(e[_+1]==="/"||e[_+1]==="*")){_=e[_+1]==="/"?e.indexOf(`
`,_)<0?e.length:e.indexOf(`
`,_):e.indexOf("*/",_)<0?e.length:e.indexOf("*/",_)+2;continue}if($==="("||$==="["||$==="{"){w++,_++;continue}if($===")"||$==="]"||$==="}"){if(w===0)return _;w--,_++;continue}if(w>0){_++;continue}if($===";")return _;if($===`
`){let m=e.slice(g,_).replace(/\s+$/,"");if(m===""||Gn[0].test(m)||Gn[1].test(m)||/delegate$/.test(m)){_++;continue}return _}_++}return _};for(;a<e.length;){let g=e[a];if(g==="'"||g==='"'||g==="`"){let O=l(a);c(e.slice(a,O),!0),a=O;continue}if(g==="/"&&e[a+1]==="/"){let O=e.indexOf(`
`,a),B=O<0?e.length:O;c(e.slice(a,B),!1),a=B;continue}if(g==="/"&&e[a+1]==="*"){let O=e.indexOf("*/",a),B=O<0?e.length:O+2;c(e.slice(a,B),!1),a=B;continue}if((g==="+"||g==="-")&&e[a+1]===g&&["",";","{","}","(",",","=>"].includes(f())){let O=a+2;for(;O<e.length&&e[O]!==`
`&&/[ \t]/.test(e[O]);)O++;if(o(e[O])&&!(O>0&&/[\w$.]/.test(e[O-1]))){let B=O;for(;B<e.length&&/[\w$]/.test(e[B]);)B++;let Q=e.slice(O,B);if(s(Q)&&!t.test(u)){c(n(Q,`${Q}() ${g==="-"?"-":"+"} 1`),!0),a=B;continue}}c(g,!0),a++;continue}if(!o(g)||a>0&&/[\w$.]/.test(e[a-1])){c(g,!0),a++;continue}let _=a;for(;_<e.length&&/[\w$]/.test(e[_]);)_++;let w=e.slice(a,_);if(!s(w)||t.test(u)){c(w,!0),a=_;continue}let $=e.slice(_).match(/^[ \t]*/)[0].length,m=e.slice(_+$),v=f();if((m.startsWith("++")||m.startsWith("--"))&&!/[\w$.]/.test(m.slice(2,3))&&(["",";","{","}","(",")",",","=>"].includes(v)||r.test(u))){c(n(w,`${w}() ${m.startsWith("--")?"-":"+"} 1`),!0),a=_+$+2;continue}let k=null,A=1;for(let O of gr)if(m.startsWith(O)){k=O.slice(0,-1),A=2;break}if((k!==null||/^=(?!=)/.test(m))&&(["",";","{","}",")","=>"].includes(v)||r.test(u))){let O=_+$+A,B=p(O),Q=e.slice(O,B).trim();if(Q){if(k===null){let M=new RegExp(`^(?:--\\s*${w}$|${w}\\s*--$)`).test(Q),H=new RegExp(`^\\+\\+\\s*${w}$|^${w}\\s*\\+\\+$`).test(Q);if(M||H){c(n(w,`${w}() ${M?"-":"+"} 1`),!0),a=B;continue}}c(n(w,k===null?Q:`${w}() ${k} (${Q})`),!0),a=B;continue}}c(w,!0),a=_}return h}import Dt from"node:fs";import yn from"node:path";var Qn=64,wr=30*60*1e3;async function $r(e){for(let s=0;;s++)try{await Dt.promises.rm(e,{force:!0});return}catch(n){if(s>=2||!/EPERM|EBUSY|EACCES/.test(String(n)))throw n;await new Promise(t=>setTimeout(t,50*(s+1)))}}async function br(e){for(let s=0;s<e.length;s+=Qn)await Promise.all(e.slice(s,s+Qn).map($r))}async function _r(e){try{return await Dt.promises.readdir(e,{withFileTypes:!0})}catch{return[]}}async function Ft(e){let s=await _r(e),n=[],t=[];for(let r of s)r.isDirectory()?t.push(yn.join(e,r.name)):n.push(yn.join(e,r.name));await br(n),await Promise.all(t.map(r=>Ft(r))),await Dt.promises.rmdir(e).catch(()=>{})}function Kn(e){Dt.promises.readdir(e).then(s=>{let n=Date.now();for(let t of s){let r=yn.join(e,t);Dt.promises.stat(r).then(i=>{i.isDirectory()&&n-i.mtimeMs>wr&&Ft(r).catch(()=>{})}).catch(()=>{})}}).catch(()=>{})}function sn(e){let s=2166136261,n=typeof e=="string"?new TextEncoder().encode(e):e;for(let t=0;t<n.length;t++)s^=n[t],s=Math.imul(s,16777619);return(s>>>0).toString(36)}var Yn={"mini-program":["weapp","qq","alipay","baidu","toutiao"],miniprogram:["weapp","qq","alipay","baidu","toutiao"],native:["flutter","android","arkts","xcode"],desktop:["electron","python","dotnet","java","cpp"],web:["web"]},yr=new Set(["weapp","qq","alipay","baidu","toutiao","flutter","android","arkts","xcode","electron","python","dotnet","java","cpp","web","vue"]),es={"mp-weixin":"weapp","mp-qq":"qq","mp-alipay":"alipay","mp-baidu":"baidu","mp-toutiao":"toutiao"};function ts(e,s){let n=s.toLowerCase(),t=e.trim().toLowerCase(),r=es[t]??t,i=Yn[r];return i?i.includes(n):r===n}function ns(e){let s=e.trim().toLowerCase();return es[s]?!0:Yn[s]!==void 0||yr.has(s)}function ss(e,s="web",n=[]){let t=/^[ \t]*(?:\/\/|<!--|\/\*)\s*#(ifdef|ifndef|endif)\b([ \t\S]*?)(?:\*\/|-->)?[ \t]*$/gm,r=e.split(`
`),i=[],o=[],h=()=>o.every(Boolean);for(let u of r){let c=t.exec(u);if(t.lastIndex=0,c){let f=c[1],a=(c[2]??"").trim().split(/\s+/)[0].toLowerCase();if(f==="endif"){o.length?o.pop():n.push("#endif with no matching #ifdef - left as written");continue}ns(a)||n.push(`#${f} ${a} names an unknown target or family - treated as false`);let l=ts(a,s);o.push(f==="ifdef"?l:!l);continue}h()&&i.push(u)}return o.length&&n.push(`${o.length} #ifdef without #endif - the tail is kept as written`),i.join(`
`)}function rs(e,s="web",n=[]){let t=s.toLowerCase(),r=e;for(let i=0;i<40;i++){let o=/\{#(ifdef|ifndef)\s+([^}]*)\}/.exec(r);if(!o)break;let h=o[1],u=o[2].trim().toLowerCase(),c=ts(u,t),f=h==="ifdef"?c:!c;ns(u)||n.push(`{#${h} ${u}} names an unknown target or family - treated as false`);let a=o.index+o[0].length,l=1,p=-1,g=-1,_=/\{#(ifdef|ifndef)\b|\{:(else)\b|\{\/(ifdef|ifndef)\}/g;_.lastIndex=a;for(let m=_.exec(r);m;m=_.exec(r))if(m[1])l++;else if(m[3]){if(l--,l===0){g=m.index;break}}else m[2]&&l===1&&(p=m.index);if(g<0){n.push(`{#${h} ${u}} has no {/${h}} - left as written`);break}let w=p>=0?p+7:g,$=p>=0?f?r.slice(a,p):r.slice(w,g):f?r.slice(a,g):"";r=r.slice(0,o.index)+$+r.slice(g+h.length+3)}return r}import ut from"node:fs";function os(e){try{let s=ut.openSync(e,"r"),n=Buffer.alloc(64),t=ut.readSync(s,n,0,64,0);return ut.closeSync(s),t<24?null:n[0]===137&&n[1]===80&&n[2]===78&&n[3]===71?{width:n.readUInt32BE(16),height:n.readUInt32BE(20)}:n.slice(0,3).toString("latin1")==="GIF"?{width:n.readUInt16LE(6),height:n.readUInt16LE(8)}:n.slice(0,4).toString("latin1")==="RIFF"&&n.slice(8,12).toString("latin1")==="WEBP"?xr(n):n[0]===255&&n[1]===216?vr(e):null}catch{return null}}function xr(e){let s=e.slice(12,16).toString("latin1");if(s==="VP8 ")return{width:e.readUInt16LE(26)&16383,height:e.readUInt16LE(28)&16383};if(s==="VP8L"){let n=e.readUInt32LE(21);return{width:(n&16383)+1,height:(n>>14&16383)+1}}if(s==="VP8X"){let n=e.readUIntLE(24,3)+1,t=e.readUIntLE(27,3)+1;return{width:n,height:t}}return null}function vr(e){let s=ut.openSync(e,"r");try{let n=Buffer.alloc(4),t=2;for(let r=0;r<64;r++){if(ut.readSync(s,n,0,4,t)<4)return null;if(n[0]!==255){t+=1;continue}let i=n[1];if(i===216||i===1||i>=208&&i<=215){t+=2;continue}let o=ut.readSync(s,n,0,2,t+2)<2?0:n.readUInt16BE(2);if(i>=192&&i<=207&&i!==196&&i!==200&&i!==204){let h=Buffer.alloc(8);return ut.readSync(s,h,0,8,t+4),{width:h.readUInt16BE(3),height:h.readUInt16BE(1)}}t+=2+o}return null}finally{ut.closeSync(s)}}import rn from"node:fs";import is from"node:path";function kr(e){if(!e.startsWith("---"))return{frontmatter:{},body:e};let s=e.indexOf(`
---`,3);if(s<0)return{frontmatter:{},body:e};let n=e.slice(4,s),t=e.slice(e.indexOf(`
`,s+1)+1).replace(/^\s*\n/,""),r={};for(let i of n.split(`
`)){let o=/^(\w[\w-]*):\s*(.*)$/.exec(i.trim());if(!o)continue;let[,h,u]=o,c=/^\[(.+)\]$/.exec(u.trim());r[h]=c?c[1].split(",").map(f=>f.trim().replace(/^["']|["']$/g,"")):u.trim().replace(/^["']|["']$/g,"")}return{frontmatter:r,body:t}}function Er(e,s){return e.replace(/{{(\w[\w.]*)}}/g,(n,t)=>{let r=t.split(".").reduce((i,o)=>i==null?i:i[o],s);return r==null?"":String(r)})}function as(e,s){s&&(e=Er(e,s));let n=[],t=e.replace(/```(\w*)\n([\s\S]*?)```/g,(u,c,f)=>(n.push(`<pre data-lang="${c}"><code>${f.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</code></pre>`),`\0CODE${n.length-1}\0`)),r=u=>u.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*]+)\*/g,"<em>$1</em>").replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" rel="noopener">$1</a>'),i=[],o=null,h=()=>{o&&(i.push(`</${o}>`),o=null)};for(let u of t.split(`
`)){let c=/^(#{1,4})\s+(.*)$/.exec(u),f=/^\s*[-*]\s+(.*)$/.exec(u),a=/^\s*\d+\.\s+(.*)$/.exec(u);c?(h(),i.push(`<h${c[1].length}>${r(c[2])}</h${c[1].length}>`)):f?(o!=="ul"&&(h(),i.push("<ul>"),o="ul"),i.push(`<li>${r(f[1])}</li>`)):a?(o!=="ol"&&(h(),i.push("<ol>"),o="ol"),i.push(`<li>${r(a[1])}</li>`)):u.trim()===""?h():u.startsWith("\0CODE")?(h(),i.push(u)):(h(),i.push(`<p>${r(u)}</p>`))}return h(),i.join(`
`).replace(/\u0000CODE(\d+)\u0000/g,(u,c)=>n[Number(c)])}function ls(e){let s={};if(!rn.existsSync(e))return s;for(let n of rn.readdirSync(e,{withFileTypes:!0})){if(!n.isDirectory())continue;let t=[],r=is.join(e,n.name);for(let i of rn.readdirSync(r)){if(!i.endsWith(".md"))continue;let o=rn.readFileSync(is.join(r,i),"utf-8"),{frontmatter:h,body:u}=kr(o);if(String(h.draft??"").toLowerCase()==="true")continue;let c=i.replace(/\.md$/,""),f=as(u),a=u.replace(/[#*`\[\]()>-]/g," ").split(/\s+/).filter(Boolean).length,l=[],p=f.replace(/<h([1-4])>([^<]+)<\/h\1>/g,(g,_,w)=>{let $=w.toLowerCase().replace(/[^\w\s-]/g,"").trim().replace(/\s+/g,"-");return l.push({level:Number(_),text:w,id:$}),`<h${_} id="${$}">${w}</h${_}>`});t.push({slug:c,frontmatter:h,body:u,html:p,readingTime:Math.max(1,Math.round(a/200)),wordCount:a,toc:l,excerpt:String(h.summary??"")||(f.match(/<p>([\s\S]*?)<\/p>/)?.[1]??"").replace(/<[^>]+>/g,"").slice(0,160)})}t.sort((i,o)=>String(o.frontmatter.date??"").localeCompare(String(i.frontmatter.date??""))),s[n.name]=t}return s}globalThis.__rosezmContentMk=as;var xn=new Map;function nt(e,s,n){let t=Nr(),r={...s,define:{...Mr(),...s.define??{}}};if(e+=`|env:${t}`,!n||s.splitting)return ot.build(r);let i=xn.get(e);return i?i.rebuild().catch(o=>{throw xn.delete(e),o}):ot.context(r).then(o=>(xn.set(e,o),o.rebuild()))}var Os=/<script>([\s\S]*?)<\/script>/,Ps=/<script\b(?![^>]*\b(?:type|src)=)[^>]*>([\s\S]*?)<\/script>/g;function cs(e){let s=[...e.matchAll(Ps)].map(u=>({start:u.index,end:u.index+u[0].length,code:u[1]})),n=e;for(let u=s.length-1;u>=0;u--){let c=s[u],f=e.slice(c.start,e.indexOf(">",c.start)+1);n=n.slice(0,c.start)+f+" ".repeat(c.code.length)+"</script>"+n.slice(c.end)}let t=n.match(an),r=t&&t.index!==void 0?t.index:-1,i=t&&t.index!==void 0?t.index+t[0].length:-1,o=s.filter(u=>!(r>=0&&u.start>=r&&u.end<=i)),h=e;for(let u=o.length-1;u>=0;u--){let c=o[u];h=h.slice(0,c.start)+h.slice(c.end)}return{script:o.map(u=>u.code).join(`
`),rest:h}}var Ns=/<template>([\s\S]*?)<\/template>/,an=/<head>([\s\S]*?)<\/head>/,Ms="<style>([\\s\\S]*?)<\\/style>",Rr=e=>[...e.matchAll(new RegExp(Ms,"g"))].map(s=>s[1]),Ls=e=>e.replace(new RegExp(Ms,"g"),""),us=/(?<=^|[;}{\n])[ \t]*(?:let|const|var)\s+(\w+)[^\n;{}=]*=\s*\$(state|data|kv|persist|derived)\b/g,Ar=/^\s+as\s+[^;\n]+/,ds=/\$setState\(([^,]+),\s*([^)]+)\)/g,Cr=/<slot\s*\/>|<slot>([\s\S]*?)<\/slot>/g,Tr=/<slot\s+((?=[^>]*\bname\s*=)[^>]*?)(?:\/>|>([\s\S]*?)<\/slot>)/g;function hs(e){let s=/\bname\s*=\s*["'](\w+)["']/.exec(e)?.[1];if(!s)throw new j("E-TEMPLATE",'<slot> with attributes must declare a name: <slot name="row" ... />',{hint:'a slot carrying attributes is a NAMED slot - it must declare which one: <slot name="row" item={post} />'});let n=[...e.matchAll(/\b(\w+)\s*=\s*\{([^}]*)\}/g)].filter(t=>t[1]!=="name").map(t=>`['${t[1]}', (${t[2].trim()})]`);return`${JSON.stringify(s)}, [${n.join(", ")}]`}var jr="<p>This section failed to render.</p>",Or=new Set(["GET","POST","PUT","PATCH","DELETE","HEAD","OPTIONS"]),dt={loader:{".js":"ts"}},Jt="rosezm_PUBLIC_",Pr=/^[A-Za-z_$][\w$]*$/,Pn=()=>Object.entries(process.env).filter(e=>e[0].startsWith(Jt)&&typeof e[1]=="string").sort(([e],[s])=>e<s?-1:e>s?1:0),Nr=()=>dn(JSON.stringify(Pn()));function Mr(){let e=Object.fromEntries(Pn()),s={};for(let[n,t]of Object.entries(e))Pr.test(n)&&(s[`import.meta.env.${n}`]=JSON.stringify(t).replace(/</g,"\\u003c"));return s["import.meta.env"]=JSON.stringify(e).replace(/</g,"\\u003c"),s}function fs(e){return[...e.matchAll(/\bimport\.meta\.env\.([A-Za-z_$][\w$]*)/g)].map(s=>s[1])}function on(e,s){let n={"(":")","[":"]","{":"}"}[e[s]]??"";if(!n)return-1;let t=0;for(let r=s;r<e.length;r++)if(e[r]===e[s])t++;else if(e[r]===n&&(t--,t===0))return r;return-1}function Lr(e,s){let n={")":"(","]":"[","}":"{"}[e[s]]??"";if(!n)return-1;let t=0;for(let r=s;r>=0;r--)if(e[r]===e[s])t++;else if(e[r]===n&&(t--,t===0))return r;return-1}function Ir(e,s){let n=0;for(let t=s;t<e.length;t++){let r=e[t];if(r==="("||r==="["||r==="{"){n++;continue}if(r===")"||r==="]"||r==="}"){if(n===0)return t;n--;continue}if(n===0&&(r===","||r===";"))return t}return e.length}function zr(e){let s=Vt(e),n=[],t=(r,i)=>{let o=[];for(let h of s.slice(r,i).matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g))o.push(h[1]);return o};for(let r of s.matchAll(/\bfunction\b/g)){let i=r.index+r[0].length;for(;i<s.length&&/\s/.test(s[i]);)i++;for(s[i]==="*"&&i++;i<s.length&&/[A-Za-z_$]/.test(s[i]);)i++;for(;i<s.length&&/\s/.test(s[i]);)i++;if(s[i]!=="(")continue;let o=on(s,i);if(o<0)continue;let h=o+1;for(;h<s.length&&/\s/.test(s[h]);)h++;if(s[h]===":"){for(h++;h<s.length&&/[^{};\n]/.test(s[h]);)h++;for(;h<s.length&&/\s/.test(s[h]);)h++}if(s[h]!=="{")continue;let u=on(s,h);if(u<0)continue;let c=new Set(Ut(e.slice(i+1,o)));for(let f of t(h,u))c.add(f);n.push({start:i,end:u+1,names:c})}for(let r of s.matchAll(/=>/g)){let i=r.index,o=i-1;for(;o>=0&&/\s/.test(s[o]);)o--;let h="",u=i;if(s[o]===")"){let l=Lr(s,o);if(l<0)continue;h=e.slice(l+1,o),u=l}else if(/[A-Za-z_$]/.test(s[o]??"")){let l=o;for(;l>=0&&/[\w$]/.test(s[l]);)l--;h=e.slice(l+1,o+1),u=l+1}else continue;let c=i+2;for(;c<s.length&&/\s/.test(s[c]);)c++;let f=s[c]==="{"?on(s,c)+1:Ir(s,c);if(f<=0)continue;let a=new Set(Ut(h));if(s[c]==="{")for(let l of t(c,f))a.add(l);n.push({start:u,end:f,names:a})}return n.sort((r,i)=>r.start-i.start)}function st(e,s,n){if(s.length===0&&!n)return e;let t=zr(e),r=(o,h)=>{for(let u of t){if(u.start>o)break;if(o<u.end&&u.names.has(h))return!0}return!1},i=(o,h=0)=>{let u="",c=0;for(;c<o.length;){let f=o[c];if(f==="'"||f==='"'){let a=c+1;for(;a<o.length&&o[a]!==f;)o[a]==="\\"&&a++,a++;u+=o.slice(c,Math.min(a+1,o.length)),c=a+1;continue}if(f==="`"){for(u+=f,c++;c<o.length&&o[c]!=="`";){if(o[c]==="\\"){u+=o.slice(c,c+2),c+=2;continue}if(o[c]==="$"&&o[c+1]==="{"){let a=1,l=c+2;for(;l<o.length&&a>0&&(o[l]==="{"?a++:o[l]==="}"&&a--,a!==0);)l++;u+="${"+i(o.slice(c+2,l),h+c+2)+"}",c=l+1;continue}u+=o[c],c++}u+="`",c++;continue}if(f==="/"&&o[c+1]==="/"){let a=o.indexOf(`
`,c),l=a===-1?o.length:a;u+=o.slice(c,l),c=l;continue}if(f==="/"&&o[c+1]==="*"){let a=o.indexOf("*/",c+2),l=a===-1?o.length:a+2;u+=o.slice(c,l),c=l;continue}if(f==="/"&&Nn(o,c)){let a=Mn(o,c);u+=o.slice(c,a),c=a;continue}if(/[A-Za-z_$]/.test(f)){let a=c;for(;a<o.length&&/[\w$]/.test(o[a]);)a++;let l=o.slice(c,a);if((l==="as"||l==="satisfies")&&!/[\w$.]/.test(u[u.length-1]??"")){u+=l;let k=a;for(;k<o.length&&/\s/.test(o[k]);)k++;if(u+=o.slice(a,k),o[k]==="{"||o[k]==="("||o[k]==="["){let A=0,R=k,O="";for(;R<o.length;R++){let B=o[R];if(O){B==="\\"?R++:B===O&&(O="");continue}if(B==="'"||B==='"'||B==="`"){O=B;continue}if(B==="{"||B==="("||B==="[")A++;else if((B==="}"||B===")"||B==="]")&&(A--,A===0))break}u+=o.slice(k,R+1),c=R+1;continue}else{let A=k,R=0;for(;A<o.length;){let O=o[A];if(O==="<")R++;else if(O===">")R=Math.max(0,R-1);else if(O==="["&&o[A+1]==="]"){A+=2;continue}else if(R===0&&!/[\w$.:<>| ]/.test(O))break;A++}u+=o.slice(k,A),c=A;continue}c=k;continue}let p=u.length?u[u.length-1]:"",g=o[a]??"",_=g==="?"&&o[a+1]===":",w=p==="@",$=!/[\w$.]/.test(p)&&!/[\w$:(]/.test(g)&&!_,m=$&&!w&&s.includes(l)&&!r(h+c,l),v=$&&n!=null&&Object.prototype.hasOwnProperty.call(n,l);u+=m?`${l}()`:v?`${n[l]}()`:l,c=a;continue}u+=f,c++}return u};return i(e)}var Is=/^\s*#(?:if|each|await|key|snippet|boundary|island|defer)\b/,zs=/^\s*\/(?:if|each|await|key|snippet|boundary|island|defer)\s*$/,Ds=/^\s*:(?:else|then|catch|fallback)\b/,Dr=/^\s*#each\s+([\s\S]+?)\s+as\s+(\{[^{}]*\}|\[[^[\]]*\]|\w+)(?:\s*,\s*(\w+))?(?:\s*\(([\s\S]+)\))?\s*$/,Fr=/^\s*#snippet\s+(\w+)(?:\s*\(([\s\S]*)\))?\s*$/,qr=/^\s*:(?:then|catch)\s+([A-Za-z_$][\w$]*)\s*$/;function Ut(e){return e.replace(/^[{[]/,"").replace(/[}\]]$/,"").split(",").map(n=>{let t=n.split("=")[0].trim(),r=t.indexOf(":");return r>=0?t.slice(r+1).trim():t}).filter(n=>/^[A-Za-z_$][\w$]*$/.test(n))}function Fs(e,s){let n=[],t=0;for(;t<e.length;){let r=Oo(e.slice(t),s);if(!r)break;if(r.selfClosing){t+=r.end;continue}let i=cn(e,t+r.end,r.name),o=i>=0?i+r.name.length+3:e.length;n.push([t+r.start,o]),t=o}return n}function Br(e,s){let n=[],t=0,r=s.size>0?Fs(e,s):[],i=0,o=-1;for(let h of Ct(e)){for(;i<r.length&&r[i][0]<=h.start;)o=r[i++][1];if(h.start<o)continue;let u=h.expr;if(zs.test(u)){t>0&&t--;continue}if(Is.test(u)){t++;continue}if(!Ds.test(u)&&t===0){let c=/^\s*@const\s+([A-Za-z_$][\w$]*)\s*=/.exec(u);c&&n.push(c[1])}}return n}function En(e,s,n,t){if(s.length===0&&!n)return e;let r="",i=0,o=[new Set],h=()=>o[o.length-1],u=p=>o.some(g=>g.has(p)),c=t?.ownScope?p=>{for(let g=o.length-1;g>=0;g--)if(o[g].has(p))return g===0;return!1}:p=>!u(p),f=()=>[s.filter(p=>!u(p)),n?Object.fromEntries(Object.entries(n).filter(([p])=>c(p))):void 0],a=[];if(t?.comps&&t.comps.size>0)for(let[p,g]of Fs(e,t.comps))a.push({pos:p,open:!0}),a.push({pos:g,open:!1});let l=0;for(let p of Ct(e)){for(;l<a.length&&a[l].pos<=p.start;)a[l].open?o.push(new Set):o.length>1&&o.pop(),l++;let g=p.expr;if(zs.test(g)){o.length>1&&o.pop(),r+=e.slice(i,p.end+1),i=p.end+1;continue}if(Is.test(g)){let m=Dr.exec(g);if(m){let[,R,O,B,Q]=m,[M,H]=f(),se=` as ${O}${B?`, ${B}`:""}`;o.push(new Set([...Ut(O),...B?[B]:[]]));let ce=Q!=null&&Q.trim()!==""?` (${st(Q,...f())})`:"";r+=e.slice(i,p.start)+`{#each ${st(R,M,H)}${se}${ce}}`,i=p.end+1;continue}let v=Fr.exec(g);if(v){o.push(new Set(v[2]?Ut(v[2]):[])),r+=e.slice(i,p.end+1),i=p.end+1;continue}let[k,A]=f();r+=e.slice(i,p.start)+"{"+st(g,k,A)+"}",o.push(new Set),i=p.end+1;continue}if(Ds.test(g)){h().clear();let m=qr.exec(g);if(m){h().add(m[1]),r+=e.slice(i,p.end+1),i=p.end+1;continue}let[v,k]=f();r+=e.slice(i,p.start)+"{"+st(g,v,k)+"}",i=p.end+1;continue}let _=/^\s*@const\s+([A-Za-z_$][\w$]*)\s*=([\s\S]*)$/.exec(g),[w,$]=f();if(_){let m=_[2],v=st(m,w,$);h().add(_[1]),r+=e.slice(i,p.start)+(v===m?e.slice(p.start,p.end+1):`{@const ${_[1]} =${v}}`),i=p.end+1;continue}r+=e.slice(i,p.start)+"{"+st(g,w,$)+"}",i=p.end+1}return r+e.slice(i)}function Ct(e){let s=[],n=0;for(;n<e.length;){if(e[n]==="{"){let t=Gt(e,n);if(t>n+1){s.push({start:n,end:t,expr:e.slice(n+1,t)}),n=t+1;continue}}n++}return s}function Jr(e,s){let n=s;for(;n<e.length;){if(e[n]==="{"){let t=Gt(e,n);if(t>n+1)return{index:n,end:t,expr:e.slice(n+1,t)}}n++}return null}function Gt(e,s){let n=0,t=s;for(;t<e.length;){let r=e[t];if(r==="'"||r==='"'){t=it(e,t);continue}if(r==="`"){t=un(e,t);continue}if(r==="/"){let i=gt(e,t);if(i!==null){t=i;continue}}if(r==="{")n++;else if(r==="}"&&--n===0)return t;t++}return-1}function rt(e,s){let n=s+2,t=1;for(;n<e.length;){let r=e[n];if(r==="'"||r==='"'){n=it(e,n);continue}if(r==="`"){n=un(e,n);continue}if(r==="{")t++;else if(r==="}"&&--t===0)return n+1;n++}return-1}function it(e,s){let n=e[s],t=s+1;for(;t<e.length;){if(e[t]==="\\"){t+=2;continue}if(e[t]===n)return t+1;t++}return t}function un(e,s){let n=s+1;for(;n<e.length;){let t=e[n];if(t==="\\"){n+=2;continue}if(t==="`")return n+1;if(t==="$"&&e[n+1]==="{"){let r=Gt(e,n+1);n=r<0?e.length:r+1;continue}n++}return n}function qs(e,s){let n=s;for(;n>=0&&/[\w$]/.test(e[n]);)n--;return n===s?"":e.slice(n+1,s+1)}function gt(e,s){let n=e[s];if(n==='"'||n==="'")return it(e,s);if(n==="`")return un(e,s);if(n!=="/"||e[s+1]==="/"||e[s+1]==="*")return null;let t=s-1;for(;t>=0&&/\s/.test(e[t]);)t--;if(t>=0&&!"(,=:[!&|?{};+-*%~^".includes(e[t])){let o=qs(e,t);if(!["return","typeof","case","in","of","new","delete","void","do","else","instanceof","yield","await"].includes(o))return null}let r=s+1,i=!1;for(;r<e.length;){let o=e[r];if(o==="\\"){r+=2;continue}if(o===`
`)return null;if(i)o==="]"&&(i=!1);else if(o==="[")i=!0;else if(o==="/"){r++;break}r++}if(r>e.length)return null;for(;r<e.length&&/[dgimsuvy]/.test(e[r]);)r++;return r}function ps(e){let s="",n=0;for(;n<e.length;){let t=gt(e,n);if(t!==null){s+=e.slice(n,t),n=t;continue}if(e.startsWith("//",n)){for(;n<e.length&&e[n]!==`
`;)n++;continue}if(e.startsWith("/*",n)){for(n+=2;n<e.length&&!e.startsWith("*/",n);)n++;n=Math.min(n+2,e.length);continue}if(e.startsWith("<!--",n)){for(n+=4;n<e.length&&!e.startsWith("-->",n);)n++;n=Math.min(n+3,e.length);continue}s+=e[n++]}return s}function Hr(e){let s=/typeof\s+(?:window|document|navigator|location|localStorage|sessionStorage)\s*(!==|===)\s*["']undefined["']/y,n=a=>{for(;a<e.length&&/\s/.test(e[a]);)a++;return a},t=a=>{let l=0,p=a+1;for(;p<e.length;){let g=e[p],_=gt(e,p);if(_!==null){p=_;continue}if(g==="("||g==="["||g==="{")l++;else if(g===")"||g==="]"||g==="}"){if(l--,l<0)return-1}else{if(l===0&&g===":")return p;if(l===0&&g==="?"){let w=t(p);if(w<0)return-1;p=w+1;continue}}p++}return-1},r=a=>{let l=0;for(;a<e.length;){let p=e[a],g=gt(e,a);if(g!==null){a=g;continue}if(p==="("||p==="["||p==="{")l++;else if(p===")"||p==="]"||p==="}"){if(l===0)return a;l--}else{if(l===0&&(p===","||p===";"))return a;if(l===0&&p==="?"){let _=t(a);if(_<0)return e.length;a=_+1;continue}}a++}return e.length},i=a=>{let l=0,p=a;for(;p<e.length;){let g=e[p],_=gt(e,p);if(_!==null){p=_;continue}if(g==="{")l++;else if(g==="}"&&(l--,l===0))return p;p++}return e.length},o=a=>{let l=0;for(;a<e.length;){let p=e[a],g=gt(e,a);if(g!==null){a=g;continue}if(p==="("||p==="["||p==="{")l++;else if(p===")"||p==="]"||p==="}"){if(l===0)return a;l--}else if(l===0&&(p===";"||p===`
`))return a;a++}return e.length},h=(a,l)=>{let p=l-1;for(;p>=0&&/\s/.test(a[p]);)p--;if(p<0||a[p]!=="(")return!1;for(p--;p>=0&&/\s/.test(a[p]);)p--;return p>=1&&a[p]==="f"&&a[p-1]==="i"&&(p<2||!/[\w$]/.test(a[p-2]))},u=[],c=0;for(;c<e.length;){let a=gt(e,c);if(a!==null){c=a;continue}s.lastIndex=c;let l=s.exec(e);if(!l){c++;continue}let p=l[1]==="!==",g=n(c+l[0].length),_=e.slice(g,g+2);if(_==="&&"&&p)u.push([g+2,r(g+2)]);else if(_==="||"&&!p)u.push([g+2,r(g+2)]);else if(e[g]==="?"){let w=t(g);w<0?p&&u.push([g+1,e.length]):p?u.push([g+1,w]):u.push([w+1,r(w+1)])}else if(e[g]===")"&&h(e,c)){let w,$=n(g+1);e[$]==="{"?(w=i($),p&&u.push([$+1,w])):(w=o($),p&&u.push([$,w]));let m=n(w+1);if(e.startsWith("else",m)){let v=n(m+4);if(e[v]==="{"){let k=i(v);p||u.push([v+1,k])}else{let k=o(v);p||u.push([v,k])}}}c=g}if(u.length===0)return e;let f=[...e];for(let[a,l]of u)for(let p=a;p<l&&p<f.length;p++)f[p]!==`
`&&(f[p]=" ");return f.join("")}function yi(e){return e.match(Os)?.[1]??null}async function Bs(e){let s=x.join(e,"rosezm.config.js");if(!C.existsSync(s))return{plugins:[],i18n:{}};let n=await import(Sr(s).href+`?t=${Date.now()}`);return{plugins:n.default??[],i18n:n.i18n??{},pwa:n.pwa??void 0,brotli:n.brotli??void 0,csp:n.csp??void 0,watch:n.watch??void 0}}async function xi(e){return(await Bs(e)).plugins}function gs(e,s,n){let t=[],r=(o,h)=>{let u=x.resolve(x.dirname(s),o),c=n.get(u);if(!c)throw new j("E-IMPORT",`${x.basename(s)}: cannot import '${o}' - no .rose file at ${u}. A component lives under src/components/ (or src/pages/) and is imported by relative path.`,{file:s,line:St(e,h),hint:`create ${u} (a .rose component) or fix the import path - a .rose import resolves to a file, never to a package`});return c},i=e.replace(/import\s+(\w+)\s+from\s*(['"])([^'"]+\.rose)\2/g,(o,h,u,c,f)=>{let a=r(c,f);return t.push({name:h,specifier:c,index:a.index}),`import { render as ${h} } from ${u}__rose_${a.index}__${u}`});return i=i.replace(/import\s*(\{[^}]*\})\s+from\s*(['"])([^'"]+\.rose)\2/g,(o,h,u,c,f)=>{let a=r(c,f),l=/\bas\s+(\w+)/.exec(h)?.[1]??"render";return t.push({name:l,specifier:c,index:a.index}),`import ${h} from ${u}__rose_${a.index}__${u}`}),i=i.replace(/(\bfrom\s*)(['"])(\.\.?\/[^'"]+)(['"])/g,(o,h,u,c,f)=>{if(u!==f)return o;let a=x.resolve(x.dirname(s),c).replace(/\\/g,"/"),l=a;if(!C.existsSync(l)){let p=a.replace(/\.(js|mjs|cjs)$/,".ts");if(p!==a&&C.existsSync(p))l=p;else return o}return`${h}${u}${l}${u}`}),{script:i,imports:t}}function vn(e,s){return e.replace(/from\s*(['"])__rose_(\d+)__\1/g,(n,t,r)=>`from ${t}./comp-${r}.${s}.js${t}`)}var Wr=/^(?:node:|(?:fs|path|os|crypto|http|https|net|tls|stream|child_process|worker_threads|dns|cluster|better-sqlite3|sqlite3|pg|mysql2|mongodb|redis|ioredis)$)/;function Ur(e){let s=[];for(let n of e.matchAll(/import\s+(type\s+)?[\s\S]*?from\s*['"]([^'"]+)['"]/g))n[1]||Wr.test(n[2])&&s.push(n[2]);return s}function Js(e){let s=[];for(let n=0;;){let t=Rt(e,"each",n);if(!t)break;n=t.index+1;let r=rt(e,t.index),i=t[5];r<0||i==null||s.push({names:new Set([...Ut(t[2]??""),...t[3]?[t[3]]:[]]),contentStart:r,contentEnd:r+i.length,items:(t[1]??"").trim()})}return s}function Hs(e,s,n){let t=0;for(let r of e.slice(s,n).matchAll(/\{#(?:snippet|key|await)\b|\{\/(?:snippet|key|await)\s*\}/g))if(t+=r[0][1]==="/"?-1:1,t>0)return!0;return!1}function Vr(e,s,n="<template>",t="",r=!1){let i=[],o=0,h=null,u="",c=e,f=0,a={window:"w",document:"d"},l={preventDefault:()=>"e.preventDefault()",stopPropagation:()=>"e.stopPropagation()",self:w=>`const __self = e.target.closest && e.target.closest('[data-${w}-' + e.type + ']'); if (__self && e.target !== __self) return;`},p={once:w=>`const __o = e.target && e.target.closest ? e.target.closest('[data-${w}-' + e.type + ']') : null; if (__o) __o.removeAttribute('data-${w}-' + e.type);`},g=[...Object.keys(l),...Object.keys(p),...Object.keys(a)],_=(w,$)=>r?` ${w}={__hk(${JSON.stringify($)})}`:` ${w}="${$}"`;for(;;){let w=/\bon:(\w+)((?:\|\w+)*)\s*=\s*\{/.exec(c);if(!w){u+=c;break}let $=!1,m=w[2]?w[2].slice(1).split("|"):[],v=m.filter(M=>a[M]);if(v.length>1)throw new j("E-TEMPLATE",`${n}: on:${w[1]} carries both |${v.join(" and |")}`,{hint:"a handler binds to one target - the element (default), |window or |document"});let k=v.length?"on"+a[v[0]]:"on";for(let M of m)if(!g.includes(M))throw new j("E-TEMPLATE",`${n}: unknown event modifier |${M}`,{hint:`the supported modifiers are ${g.map(H=>"|"+H).join(" ")} - capture/passive are listener options a delegated listener cannot carry per element; anything else belongs inside the handler body`});u+=c.slice(0,w.index);let A=w.index+w[0].length,R=1;for(;A<c.length;){let M=c[A];if(M==='"'||M==="'"){A=it(c,A);continue}if(M==="`"){A=un(c,A);continue}if(M==="{")R++;else if(M==="}"&&(R--,R===0))break;A++}let O=c.slice(w.index+w[0].length,A).trim(),B=new Set;for(let M of e.matchAll(/\{#each\s+[\s\S]+?\s+as\s+([A-Za-z_$][\w$]*)\s*(?:,\s*([A-Za-z_$][\w$]*))?/g))B.add(M[1]),M[2]&&B.add(M[2]);if(/=>/.test(O)&&!/^\w+$/.test(O)){let M=[...B].filter(H=>new RegExp(`\\b${H}\\b`).test(O));if(M.length>0){let H=f+w.index,se=(h??=Js(e)).filter(xe=>H>=xe.contentStart&&H<xe.contentEnd).sort((xe,Re)=>xe.contentStart-Re.contentStart).pop()??null;if(se!=null&&!Hs(e,se.contentStart,H)&&M.every(xe=>se.names.has(xe)))$=!0;else{let xe=M.find(Re=>!se||!se.names.has(Re))??M[0];throw new j("E-TEMPLATE",`${n}: this inline handler reads the {#each} variable "${xe}" but is hoisted to the page module, where it does not exist`,{file:n,line:St(e,f+w.index),hint:`name the handler in the script block (function onX(e) { ... }) and write on:${w[1]}={onX} - the named form closes over nothing and works for every item`})}}}let Q=M=>{if(!m.length)return M;let H=m.filter(ce=>l[ce]).map(ce=>l[ce](k)),se=m.filter(ce=>p[ce]).map(ce=>p[ce](k));return`(e) => {${H.length?" "+H.join("; ")+";":""} (${M})(e);${se.length?" "+se.join("; ")+";":""} }`};if(m.length&&s.has(O))throw new j("E-TEMPLATE",`${n}: event modifiers are not supported on the server action ${O}`,{hint:"$action already preventDefaults - drop the modifiers, or bind a local handler that calls $action"});if($){let M=t?`__rh_${t}_`:"__rh_";u+=`data-${k}-${w[1]}={__rhreg(${JSON.stringify(M)}, ${m.length?Q(O):O})}`,o++}else if(m.length){let M=t?`__h_${t}_${i.length}`:`__h${i.length}`;u+=_(`data-${k}-${w[1]}`,M),i.push({event:w[1],fn:`${M}: ${Q(O)}`})}else if(s.has(O))u+=`data-on-${w[1]}="$action:${O}"`;else if(/^\w+$/.test(O))u+=_(`data-on-${w[1]}`,O),i.push({event:w[1],fn:O});else{let M=t?`__h_${t}_${i.length}`:`__h${i.length}`;u+=_(`data-on-${w[1]}`,M),i.push({event:w[1],fn:`${M}: ${O}`})}f+=A+1,c=c.slice(A+1)}return{template:u,bindings:i,inlineCount:o}}function Gr(e){let s;try{s=C.readFileSync(e,"utf-8")}catch{return[]}let n=s.replace(Ps,""),t=Ls(n),r=t.match(Ns)?.[1]??t.replace(an,"").trim(),i=[];for(let o of r.matchAll(/<slot\s+([^>]*?)\/?>/g)){let h=/\bname\s*=\s*["'](\w+)["']/.exec(o[1]);if(!h)continue;let u=[...o[1].matchAll(/\b(\w+)\s*=\s*\{/g)].map(c=>c[1]).filter(c=>c!=="name");i.push({name:h[1],props:u})}return i}function ms(e){let s=[],n=[],t=null,r=0,i=o=>r<=0&&/from\s*['"][^'"]+['"]\s*;?\s*$/.test(o);for(let o of e.split(`
`)){if(t){t.push(o);for(let h of o)h==="{"||h==="("?r++:(h==="}"||h===")")&&r--;i(o)&&(s.push(t.join(`
`)),t=null);continue}if(/^\s*import\b/.test(o)){t=[o],r=0;for(let h of o)h==="{"||h==="("?r++:(h==="}"||h===")")&&r--;i(o)&&(s.push(o),t=null);continue}n.push(o)}return t&&s.push(t.join(`
`)),{imports:s.join(`
`),rest:n.join(`
`)}}var qt=new Map,ws=new Map;function Ws(e){let s=ws.get(e);return s||(s=new Set,ws.set(e,s)),s}var Us=[],Zr=2e3,$s=new WeakMap,bs=new WeakMap;function Xr(e){let s=$s.get(e);if(s===void 0){let n=[];for(let[t,r]of e)n.push(`${t}#${r.index}:${r.scopeKey}:${r.slots.join("|")}`);s=n.join(";"),$s.set(e,s)}return s}function Qr(e){let s=bs.get(e);if(s===void 0){let n=[];for(let t of e){if(!t.transform)continue;let r;try{r=String(t.transform)}catch{r="opaque"}n.push(`${t.name}${dn(r)}`)}s=n.join(""),bs.set(e,s)}return s}function Kr(e,s,n,t,r){let i;try{i=C.statSync(e)}catch{return null}let o=[e,String(i.mtimeMs),String(i.size),s,n?"1":"0",Xr(t),Qr(r)],h=Ws(e);for(let u of h)try{o.push(`${u}${String(C.statSync(u).mtimeMs)}`)}catch{o.push(`${u}gone`)}for(let u of Us)try{o.push(`watch:${u}${String(C.statSync(u).mtimeMs)}`)}catch{}return o.join("\0")}var Yr=(()=>{try{return String(C.statSync(Bt(import.meta.url)).mtimeMs)}catch{return"noid"}})(),At=(()=>{try{let e=x.join(js.tmpdir(),"rosezm-compile-cache");return C.mkdirSync(e,{recursive:!0}),e}catch{return null}})(),eo=0;function dn(e){let s=2166136261;for(let n=0;n<e.length;n++)s^=e.charCodeAt(n),s=Math.imul(s,16777619);return(s>>>0).toString(16).padStart(8,"0")}function Vs(e){return x.join(At,dn(e+"|"+Yr)+".json")}function to(e){if(!At||process.env.rosezm_NO_DISK_CACHE==="1")return null;try{let s=JSON.parse(C.readFileSync(Vs(e),"utf-8"));if(s&&typeof s=="object"&&typeof s.ssr=="string")return s}catch{}return null}function no(e,s){if(!At||process.env.rosezm_NO_DISK_CACHE==="1")return;let n=Vs(e),t=JSON.stringify(s);C.promises.writeFile(n,t).catch(()=>{C.promises.mkdir(At,{recursive:!0}).then(()=>C.promises.writeFile(n,t)).catch(()=>{})});try{if(!(eo++&511)){let r=C.readdirSync(At);if(r.length>5e3)for(let i of r)try{C.unlinkSync(x.join(At,i))}catch{}}}catch{}}async function so(e,s,n,t,r,i){let o=Kr(e,n,t,i,r);if(o){let u=qt.get(o);if(u)return{...u};let c=to(o);if(c)return c}let h=await ro(e,s,n,t,r,i);if(o){if(qt.size>=Zr){let u=qt.keys().next().value;u!==void 0&&qt.delete(u)}qt.set(o,h),no(o,h)}return h}function _s(e,s){let n=e.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+hotVary\s*=\s*\[([\s\S]*?)\]\s*;?/);if(!n)return;let t=[];for(let r of n[1].split(",")){let i=r.trim().replace(/^['"`]|['"`]$/g,"");if(!i)continue;let o=i.toLowerCase();if(!/^[a-z0-9!#$%&'*+.^_`|~-]+$/.test(o))throw new j("E-EXPORT",`${s}: export const hotVary must list request header names (got '${i}')`,{file:s,line:Ce(e,n),hint:"hotVary is a list of the request headers this route negotiates on, e.g. export const hotVary = ['x-locale', 'x-rv-url']"});if(o==="accept-encoding")throw new j("E-EXPORT",`${s}: hotVary must not name accept-encoding - the server stores raw bytes and re-negotiates the encoding on every request`,{file:s,line:Ce(e,n),hint:"drop accept-encoding from hotVary; it is already handled per request"});o==="cookie"||o==="accept-language"||t.includes(o)||t.push(o)}return t.length?t:void 0}async function ro(e,s,n,t=!1,r=[],i=new Map){let o=await C.promises.readFile(e,"utf-8");for(let y of r)if(y.transform)try{let E=await y.transform(o,e);if(typeof E=="string")o=E;else{o=E.code;for(let z of E.deps??[])Ws(e).add(z)}}catch(E){throw new j("E-PLUGIN",`plugin ${y.name} failed on ${x.basename(e)}: ${E instanceof Error?E.message:String(E)}`,{file:e,hint:"the error above came from inside the plugin - fix its transform() (or remove the plugin from rosezm.config.js)"})}if(o=ss(o,"web"),t){let y=cs(o).script,E=[...new Set([...[...y.matchAll(/(?:^|\n)\s*export\s+(?:async\s+)?function\s+(\w+)\s*\(/g)].map(q=>q[1]),...[...y.matchAll(/(?:^|\n)\s*export\s+(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:function\b|(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>)/g)].map(q=>q[1])])].filter(q=>Or.has(q)),z=/getContext\s*\(/.test(y)||/\$store\s*\(/.test(y)||/\$query\s*\(/.test(y),J=/\$store\s*\(/.test(y),ne=y.includes("__rosezmAuth"),oe=!z&&/(?:^|\n)\s*export\s+(?:const|let|var)\s+prerender\s*=\s*true\b/.test(y),Se=ms(gs(y,e,i).script),be=new Set([...y.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]\.\/runtime\.js['"]/g)].flatMap(q=>q[1].split(",").map(Xe=>Xe.trim().split(/\s+as\s+/)[0]).filter(Boolean))),De=Go.filter(q=>!be.has(q)),Ue=De.length>0?`import { ${De.join(", ")} } from './runtime.js';
`:"";return{ssr:"",client:"",stateKeys:[],actionNames:[],guardName:null,style:"",hasParams:!1,api:`${Ue}${vn(`${Se.imports}
${Se.rest}`,"ssr").trim()}`,apiMethods:E,hasPrerender:oe,usesContext:z,usesStore:J,usesrosezmAuth:ne,hotVary:_s(y,e)}}let{script:h,rest:u}=cs(o),c=u.replace(an,""),f=Rr(c),a=n==="_layout"||n.endsWith("/_layout"),l=y=>Gs(y.replace(/:global\(([^()]*)\)/g,"$1")),p=f.join(`
`),g=p.trim()?a?l(p):Zs(p,n):"",_=Ls(c),w=gs(h,e,i),$=w.script,m=$.includes("__rosezmAuth"),v=w.imports,{imports:k,rest:A}=ms($);if(x.basename(e)!=="_middleware.rose")for(let y of Ur(k)){let E=k.indexOf(y);throw new j("E-NODE-ONLY",`${e}: cannot import '${y}' in a page or component - it never reaches the browser. This module's script ships to the client (its $data bodies included), so move the import to src/pages/_middleware.rose or a pages/api/*.rose handler: those are server-only, and the rows travel to the page through getContext() / $data.`,{file:e,line:E>=0?St(k,E):void 0,hint:`'${y}' is a server-only module: import it inside src/pages/_middleware.rose (or a pages/api/*.rose handler) instead - a page/component script ships to the browser`})}let R=i.get(e)?.scopeKey.startsWith("components/")??!1;if(R&&/\$data\s*\(/.test($))throw new j("E-EXPORT",`${e}: $data() is not allowed in a component - an imported component renders synchronously inside its parent. Fetch in the page's $data (or pages/_middleware.rose) and pass the value down as a prop: <Card user={user()}>.`,{file:e,hint:"move the fetch to the page (or the middleware) and pass the value down as a prop"});let O=/getContext\s*\(/.test($)||/\$store\s*\(/.test($)||/\$query\s*\(/.test($),B=/\$store\s*\(/.test($),Q=/(?:^|\n)\s*export\s+(?:(?:const|let|var)\s+|(?:async\s+)?function\s+)params\b/.test($),M=$.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+revalidate\s*=\s*(\d+)\s*;?/),H=M?Number(M[1]):void 0,se=$.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+cache\s*=\s*(\d+)\s*;?/),ce=se?Number(se[1]):void 0,xe=_s($,e),Re=$.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+prefetch\s*=\s*['"`](\w+)['"`]\s*;?/),Ne=Re?Re[1]:void 0;if(Ne&&!["off","hover","viewport","all"].includes(Ne))throw new j("E-EXPORT",`${e}: export const prefetch must be 'off', 'hover', 'viewport' or 'all'`,{file:e,line:Ce($,Re),hint:"prefetch is the app-global link strategy, declared once in the root _layout.rose: 'off' | 'hover' (default) | 'viewport' | 'all'"});let L=$.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+lazyHydration\s*=\s*(true|false)\s*;?/),G=L?L[1]==="true":void 0;if(L&&!G)throw new j("E-EXPORT",`${e}: export const lazyHydration must be true (or be absent - hydration is eager by default)`,{file:e,line:Ce($,L),hint:"omit the export entirely, or set it to exactly true - lazy hydration is opt-in per app, declared once in the root _layout.rose"});let de=$.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+vitals\s*=\s*([^;\n]+)\s*;?/),Te=de?de[1].trim()==="true":void 0;if(de&&!Te)throw new j("E-EXPORT",`${e}: export const vitals must be true (or be absent - the hook ships only when an app asks for it)`,{file:e,line:Ce($,de),hint:"omit the export entirely, or set it to exactly true - the web-vitals hook is opt-in per app"});let Me=$.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+bundle\s*=\s*['"`](\w+)['"`]\s*;?/),Fe=Me?Me[1]:void 0;if(Fe&&!["inline","split","sliced"].includes(Fe))throw new j("E-EXPORT",`${e}: export const bundle must be 'inline', 'split' or 'sliced'`,{file:e,line:Ce($,Me),hint:"'inline' (default) is the single-document mode; 'split' is mode B for large apps - route-level chunks, loaded on demand; 'sliced' inlines the runtime plus each route's own render chain and shares the rest via a nav chunk"});let Ae=$.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+csr\s*=\s*(true|false)\s*;?/),he=Ae?Ae[1]!=="false":void 0,pe=$.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+shell\s*=\s*(true|false)\s*;?/),I=pe?pe[1]!=="false":void 0,je=$.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+buffer\s*=\s*(true|false)\s*;?/),Be=je?je[1]!=="false":void 0,Z=/\b(?:redirect|notFound)\s*\(/.test($)||void 0;if(he===!1){let y=/\son:[a-z]+\s*=/.exec(o)??/\b(?:onMount|onCleanup|refresh)\s*\(/.exec($);if(y){let E=y===(/\son:[a-z]+\s*=/.exec(o)??void 0)?o:$;throw new j("E-EXPORT",`${e}: csr = false cannot ship ${y[0].trim()} - event wiring, onMount/onCleanup and refresh() all need the client bundle. (Forms still work without JS: a native POST runs the server action.)`,{file:e,line:Ce(E,y),hint:'drop csr = false (let the compiler decide), or remove the client-only code - a native <form method="POST"> server action works without the bundle'})}}let W,D=vs($,"headers");if(D){let y;try{y=new Function(`return ${D}`)()}catch{throw new j("E-EXPORT",`${e}: export const headers must be an object literal`,{file:e,hint:"write it as one literal: export const headers = { 'x-robots-tag': 'noindex' }"})}if(!y||typeof y!="object"||Array.isArray(y)||Object.values(y).some(E=>typeof E!="string"))throw new j("E-EXPORT",`${e}: export const headers must be a flat map of string -> string`,{file:e,hint:"every value must be a string literal (a number or an array fails here instead of shipping verbatim)"});W=y}let ee,te=vs($,"csp");if(te){let y;try{y=new Function(`return ${te}`)()}catch{throw new j("E-EXPORT",`${e}: export const csp must be an object literal`,{file:e,hint:"write it as one literal: export const csp = { nonce: true }"})}let E=y?.nonce;if(E!==void 0&&typeof E!="boolean")throw new j("E-EXPORT",`${e}: csp.nonce must be a boolean`,{file:e,hint:"csp.nonce is a switch: true (per-request nonce, the route becomes dynamic) or absent (the default hashed policy)"});ee=E===!0}let{clean:K,exports:ge,actions:ve,props:ie,guard:Y}=io(A),U=K,X=new Set(ve.map(y=>y.name)),ue=[];/\son:[a-z]+\s*=/.test(o)&&ue.push("event wiring (on:)"),/\sbind:(?:value|checked|group|open)\s*=/.test(o)&&ue.push("a two-way binding (bind:)"),(/<form[^>]*\son:[a-z]+\s*=/i.test(o)||/\$action:|data-on-/.test(o))&&ue.push("a form bound to a client dispatch ($action)");let Le=$.match(/\b(?:onMount|onCleanup|refresh|adopt)\s*\(|(?:\$action|\$effect)\s*\(/);Le&&ue.push(`${Le[0].replace(/\s*\($/,"")}()`),o.includes("{#defer")&&ue.push("{#defer} progressive content"),o.includes("{#await")&&ue.push("{#await} async block");let Je=ue.length>0,Ie=[];if(!Je){let y=ps(o),E=ps($),z=Hr(E);/\son[a-z]+\s*=\s*["'][^"']*["']/i.test(y)&&Ie.push('an inline on* attribute (e.g. onclick="...") - it cannot fire without the bundle; use on:click or set csr = true'),/javascript:/i.test(y)&&Ie.push("a javascript: URL - it needs the bundle to run; link to a real route"),/\b(?:eval|new Function)\s*\(/.test(z)&&Ie.push("eval()/new Function() - client code the predicate cannot see"),/\b(?:document|window|localStorage|sessionStorage)\s*\.|\b(?:add|remove)EventListener\s*\(|\brequestAnimationFrame\s*\(|\bMutationObserver\b|\bnavigator\s*\.|\blocation\s*\.\s*(?:href|assign|replace|reload|pathname|search|hash|origin)\b|\b(?:setTimeout|setInterval)\s*\(/.test(z)&&Ie.push("browser-only code (document./window./addEventListener/a timer/...) - a JS-free document never ships this script to the browser, so it throws on the server or runs there and never reaches the client; if the route needs the browser, set csr = true")}let Ve=_.match(Ns),Ge=u.match(an)?.[1]??"",ae=Ve?Ve[1]:_.replace(Os,"").trim(),Ee=g?oo(Rs(ae,s),n):Rs(ae,s),Oe=lo(U),at=Oe.filter(y=>y.kind==="state"||y.kind==="kv"||y.kind==="persist"),He=Oe.filter(y=>y.kind==="derived").map(y=>y.name),wt=[...at.map(y=>y.name),...Oe.filter(y=>y.kind==="data").map(y=>y.name),...He],me=new Map;at.forEach(y=>me.set(y.name,`set${Qe(y.name)}`));{let y=Vt($),E=new Set;for(let z of y.matchAll(/(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g))E.add(z[1]);for(let z of y.matchAll(/(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g))E.add(z[1]);for(let z of at){let J=me.get(z.name);if(E.has(J))throw new j("E-SCRIPT",`${e}: the automatic setter "${J}" for $state("${z.name}") collides with a same-named declaration in the script`,{file:e,hint:`rename your function, or drop the auto setter and write $setState("${z.name}", v) - the explicit form never collides`});if(As.has(z.name))throw new j("E-SCRIPT",`${e}: the $state name "${z.name}" collides with the framework's runtime import of the same name`,{file:e,hint:`rename the variable (e.g. ${z.name}_status) - a name matching a runtime export (${[...As].slice(0,4).join(", ")}...) makes the bundle self-reference and 500 at render`})}}let Ot=(()=>{let y=["state","derived","kv","persist"],E=Oe.map((oe,Se)=>({d:oe,i:Se})).filter(({d:oe})=>y.includes(oe.kind)),z=new Set(E.map(({d:oe})=>oe.name)),J=[],ne=new Set;for(let oe=0;oe<=E.length;oe++){let Se=!1;for(let{d:be,i:De}of E){if(ne.has(be.name))continue;[...new Set([...be.expr.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)].map(q=>q[1]))].filter(q=>z.has(q)&&q!==be.name).every(q=>ne.has(q))&&(J.push(De),ne.add(be.name),Se=!0)}if(!Se)break}return J})(),$t=y=>{let E=R?`${n}:${y.name}`:y.name,z=R?`__ik(${JSON.stringify(E)})`:JSON.stringify(E);if(y.kind==="state")return`const [${y.name}, ${me.get(y.name)}] = state(${z}, ${y.expr});`;let ne=y.expr.includes("=>")||y.expr.startsWith("function")?y.expr:`() => (${y.expr})`;if(y.kind==="persist")return`const [${y.name}, ${me.get(y.name)}] = persistState(${z}, ${y.expr});`;if(y.kind==="derived")return`const ${y.name} = () => (${st(y.expr,wt)});`;if(y.kind==="kv"){let oe=/^(.*)\s*,\s*(\d+)\s*$/s.exec(y.expr),Se=oe?oe[1]:y.expr,be=oe?oe[2]:"300";return`const __seeded_${y.name} = isSeeded(${z});
const [${y.name}, set${Qe(y.name)}] = state(${z}, null);
if (!__seeded_${y.name}) { const __v_${y.name} = await globalThis.__rosezmKvApi.kvMemo(${R?`__ik(${JSON.stringify("__kvh:"+n+":"+y.name)})`:JSON.stringify("__kvh:"+n+":"+y.name)}, ${Se}, ${be}); set${Qe(y.name)}(__v_${y.name}); markSeeded(${z}); }`}return`const __seeded_${y.name} = isSeeded(${z});
const [${y.name}, set${Qe(y.name)}] = state(${z}, null);
if (!__seeded_${y.name}) { const __v_${y.name} = await $data(${ne}); set${Qe(y.name)}(__v_${y.name}); markSeeded(${z}); }`},bt=[],_t="",yt=0;Oe.forEach((y,E)=>{let z=co(U,y.start)===0;if(!z){if(y.kind==="derived")throw new Error(`${e}: $derived must be a top-level declaration - inside a function body a plain const arrow already does this natively`);bt.push(y)}_t+=U.slice(yt,y.start)+(z?`'__rvdecl${E}__';`:""),yt=y.end}),_t+=U.slice(yt);let fn=new Set(at.map(y=>y.name)),Pt=y=>fn.has(y),xt=Zn(U);if(xt)throw new j("E-STATE",`${e}: ${xt} is a $derived value and is written here - a $derived is read-only`,{hint:`make ${xt} a $state, or derive a different name from it`});let We=_n(_t,Pt).replace(ds,(y,E,z)=>{let J=E.trim().replace(/^['"`]|['"`]$/g,"");if(He.includes(J))throw new Error(`${e}: $setState('${J}', ...) - a $derived value is read-only; make it $state or derive a different expression`);return`${me.get(J)||`set${Qe(J)}`}(${z})`});if(We=st(We,wt),[...We.matchAll(/'__rvdecl(\d+)__';/g)].length===Ot.length){let E=0;We=We.replace(/'__rvdecl(\d+)__';/g,(z,J)=>$t(Oe[Ot[E++]??Number(J)]))}else We=We.replace(/'__rvdecl(\d+)__';/g,(E,z)=>$t(Oe[Number(z)]));let Zt=bt.filter(y=>y.kind==="state").map($t).join(`
`),vt=bt.filter(y=>y.kind==="data").map($t).join(`
`),Xt=Xn(Ee,Pt).replace(ds,(y,E,z)=>{let J=E.trim().replace(/^['"`]|['"`]$/g,"");if(He.includes(J))throw new j("E-STATE",`${e}: $setState('${J}', ...) in a template handler - a $derived value is read-only`,{hint:`make ${J} a $state, or derive a different name from it`});return`${me.get(J)||`set${Qe(J)}`}(${z})`}),gn=En(Xt,wt).replace(/<img\b(?![^>]*?\sloading=)/gi,'<img loading="lazy"').replace(/<img\b(?![^>]*?\sdecoding=)/gi,'<img decoding="async"'),Nt=n.replace(/[^\w]/g,"_").replace(/^_+|_+$/g,"").slice(-40),lt=Vr(gn,X,e,Nt,R),Mt=lt.inlineCount,qe=Oe.filter(y=>y.kind!=="derived").map(y=>y.name),ze=[],Ye=0,Qt=new Set(v.map(y=>y.name)),kt=new Set(ie.map(y=>y.name)),Et=!1,Kt=lt.template.replace(/\sbind:(value|checked|this|open)\s*=\s*\{([\w$]+)(?:\(\))?((?:\.[\w$]+(?:\(\))?)*)\}/g,(y,E,z,J,ne,oe)=>{let Se=oe.lastIndexOf("<",ne),be=Se>=0?oe.slice(Se,ne):"",De=/^<([a-zA-Z][^\s/>]*)/.exec(be)?.[1]??"",Ue=z+J,q=z,Xe=J.split(".").filter(Boolean).map(Pe=>Pe.replace(/\(\)$/,"")),zt=Xe.length>0;if(!qe.includes(q)&&!kt.has(q)&&!zt)throw new Error(`${e}: bind:${E}={${Ue}} must name a $state declaration`+(qe.length?` (state keys here: ${qe.join(", ")})`:" (this file declares no $state)"));if(zt&&!qe.includes(q)){let fe=Js(lt.template).filter(tt=>ne>=tt.contentStart&&ne<tt.contentEnd).sort((tt,cr)=>tt.contentStart-cr.contentStart).pop()??null;if(!fe||!fe.names.has(q)||Hs(lt.template,fe.contentStart,ne))throw new Error(`${e}: bind:${E}={${Ue}} binds a field of "${q}", which is not a $state declaration`+(qe.length?` (state keys here: ${qe.join(", ")})`:" (this file declares no $state)"));let ye=fe.items,et=[...me.keys()].find(tt=>ye===tt||ye===`${tt}()`);if(!et)throw new Error(`${e}: bind:${E}={${Ue}} - the {#each} source "${ye}" is not a plain $state read, so the row edit has no state to write back through. Copy the row into a $state and bind through it`);let wn=me.get(et),Un=Xe;Et=!0,Mt++;let lr=E==="checked"?"e.target.checked":"__rvraw(e)",$n=`(e) => __rvrow(${wn}, ${ye}, ${q}, ${JSON.stringify(Un)}, ${lr})`,bn=Nt?`__rh_${Nt}_`:"__rh_",Vn=`${q}${Un.map(tt=>`.${tt}`).join("")}`;return E==="checked"?` checked={${Vn}} data-on-change={__rhreg(${JSON.stringify(bn)}, ${$n})}`:` value={${Vn}} data-on-input={__rhreg(${JSON.stringify(bn)}, ${$n})} data-on-change={__rhreg(${JSON.stringify(bn)}, ${$n})}`}if(E==="this")return R?` data-bind-this={__ik(${JSON.stringify(`${n}:${q}`)})}`:` data-bind-this="${q}"`;if(!qe.includes(q)){let Pe="on"+Qe(E)+"Change",fe=`__rvbind_${n.replace(/\W/g,"_")}_${Ye++}`,ye=et=>R?` data-on-${et}={__hk(${JSON.stringify(fe)})}`:` data-on-${et}="${fe}"`;return/^<select[\s>]/i.test(be)&&/\smultiple\b/i.test(be)?(ze.push({event:"change",fn:`${fe}: (e) => __p.${Pe}?.(Array.from(e.target.selectedOptions, (o) => o.value))`}),` data-selmulti={(__rvlive('value', ${q}) || []).join(',')}${ye("change")}`):E==="checked"?(ze.push({event:"change",fn:`${fe}: (e) => __p.${Pe}?.(e.target.checked)`}),` checked={__rvlive('checked', ${q})}${ye("change")}`):E==="open"?(ze.push({event:"toggle",fn:`${fe}: (e) => __p.${Pe}?.(e.target.open)`}),` open={__rvlive('open', ${q})}${ye("toggle")}`):(ze.push({event:"input",fn:`${fe}: (e) => { const t = e.target; const raw = t.type === 'number' || t.type === 'range' ? t.valueAsNumber : t.value; __p.${Pe}?.(typeof raw === 'number' && Number.isNaN(raw) ? null : raw); }`}),` value={__rvlive('value', ${q})}${ye("input")}${ye("change")}`)}if(zt){Et=!0;let Pe=me.get(q),fe=`${q}()`+Xe.map(wn=>`.${wn}`).join(""),ye=`__rvbind_${n.replace(/\W/g,"_")}_${Ye++}`,et=`${Pe}(__rvsetpath(${q}(), ${JSON.stringify(Xe)}, ${E==="checked"?"e.target.checked":"__rvraw(e)"}))`;return E==="checked"?(ze.push({event:"change",fn:`${ye}: (e) => { ${et}; }`}),` checked={${fe}}${R?` data-on-change={__hk(${JSON.stringify(ye)})}`:` data-on-change="${ye}"`}`):(ze.push({event:"input",fn:`${ye}: (e) => { ${et}; }`}),ze.push({event:"change",fn:`${ye}: (e) => { ${et}; }`}),` value={${fe}}${R?` data-on-input={__hk(${JSON.stringify(ye)})} data-on-change={__hk(${JSON.stringify(ye)})}`:` data-on-input="${ye}" data-on-change="${ye}"`}`)}if(De&&Qt.has(De)){let Pe=me.get(q),fe="on"+Qe(E)+"Change";return` ${E}={${q}()} __live-${E}={${q}} ${fe}={${Pe}}`}if(E==="value"&&/^<select[\s>]/i.test(be)&&/\smultiple\b/i.test(be)){let Pe=me.get(q),fe=`__rvbind_${n.replace(/\W/g,"_")}_${Ye++}`;return ze.push({event:"change",fn:`${fe}: (e) => ${Pe}(Array.from(e.target.selectedOptions, (o) => o.value))`}),` data-selmulti={${q}().join(',')} data-on-change="${fe}"`}if(E==="open"){let Pe=me.get(q),fe=`__rvbind_${n.replace(/\W/g,"_")}_${Ye++}`;return ze.push({event:"toggle",fn:`${fe}: (e) => ${Pe}(e.target.open)`}),` open={${q}()}${R?` data-on-toggle={__hk(${JSON.stringify(fe)})}`:` data-on-toggle="${fe}"`}`}let nn=me.get(q),mn=E==="checked"?"change":"input",ct=`__rvbind_${n.replace(/\W/g,"_")}_${Ye++}`;ze.push({event:mn,fn:E==="checked"?`${ct}: (e) => ${nn}(e.target.checked)`:`${ct}: (e) => { const t = e.target; const raw = t.type === 'number' || t.type === 'range' ? t.valueAsNumber : t.value; ${nn}(typeof raw === 'number' && Number.isNaN(raw) ? null : raw); }`});let ar=E==="checked"?R?` data-on-change={__hk(${JSON.stringify(ct)})}`:` data-on-change="${ct}"`:R?` data-on-input={__hk(${JSON.stringify(ct)})} data-on-change={__hk(${JSON.stringify(ct)})}`:` data-on-input="${ct}" data-on-change="${ct}"`;return` ${E}={${q}()}${ar}`}),Yt=new Map(v.map(y=>{let E=x.resolve(x.dirname(e),y.specifier),z=i.get(E);return[y.name,{index:z.index,slots:z.slots}]})),Lt=[],en=0,ft=!kt.size||!/<(input|textarea|select)[\s>]/i.test(Kt)?Kt:Tt(Kt,y=>{let{tag:E,attrs:z}=y;if(!/^(input|textarea|select)$/i.test(E)||/\sdata-on-input=|\sdata-selmulti=/.test(z))return null;let J=/\svalue\s*=\s*\{([\w$]+)\}/.exec(z);if(!J||!kt.has(J[1]))return null;let ne=J[1],oe=`__rvbind_${n.replace(/\W/g,"_")}_${Ye++}`;ze.push({event:"input",fn:`${oe}: (e) => { const t = e.target; const raw = t.type === 'number' || t.type === 'range' ? t.valueAsNumber : t.value; __p.onValueChange?.(typeof raw === 'number' && Number.isNaN(raw) ? null : raw); }`});let Se=/^select$/i.test(E)&&/\smultiple\b/i.test(z),be=z.replace(J[0],` value={__rvlive('value', ${ne})}`),De=q=>R?` data-on-${q}={__hk(${JSON.stringify(oe)})}`:` data-on-${q}="${oe}"`,Ue=Se?` data-selmulti={(__rvlive('value', ${ne}) || []).join(',')}${De("change")}`:`${De("input")}${De("change")}`;return be+Ue}),d=ft.includes("bind:group")?Tt(ft,y=>{let{tag:E,attrs:z}=y,J=/\sbind:group\s*=\s*\{([\w$]+)(?:\(\))?\}/.exec(z);if(!J)return null;let ne=J[1],oe=!qe.includes(ne);if(oe&&!kt.has(ne))throw new j("E-TEMPLATE",`${e}: bind:group={${ne}} must name a $state declaration`,{hint:"the group state holds the selected value (radio) or an ARRAY of checked values (checkbox) - declare it: let "+ne+' = $state("")'});if(!oe&&Qt.has(E)){let mn=me.get(ne);return z.replace(J[0],` group={${ne}()} __live-group={${ne}} onGroupChange={${mn}}`)}if(!/\stype\s*=\s*["'](radio|checkbox)["']/.test(z))throw new j("E-TEMPLATE",`${e}: bind:group is for radio and checkbox inputs`,{hint:'<input type="radio" value="v" bind:group={state}> holds the selected value; type="checkbox" holds an ARRAY of the checked values (declare the state as $state([]))'});let Se=/\stype\s*=\s*["']checkbox["']/.test(z),be=/\svalue\s*=\s*"([^"]*)"|\svalue\s*=\s*'([^']*)'/.exec(z);if(!be||/\{/.test(be[0]))throw new j("E-TEMPLATE",`${e}: a bind:group input needs a static value attribute`,{hint:'<input type="radio" value="free" bind:group={plan}> - the value IS what the state receives'});if(/\schecked\s*=/.test(z))throw new j("E-TEMPLATE",`${e}: a bind:group input cannot also carry checked=`,{hint:"the group state alone decides which inputs are checked"});let De=oe?"":me.get(ne),Ue=`__rvbg_${n.replace(/\W/g,"_")}_${en++}`,q=JSON.stringify(be[1]??be[2]),Xe=oe?`__rvlive('group', ${ne})`:`${ne}()`,zt=Se?`${Xe}.includes(${q})`:`${Xe} === ${q}`,nn=Se?oe?`__p.onGroupChange?.(e.target.checked ? [...${Xe}, ${q}] : ${Xe}.filter((x) => x !== ${q}))`:`${De}(e.target.checked ? [...${ne}(), ${q}] : ${ne}().filter((x) => x !== ${q}))`:oe?"__p.onGroupChange?.(e.target.value)":`${De}(e.target.value)`;return Lt.push({event:"change",fn:`${Ue}: (e) => { ${nn}; }`}),z.replace(J[0],` checked={${zt}}${R?` data-on-change={__hk(${JSON.stringify(Ue)})}`:` data-on-change="${Ue}"`}`)}):ft,b=lt.bindings.concat(ze,Lt),T=d.replace(/\suse:([\w-]+)(\s*=\s*\{([\s\S]*?)\})?/g,(y,E,z,J)=>z?` data-use="${E}" data-use-param={JSON.stringify(${J})}`:` data-use="${E}"`),N=rs(T,"web"),F=wo(N,e),P=go(F),S=_o(P,e),V=$o(S,e),we=bo(V,e),ke=fo(we,e),le=xo(ke),re=vo(le),_e=Eo(re.template,e),Ze=yo(_e.template,e),tn=jo(Ze.replace(Tr,(y,E,z)=>{let J=`{__slot(${hs(E)})}`;if(z){if(/\{[^{}]*\}/.test(z))throw new j("E-TEMPLATE",`${e}: slot fallback content must be static markup`,{hint:"a {expr} inside a slot fallback has no reactive scope here - render the dynamic part in the parent and pass it as the slot content"});return`{__slot(${hs(E)}, ${JSON.stringify(z)})}`}return J}).replace(Cr,(y,E)=>E&&E.trim()?`{__slotDefault(${JSON.stringify(E)})}`:"{__slot__}"),Yt);To(tn,e);let zn=new Set;{let y=Vt($),E=new Set(at.map(J=>J.name)),z=J=>/^(?:async\s*)?(?:function\b|\([^)]*\)\s*=>)/.test(J)||/^(?:async\s*)?\(/.test(J)&&J.includes("=>")||/^(?:async\s+)?[A-Za-z_$][\w$]*\s*=>/.test(J);for(let J of y.matchAll(/(?:^|\n)\s*(?:export\s+)?(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;]{0,200})/g))E.has(J[1])||/^\s*\$state\b/.test(J[2])||z(J[2].trim())||zn.add(J[1])}Sn=0,Ht=e,ln=new Set,Rn=!0,Tn=new Set(zn);let Dn=Ke(tn,"h","__c",null,0,!0,Yt);Rn=!1,Tn=new Set;let Fn=An,sr=Cn;An="",Cn={},ln=new Set;let qn=jn;if(jn=null,qn)throw new j("E-TEMPLATE",`${e}: {@const ${qn}} is declared twice at the top level`,{file:e,hint:"a const cannot be redeclared in the same scope - rename one of them, or wrap the second in a block ({#if}/{#each}) where it shadows the first instead of colliding with it"});for(let y of b)/^\w+$/.test(y.fn)||(y.fn=st(y.fn,[],sr));let It=Ge.trim()?Ro(Ge):"";if(!R&&g){let E=`<style id="${"rosezm-style-"+n.replace(/[^a-zA-Z0-9_-]/g,"-")}">${g}</style>`;It=(It?It+`
`:"")+`__hd += ${JSON.stringify(E)};`}let Bn=/<slot\s+[^>]*\bname\s*=/.test(Ee),Jn=ve.length>0?`${ge}
${ve.map(y=>y.stmt).join(`
`)}`:ge,Hn=Y?`
${Y}`:"",rr=x.basename(e)==="_middleware.rose",Wn=ko(re.count,re.holds)+(_e.blocks.length?`
`+So(_e.blocks):""),or=rr?`${jt}

${k}

${Jn}
${Hn}

${We}
`:Zo(We+Wn,Dn,Zt,Jn,It,ie,Bn,k,R,Hn,ve.length>0,vt,Fn,Mt>0,Et),ir=Xo(We+Wn,Dn,Zt,b,ge,It,ie,Bn,k,R,vt,Fn,Mt>0,Et);return{ssr:vn(or,"ssr"),client:vn(ir,"client"),stateKeys:qe,actionNames:[...X],guardName:Y?"beforeAction":null,style:g,hasParams:Q,usesContext:O,usesStore:B,revalidate:H,cache:ce,hotVary:xe,csr:he,shell:I,buffer:Be,controlSignal:Z,prefetch:Ne,lazyHydration:G,vitals:Te,bundle:Fe,needsClient:Je,clientReasons:ue,jsWarnings:Ie,headers:W,cspNonce:ee,usesrosezmAuth:m,props:ie,roseImports:v,isComponent:R}}function Gs(e){return e.replace(/(-?\d*\.?\d+)rpx/g,(s,n)=>{let t=Number(n)/2;return t===0?"0":`${Math.round(t*100)/100}px`})}function ys(e){return e.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^"']+/g,s=>s[0]==='"'||s[0]==="'"?s:s.replace(/\s+/g," ").replace(/\s*([:;{},])\s*/g,"$1").trim()).trim()}function Zs(e,s){let n=`[data-rosezm-c="${s}"]`,t=u=>{let c=u.trim();if(!c.includes(":global"))return`${n} ${c}, ${n}${c}`;let f=c.replace(/:global\([^()]*\)/g,l=>l.slice(8,-1)).trim();return c.replace(/:global\([^()]*\)/g,"").trim()?`${n} ${f}, ${n}${f}`:f},r=Gs(e.replace(/\/\*[\s\S]*?\*\//g,"")),i="",o="",h=0;for(;h<r.length;){let u=r[h];if(u==="{"){let c=1,f=h+1;for(;f<r.length&&c>0;)r[f]==="{"?c++:r[f]==="}"&&c--,f++;let a=r.slice(h+1,f-1),l=o.trim();if(l.startsWith("@"))i+=`${l}{${/^@(?:-[\w]+-)?keyframes/.test(l)?ys(a):Zs(a,s)}}`;else if(l){let p=l.split(",").map(g=>t(g)).join(",");i+=`${p}{${ys(a)}}`}o="",h=f;continue}u!=="}"&&u!==`
`&&u!=="\r"?o+=u:u==="}"&&(o=""),h++}return i.trim()}function oo(e,s){let n=` data-rosezm-c="${s}"`,t="",r=0,i=0;for(;i<e.length;){let o=e.indexOf("<",i);if(o===-1){t+=e.slice(i);break}t+=e.slice(i,o);let h=o+1,u="",c=0,f=0;for(;h<e.length;){let _=e[h];if(u)_===u&&(u="");else if(_==='"'||_==="'")u=_;else if(_==="(")c++;else if(_===")")c=Math.max(0,c-1);else if(_==="{")f++;else if(_==="}")f=Math.max(0,f-1);else if(_===">"&&c===0&&f===0)break;h++}let a=e.slice(o,h+1),l=/^<\//.test(a),p=a.match(/^<\/?([a-zA-Z][\w-]*)/),g=/\/>$/.test(a)||p&&Xs.has(p[1].toLowerCase());if(p&&!l&&r===0&&!g){let _=a.endsWith("/>")?a.length-2:a.length-1;t+=a.slice(0,_)+n+a.slice(_),r++}else t+=a,p&&(r+=l?-1:g?0:1);i=h+1}return t}var Xs=new Set(["img","br","hr","input","meta","link","source","wbr"]),xs=/^[ \t]*export\s+(?:(const|let|var)|(?:async\s+)?function)\s+(\w+)/gm;function vs(e,s){let n=new RegExp(`(?:^|\\n)\\s*export\\s+(?:const|let|var)\\s+${s}\\s*=\\s*`).exec(e);if(!n)return null;let t=n.index+n[0].length;if(e[t]!=="{")return null;let r=t,i=0;for(;t<e.length;t++){let o=e[t];if(o==="{")i++;else if(o==="}"&&(i--,i===0)){t++;break}}return e.slice(r,t)}function io(e){let s=[],n=[],t=[],r=[],i="",o=0,h;for(xs.lastIndex=0;h=xs.exec(e);){let u=h[1],c=h.index+h[0].indexOf("export"),f=c+h[0].length-h[0].indexOf("export");if(u){let g=0,_=!1;for(;f<e.length;){let w=e[f];if(w==="("||w==="{"||w==="[")g++;else if(w===")"||w==="}"||w==="]"){if(g--,g===0&&_){f++;break}}else if(g===0&&w==="="){let $=f>0?e[f-1]:"",m=f+1<e.length?e[f+1]:"";$!=="="&&$!=="!"&&$!=="<"&&$!==">"&&m!=="="&&m!==">"&&(_=!0)}else if(g===0&&w===";"){f++;break}else if(g===0&&w===`
`){let $=e.slice(f+1);if(!/^\s*[.([{+\-*/?:,=&|]/.test($)){f++;break}}f++}e[f]===";"&&f++}else{for(;f<e.length&&e[f]!=="{";)f++;let g=0;for(;f<e.length;){let _=e[f];if(_==="{")g++;else if(_==="}"&&(g--,g===0)){f++;break}f++}}i+=e.slice(o,c);let a=e.slice(c,f).trim(),l=a.match(/^export\s+async\s+function\s+(\w+)/);if(a.match(/^export\s+(?:async\s+)?function\s+(\w+)/)?.[1]==="beforeAction")r.push(a);else if(l)n.push({name:l[1],stmt:a});else if(u==="let"){let g=/^export\s+let\s+(\w+)/.exec(a);if(g){let _=0,w="",$=-1;for(let v=g[0].length;v<a.length;v++){let k=a[v];if(w){k==="\\"?v++:k===w&&(w="");continue}if(k==="'"||k==='"'||k==="`"){w=k;continue}if(k==="("||k==="["||k==="{")_++;else if(k===")"||k==="]"||k==="}")_--;else if(_===0&&k==="="){let A=v>0?a[v-1]:"",R=v+1<a.length?a[v+1]:"";if(A==="="||A==="!"||A==="<"||A===">"||R==="="||R===">")continue;$=v;break}}let m=$>=0?a.slice($+1).replace(/;\s*$/,"").trim():"";t.push({name:g[1],def:m===""?null:m})}else s.push(a)}else s.push(a);o=f}return i+=e.slice(o),{clean:i,exports:s.join(`
`),actions:n,props:t,guard:r.join(`
`)}}var ao=new Set("(,=:[!&|?{};+-*%<>~^".split(""));function Nn(e,s){let n=s-1;for(;n>=0&&/\s/.test(e[n]);)n--;if(n<0)return!0;let t=e[n];if(ao.has(t))return!0;if(/[A-Za-z0-9_$]/.test(t)){let r=qs(e,n);return r?["return","typeof","instanceof","in","of","new","delete","void","throw","case","do","else"].includes(r):!1}return!1}function Mn(e,s,n=e.length){let t=s+1,r=!1;for(;t<n;){let i=e[t];if(i==="\\"){t+=2;continue}if(r){i==="]"&&(r=!1),t++;continue}if(i==="["){r=!0,t++;continue}if(i==="/"||i===`
`)break;t++}for(e[t]==="/"&&t++;t<n&&/[a-z]/.test(e[t]);)t++;return t}function lo(e){let s=[],n=Vt(e);us.lastIndex=0;let t;for(;t=us.exec(n);){let r=t.index+t[0].length,i=()=>{for(;r<e.length&&/\s/.test(e[r]);)r++};if(i(),e[r]==="<"){let a=0;for(;r<e.length;){let l=e[r];if(l==="<")a++;else if(l===">"&&e[r-1]!=="="){if(a--,a===0){r++;break}}else l==="="&&e[r+1]===">"&&r++;r++}i()}if(e[r]!=="(")continue;let o=r+1,h=1,u=o;for(;u<e.length&&h>0;){let a=e[u];a==="("?h++:a===")"&&h--,u++}let c=u,f=Ar.exec(e.slice(u));f&&(c=u+f[0].length),e[c]===";"&&c++,s.push({name:t[1],kind:t[2],expr:e.slice(o,u-1).trim(),start:t.index,end:c})}return s}function co(e,s){let n=0,t=0;for(;t<s;){let r=e[t];if(r==="'"||r==='"'||r==="`"){let i=r;for(t++;t<s;){if(e[t]==="\\"){t+=2;continue}if(e[t]===i){t++;break}if(i==="`"&&e[t]==="$"&&e[t+1]==="{"){let o=1;for(t+=2;t<s&&o>0;)e[t]==="{"?o++:e[t]==="}"&&o--,t++;continue}t++}continue}if(r==="/"&&e[t+1]==="/"){let i=e.indexOf(`
`,t);t=i===-1?e.length:i;continue}if(r==="/"&&e[t+1]==="*"){let i=e.indexOf("*/",t+2);t=i===-1?e.length:i+2;continue}if(r==="/"&&Nn(e,t)){t=Mn(e,t,s);continue}r==="{"?n++:r==="}"&&n--,t++}return n}function Vt(e){let s="",n=0,t=(r,i)=>{for(let o=r;o<i&&o<e.length;o++)s+=e[o]===`
`?`
`:" "};for(;n<e.length;){let r=e[n];if(r==="'"||r==='"'||r==="`"){let i=r,o=n+1;for(;o<e.length;){if(e[o]==="\\"){o+=2;continue}if(e[o]===i){o++;break}if(i==="`"&&e[o]==="$"&&e[o+1]==="{"){let h=Gt(e,o+1);o=h<0?e.length:h+1;continue}o++}t(n,Math.min(o,e.length)),n=o;continue}if(r==="/"&&e[n+1]==="/"){let i=e.indexOf(`
`,n),o=i===-1?e.length:i;t(n,o),n=o;continue}if(r==="/"&&e[n+1]==="*"){let i=e.indexOf("*/",n+2),o=i===-1?e.length:i+2;t(n,o),n=o;continue}if(r==="/"&&Nn(e,n)){let i=Mn(e,n);t(n,i),n=i;continue}s+=r,n++}return s}var uo=new Set(["true","false","null","undefined","NaN","Infinity"]);function ht(e,s,n){if(!s)return e;let t=new RegExp(s.source,(s.flags.includes("g")?s.flags.replace("g",""):s.flags)+"y"),r="",i=0,o=e.length;for(;i<o;){let h=e[i];if(h==="/"&&e[i+1]==="/"){let c=e.indexOf(`
`,i),f=c<0?o:c;r+=e.slice(i,f),i=f;continue}if(h==="/"&&e[i+1]==="*"){let c=e.indexOf("*/",i+2),f=c<0?o:c+2;r+=e.slice(i,f),i=f;continue}if(h==='"'||h==="'"){let c=i+1;for(;c<o;){if(e[c]==="\\"){c+=2;continue}if(e[c]===h){c+=1;break}c+=1}r+=e.slice(i,c),i=c;continue}if(h==="`"){let c=i+1,f="";for(;c<o;){if(e[c]==="\\"){c+=2;continue}if(e[c]==="`"){c+=1;break}if(e[c]==="$"&&e[c+1]==="{"){let a=1,l=c+2;for(;l<o&&a>0&&(e[l]==="{"?a+=1:e[l]==="}"&&(a-=1),a!==0);)l+=1;f+=ht(e.slice(c+2,l),s,n),c=l+1;continue}c+=1}r+=e.slice(i,c),i=c;continue}t.lastIndex=i;let u=t.exec(e);if(u){r+=n,i+=u[0].length;continue}r+=h,i+=1}return r}function ks(e){let s=e.trim();return/^[A-Za-z_$][\w$]*$/.test(s)&&Tn.has(s)?s:/^[A-Za-z_$][\w$]*$/.test(s)&&s!=="__s"&&!uo.has(s)?`${s}()`:s}var ho=!0;function fo(e,s){if(!e.includes("{#key"))return e;for(let n=0;n<10;n++){let t=/\{#key\b/g;t.lastIndex=0;let r=t.exec(e);if(!r)return e;let i=rt(e,r.index);if(i<0)return e;let o=e.slice(r.index+5,i-1).trim();if(!o)return e;let h=i,u=/\{[#\/](?:key|if|each|boundary|island)\b/g;u.lastIndex=h;let c=1,f=-1,a;for(;a=u.exec(e);){if(a[0].startsWith("{#")){let l=rt(e,a.index);l>=0&&(u.lastIndex=l),c++;continue}if(c--,c===0){f=a.index;break}}if(f<0)throw new j("E-TEMPLATE",`${s}: {#key ${o}} is never closed`,{hint:"every {#key} needs its {/key}"});e=e.slice(0,r.index)+`{#each [${o}] as __rvkv}`+e.slice(h,f)+"{/each}"+e.slice(f+6)}return e}function po(e){let s=/\{#(?:if|each|boundary|island)\b|\{\/(?:if|each|boundary|island)\s*\}|\{:else(?:\s+if\s+[^}]*)?\}/g,n="",t=0,r=!1;for(;;){let i=e.slice(t),h=/\{#(if|each)\b/g.exec(i);if(!h){n+=e.slice(t);break}let u=h[1],c=rt(i,h.index);if(c<0){n+=e.slice(t);break}let f=i.slice(h.index+2+u.length,c-1),a=t+h.index,l=t+c,p=Ln(u,f);if(!p){n+=e.slice(t,l),t=l;continue}let g=u==="if"?p[0].trim():"";n+=e.slice(t,a),s.lastIndex=l;let _=1,w=-1,$=0,m=[],v;for(;v=s.exec(e);){let M=v[0];if(M.startsWith("{:else")){if(_===1){let H=/^\{:else\s+if\s+([^}]*)\}$/.exec(M);m.push({at:v.index,len:M.length,cond:H?H[1].trim():null})}continue}if(M.startsWith("{#")){let H=rt(e,v.index);H>=0&&(s.lastIndex=H),_++;continue}if(_--,_===0){w=v.index,$=M.length;break}}if(w<0){n+=e.slice(a);break}if(m.length===0){n+=e.slice(a,l),t=l,r=!0;continue}let k=e.slice(l,w);if(u==="each"){let M=[...m].reverse().find(Re=>Re.cond===null);if(!M){n+=e.slice(a,w+$),t=w+$;continue}let H=M.at-l,se=k.slice(0,H),ce=k.slice(H+M.len),xe=p[0];n+=e.slice(a,l)+se+`{/each}{#if !(${xe}.length)}${ce}{/if}`,t=w+$,r=!0;continue}let A=[],R=0;for(let M=0;M<m.length;M++){let H=m[M],se=H.at-l;A.push({cond:M===0?null:m[M-1].cond,body:k.slice(R,se)}),R=se+H.len}A.push({cond:m[m.length-1].cond,body:k.slice(R)});let O=A.shift(),B=M=>{if(!M.length)return"";let H=M[0],se=M.slice(1);if(H.cond==null)return H.body;let ce=`{#if ${H.cond}}${H.body}{/if}`;return se.length&&(ce+=`{#if !(${H.cond})}`+B(se)+"{/if}"),ce},Q=`{#if ${g}}${O.body}{/if}`;A.length&&(Q+=`{#if !(${g})}`+B(A)+"{/if}"),n+=Q,t=w+$,r=!0}return{template:n,changed:r}}function go(e){if(!/\sclass\s*=\s*"/.test(e)||!/\sclass\s*=\s*\{/.test(e))return e;let s=/<([a-zA-Z][^\s>/]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g,n="",t=0,r;for(s.lastIndex=0;r=s.exec(e);){let[i,o,h,u]=r,c=/\sclass\s*=\s*"([^"]*)"/.exec(h);if(!c)continue;let f=/\sclass\s*=\s*\{/.exec(h);if(!f||f.index===c.index)continue;let a=h.indexOf("{",f.index),l=1,p=a+1;for(;p<h.length&&l>0;){let k=h[p];if(k==='"'||k==="'"){p=it(h,p);continue}k==="{"?l++:k==="}"&&l--,p++}if(l!==0)continue;let g=h.slice(a+1,p-1),_=JSON.stringify(c[1]),w=` class={((v) => v == null ? ${_} : typeof v === 'object' ? ({ ${_}: true, ...v }) : (${_} + ' ' + v))(${g})}`,$=Math.min(c.index,f.index),m=Math.max(c.index+c[0].length,p),v=h.slice(0,$)+w+h.slice(m);n+=e.slice(t,r.index)+`<${o}${v}${u}>`,t=r.index+i.length}return n+=e.slice(t),n}function mo(e,s){let n=/^<([a-zA-Z][^\s>/]*)/.exec(e.slice(s));if(!n)return null;let t=s+n[0].length,r="",i=0;for(;t<e.length;){let o=e[t];if(r)o===r&&(r="");else if(o==='"'||o==="'")r=o;else if(o==="{")i++;else if(o==="}")i=Math.max(0,i-1);else if(o===">"&&i===0){let u=e.slice(s,t+1).endsWith("/>")?"/":"",c=u?t-1:t;return{start:s,end:t+1,tag:n[1],attrs:e.slice(s+n[0].length,c),selfClose:u}}t++}return null}function Tt(e,s){let n="",t=0,r=0;for(;r<e.length;){let i=e.indexOf("<",r);if(i<0)break;let o=mo(e,i);if(!o){r=i+1;continue}let h=s(o);n+=e.slice(t,o.start)+(h===null?e.slice(o.start,o.end):`<${o.tag}${h}${o.selfClose}>`),t=o.end,r=o.end}return n+=e.slice(t),n}function wo(e,s){return e.includes("class:")?Tt(e,n=>{let t=n.attrs;if(!t.includes("class:"))return null;let r=[],i=/\sclass:([\w-]+)\s*=\s*\{/g,o;for(;o=i.exec(t);){let l=o.index+o[0].length,p=1;for(;l<t.length&&p>0;){let g=t[l];if(g==='"'||g==="'"){l=it(t,l);continue}g==="{"?p++:g==="}"&&p--,l++}if(p!==0)throw new j("E-TEMPLATE",`${s}: class:${o[1]}={...} is missing its closing brace`,{file:s,hint:"the binding expression needs a matching } before the tag ends"});r.push({name:o[1],expr:t.slice(o.index+o[0].length,l-1),start:o.index,end:l})}let h=/(\sclass\s*=\s*)("([^"]*)"|'([^']*)'|\{[^}]*\})/,u=h.exec(t);if(u&&u[2].startsWith("{"))throw new j("E-TEMPLATE",`${s}: <${n.tag}> has both class={...} and class: directives`,{file:s,hint:'merge them: move the dynamic part into a class:NAME={expr} and keep the rest in class="..."'});let c=u?u[3]??u[4]??"":"",f=`(${JSON.stringify(c)}`;for(let l of r)f+=`+((${l.expr})?${JSON.stringify(" "+l.name)}:'')`;f+=")";let a=t;for(let l=r.length-1;l>=0;l--)a=a.slice(0,r[l].start)+a.slice(r[l].end);return u?a=a.replace(h,` class={${f}}`):a=` class={${f}}`+a,a}):e}function $o(e,s){return/\s(?:transition|in|out):/.test(e)?Tt(e,n=>{let t=n.attrs;if(!t.includes("transition:")&&!/\s(?:in|out):/.test(t))return null;let r=[],i=/\s(transition|in|out):([\w-]+)(?:\s*=\s*\{)?/g,o;for(;o=i.exec(t);){let a=o.index,l=o.index+o[0].length,p="";if(o[0].endsWith("{")){let g=1,_=l;for(;_<t.length&&g>0;){let w=t[_];if(w==='"'||w==="'"){_=it(t,_);continue}w==="{"?g++:w==="}"&&g--,_++}if(g!==0)throw new j("E-TEMPLATE",`${s}: transition:${o[1]}={...} is missing its closing brace`,{file:s,hint:"the transition params expression needs a matching } before the tag ends"});p=t.slice(l,_-1),l=_}r.push({dir:o[1]==="transition"?"":o[1],name:o[2],params:p,start:a,end:l})}if(r.length===0)return null;let h="";for(let a of r)h&&(h+="|"),h+=(a.dir?a.dir+":":"")+a.name+(a.params?":"+a.params:"");let u=t;for(let a=r.length-1;a>=0;a--)u=u.slice(0,r[a].start)+u.slice(r[a].end);let c=/\sdata-transition\s*=\s*("([^"]*)"|'([^']*)'|\{[^}]*\})/,f=c.exec(u);if(f){let a=f[2]??f[3]??"";u=u.replace(c,` data-transition="${a}${h?(a?"|":"")+h:""}"`)}else u=` data-transition="${h}"`+u;return u}):e}function bo(e,s){return e.includes("animate:")?Tt(e,n=>{let t=n.attrs;if(!t.includes("animate:"))return null;let r=[],i=/\sanimate:([\w-]+)(?:\s*=\s*\{)?/g,o;for(;o=i.exec(t);){let a=o.index,l=o.index+o[0].length,p="";if(o[0].endsWith("{")){let g=1,_=l;for(;_<t.length&&g>0;){let w=t[_];if(w==='"'||w==="'"){_=it(t,_);continue}w==="{"?g++:w==="}"&&g--,_++}if(g!==0)throw new j("E-TEMPLATE",`${s}: animate:${o[1]}={...} is missing its closing brace`,{file:s,hint:"the animate params expression needs a matching } before the tag ends"});p=t.slice(l,_-1),l=_}r.push({name:o[1],params:p,start:a,end:l})}let h="";for(let a of r)h&&(h+="|"),h+=a.name+(a.params?":"+a.params:"");let u=t;for(let a=r.length-1;a>=0;a--)u=u.slice(0,r[a].start)+u.slice(r[a].end);let c=/\sdata-animate\s*=\s*("([^"]*)"|'([^']*)'|\{[^}]*\})/,f=c.exec(u);if(f){let a=f[2]??f[3]??"";u=u.replace(c,` data-animate="${a}${h?(a?"|":"")+h:""}"`)}else u=` data-animate="${h}"`+u;return u}):e}function _o(e,s){return e.includes("style:")?Tt(e,n=>{let t=n.attrs;if(!t.includes("style:"))return null;let r=[],i=/\sstyle:([\w-]+)\s*=\s*\{/g,o;for(;o=i.exec(t);){let l=o.index+o[0].length,p=1;for(;l<t.length&&p>0;){let g=t[l];if(g==='"'||g==="'"){l=it(t,l);continue}g==="{"?p++:g==="}"&&p--,l++}if(p!==0)throw new j("E-TEMPLATE",`${s}: style:${o[1]}={...} is missing its closing brace`,{file:s,hint:"the binding expression needs a matching } before the tag ends"});r.push({prop:o[1],expr:t.slice(o.index+o[0].length,l-1),start:o.index,end:l})}let h=/(\sstyle\s*=\s*)("([^"]*)"|'([^']*)'|\{[^}]*\})/,u=h.exec(t);if(u&&u[2].startsWith("{"))throw new j("E-TEMPLATE",`${s}: <${n.tag}> has both style={...} and style: directives`,{file:s,hint:'keep the static declarations in style="..." and move the dynamic ones to style:PROP={expr}'});let c=u?u[3]??u[4]??"":"",f=`${JSON.stringify(c.endsWith(";")||c===""?c:c+";")}`;for(let l of r)f+=`+${JSON.stringify(l.prop+":")}+(${l.expr})+';'`;let a=t;for(let l=r.length-1;l>=0;l--)a=a.slice(0,r[l].start)+a.slice(r[l].end);return u?a=a.replace(h,` style={${f}}`):a=` style={${f}}`+a,a}):e}function yo(e,s){if(!e.includes("{:fallback"))return e;for(let n=0;n<10;n++){let t=/\{#boundary\}|\{\/boundary\}|\{:fallback\}/g,r="",i=0,o=!1,h;for(;h=t.exec(e);){if(h[0]!=="{#boundary}")continue;let u=h.index,c=u+h[0].length,f=1,a=-1,l;for(;l=t.exec(e);){if(l[0]==="{#boundary}"){f++;continue}if(l[0]==="{/boundary}"&&(f--,f===0)){a=l.index;break}}if(a<0)break;let p=e.slice(c,a),g=/\{#(boundary|if|each|key|island)(?:\s+[^}]*)?\}|\{\/(?:boundary|if|each|key|island)\s*\}|\{:fallback\}/g,_=["boundary"],w=1,$=-1,m=0,v;for(g.lastIndex=0;v=g.exec(p);){let O=v[0];if(O==="{:fallback}"){if(_[_.length-1]!=="boundary")throw new j("E-TEMPLATE",`${s}: {:fallback} must sit directly inside a {#boundary} block`,{hint:"move it out of the {#if}/{#each} it sits in, or keep the conditional fallback in the parent"});if($>=0)throw new j("E-TEMPLATE",`${s}: a {#boundary} can carry only one {:fallback}`,{hint:"remove the extra {:fallback} segment"});$=v.index,m=O.length;continue}if(O.startsWith("{#")){w++,_.push(O.slice(2,O.length-1).trim().split(/\s/)[0]);continue}w--,_.pop()}if($<0)continue;let k=p.slice(0,$),A=p.slice($+m),R=Buffer.from(A,"utf-8").toString("base64");r+=e.slice(i,u)+`{#boundary __fb="${R}"}`+k+"{/boundary}",i=a+11,o=!0}if(!o)break;e=r+e.slice(i)}return e}function xo(e){for(let s=0;s<40;s++){if(!/\{:else\b/.test(e))return e;let n=po(e);if(e=n.template,!n.changed)return e}return e}function vo(e){if(!ho){let o=/\{#defer(?:\s+hold=\\d+)?\}/g,h="",u=0;for(;;){o.lastIndex=u;let c=o.exec(e);if(!c)break;let f=c.index,a=c[0].length,l=e.indexOf("{/defer}",f+a);if(l<0)break;h+=e.slice(u,f)+e.slice(f+a,l),u=l+8}return{template:u===0?e:h,count:0,holds:[]}}let s=0,n=[],t="",r=0,i=/\{#defer(?:\s+hold=(\d+))?\}/g;for(;;){i.lastIndex=r;let o=i.exec(e);if(!o)break;let h=o.index,u=o[0].length,c=o[1]?Number(o[1]):0,f=1,a=h+u,l=-1;for(;a<e.length;){i.lastIndex=a;let _=i.exec(e),w=_?_.index:-1,$=e.indexOf("{/defer}",a);if($<0)break;if(w>=0&&w<$){f++,a=w+_[0].length;continue}if(f--,f===0){l=$;break}a=$+8}if(l<0)break;let p=e.slice(h+u,l);n.push(c);let g=++s;t+=e.slice(r,h),t+="{#if __rvDefer"+g+"()}"+p+`{/if}
{#if !__rvDefer`+g+'()}<div class="rv-defer-loading"></div>{/if}',r=l+8}return s===0?{template:e,count:0,holds:[]}:(t+=e.slice(r),{template:t,count:s,holds:n})}function ko(e,s=[]){let n="";for(let t=1;t<=e;t++){n+="const [__rvDefer"+t+", set__rvDefer"+t+'] = state("__rvdefer'+t+`", false);
`;let r=s[t-1]||0;n+=r>0?"onMount(function () { setTimeout(function () { set__rvDefer"+t+"(true); }, "+r+`); });
`:"onMount(function () { requestAnimationFrame(function () { requestAnimationFrame(function () { set__rvDefer"+t+`(true); }); }); });
`}return n}function Eo(e,s){let n="",t=0,r=0,i=[];for(;;){let o=e.indexOf("{#await",t);if(o<0)break;let h=o+7,u=1;for(;h<e.length&&u>0;){let L=e[h];L==="{"?u++:L==="}"&&u--,h++}if(u!==0)break;let c=e.slice(o+7,h-1).trim();if(!c)throw new j("E-TEMPLATE",`${s}: {#await} needs a promise expression`,{file:s,hint:"write {#await fetchUsers()}...{:then users}...{/await}"});let f=/\b(then|catch)\s+[A-Za-z_$][\w$]*\s*$/.exec(c);if(f)throw new j("E-TEMPLATE",`${s}: {#await ${c}} puts the ${f[1]} branch in the opener`,{file:s,hint:`write the branch on its own line inside the block:
{#await ${c.replace(/\s+(then|catch)\s+[A-Za-z_$][\w$]*\s*$/,"")}}
  ...ending
{:${f[1]} ${f[0].trim().split(/\s+/)[1]}}
  ${f[1]==="then"?"fulfilled":"rejected"}
{/await}`});let a=/\{\#(if|each|boundary|island|await)\b/g,l=/\{\/(if|each|boundary|island|await)\}/g,p=/\{:then\b([^}]*)\}/g,g=/\{:catch\b([^}]*)\}/g,_=1,w=h,$=-1,m=-1,v=-1,k="",A="";for(;;){a.lastIndex=w,l.lastIndex=w,p.lastIndex=w,g.lastIndex=w;let L=a.exec(e),G=l.exec(e),de=p.exec(e),Te=g.exec(e),Me=[[L,"open"],[G,"close"],[de,"then"],[Te,"catch"]],Fe=1/0,Ae="",he=null;for(let[pe,I]of Me)pe&&pe.index<Fe&&(Fe=pe.index,Ae=I,he=pe);if(!he)break;if(Ae==="open"){_++,w=he.index+he[0].length;continue}if(Ae==="close"){if(_===1&&he[1]==="await"){v=he.index;break}_--,w=he.index+he[0].length;continue}_===1&&(Ae==="then"&&$<0?($=he.index,k=he[1]):Ae==="catch"&&m<0&&(m=he.index,A=he[1])),w=he.index+he[0].length}if(v<0||$<0)break;let R=$+7+k.length,O=m>=0?m+8+A.length:-1,B=e.slice(h,$),Q=e.slice(R,m>=0?m:v),M=m>=0?e.slice(O,v):"",H=k.trim(),se=A.trim(),ce=/^\w+$/.test(H)?H:`__rvAwaitThen${r+1}`,xe=m>=0?/^\w+$/.test(se)?se:`__rvAwaitCatch${r+1}`:"";r++;let Re=r,Ne=`__rvAwait${Re}`;i.push({n:Re,expr:c,thenVar:ce,catchVar:xe}),n+=e.slice(t,o),n+=`{#if ${Ne}().status === 'pending'}`+B+`{/if}
`,n+=`{#each (${Ne}().status === 'resolved' ? [${Ne}().value] : []) as ${ce}}`+Q+`{/each}
`,m>=0&&(n+=`{#each (${Ne}().status === 'rejected' ? [${Ne}().error] : []) as ${xe}}`+M+`{/each}
`),t=v+8}return r===0?{template:e,blocks:i}:(n+=e.slice(t),{template:n,blocks:i})}function So(e){let s="";for(let n of e){let t=`__rvAwait${n.n}`;s+=`const [${t}, set${t}] = state("__rvawait${n.n}", { status: 'pending', value: null, error: null });
`,s+=`onMount(function () {
`,s+=`  Promise.resolve(${n.expr}).then(function (__rvAwaitVal) {
`,s+=`    set${t}({ status: 'resolved', value: __rvAwaitVal });
`,s+=`  }).catch(function (__rvAwaitErr) {
`,s+=`    set${t}({ status: 'rejected', error: __rvAwaitErr });
`,s+=`  });
`,s+=`});
`}return s}function Ln(e,s){if(e==="if"){let t=/^\s*([\s\S]+?)\s*$/.exec(s);return t?[t[1]]:null}if(e==="each"){let t=/^\s*([\s\S]+?)\s+as\s+(\{[^{}]*\}|\[[^[\]]*\]|\w+)(?:\s*,\s*(\w+))?(?:\s*\(([\s\S]+)\))?\s*$/.exec(s);return t?[t[1],t[2],t[3]??"",t[4]??""]:null}if(e==="boundary")return[s];if(e==="island"){let t=/^\s*(?:name="([^"]*)")?(?:\s*hydrate="([^"]*)")?\s*$/.exec(s);return t?[t[1]??"",t[2]??""]:null}let n=/^\s*(\w+)(?:\s*\(([\s\S]+)\))?\s*$/.exec(s);return n?[n[1],n[2]??""]:null}function Rt(e,s,n){let t=new RegExp(`\\{#${s}\\b`,"g"),r=new RegExp(`\\{/${s}\\}`,"g");t.lastIndex=n;let i;for(;i=t.exec(e);){let o=i.index,h=rt(e,o);if(h<0)continue;let u=Ln(s,e.slice(o+2+s.length,h-1));if(!u)continue;let c=1,f=h;for(;;){t.lastIndex=f,r.lastIndex=f;let a=t.exec(e),l=r.exec(e);if(!l)break;if(a&&a.index<l.index){let p=rt(e,a.index);c++,f=p<0?a.index+a[0].length:p;continue}if(f=l.index+l[0].length,--c===0){let p=e.slice(h,l.index),g=[e.slice(o,f),...u,p];return g.index=o,g}}t.lastIndex=h}return null}function Ro(e){let s=/<(style|script|noscript)\b[^>]*>/iy,n="",t="",r=0,i=0,o=()=>{t.trim()&&(n+=Ke(t,"__hd","__hc",null,r++,!1)),t=""};for(;i<e.length;){if(e.startsWith("<!--",i)){let u=e.indexOf("-->",i+4);i=u<0?e.length:u+3;continue}s.lastIndex=i;let h=s.exec(e);if(h){let u=h[1].toLowerCase(),c=e.toLowerCase().indexOf(`</${u}`,i+h[0].length),f=c<0?-1:e.indexOf(">",c),a=f<0?e.length:f+1;o(),n+=Ks(h[0],"__hd","__hc",null),n+=Io(e.slice(i+h[0].length,a),"__hd","__hc",null),i=a;continue}t+=e[i++]}return o(),n}var Ao=new Set(["if","each","boundary","island","await","snippet"]),Es=new Map;function Co(e){let s=Es.get(e);return s||(s={open:new RegExp(`\\{#${e}\\b`,"g"),close:new RegExp(`\\{/${e}\\}`,"g")},Es.set(e,s)),s}function To(e,s){let n=[],t=/<(style|script|noscript)\b[^>]*>/gi,r;for(;r=t.exec(e);){let a=r[1].toLowerCase(),l=e.toLowerCase().indexOf(`</${a}`,r.index+r[0].length),p=l<0?-1:e.indexOf(">",l),g=p<0?e.length:p+1;n.push([r.index,g]),t.lastIndex=g}let i=/<!--[\s\S]*?-->/g,o;for(;o=i.exec(e);)n.push([o.index,o.index+o[0].length]);n.sort((a,l)=>a[0]-l[0]);let h=a=>n.some(([l,p])=>a>=l&&a<p),u=/\{([:/])(\w+)\}/g,c;for(;c=u.exec(e);){if(h(c.index))continue;let[,a,l]=c;if(!(a==="/"&&Ao.has(l))){if(a==="/")throw new j("E-TEMPLATE",`${s}: {/${l}} does not close anything`,{file:s,line:Ce(e,c),hint:"the closers are {/if}, {/each} and {/boundary} - one per block you opened"});if(l==="else"){let p=(w,$,m)=>{let v=0,k;for(w.lastIndex=0;(k=w.exec(e))&&!(k.index>=m);)h(k.index)||v++;let A=new RegExp($,"g"),R=0;for(;(k=A.exec(e))&&!(k.index>=m);)h(k.index)||R++;return v-R},g=p(/\{#if\b/g,"\\{/if\\b",c.index),_=p(/\{#each\b/g,"\\{/each\\b",c.index);if(g<=0&&_<=0)throw new j("E-TEMPLATE",`${s}: a stray {:else} with no {#if} or {#each} above it`,{file:s,line:Ce(e,c),hint:"{:else} belongs inside an {#if} ... {/if} or {#each} ... {/each} block"});continue}if(l==="fallback")throw new j("E-TEMPLATE",`${s}: a stray {:fallback} with no {#boundary} above it`,{file:s,line:Ce(e,c),hint:"{:fallback} belongs directly inside a {#boundary} ... {/boundary} block"});if(l==="then"||l==="catch"){let p=(w,$)=>{w.lastIndex=0;let m=0,v;for(;(v=w.exec(e))&&!(v.index>=$);)h(v.index)||m++;return m},g=p(/\{#await\b/g,c.index),_=p(/\{\/await\b/g,c.index);if(g<=_)throw new j("E-TEMPLATE",`${s}: a stray {:${l}} with no {#await} above it`,{file:s,line:Ce(e,c),hint:"{:then} / {:catch} belong inside an {#await} ... {/await} block"});continue}throw new j("E-TEMPLATE",`${s}: {:${l}} is not a rosezm directive`,{file:s,line:Ce(e,c),hint:"rosezm templates support {#if}/{:else}, {#each} and {#boundary}"})}}let f=/\{#(if|each|boundary|island|await)\b/g;for(;c=f.exec(e);){if(h(c.index))continue;let a=c[1],l=rt(e,c.index);if(l<0)continue;let p=e.slice(c.index+2+a.length,l-1);if(a==="each"&&!Ln("each",p))throw new j("E-TEMPLATE",`${s}: {#each ${p.trim()}} is missing its item name`,{file:s,line:Ce(e,c),hint:"write {#each items() as item} - the name after `as` is what the block body reads (item.id, item.name)"});let{open:g,close:_}=Co(a),w=1,$=l;for(;;){g.lastIndex=$,_.lastIndex=$;let m=g.exec(e),v=_.exec(e);if(!v)break;if(m&&m.index<v.index){let k=rt(e,m.index);$=k<0?m.index+m[0].length:k;continue}if($=v.index+v[0].length,--w===0)break}if(w!==0)throw new j("E-TEMPLATE",`${s}: unclosed {#${a}} - every block needs its {/${a}}`,{file:s,line:Ce(e,c),hint:`add the matching {/${a}} (an inner {#if} or {#each} closes first, deepest first)`})}}function jo(e,s){let n=/<([a-zA-Z][\w-]*)((?:\s+[\w:-]+(?:=(?:"[^"]*"|'[^']*'|`[^`]*`|[^\s"'>]+))?)*)\s*(\/?)>/g;return e.replace(n,(t,r,i,o)=>{if(s.has(r)||!/\{/.test(i))return t;let h=i.replace(/([\w:-]+)=("([^"]*)"|'([^']*)'|`([^`]*)`)/g,(u,c,f,a,l,p)=>{let g=a??l??p??"";if(!/\{/.test(g)||p===void 0&&g.includes("`"))return u;let _=Ct(g);if(_.length===0)return u;let w="",$=0;for(let m of _)$<m.start&&(w+=(w?" + ":"")+JSON.stringify(g.slice($,m.start))),w+=(w?" + ":"")+`(${m.expr})`,$=m.end+1;return $<g.length&&(w+=(w?" + ":"")+JSON.stringify(g.slice($))),`${c}={${w}}`});return`<${r}${h}${o?" /":""}>`})}var Sn=0,Rn=!1,An="",Cn={},ln=new Set,Tn=new Set,jn=null,Ht="";function Ke(e,s,n,t,r,i=!0,o=new Map,h=0,u="__iid",c=""){let f="",a=e,l=0,p=0,g=0,_=/\{#island\b/.test(e),w=i&&(!_||h>0),$=()=>`${r}_${g++}`;if(r===0&&(f+=`const __snip = {};
`),r===0){let L=/<svelte:(window|body|head|document)\b[^>]*>/i.exec(e);if(L){let G=L[1].toLowerCase();throw new j("E-TEMPLATE",`rosezm has no <svelte:${G}> element - window-level events are a modifier on any host element (on:keydown|${G==="document"?"document":"window"}={fn})`,{hint:`use on:keydown|${G==="document"?"document":"window"}={fn}. Any element can carry it - the listener is attached to ${G==="document"?"document":"window"} at wire time, so no wrapper element is needed. See GOTCHAS.md: window/document level events.`})}}let m=new Map,v=Br(e,o),k=new Set(v).size===v.length;if(v.length>0&&k){let L={};for(let G of v){let de=`__rvct${Sn++}`;m.set(G,de),L[G]=de}a=En(e,[],L,{ownScope:!0,comps:o})}let A=L=>{let G,de=-1;return()=>((de!==p||G===void 0||G!==null&&G.index<l)&&(G=L(l),de=p),G)},R=/<(style|script|noscript)\b[^>]*>/g,O=null,B=A(L=>Rt(a,"if",L)),Q=A(L=>Rt(a,"each",L)),M=A(L=>Rt(a,"boundary",L)),H=A(L=>Rt(a,"island",L)),se=A(L=>Rt(a,"snippet",L)),ce=A(L=>Jr(a,L)),xe=A(L=>{let G=o.size>0?Qs(a,L,o):null;return G?{index:G.start,tag:G}:null}),Re=A(L=>{R.lastIndex=L;let G=R.exec(a);return G?{index:G.index,tag:G[0],name:G[1].toLowerCase()}:null}),Ne=A(L=>{let G=a.indexOf("<!--",L);if(G<0)return null;let de=a.indexOf("-->",G+4);return{index:G,end:de<0?a.length:de+3}});for(;l<a.length;){let L=B(),G=Q(),de=M(),Te=ce(),Me=Te?Object.assign([a.slice(Te.index,Te.end+1),Te.expr],{index:Te.index}):null,Fe=xe()?.tag??null,Ae=H(),he=se(),pe=[];L?.index!==void 0&&pe.push({type:"if",match:L,index:L.index}),G?.index!==void 0&&pe.push({type:"each",match:G,index:G.index}),de?.index!==void 0&&pe.push({type:"boundary",match:de,index:de.index}),Ae?.index!==void 0&&pe.push({type:"island",match:Ae,index:Ae.index}),he?.index!==void 0&&pe.push({type:"snippet",match:he,index:he.index}),Me?.index!==void 0&&pe.push({type:"expr",match:Me,index:Me.index}),Fe&&pe.push({type:"comp",match:Me,index:Fe.start,tag:Fe});let I=pe.length>0?pe.reduce((Z,W)=>Z.index<=W.index?Z:W):null,je=Re();if(je&&I&&je.index<I.index){O===null&&(O=a.toLowerCase());let Z=O.indexOf(`</${je.name}`,je.index+je.tag.length),W=Z<0?-1:a.indexOf(">",Z),D=W<0?a.length:W+1;f+=$e(a.slice(l,je.index),s,n,t),f+=Ks(je.tag,s,n,t),f+=$e(a.slice(je.index+je.tag.length,D),s,n,t),l=D;continue}let Be=Ne();if(Be&&(!I||Be.index<I.index)){f+=$e(a.slice(l,Be.end),s,n,t),l=Be.end;continue}if(!I){f+=$e(a.slice(l),s,n,t);break}if(I.type==="if"){let[,Z,W]=I.match,D=a.slice(l,I.index);D&&(f+=$e(D,s,n,t));let ee=ks(Z),te=$(),K=t??"__s",ge=Ke(W.trim(),"h","__c",K,r+1,w,o,h,u,c);f+=`const __b${te} = (__s, __c) => { let h = ''; ${ge} return h; };
`,w?f+=`${s} += ifMark(${n}, () => (${ee}), __b${te}${t?`, ${t}`:""});
`:f+=`${s} += (${ee}) ? __b${te}(${t??"undefined"}, []) : '';
`,l=I.index+I.match[0].length}else if(I.type==="each"){let[,Z,W,D,ee,te]=I.match,K=a.slice(l,I.index);K&&(f+=$e(K,s,n,t));let ge=ks(Z),ve=$(),ie=/^[{[]/.test(W),Y=ie?null:new RegExp(`\\b${W}\\b`,"g"),U=D?new RegExp(`\\b${D}\\b`,"g"):null,X="",ue=0;for(let ae of Ct(te.trim())){let Ee=Y?ht(ae.expr,Y,"__s"):ae.expr;U&&(Ee=ht(Ee,U,"__i")),X+=te.trim().slice(ue,ae.start)+"{"+Ee+"}",ue=ae.end+1}X+=te.trim().slice(ue);let Le=ee?(()=>{let ae=ee.trim();return Y&&(ae=ht(ae,Y,"__s")),U&&(ae=ht(ae,U,"__i")),ae})():"__i",Je=`${c?`(${c}) + "/" + `:""}String(${Le})`,Ie=Ke(X,"h","__c","__s",r+1,w,o,h,u,Je),Ve=ie?`const ${W} = __s; ${Ie}`:Ie,Ge="";if(ee){if(ie)throw new j("E-TEMPLATE",`${Ht}: a keyed {#each} keys on a named item's property - write {#each xs as x (x.id)}, not a destructuring pattern`,{file:Ht,hint:"name the item first, then key on one of its properties"});let ae=ee.trim();Y&&(ae=ht(ae,Y,"__s")),U&&(ae=ht(ae,U,"__i")),Ge=`, (__s, __i) => (${ae})`}if(f+=`const __b${ve} = (__s, __c, __i) => { let h = ''; ${Ve} return h; };
`,w)f+=`${s} += eachMark(${n}, () => (${ge}), __b${ve}${Ge});
`;else{let ae=ie?"__s":W;f+=`${s} += (${ge}).map((${ae}, __i) => __b${ve}(${ae}, [], __i)).join('');
`}l=I.index+I.match[0].length}else if(I.type==="boundary"){let[,Z,W]=I.match,D="";if(Z){let Y=/__fb="([A-Za-z0-9+/=]*)"/.exec(Z);Y&&(D=Buffer.from(Y[1],"base64").toString("utf-8"))}let ee=W,te=a.slice(l,I.index);te&&(f+=$e(te,s,n,t));let K=$(),ge=/\$action:|<form[\s>]/.test(ee),ve=Ke(ee.trim(),"h",n,t,r+1,w,o,h,u,c);f+=`const __b${K} = (__c) => { let h = ''; ${ve} return h; };
`;let ie="";if(D.trim()){let Y=Ke(D.trim(),"h",n,t,r+1,w,o,h,u,c);ie=`const __bf${K} = (__c) => { let h = ''; ${Y} return h; };
`}f+=ie,f+=`let __bd${K} = '';
`,f+=ge?`try { $actionErrorOrThrow(); __bd${K} = __b${K}(${n}); } catch (e) { $setBoundaryError(e); __bd${K} = ${ie?`__bf${K}(${n})`:"$boundaryFallback(e)"}; }
`:`try { __bd${K} = __b${K}(${n}); } catch (e) { $setBoundaryError(e); __bd${K} = ${ie?`__bf${K}(${n})`:JSON.stringify(jr)}; }
`,f+=`${s} += __bd${K};
`,l=I.index+I.match[0].length}else if(I.type==="snippet"){let[,Z,W,D]=I.match,ee=a.slice(l,I.index);ee&&(f+=$e(ee,s,n,t)),$();let te=W?W.split(",").map(ge=>ge.trim()).filter(Boolean).join(","):"",K=Ke(D.trim(),"h","__c","__s",r+1,w,o,h,u,c);f+=`__snip.${Z} = (__s, __c${te?","+te:""}) => { let h = ''; ${K} return h; };
`,l=I.index+I.match[0].length}else if(I.type==="comp"){let Z=I.tag;Z.start>l&&(f+=$e(a.slice(l,Z.start),s,n,t));let W=o.get(Z.name),D=$(),ee="";if(Z.selfClosing)l=Z.end;else{let X=cn(a,Z.end,Z.name);if(X<0)throw new j("E-TEMPLATE",`unclosed <${Z.name}> - every component tag needs its matching close tag`,{hint:`add the matching </${Z.name}> (or close the tag with /> when it takes no children)`});ee=a.slice(Z.end,X),l=X+Z.name.length+3}let{def:te,named:K}=Mo(ee),ge=te.trim().length>0;ge&&(f+=`const __ch${D} = (__s, __c) => { let h = ''; ${Ke(te,"h","__c",t,r+1,w,o,h,u,c)} return h; };
`);let ve=K.map(([X,ue])=>{let Le=W.slots.find(Ve=>Ve.name===X),Je=ue;for(let Ve of Le?.props??[]){let Ge=new RegExp(`\\b${Ve}\\b`,"g"),ae="",Ee=0;for(let Oe of Ct(Je))ae+=Je.slice(Ee,Oe.start)+"{"+ht(Oe.expr,Ge,`__s.${Ve}`)+"}",Ee=Oe.end+1;Je=ae+Je.slice(Ee)}let Ie=`(${u}${c?` + "/" + (${c})`:""} + (__si || ''))`;return`${JSON.stringify(X)}: (__s, __c, __si) => { let h = ''; ${Ke(Je,"h","__c",t,r+1,w,o,h,Ie,"")} return h; }`}),ie=Po(Z.attrs).filter(X=>X.name!=="slot").map(X=>{if(X.kind==="spread")return`...(${X.value})`;let ue=X.name.startsWith("on:")?`on${Qe(X.name.slice(3))}`:X.name,Le=X.kind==="expr"?`(${X.value})`:X.kind==="str"?JSON.stringify(X.value):"true";return`${JSON.stringify(ue)}: ${Le}`}).join(", "),Y=ge?`__ch${D}(${t??"undefined"}, ${n})`:"''",U=`(${u} + ${JSON.stringify("/c"+Z.start)}${c?` + (${c})`:""})`;f+=`${s} += ${Z.name}(${n}, ${Y}, { ${ie} }, { ${ve.join(", ")} }, ${U});
`}else if(I.type==="island"){let[,Z,W,D]=I.match,ee=a.slice(l,I.index);ee&&(f+=$e(ee,s,n,t));let te=W==="visible"||W==="idle"?` data-rv-island-hydrate="${W}"`:"";f+=`${s} += ${JSON.stringify(`<div data-rv-island="${Z||""}"${te}>`)};
`;let K=Ke(D.trim(),"h","__c",t,r+1,i,o,h+1,u,c);f+=K,f+=`${s} += '</div>';
`,l=I.index+I.match[0].length}else{let[,Z]=I.match,W=Z.trim(),D=a.slice(l,I.index),ee=/^@const\s+([A-Za-z_$][\w$]*)\s*=\s*([\s\S]+)$/.exec(W);if(ee){D&&(f+=$e(D,s,n,t));let U=ee[1],X=a.slice(I.index+I.match[0].length),ue=m.get(U);l=I.index+I.match[0].length,ue===void 0&&(ue=`__rvct${Sn++}`,a=En(X,[],{[U]:ue}),l=0,p++);let Le=`const ${ue} = () => (${ee[2].trim()});
`;Rn&&r===0?(ln.has(U)?jn=U:ln.add(U),An+=Le,Cn[U]=ue):f+=Le;continue}if(W==="__slot__"){D&&(f+=$e(D,s,n,t)),f+=Vo(s),l=I.index+I.match[0].length;continue}let te=/^__slotDefault\(("(?:[^"\\]|\\.)*")\)$/.exec(W);if(te){D&&(f+=$e(D,s,n,t)),f+=`${s} += __slotDefault(children, ${te[1]});
`,l=I.index+I.match[0].length;continue}let K=/^__slot\((['"])(\w+)\1, \[([\s\S]*?)\](?:,\s*("(?:[^"\\]|\\.)*"))?\)$/.exec(W);if(K){D&&(f+=$e(D,s,n,t));let U=K[4]?`, ${K[4]}`:"",X=`(__iid + ${JSON.stringify("/s"+I.index)}${c?` + "/" + (${c})`:""})`;f+=`${s} += __slotBlock(${n}, __sl, ${JSON.stringify(K[2])}, [${K[3]}]${U}, ${X});
`,l=I.index+I.match[0].length;continue}let ge=/^@html\s+([\s\S]+)$/.exec(W);if(ge){D&&(f+=$e(D,s,n,t));let U=ge[1].trim();if(!w)f+=`${s} += String(${U} ?? '');
`;else{let X=t?`(${t}) => (${U})`:`() => (${U})`;f+=`${s} += rawMark(${n}, ${X}${t?`, ${t}`:""});
`}l=I.index+I.match[0].length;continue}let ve=/^@debug\b([\s\S]*)$/.exec(W);if(ve){D&&(f+=$e(D,s,n,t));let U=ve[1].trim().replace(/,$/,"");f+=U?`console.log('[rosezm:debug]', { ${U} });
`:`console.log('[rosezm:debug]'); debugger;
`,l=I.index+I.match[0].length;continue}let ie=/^@render\s+([A-Za-z_$][\w$]*)\s*\(([\s\S]*)\)\s*$/.exec(W);if(ie){if(new RegExp(`\\{#snippet\\s+${ie[1]}\\b`).test(a.slice(I.index+I.match[0].length)))throw new j("E-TEMPLATE",`${Ht}: {@render ${ie[1]}} runs before its {#snippet ${ie[1]}} is defined`,{file:Ht,hint:"move the {#snippet} definition above the {@render} call - definitions register as the statement stream reaches them"});D&&(f+=$e(D,s,n,t));let X=ie[2].trim();f+=`${s} += ((__snip && __snip.${ie[1]}) ? __snip.${ie[1]}(${t??"null"}, ${n}${X?", "+X:""}) : '');
`,l=I.index+I.match[0].length;continue}let Y=Lo(a,I.index)?/([\w-]+)=\s*$/.exec(D)??null:null;if(Y){let U=D.slice(0,D.length-Y[0].length);U&&(f+=$e(U,s,n,t)),f+=Uo(Y[1],W,s,n,t,w)}else{D&&(f+=$e(D,s,n,t));let U=a.slice(I.index+I.match[0].length);if(/=[\"'][^\"']*$/.test(D))f+=`${s} += esc(${W});
`;else{let ue=U.length>0&&!/^<[a-zA-Z/!]/.test(U)&&!U.startsWith("{");f+=Ho(W,s,n,t,w,ue)}}l=I.index+I.match[0].length}}return f=f.replace(/\+= "\s*([a-zA-Z][\w-]*)=";\r?\n\s*\w+\s*\+=\s*textMark\((\w+), (.+?), 1, ([^;]+?)\);/g,(L,G,de,Te,Me)=>`+= attrMark(${de}, ${Te}, '${G}', ${Me});`),f}function hn(e,s){let n=s+1,t="",r=0;for(;n<e.length;){let i=e[n];if(t)i===t&&(t="");else if(i==='"'||i==="'")t=i;else if(i==="{")r++;else if(i==="}")r=Math.max(0,r-1);else if(i===">"&&r===0)return n+1;n++}return-1}function Qs(e,s,n){let t=s;for(;t<e.length;){let r=e.indexOf("<",t);if(r<0)return null;let i=/^<([a-zA-Z][\w-]*)/.exec(e.slice(r,r+64));if(i&&n.has(i[1])){let o=hn(e,r);if(o>0){let h=e.slice(r,o),u=/\/>$/.test(h);return{start:r,end:o,name:i[1],attrs:h.slice(1+i[1].length,u?-2:-1),selfClosing:u}}}t=r+1}return null}function Oo(e,s){return Qs(e,0,s)}function cn(e,s,n){let t=new RegExp(`<(/?)${n}(?=[\\s/>])`,"g");t.lastIndex=s;let r=1,i;for(;i=t.exec(e);){let o=hn(e,i.index);if(o<0)return-1;if(i[1]==="/"){if(r--,r===0)return i.index}else/\/>$/.test(e.slice(i.index,o))||r++}return-1}function Po(e){let s=[],n=0;for(;n<e.length;){let t=/^\s*\{\.\.\.([^}]*)\}/.exec(e.slice(n));if(t){s.push({name:"...",kind:"spread",value:t[1].trim()}),n+=t[0].length;continue}let r=/^\s*([\w:.-]+)/.exec(e.slice(n));if(!r)break;n+=r[0].length;let i=/^\s*=\s*/.exec(e.slice(n));if(!i){s.push({name:r[1],kind:"bool",value:""});continue}n+=i[0].length;let o=e[n];if(o==="{"){let h=1,u=n+1;for(;u<e.length&&h>0;)e[u]==="{"?h++:e[u]==="}"&&h--,u++;s.push({name:r[1],kind:"expr",value:e.slice(n+1,u-1).trim()}),n=u}else if(o==='"'||o==="'"){let h=e.indexOf(o,n+1);s.push({name:r[1],kind:"str",value:e.slice(n+1,h<0?e.length:h)}),n=h<0?e.length:h+1}else break}return s}function No(e,s){let n=0;for(;n<e.length;){let t=e.indexOf("<",n);if(t<0)return;let r=/^<(\/?)([a-zA-Z][\w-]*)/.exec(e.slice(t,t+64));if(!r){n=t+1;continue}let i=hn(e,t);if(i<0)return;let o=/\bslot\s*=\s*["'](\w+)["']/.exec(e.slice(t,i));if(o&&r[1]!=="/")throw new j("E-TEMPLATE",`slot="${o[1]}" on <${r[2]}> is nested inside slot="${s}" - a slot must be a direct child of the component`,{hint:"move the inner <slot> out of the outer one - a slot is a direct child of the component tag, never nested in another slot"});n=i}}function Mo(e){let s="",n=new Map,t=0,r=0,i=0,o=[];for(;t<e.length;){let h=e.indexOf("<",t),u=e.indexOf("{#",t),c=e.indexOf("{/",t),f=[h,u,c].filter(m=>m>=0);if(f.length===0){s+=e.slice(t);break}let a=Math.min(...f);if(a>t&&(s+=e.slice(t,a)),a===u||a===c){let m=e.indexOf("}",a),v=e.slice(a,m<0?e.length:m+1);if(a===u){let k=/^\{#(\w+)/.exec(v);o.push({header:v,type:k?k[1]:""}),i++}else i=Math.max(0,i-1),o.length&&o.pop();s+=v,t=a+v.length;continue}let l=/^<(\/?)([a-zA-Z][\w-]*)/.exec(e.slice(a,a+64));if(!l){s+="<",t=a+1;continue}let p=hn(e,a);if(p<0){s+=e.slice(a);break}let g=e.slice(a,p),_=/\/>$/.test(g),w=Xs.has(l[2].toLowerCase());if(l[1]==="/"){r=Math.max(0,r-1),s+=g,t=p;continue}!_&&!w&&r++;let $=/\bslot\s*=\s*["'](\w+)["']/.exec(g)?.[1];if($&&r===1&&i===0){if(_||w)n.set($,(n.get($)??"")+g.replace(/\s*slot\s*=\s*["']\w+["']/,""));else{let m=cn(e,p,l[2]);if(m<0)throw new j("E-TEMPLATE",`unclosed <${l[2]}> inside slot="${$}"`,{hint:`add the matching </${l[2]}>`});let v=`</${l[2]}>`,k=e.slice(p,m);No(k,$),n.set($,(n.get($)??"")+g.replace(/\s*slot\s*=\s*["']\w+["']/,"")+k+v),r=Math.max(0,r-1),t=m+v.length;continue}t=p;continue}if($&&i>0){let m=g.replace(/\s*slot\s*=\s*["']\w+["']/,""),v="";for(let R of o)v+=R.header;if(v+=m,_||w){for(let R=o.length-1;R>=0;R--)v+=`{/${o[R].type}}`;n.set($,(n.get($)??"")+v),t=p;continue}let k=cn(e,p,l[2]);if(k<0)throw new j("E-TEMPLATE",`unclosed <${l[2]}> inside slot="${$}"`,{hint:`add the matching </${l[2]}>`});let A=`</${l[2]}>`;v+=e.slice(p,k)+A;for(let R=o.length-1;R>=0;R--)v+=`{/${o[R].type}}`;n.set($,(n.get($)??"")+v),r=Math.max(0,r-1),t=k+A.length;continue}if($)throw new j("E-TEMPLATE",`slot="${$}" on <${l[2]}> must be a direct child of the component, or wrapped only by an {#if}/{#each}/{#boundary} block - it is nested inside another element`,{hint:'place the element with slot="..." directly inside the component tag, or inside a single {#if}/{#each} block - wrapping it in another element is not yet supported'});s+=g,t=p}return{def:s,named:[...n.entries()]}}function Lo(e,s){let t=e.slice(0,s).lastIndexOf("<");if(t<0||!/^<[a-zA-Z]/.test(e.slice(t)))return!1;let r=t+1,i="",o=0;for(;r<s;){let h=e[r];if(i)h===i&&(i="");else if(h==='"'||h==="'")i=h;else if(h==="{")o++;else if(h==="}")o=Math.max(0,o-1);else if(h===">"&&o===0)return!1;r++}return!0}function $e(e,s,n,t){return e?`${s} += ${JSON.stringify(e)};
`:""}function Io(e,s,n,t){if(!e.includes("{@html"))return $e(e,s,n,t);let r="",i=0,o=e.indexOf("{@html");for(;o!==-1;){let u=Gt(e,o);if(u<0)break;let c=/^@html\s+([\s\S]+)$/.exec(e.slice(o+1,u));if(c){let f=e.slice(i,o);f&&(r+=`${s} += ${JSON.stringify(f)};
`),r+=`${s} += String(${c[1].trim()} ?? '');
`,i=u+1}o=e.indexOf("{@html",u+1)}if(i===0)return $e(e,s,n,t);let h=e.slice(i);return h&&(r+=`${s} += ${JSON.stringify(h)};
`),r}function Ks(e,s,n,t){let r=Ct(e);if(r.length===0)return $e(e,s,n,t);let i=`${s} += `,o=0;return r.forEach((h,u)=>{let c=e.slice(o,h.start),f=c.endsWith("=");u>0&&(i+=" + "),i+=JSON.stringify(f?c+'"':c),i+=` + esc(${h.expr})`,f&&(i+=` + '"'`),o=h.end+1}),o<e.length&&(i+=" + "+JSON.stringify(e.slice(o))),i+`;
`}var zo=/<img\b(?:[^<>]|\{[^{}]*\})*>/g,Do={".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".gif":"image/gif",".webp":"image/webp",".svg":"image/svg+xml",".ico":"image/x-icon"},Fo=8192,qo=16384;function Bo(e,s){let n=x.extname(s),t=x.basename(s,n),r=s.slice(0,s.length-(t+n).length),i;try{i=C.readdirSync(x.join(e,x.dirname(s)))}catch{return[]}let o=new RegExp("^"+t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\.w(\\d+)"+n.replace(".","\\.")+"$","i"),h=[];for(let u of i){let c=o.exec(u),f=c?Number(c[1]):0;f>0&&h.push({url:`${r}${t}.w${f}${n}`,width:f})}return h.sort((u,c)=>u.width-c.width)}var Ss=new Map;function Jo(e){let s;try{s=C.statSync(e)}catch{return null}let n=Ss.get(e);if(n&&n.mtime===s.mtimeMs)return{buffer:n.buffer,dims:n.dims};let t;try{t=C.readFileSync(e)}catch{return null}let r=os(e),i={mtime:s.mtimeMs,buffer:t,dims:r};return Ss.set(e,i),{buffer:t,dims:i.dims}}function Rs(e,s){return e.replace(zo,n=>{let t=n.match(/\bsrc="(\/[^"{}]+)"/);if(!t)return n;let r=x.extname(t[1]).toLowerCase(),i=Do[r];if(!i)return n;let o=x.join(s,t[1]),h=Jo(o);if(!h)return n;let u=h.buffer,f=/\swidth=/.test(n)||/\sheight=/.test(n)?null:h.dims,a=g=>f?g.replace(/<img\b/,`<img width="${f.width}" height="${f.height}"`):g,l=r===".svg"?qo:Fo;if(u.length>l){let _=/\ssrcset=/.test(n)||/\ssizes=/.test(n)?[]:Bo(s,t[1]);if(!_.length)return a(n);let w=_.map($=>`${$.url} ${$.width}w`).join(", ");return a(n.replace(/<img\b/,`<img srcset="${w}"`))}let p=r===".svg"?`data:image/svg+xml,${u.toString("utf-8").replace(/%/g,"%25").replace(/#/g,"%23").replace(/"/g,"%22")}`:`data:${i};base64,${u.toString("base64")}`;return a(n.replace(t[0],`src="${p}"`))})}function Ho(e,s,n,t,r=!0,i=!1){if(!r)return`${s} += esc(${e});
`;let o=t?`(${t}) => (${e})`:`() => (${e})`,h=i?", 1":t?", 0":"";return t&&(h+=`, ${t}`),`${s} += textMark(${n}, ${o}${h});
`}var Wo=new Set(["checked","disabled","readonly","required","selected","multiple","autofocus","open"]);function Uo(e,s,n,t,r,i=!0){if(!i)return`${n} += '${e}="' + esc(${s}) + '"';
`;let o=r?`(${r}) => (${s})`:`() => (${s})`,h=r?`, ${r}`:"";return Wo.has(e)?`${n} += boolAttrMark(${t}, ${o}, '${e}'${h});
`:`${n} += attrMark(${t}, ${o}, '${e}'${h});
`}function Vo(e){return`${e} += String(children);
`}var jt="import { state, setState, persistState, $data, hasState, isSeeded, markSeeded, esc, refresh, onMount, onCleanup, $effect, getContext, $query, $t, bestLocale, localeDir, ensureLocale, loadLocale, handlers, directives, $cookies, $sessionCookie, $setCookie, $isLocal, serializeRequestCookies, $store, $udp, $tcp, $listen, $websocket, $mqtt, parseLoRaWAN, ActionError, $actionError, $actionErrorOrThrow, $actionPending, $boundaryFallback, $setBoundaryError, $boundaryError, $append, $prepend, $merge, applyStateDeltas, textMark, attrMark, boolAttrMark, ifMark, eachMark, headMark, rawMark, slotBlockMark, redirect, notFound, aggregate, loader, encodeSdui, decodeSdui, setPath as __rvsetpath, writeRowField as __rvrow } from './runtime.js';",As=new Set(jt.replace(/^import\s*\{/,"").replace(/\}\s*from[\s\S]*$/,"").split(",").map(e=>e.trim()).filter(Boolean)),Go=jt.replace(/^import\s*\{/,"").replace(/\}\s*from[\s\S]*$/,"").split(",").map(e=>e.trim()).filter(Boolean);function Ys(e){return e.length===0?"":e.map(s=>`const ${s.name} = __p.${s.name}${s.def?` ?? (${s.def})`:""};`).join(`
`)}var er=`const __slot = (sl, name, pairs) => {
  const fn = sl[name];
  if (typeof fn !== 'function') return null;
  const o = {};
  for (let i = 0; i < pairs.length; i++) o[pairs[i][0]] = pairs[i][1];
  return { o, fn };
};
const __slotBlock = (closes, sl, name, pairs, fallback, suffix) => {
  const hit = __slot(sl, name, pairs);
  if (hit) return slotBlockMark(closes, hit, suffix);
  return fallback || '';
};
const __slotDefault = (children, fallback) => {
  const c = children == null ? '' : String(children);
  if (c.trim()) return c;
  return fallback || '';
};`,tr=`
const __rvraw = (e) => {
  const t = e.target;
  const raw = t.type === 'number' || t.type === 'range' ? t.valueAsNumber : t.value;
  return typeof raw === 'number' && Number.isNaN(raw) ? null : raw;
};
`,nr=`
// An inline handler inside {#each} registers HERE, inside the render
// closure - the arrow captures the row's \`__s\` (the item), which module
// scope never had (BUG.md BE). The key is prefix + this document's shared
// closes-array counter: one array per document render, shared by every
// layout/page/component instance, so rows and instances never collide and
// the FIRST render's sequence matches the server's (adopt-by-index contract)
// - which is the key wire()'s direct listener captures at bind time. A
// closure mints once and re-evaluations (wire's attribute pass) reuse the
// minted key, so nothing re-mints and the registry does not grow per pass.
const __rhreg = (prefix, fn) => {
  if (typeof fn === 'function' && fn.__rhk) return fn.__rhk;
  const n = (closes.__rhn = (closes.__rhn || 0) + 1) - 1;
  const k = prefix + n;
  handlers[k] = fn;
  if (typeof fn === 'function') fn.__rhk = k;
  return k;
};
`;function Zo(e,s,n,t="",r="",i=[],o=!1,h="",u=!1,c="",f=!1,a="",l="",p=!1,g=!1){let _=r?`
const __head = () => { let __hd = ''; ${r} return __hd; };
__html += headMark(closes, __head);`:"",w=f||p?`
const $setState = (key, value) => setState(key, value);`:"",$=p?nr:"",m=g?tr:"";return`
${jt}

${h}

${t}
${c}
${w}

${o?er:""}

export ${u?"function":"async function"} render(closes, children, __props, __slots, __iid = '') {
  ${u?`// BUG.md P1: the call site's instance id suffixes every state key and
  // handler name this render registers - two instances of one component get
  // two disjoint scopes instead of overwriting each other.
  const __ik = (k) => __iid ? k + '#' + __iid : k;
  const __hk = __ik;`:""}
  ${i.length>0?"const __p = __props || {};":""}
  ${o?"const __sl = __slots || {};":""}
  ${Ys(i)}
  ${i.length>0?"const __rvlive = (k, v) => { const g = __p['__live-' + k]; return typeof g === 'function' ? g() : v; };":""}
  ${e}
  ${n}
  ${a}
  ${l}
  ${$}
  ${m}

  ${u?"":"applyStateDeltas();"}
  const __root = (__c, children) => { let h = ''; ${s} return h; };
  let __html = ${u?"":"await "}__root(closes, children);${_}
  return __html;
}
`}function Xo(e,s,n,t,r="",i="",o=[],h=!1,u="",c=!1,f="",a="",l=!1,p=!1){let g=new Set,_=t.filter(A=>g.has(A.fn)?!1:(g.add(A.fn),!0)),w=_.length>0?c?_.map(A=>{let R=A.fn.indexOf(": ");return R<0?`handlers[__hk(${JSON.stringify(A.fn)})] = ${A.fn};`:`handlers[__hk(${JSON.stringify(A.fn.slice(0,R))})] = ${A.fn.slice(R+2)};`}).join(`
`):`Object.assign(handlers, { ${_.map(A=>A.fn).join(", ")} });`:"",$=_.length>0||l?"const $setState = (key, value) => setState(key, value);":"",m=l?nr:"",v=p?tr:"",k=i?`
const __head = () => { let __hd = ''; ${i} return __hd; };
__html += headMark(closes, __head);`:"";return`
${jt}

${u}

${r}
${$?`
${$}
`:""}
${h?er:""}

export ${c?"function":"async function"} render(closes, children, __props, __slots, __iid = '') {
  ${c?`// BUG.md P1: see generateSSR - the instance id scopes state and handlers.
  const __ik = (k) => __iid ? k + '#' + __iid : k;
  const __hk = __ik;`:""}
  ${o.length>0?"const __p = __props || {};":""}
  ${h?"const __sl = __slots || {};":""}
  ${Ys(o)}
  ${o.length>0?"const __rvlive = (k, v) => { const g = __p['__live-' + k]; return typeof g === 'function' ? g() : v; };":""}
  ${e}
  ${n}
  ${f}
  ${a}
  ${v}
  ${w}
  ${m}
  const __root = (__c, children) => { let h = ''; ${s} return h; };
  let __html = ${c?"":"await "}__root(closes, children);${k}
  return __html;
}
`}var mt=(e,s)=>e.map((n,t)=>({li:n,i:t})).filter(({li:n})=>n.isLayout&&ti(n.filePath,e[s].filePath)).sort((n,t)=>t.li.filePath.length-n.li.filePath.length).map(({i:n})=>n),Wt=(e,s,n)=>s[n].csr===!0||s[n].needsClient||On(e,s,n)?!1:!mt(e,n).some(t=>s[t].needsClient),On=(e,s,n)=>s[n].shell===!1||mt(e,n).some(t=>s[t].shell===!1);function Qo(e,s){return e.map((n,t)=>({info:n,i:t})).filter(({info:n})=>!n.isLayout&&!n.isNotFound&&!n.isError&&!n.isApi&&!n.isMiddleware&&!n.isComponent).map(({info:n,i:t})=>{if(Wt(e,s,t))return`${n.routePath}  zero-JS  nothing in the chain needs the client`;let r=[t,...mt(e,t)].filter(o=>s[o].needsClient).map(o=>`${(s[o].clientReasons??["needs the client"]).join(" + ")} in ${x.basename(e[o].filePath)}`).join("; "),i=s[t].csr===!0?" (csr = true forces the bundle)":"";return`${n.routePath}  client JS  ${r}${i}`})}var Cs=`

import { start, postForm } from '/client.js';

for (const el of document.querySelectorAll('[data-rosezm]')) {
  const route = el.getAttribute('data-rosezm');
  const doc = await fetch(route).then((r) => (r.ok ? r.text() : ''));
  const parsed = new DOMParser().parseFromString(doc, 'text/html');
  // A JS-shipping document wraps its content in #app; a zero-JS route's content is the body's own (no wrapper).
  const app = parsed.getElementById('app');
  if (app) {
    el.innerHTML = app.innerHTML;
  } else {
    for (const node of Array.from(parsed.body.children)) {
      if (!/^(?:SCRIPT|LINK|STYLE)$/.test(node.tagName)) el.appendChild(node);
    }
  }
  // start() resumes from #__rosezm_state (zero hydration), so the state
  const state = parsed.getElementById('__rosezm_state');
  if (state) el.appendChild(state);
  
  const rendered = state ? JSON.parse(state.textContent || '{}').__route : null;
  await start(el, route, rendered === route);
  if (state) state.remove();
  
  el.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="/"]');
    if (!a || !el.contains(a)) return;
    e.preventDefault();
    el.setAttribute('data-rosezm', a.getAttribute('href'));
    start(el, a.getAttribute('href'), false);
  });
  // Progressive-enhancement forms work inside a mount too: the native POST would replace the HOST page.
  el.addEventListener('submit', (e) => {
    const f = e.target;
    if (!f || f.tagName !== 'FORM' || f.hasAttribute('data-on-submit')) return;
    if ((f.getAttribute('method') || '').toLowerCase() !== 'post') return;
    e.preventDefault();
    postForm(new FormData(f), el, el.getAttribute('data-rosezm'));
  });
}
`,kn=new Map,Ts=null;async function Ko(e){let s="";try{s=await C.promises.readFile(e,"utf8")}catch{return}try{await ot.transform(s,{loader:"js",format:"esm"})}catch(n){let t=n instanceof Error?n.message.split(`
`).filter(Boolean).slice(0,2).join(" "):String(n);throw new j("E-BUILD-PARSE",`the emitted ${x.basename(e)} is not valid JavaScript: ${t}`,{hint:"this is a compiler bug, not a page bug - please report the page that produced it"})}}async function Ei(e,s=[]){let n=async t=>{let r=[];try{r=await C.promises.readdir(t,{withFileTypes:!0})}catch{return[]}let i=[];for(let o of r){if(o.name==="node_modules")continue;let h=x.join(t,o.name);o.isDirectory()?i.push(...await n(h)):/\.(?:js|mjs)$/.test(o.name)&&i.push(h)}return i};for(let t of(await n(e)).sort())await Ko(t)}async function Si(e,s,n={}){let t=x.resolve(e),r=x.resolve(s),i=n.minify!==!1,o=n.incremental===!0,h=process.env.VERCEL==="1"||process.env.VERCEL==="true";await C.promises.mkdir(r,{recursive:!0});let u=(await C.promises.readdir(r)).filter(d=>/^(?:comp-\d+\.(?:ssr|client)|runtime|(?:server|client)-entry)\.js$/.test(d));await Promise.all(u.map(d=>C.promises.rm(x.join(r,d),{force:!0})));let[c,f]=await Promise.all([Yo(t),ei(t)]),a=[...c,...f];if(c.length===0)throw new j("E-ROUTE",`no .rose pages found under ${x.join(t,"src","pages")} - run rosezm from a project root, or pass one: rosezm build <dir>`,{file:x.join(t,"src","pages"),hint:"create src/pages/index.rose in that directory (or run the command from the project root)"});let l=a.map(d=>({...ni(d,t)}));if(n.pages?.length){let d=S=>!S.isComponent&&!S.isLayout&&!S.isNotFound&&!S.isError&&!S.isApi&&!S.isMiddleware,b=new Set(n.pages.map(S=>S.replace(/\/+$/,"")||"/")),T=l.filter(d).map(S=>S.pattern),N=[...b].filter(S=>!T.includes(S));if(N.length)throw new j("E-ROUTE",`--pages names ${N.join(", ")} - no such route`,{hint:`routes: ${T.join(", ")}`});let F=l.map(S=>!d(S)||b.has(S.pattern));l=l.filter((S,V)=>F[V]);let P=a.filter((S,V)=>F[V]);a.length=0,a.push(...P)}let p=await Bs(t);Us=(p.watch??[]).map(d=>x.isAbsolute(d)?d:x.join(t,d));let g=p.plugins,_=a.map((d,b)=>{let T=l[b].isComponent?x.join(t,"src"):x.join(t,"src","pages");return x.relative(T,d).replace(/\\/g,"/").replace(/\.rose$/,"")}),w=new Map(a.map((d,b)=>[d,{index:b,scopeKey:_[b],slots:Gr(d)}])),$=ot.transform("export default 0",{loader:"js"}).catch(()=>{}),m=await Promise.all(a.map((d,b)=>so(d,x.join(t,"public"),_[b],l[b].isApi,g,w)));await $;{let d=new Set(Pn().map(([N])=>N)),b=[],T=new Set;for(let N=0;N<m.length;N++)for(let F of[...fs(m[N].ssr),...fs(m[N].client)]){if(d.has(F)||T.has(F))continue;T.add(F);let P=`${x.relative(t,a[N]).replace(/\\/g,"/")} reads import.meta.env.${F}`;b.push(F.startsWith(Jt)?`  ${P}
    -> it has the public prefix but is not set in this build's environment (an unset public var is undefined in the bundle; the server render does not fall back to it)`:`  ${P}
    -> only ${Jt}* is exposed to the client; rename it to ${Jt}${F} if it is public config, or keep it server-only (it stays undefined here, in dev and in the bundle)`)}b.length>0&&console.warn(`rosezm warning: import.meta.env.<name> carries only ${Jt}* variables:
${b.join(`
`)}`)}let v=new Map;a.forEach((d,b)=>{let T=[];for(let N of m[b].roseImports??[]){let F=x.resolve(x.dirname(a[b]),N.specifier),P=w.get(F);P&&T.push(P.index)}v.set(b,T)});let k=(d,b=new Set)=>{if(m[d].needsClient)return x.basename(a[d]);if(b.has(d))return null;b.add(d);for(let T of v.get(d)??[]){let N=k(T,b);if(N)return N}return null};m.forEach((d,b)=>{if(d.needsClient)return;let T=k(b);T&&(d.needsClient=!0,d.clientReasons=[...d.clientReasons??[],`imported component ${T} needs the client`])});let A=d=>{let b=[],T=new Set([d]),N=F=>{for(let P of v.get(F)??[])if(!T.has(P)){if(T.add(P),l[P].isComponent)for(let S of m[P].actionNames)b.push({name:S,j:P});N(P)}};return N(d),b},R=new Set,O=d=>{if(!R.has(d)){R.add(d);for(let b of m[d].roseImports??[]){let T=x.resolve(x.dirname(a[d]),b.specifier),N=w.get(T);N&&O(N.index)}}};a.forEach((d,b)=>{l[b].isComponent||O(b)});let B=m.map((d,b)=>R.has(b)&&l[b].isComponent?d.style:"").filter(Boolean).join(`
`);B?await C.promises.writeFile(x.join(r,"styles.css"),B):await C.promises.rm(x.join(r,"styles.css"),{force:!0});let Q={};try{let d=x.join(t,"src","locales"),b=(await C.promises.readdir(d)).filter(N=>N.endsWith(".json")),T=await Promise.all(b.map(async N=>[N.slice(0,-5),JSON.parse(await C.promises.readFile(x.join(d,N),"utf-8"))]));Q=Object.fromEntries(T)}catch{Q={}}let M=Q.en?"en":Object.keys(Q).sort()[0]??"en",H=JSON.stringify(Q).replace(/</g,"\\u003c"),se=p.i18n.preload??Object.keys(Q),ce=Object.keys(Q).filter(d=>!se.includes(d));for(let d of se)Q[d]||console.warn(`rosezm: i18n.preload lists '${d}' but there is no src/locales/${d}.json - ignored`);if(await C.promises.rm(x.join(r,"locales"),{recursive:!0,force:!0}),ce.length>0){let d=x.join(r,"locales");await C.promises.mkdir(d,{recursive:!0});for(let b of ce)await C.promises.writeFile(x.join(d,`${b}.json`),JSON.stringify(Q[b]))}let xe=Object.fromEntries(Object.keys(Q).filter(d=>!ce.includes(d)).map(d=>[d,Q[d]])),Re=JSON.stringify(xe).replace(/</g,"\\u003c"),Ne=x.join(t,".rosezm-build"),L=x.join(Ne,`${process.pid}-${dn(x.resolve(t))}`),G=C.existsSync(L);await C.promises.mkdir(L,{recursive:!0});let de=new Date;await C.promises.utimes(L,de,de),(!G||Ts!==L)&&(kn.clear(),Ts=L),Kn(Ne);let Te=[x.join(x.dirname(Bt(import.meta.url)),"..","cli","content.ts"),x.join(x.dirname(Bt(import.meta.url)),"..","src","cli","content.ts")],Me=Te.find(d=>C.existsSync(d))??Te[0];C.copyFileSync(Me,x.join(L,"content-md.ts"));let Fe=g.filter(d=>d&&(d.onRequest||d.onResponse));if(Fe.length>0){let d=x.relative(L,x.join(t,"rosezm.config.js")).replace(/\\/g,"/");await C.promises.writeFile(x.join(L,"plugins.js"),`
import config from ${JSON.stringify(d)};

const list = Array.isArray(config) ? config : [];
export const hooks = list
  .filter((p) => p && (p.onRequest || p.onResponse))
  .map((p) => ({ name: p.name, onRequest: p.onRequest ? p.onRequest.bind(p) : null, onResponse: p.onResponse ? p.onResponse.bind(p) : null }));

export const hasRequestHooks = hooks.some((p) => p.onRequest);
export const hasResponseHooks = hooks.some((p) => p.onResponse);
`)}let Ae=["../runtime/index.ts","../src/runtime/index.ts"].map(d=>Bt(new URL(d,import.meta.url))).find(d=>C.existsSync(d));if(!Ae)throw new j("E-INTERNAL","rosezm: the runtime source (src/runtime/index.ts) was not found next to the compiler",{hint:"the published package ships src/ beside dist-cli/ - reinstall it, or run from a checkout"});let he=nt(Ae,{entryPoints:[Ae],bundle:!0,outfile:x.join(L,"runtime.js"),format:"esm",platform:"browser",write:!0},o),pe=(()=>{let d=x.dirname(Bt(import.meta.url));for(let b of[x.join(d,"..","cli","prod-server.ts"),x.join(d,"..","src","cli","prod-server.ts")])if(C.existsSync(b))return b;return x.join(d,"..","cli","prod-server.ts")})(),I="import { createRequire as __cr } from 'node:module'; import { fileURLToPath as __f2p } from 'node:url'; import { dirname as __dn } from 'node:path'; const require = __cr(import.meta.url); const __filename = __f2p(import.meta.url); const __dirname = __dn(__filename);",je=o?Promise.resolve({}):nt(pe,{entryPoints:[pe],bundle:!0,outfile:x.join(r,"prod.mjs"),format:"esm",platform:"node",write:!0,banner:{js:I},...dt,...i?{minify:!0,keepNames:!0}:{}},o);he.catch(()=>{}),je.catch(()=>{});let Be=[];if(n.cjs){Be.push(nt(pe,{entryPoints:[pe],bundle:!0,outfile:x.join(r,"prod.cjs"),format:"cjs",platform:"node",write:!0,define:{"import.meta.url":"__rosezmMetaUrl"},banner:{js:"const __rosezmMetaUrl = require('node:url').pathToFileURL(__filename).href;"},...dt,...i?{minify:!0,keepNames:!0}:{}},o));for(let d of Be)d.catch(()=>{})}let Z=[],W=(d,b)=>{kn.get(d)!==b&&(kn.set(d,b),Z.push(C.promises.writeFile(x.join(L,d),b)))};for(let d=0;d<m.length;d++){let b=m[d].api??m[d].ssr;W(`comp-${d}.ssr.js`,b),l[d].isApi||W(`comp-${d}.client.js`,m[d].client)}for(let d=0;d<Z.length;d+=64)await Promise.all(Z.slice(d,d+64));let D=l.map((d,b)=>({info:d,i:b})).filter(({info:d})=>!d.isLayout&&!d.isNotFound&&!d.isError&&!d.isApi&&!d.isMiddleware&&!d.isComponent).sort((d,b)=>{let T=P=>{let S=P.split("/");return[S.filter(V=>V.startsWith("**")).length,S.filter(V=>V.startsWith("*")).length,S.filter(V=>V.startsWith(":")).length]},N=T(d.info.pattern),F=T(b.info.pattern);for(let P=0;P<3;P++)if(N[P]!==F[P])return N[P]-F[P];return d.info.filePath<b.info.filePath?-1:1}),ee=l.map((d,b)=>({info:d,i:b})).filter(({info:d})=>d.isApi).sort((d,b)=>{let T=P=>{let S=P.split("/");return[S.filter(V=>V.startsWith("**")).length,S.filter(V=>V.startsWith("*")).length,S.filter(V=>V.startsWith(":")).length]},N=T(d.info.pattern),F=T(b.info.pattern);for(let P=0;P<3;P++)if(N[P]!==F[P])return N[P]-F[P];return d.info.filePath<b.info.filePath?-1:1}),te=d=>{let b=`render_${d}`;for(let T of mt(l,d))b=`(async (closes, children) => await render_${T}(closes, await (${b})(closes, children)))`;return b},K=x.join(t,"src","pages","_layout.rose"),ge=a.findIndex((d,b)=>m[b].bundle&&d!==K);if(ge>=0)throw new j("E-BUNDLE",`${x.basename(a[ge])}: export const bundle switches the whole app's bundle mode, so it belongs in the root layout (src/pages/_layout.rose)`,{file:a[ge],hint:"move `export const bundle = 'split'` (or 'inline') to src/pages/_layout.rose - the mode is per-app, not per-page"});let ve=m[a.indexOf(K)]?.bundle??"inline",ie=ve==="split",Y=ve==="sliced",U=d=>"s"+sn(d),X=jt.replace(/^import\s*\{/,"").replace(/\}\s*from[\s\S]*$/,"").split(",").map(d=>d.trim()).filter(Boolean),ue=(()=>{let d=T=>T.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),b=new Set;for(let T of m){if(!T.client)continue;let N=T.client.replace(/^import\s*\{[^}]*\}\s*from\s*'\.\/runtime\.js';/m,"");for(let F of X)b.has(F)||new RegExp(`(?<![\\w$])${d(F)}(?![\\w$])`).test(N)&&b.add(F)}return X.filter(T=>b.has(T))})(),Le=d=>[d,...mt(l,d)],Je=d=>`load: () => loadChain([${Le(d).map(b=>`() => import('./comp-${b}.client.js')`).join(", ")}])`,Ie=d=>Wt(l,m,d),Ve=m.map((d,b)=>{if(!R.has(b))return"";if(l[b].isMiddleware)return`import * as middlewareMod from './comp-${b}.ssr.js';`;if(l[b].isApi){let re=(m[b].apiMethods??[]).map(_e=>`${_e} as ${_e}_${b}`).join(", ");return re?`import { ${re} } from './comp-${b}.ssr.js';`:`import './comp-${b}.ssr.js';`}let T=!l[b].isLayout&&!l[b].isNotFound,N=T?m[b].actionNames:[],F=N.map(le=>`${le} as ${le}_${b}`).join(", "),P=T?(()=>{let le=new Set(N),re=[],_e=new Set;for(let Ze of A(b))if(!(le.has(Ze.name)||_e.has(Ze.j))){_e.add(Ze.j);for(let pt of m[Ze.j].actionNames)re.push(`${pt} as ${pt}_${Ze.j}`)}return re.join(", ")})():"",S=T&&m[b].guardName?`beforeAction as beforeAction_${b}`:"",V=[F,S].filter(Boolean).join(", "),we=P?P.split(", ").reduce((le,re)=>{let _e=re.split(" as ")[1],Ze=Number(_e.slice(_e.lastIndexOf("_")+1)),pt=le.findIndex(tn=>tn.endsWith(`comp-${Ze}.ssr.js';`));return pt>=0?le[pt]=le[pt].replace(" };",`, ${re} };`):le.push(`import { ${re} } from './comp-${Ze}.ssr.js';`),le},[]):[],ke=we.length?`
${we.join(`
`)}`:"";return(V?`import { render as render_${b}, ${V} } from './comp-${b}.ssr.js';`:`import { render as render_${b} } from './comp-${b}.ssr.js';`)+ke}).join(`
`),Ge=l.map((d,b)=>({info:d,i:b})).filter(({info:d})=>d.isNotFound).map(({info:d,i:b})=>{let T=x.relative(x.join(t,"src","pages"),d.filePath).replace(/\\/g,"/"),N=x.posix.dirname(T),F=N==="."?"/":"/"+N,P=[];On(l,m,b)&&P.push("shell: false"),Wt(l,m,b)&&P.push("csr: false");let S=P.length?`, { ${P.join(", ")} }`:"";return{prefix:F,render:te(b),flags:S}}).sort((d,b)=>b.prefix.length-d.prefix.length),ae=`[
${Ge.map(d=>`  ['${d.prefix}', ${d.render}${d.flags}],`).join(`
`)}
]`,Ee=l.findIndex(d=>d.isError),Oe=Ee>=0?te(Ee):"null",at=Ee>=0?Wt(l,m,Ee):!1,He=l.findIndex(d=>d.isMiddleware),wt=[];if(He>=0){let d=await C.promises.readFile(a[He],"utf8"),b=/<script>([\s\S]*?)<\/script>/.exec(d)?.[1]??"",T=Vt(b),N=T.search(/\bexport\s+const\s+gated\s*=\s*\[/);if(N>=0){let F=b.indexOf("[",N),P=on(T,T.indexOf("[",N));if(P<0)throw new j("E-EXPORT",`${a[He]}: export const gated is not a closed array`,{file:a[He],hint:"the value must be an array of string prefixes, e.g. export const gated = ['/admin']"});let S=b.slice(F+1,P),V=[...S.matchAll(/(['"])((?:\\.|(?!\1).)*)\1/g)].map(ke=>ke[2]);if(S.replace(/(['"])((?:\\.|(?!\1).)*)\1/g,"").replace(/,/g,"").trim()||V.some(ke=>!ke.startsWith("/")))throw new j("E-EXPORT",`${a[He]}: export const gated accepts string path prefixes only`,{file:a[He],hint:`got ${JSON.stringify(S.trim())} - e.g. export const gated = ['/admin', '/vault']`});wt=V}}let me=x.join(t,"src","app.rose"),Ot="";if(C.existsSync(me)){let d=await C.promises.readFile(me,"utf8"),b=/<script>([\s\S]*?)<\/script>/.exec(d)?.[1]??"";if(!b.trim())throw new j("E-EXPORT",`${me}: an app.rose needs a <script> block with its lifecycle exports`,{file:me,hint:"export function onLaunch() {...} (and optionally onShow/onHide/onError and a globalData object)"});let T=ot.transformSync(b,{loader:"ts",format:"esm",target:"es2020"}).code,N=ke=>{let le=new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${ke}\\s*\\([^)]*\\)\\s*\\{`).exec(T);if(!le)return null;let re=0;for(let _e=le.index+le[0].length-1;_e<T.length;_e++)if(T[_e]==="{")re++;else if(T[_e]==="}"&&(re--,re===0))return`${/(?:export\s+)?((?:async\s+)?function\s+\w+\s*\([^)]*\))/.exec(le[0])[1]} {${T.slice(le.index+le[0].length,_e+1)}`;return null},F=N("onLaunch"),P=N("onShow"),S=N("onHide"),V=N("onError"),we=/(?:export\s+)?const\s+globalData\s*=\s*(\{[\s\S]*?\n?\})\s*;?/.exec(T)?.[1]??null;if(!F&&!P&&!S&&!V&&!we)throw new j("E-EXPORT",`${me}: no lifecycle exports found in the script`,{file:me,hint:"export function onLaunch() {...} (and optionally onShow/onHide/onError and a globalData object)"});Ot=`
// App-level lifecycle from src/app.rose: onLaunch once at boot, onShow/onHide
// on visibilitychange, onError on window.onerror, globalData on window.__rosezmApp.
// Guarded on window: the same bundle also runs in Node for SSR, where none of
// this exists (the same guard the lazy-hydration flag below uses).
if (typeof window !== 'undefined') {
window.__rosezmApp = ${we?`(${we})`:"{}"};
${F?`var __appLaunch = ${F};`:""}
${P?`var __appShow = ${P};`:""}
${S?`var __appHide = ${S};`:""}
${V?`var __appErr = ${V};`:""}
var __appLaunched = false;
window.addEventListener('error', function (e) { if (typeof __appErr === 'function') { try { __appErr(e.error || new Error(e.message)); } catch (x) {} } });
window.addEventListener('unhandledrejection', function (e) { if (typeof __appErr === 'function') { try { __appErr(e.reason instanceof Error ? e.reason : new Error(String(e.reason))); } catch (x) {} } });
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible' && typeof __appShow === 'function') { try { __appShow(); } catch (x) {} }
  if (document.visibilityState === 'hidden' && typeof __appHide === 'function') { try { __appHide(); } catch (x) {} }
});
}`}let $t=D.map(({info:d,i:b})=>{let T=new Set(m[b].actionNames),N=A(b).filter(re=>!T.has(re.name)),F=[...m[b].actionNames.map(re=>`${re}: ${re}_${b}`),...N.map(re=>`${re.name}: ${re.name}_${re.j}`)].join(", ");if(m[b].csr===!1&&m[b].needsClient)throw new j("E-EXPORT",`${d.filePath}: csr = false but this route needs the client bundle (${(m[b].clientReasons??["needs the client"]).join(" + ")}).`,{file:d.filePath,hint:"remove csr = false (the compiler decides zero-JS by itself), or remove the client-only code listed above"});if(m[b].csr===!1){let re=mt(l,b).find(_e=>m[_e].needsClient);if(re!==void 0)throw new j("E-EXPORT",`${d.filePath}: csr = false cannot ship under ${l[re].filePath} - the layout needs the client bundle (event wiring, onMount/onCleanup, refresh() or a server action).`,{file:d.filePath,hint:"a layout needing the runtime bundles every route under it - drop csr = false here, or make the layout content-only"})}let P=Ie(b)?", csr: false":"",S=On(l,m,b)?", shell: false":"",V=m[b].buffer?", buffer: true":"",we=m[b].controlSignal?", signal: true":"",ke=m[b].guardName?`, guard: beforeAction_${b}`:"",le=Y&&!Ie(b)?`, slice: '${U(d.pattern)}'`:"";return`{ pattern: '${d.pattern}', path: '${d.routePath}', render: ${te(b)}, actions: ${F?`{ ${F} }`:"null"}${ke}${P}${S}${V}${we}${le} }`}).join(`,
  `),bt=m.some(d=>d.usesrosezmAuth),_t=m.some(d=>/\$(?:udp|tcp|listen|mqtt)\s*\(/.test((d.ssr||"")+(d.client||"")+(d.api||""))),yt=m.some(d=>/\$websocket\s*\(/.test((d.ssr||"")+(d.client||"")+(d.api||""))),fn=`
${Ve}
import { renderMarkdown } from './content-md.ts';
${bt?"import crypto from 'node:crypto';":"// no route references __rosezmAuth: the node:crypto auth helpers are omitted, keeping the bundle edge-loadable"}
${_t?`import * as __rosezmDgram from 'node:dgram';
import * as __rosezmNet from 'node:net';`:"// no route opens a network listener ($udp/$tcp/$listen): the node:dgram/node:net imports are omitted, keeping the bundle edge-loadable"}
${yt?`import * as __rosezmHttp from 'node:http';
import * as __rosezmCrypto from 'node:crypto';`:"// no route opens a WebSocket server ($websocket): the node:http/node:crypto imports are omitted, keeping the bundle edge-loadable"}
import { setState, persistState, clearRequestState, isolateRender, serializeState, resetRequestContext, clientAddress, installContextStore, setRequestQuery, getRequestQuery, getContext, serializeRequestCookies, isLocale, setLocales, localeList, localeDir, setStoreTransport, applyStorePatch, ActionError, StateDelta, setStateDelta, esc, __startNetwork, __stopNetwork, $udp, $tcp, $listen, $websocket, $mqtt } from './runtime.js';
export { __startNetwork, __stopNetwork };
${Fe.length>0?"import { hooks as __pluginHooks, hasRequestHooks as __hasRequestHooks, hasResponseHooks as __hasResponseHooks } from './plugins.js';":`// no plugin declares a runtime hook, so there is no plugins
// module to import - the runners below stay no-ops and the servers call them
// unconditionally (one code path, no flags to keep in sync).
const __pluginHooks = [];
const __hasRequestHooks = false;
const __hasResponseHooks = false;`}


export async function runRequestHooks(ctx) {
  for (const p of __pluginHooks) {
    if (!p.onRequest) continue;
    try {
      const r = await p.onRequest(ctx);
      if (r instanceof Response) return r;
    } catch (err) {
      console.error('rosezm: plugin', p.name, 'onRequest failed:', err instanceof Error ? err.message : err);
    }
  }
  return null;
}

export async function runResponseHooks(ctx, res) {
  let out = res;
  for (const p of __pluginHooks) {
    if (!p.onResponse) continue;
    try {
      const r = await p.onResponse(ctx, out);
      if (r instanceof Response) out = r;
    } catch (err) {
      console.error('rosezm: plugin', p.name, 'onResponse failed:', err instanceof Error ? err.message : err);
    }
  }
  return out;
}


export const hasRequestHooks = __hasRequestHooks;
export const hasResponseHooks = __hasResponseHooks;

// P0-1: the query of the request being rendered, for $query().
export function setQuery(query) {
  setRequestQuery(query || {});
}


setLocales(${H}, '${M}');


// Live store channel: every $store write fans out to the browsers holding an open
// SSE connection AND (when forked) to sibling workers. The client set lives on
// globalThis so a dev hot-re-import (a fresh module instance) keeps serving the
// same live connections. __addStoreClient/__removeStoreClient are called by the
// host (cli serve worker / devWrap) as SSE connections open and close.
const __storeClients: Set<any> = (globalThis as any).__rosezm_storeClients || ((globalThis as any).__rosezm_storeClients = new Set());
function __broadcastStore(name: string, value: unknown): void {
  if (__storeClients.size === 0) return;
  const frame = 'event: store\\ndata: ' + JSON.stringify({ name: name, value: value }) + '\\n\\n';
  for (const res of __storeClients) {
    try { res.write(frame); } catch { __storeClients.delete(res); }
  }
}
setStoreTransport((name, value) => {
  __broadcastStore(name, value);
  if (typeof process !== 'undefined' && typeof process.send === 'function') process.send({ type: 'rosezm:store', name, value });
});
if (typeof process !== 'undefined' && typeof process.send === 'function') {
  process.on('message', (msg) => {
    if (msg && msg.type === 'rosezm:store') {
      applyStorePatch(msg.name, msg.value);
      __broadcastStore(msg.name, msg.value);
    }
  });
}
export function __addStoreClient(res: any): void { __storeClients.add(res); }
export function __removeStoreClient(res: any): void { __storeClients.delete(res); }


// (the cross-machine seam): the cluster relay above covers ONE machine.
export function __installStoreTransport(send: (name: string, value: unknown) => void): void {
  // Wrap, not replace: a cross-machine transport (a plugin's LISTEN/NOTIFY bus)
  // still fans out to this machine's live browsers on every patch.
  setStoreTransport((name, value) => { __broadcastStore(name, value); send(name, value); });
}
export function __deliverStorePatch(name: string, value: unknown): void {
  applyStorePatch(name, value);
  __broadcastStore(name, value);
}

export { localeList };
export const defaultLocale = '${M}';

// Route params maps, re-exported for the build's prerender step: routePath -> the component's exported params (a static map or a function).
${D.filter(({i:d})=>m[d].hasParams).map(({i:d})=>`import * as comp_${d} from './comp-${d}.ssr.js';`).join(`
`)}

export const routeParams = {
  ${D.filter(({info:d,i:b})=>m[b].hasParams).map(({info:d,i:b})=>`'${d.routePath}': comp_${b}.params`).join(`,
  `)}
};

// Routes whose component reads the request context (getContext()), mutates a shared store ($store()), reads the query ($query(), P0-1)
export const dynamicRoutes = [
  ${D.filter(({i:d})=>m[d].usesContext||m[d].cspNonce||m[d].buffer||m[d].controlSignal||m[d].needsClient).map(({info:d})=>`'${d.routePath}'`).join(`,
  `)}
];

// Routes that the prerender function should skip (not bake into static files).
export const prerenderSkipRoutes = [
  ${D.filter(({i:d})=>m[d].usesContext||m[d].cspNonce||m[d].buffer||m[d].controlSignal).map(({info:d})=>`'${d.routePath}'`).join(`,
  `)}
];

// Which api routes opt into build-time baking (export const prerender = true): routePath -> boolean.
${ee.filter(({i:d})=>m[d].hasPrerender).map(({i:d})=>`import * as api_${d} from './comp-${d}.ssr.js';`).join(`
`)}

export const apiPrerender = {
  ${ee.map(({info:d,i:b})=>`'${d.routePath}': ${m[b].hasPrerender?`api_${b}.prerender === true`:"false"}`).join(`,
  `)}
};


export const revalidate = [
  ${D.filter(({i:d})=>m[d].revalidate!==void 0&&!m[d].usesContext).map(({info:d,i:b})=>`{ pattern: '${d.pattern}', seconds: ${m[b].revalidate} }`).join(`,
  `)}
];

// Per-request render memo (export const cache = N): a dynamic route's whole renderPage result is memoized for N seconds.
// A page that reads getContext() holds per-request state (the middleware
// put the caller's identity there), so its render must not be memoized: the
// second request in the window replayed the FIRST request's whole page -
// another user's context, in the same slot. The revalidate list above
// already refuses such a page; the memo did not, and now it does too.
export const routeCaches = [
  ${D.filter(({i:d})=>m[d].cache!==void 0&&!m[d].usesContext).map(({info:d,i:b})=>`{ pattern: '${d.pattern}', seconds: ${m[b].cache} }`).join(`,
  `)}
];

// Hot-cache key dimensions (export const hotVary = ['x-locale']): the shared
// server caches key on URL + cookie + accept-language only, so a route whose
// representation is negotiated on its own private header had one client's
// bytes replayed to another for a whole TTL (BUG.md AB) - and the app's only
// exits were a query tag (?l=, ?rv=) or no-store, which switches the cache off
// for the route entirely. Naming the headers here folds them into the key AND
// into the warm render that fills it, so every value gets its own entry and
// the cache keeps working.
export const routeHotVary = [
  ${[...D,...ee].filter(({i:d})=>m[d].hotVary).map(({info:d,i:b})=>`{ pattern: '${d.pattern}', dims: ${JSON.stringify(m[b].hotVary)} }`).join(`,
  `)}
];
export function hotVaryFor(pathname: string): string[] | null {
  for (const r of routeHotVary) if (matchRoute(r.pattern, pathname)) return r.dims;
  return null;
}
const __dynCache = new Map();
export function invalidateRenderCache(): void {
  __dynCache.clear();
}


// Application KV cache primitive (server-side, per-worker in-memory): a zero-dependency store for expensive computations.
const __kvStore = new Map<string, { v: unknown; exp: number }>();
// Content collections: src/content/<coll>/*.md scanned once at build time,
const contentCollections = ${JSON.stringify(ls(x.join(t,"src","content")))};
export const kv = {
  get(key: string): unknown {
    const e = __kvStore.get(key);
    if (!e) return undefined;
    if (e.exp < Date.now()) { __kvStore.delete(key); return undefined; }
    return e.v;
  },
  set(key: string, value: unknown, ttlSeconds = 300): void {
    if (__kvStore.size > 1000) {
      const cutoff = Date.now();
      for (const [k, e] of __kvStore) { if (e.exp < cutoff) __kvStore.delete(k); }
      if (__kvStore.size > 2000) __kvStore.clear(); 
    }
    __kvStore.set(key, { v: value, exp: Date.now() + ttlSeconds * 1000 });
  },
  del(key: string): void { __kvStore.delete(key); },
  has(key: string): boolean {
    const e = __kvStore.get(key);
    return !!e && e.exp >= Date.now();
  },
};
globalThis.__rosezmKvApi = { kv, kvMemo: $kv };
globalThis.__rosezmContent = {
  list: (coll: string, filter?: { tag: string }) => {
    let items = contentCollections[coll] ?? [];
    if (filter?.tag) items = items.filter((e) => ((e.frontmatter.tags as string[] | undefined) ?? []).includes(filter.tag));
    return items.map((e) => ({ slug: e.slug, ...e.frontmatter }));
  },
  rss: (coll: string, opts: { title: string; origin: string; description?: string }) => {
    return buildRss(contentCollections[coll] ?? [], opts);
  },
  get: (coll: string, slug: string, vars?: Record<string, unknown>) => {
    const e = (contentCollections[coll] ?? []).find((x) => x.slug === slug);
    if (!e) return null;
    return { slug: e.slug, ...e.frontmatter, html: renderMarkdown(e.body, vars), toc: e.toc, readingTime: e.readingTime, wordCount: e.wordCount, excerpt: e.excerpt };
  },
};

const v = {
  validate(body: Record<string, unknown>, rules: Record<string, string[]>): { ok: boolean; errors: Record<string, string>; values: Record<string, unknown> } {
    const errors: Record<string, string> = {};
    const values: Record<string, unknown> = {};
    for (const [field, ruleList] of Object.entries(rules)) {
      let val = body[field];
      for (const rule of ruleList) {
        if (val === undefined || val === null || val === "") {
          if (rule === "required") errors[field] = field + " is required";
          else if (rule.startsWith("default:")) val = rule.slice(8);
          continue;
        }
        if (rule === "string") val = String(val);
        else if (rule === "trim") val = String(val).trim();
        else if (rule === "number") {
          const num = Number(val);
          if (Number.isNaN(num)) errors[field] = field + " must be a number";
          else val = num;
        } else if (rule === "email") {
          if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(String(val))) errors[field] = field + " must be a valid email";
        } else if (rule.startsWith("min:")) {
          const min = Number(rule.slice(4));
          if (typeof val === "number" ? val < min : String(val).length < min) errors[field] = field + " must be at least " + min;
        } else if (rule.startsWith("max:")) {
          const max = Number(rule.slice(4));
          if (typeof val === "number" ? val > max : String(val).length > max) errors[field] = field + " must be at most " + max;
        }
      }
      values[field] = val;
    }
    return { ok: Object.keys(errors).length === 0, errors, values };
  },
};

const jobs = {
  _timers: new Map<string, ReturnType<typeof setInterval>>(),
  every(name: string, seconds: number, fn: () => void | Promise<void>): void {
    if (this._timers.has(name)) return;
    const t = setInterval(() => { Promise.resolve(fn()).catch(() => {}); }, seconds * 1000);
    this._timers.set(name, t as any);
  },
  cancel(name: string): void {
    const t = this._timers.get(name);
    if (t) { clearInterval(t); this._timers.delete(name); }
  },
  cancelAll(): void { for (const t of this._timers.values()) clearInterval(t); this._timers.clear(); }
};

function sse(handler: (send: (event: string, data: unknown) => void) => Promise<void> | void): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode("event: " + event + "\\ndata: " + JSON.stringify(data) + "\\n\\n"));
      };
      try {
        await handler(send);
      } finally {
        closed = true;
        try { controller.close(); } catch {  }
      }
    },
  });
  return new Response(stream, {
    headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache", "connection": "keep-alive" },
  });
}
${_t?`// The isomorphic runtime's $udp/$tcp reach Node's dgram/net only through these globals; injecting them at server boot is what lets __startNetwork() turn a registered spec into a bound socket.
(globalThis as any).__rosezm_dgram = __rosezmDgram;
(globalThis as any).__rosezm_net = __rosezmNet;`:""}
${yt?`// The isomorphic runtime's $websocket performs the RFC 6455 handshake (sha1) on a node:http upgrade socket; both reach it only through these globals.
(globalThis as any).__rosezm_http = __rosezmHttp;
(globalThis as any).__rosezm_crypto = __rosezmCrypto;`:""}
globalThis.__rosezmExtras = { v, jobs, sse, udp: $udp, tcp: $tcp, listen: $listen, websocket: $websocket, mqtt: $mqtt };
${bt?`
const auth = {
  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 32).toString("hex");
    return salt + ":" + hash;
  },
  verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), crypto.scryptSync(password, salt, 32));
  },
  signSession(data: Record<string, unknown>, secret: string, ttlSeconds = 86400): string {
    const payload = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + ttlSeconds * 1000 })).toString("base64url");
    const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    return payload + "." + sig;
  },
  verifySession<T = Record<string, unknown>>(token: string, secret: string): T | null {
    const dot = token.lastIndexOf(".");
    if (dot < 0) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expect = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    try {
      if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
    } catch { return null; }
    try {
      const data = JSON.parse(Buffer.from(payload, "base64url").toString());
      if (data.exp < Date.now()) return null;
      return data as T;
    } catch { return null; }
  },
  csrfToken(secret: string, sessionId: string): string {
    return crypto.createHmac("sha256", secret).update(sessionId).digest("hex");
  },
  verifyCsrf(token: string, secret: string, sessionId: string): boolean {
    try {
      return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(this.csrfToken(secret, sessionId)));
    } catch { return false; }
  },
};
globalThis.__rosezmAuth = auth;
`:"// __rosezmAuth helpers omitted: no route references them (keeps the bundle free of node:crypto and edge-loadable)"}

// Concurrent missers on a cold key share ONE compute through this inflight map - the check-then-set shape alone lets N simultaneous cold readers hammer.
const __kvInflight = new Map<string, Promise<unknown>>();
export async function $kv(key: string, compute: () => unknown | Promise<unknown>, ttlSeconds = 300): Promise<unknown> {
  const hit = kv.get(key);
  if (hit !== undefined) return hit;
  let p = __kvInflight.get(key);
  if (!p) {
    p = (async () => {
      const v = await compute();
      if (v !== undefined) kv.set(key, v, ttlSeconds);
      return v;
    })();
    __kvInflight.set(key, p);
    p.finally(() => { __kvInflight.delete(key); }).catch(() => {});
  }
  return p;
}
export function isCachedRoute(pathname: string): boolean {
  return routeClass(pathname).cache !== null;
}
export function invalidatePath(pathname: string): number {
  let n = 0;
  for (const key of [...__dynCache.keys()]) {
    if (key.startsWith(pathname + '|')) { __dynCache.delete(key); n++; }
  }
  return n;
}
// The render memo is a shared store, so its key has to name the whole
// representation: URL + cookie alone let one visitor's render be replayed to
// another for the entire memo TTL whenever the route negotiates on a request
// header - accept-language first (BUG.md AB), then whatever the route itself
// declared with export const hotVary. dims is the caller-built negotiation
// fingerprint (accept-language plus the declared headers); it folds in here.
function __dynKey(pathname: string, cookieHeader: string, search: string, dims: string): string {
  let h = 0x811c9dc5;
  const c = (cookieHeader || '') + '\\u0000' + (dims || '');
  for (let i = 0; i < c.length; i++) {
    h ^= c.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  // The query string is part of the cache key: routes like /search?q= or /archives?year= render different documents per query.
  return pathname + '|' + (search || '') + '|' + h.toString(16);
}
export function peekRenderCache(pathname: string, cookieHeader: string, search = '', dims = ''): ReturnType<typeof renderPage> | null {
  const cfg = routeClass(pathname).cache;
  if (!cfg) return null;
  const hit = __dynCache.get(__dynKey(pathname, cookieHeader, search, dims));
  return hit && hit.expires > Date.now() ? hit.page : null;
}
// NOTE : this memo caches renderPage's RETURN VALUE - pure HTML/state, NO
// set-cookie header (see the { html, state, head, status, ... } object at
// compiler/index.ts:5756). Set-Cookie is read only at the exit layer from the
// full Response ( list-header fix) and guarded at fillHot/refetchHot in
// , NOT here - there is nothing to guard in this layer. Do NOT add a
// set-cookie guard to this memo.
export async function renderPageCached(pathname: string, cookieHeader: string, search = '', dims = ''): Promise<ReturnType<typeof renderPage>> {
  const cfg = routeClass(pathname).cache;
  if (!cfg) return renderPage(pathname);
  const key = __dynKey(pathname, cookieHeader, search, dims);
  const hit = __dynCache.get(key);
  if (hit && hit.expires > Date.now()) {
    __dynCache.delete(key);
    __dynCache.set(key, hit);
    return hit.page;
  }
  // Stale-while-revalidate: an EXPIRED entry still answers instantly while one background render refreshes it - the TTL boundary never spikes.
  if (hit && !hit.refreshing) {
    hit.refreshing = true;
    // BUG.md A: this refresh runs AFTER the live response returned, so the module-global
    // requestQuery may already belong to a later request. Re-seed it from THIS entry's
    // search and restore the snapshot afterward, so the cached refresh reflects this query.
    const __q: Record<string, string> = {};
    new URLSearchParams(search || '').forEach((v, k) => { __q[k] = v; });
    const __prevQ = getRequestQuery();
    setRequestQuery(__q);
    renderPage(pathname).then((fresh: any) => {
      setRequestQuery(__prevQ);
      if (fresh.status === 200 && !fresh.redirect) {
        __dynCache.set(key, { page: fresh, expires: Date.now() + cfg.seconds * 1000 });
      } else {
        __dynCache.delete(key);
      }
    }).catch(() => { setRequestQuery(__prevQ); __dynCache.delete(key); });
    return hit.page;
  }
  // Miss: render with this request's query. The caller (edge/cli) already seeded
  // requestQuery; re-seed from the key's search so the cached entry stays self-consistent
  // even if a concurrent request overwrote the global during the await.
  const __q0: Record<string, string> = {};
  new URLSearchParams(search || '').forEach((v, k) => { __q0[k] = v; });
  setRequestQuery(__q0);
  const page = await renderPage(pathname);
  if (page.status === 200 && !page.redirect) {
    __dynCache.set(key, { page, expires: Date.now() + cfg.seconds * 1000 });
    if (__dynCache.size > 300) {
      __dynCache.delete(__dynCache.keys().next().value as string);
    }
  }
  return page;
}

// Pages/_middleware.rose: a Web-standard request handler that runs before every render on the server (pages, POSTs, api calls alike).
export const middleware = ${He>=0?"middlewareMod.handle ?? null":"null"};

// Routes whose DOCUMENTS ship without the client bundle ( decided by the compiler since #29): HTML + CSS only - no runtime, no state script.
export const noJsRoutes = [
  ${D.filter(({i:d})=>Ie(d)).map(({info:d})=>`'${d.pattern}'`).join(`,
  `)}
];

export function isNoJs(pathname) {
  return routeClass(pathname).noJs;
}

// P0-2 (bug report): routes that exported "buffer = true".
export function isBuffered(pathname) {
  return routeClass(pathname).buffered;
}


export const routeHeaders = [
  ${D.filter(({i:d})=>m[d].headers).map(({info:d,i:b})=>`{ pattern: '${d.pattern}', headers: ${JSON.stringify(m[b].headers)} }`).join(`,
  `)}
];

export function headersFor(pathname) {
  return routeClass(pathname).headers;
}


export const cspNonceRoutes = [
  ${D.filter(({i:d})=>m[d].cspNonce).map(({info:d})=>`'${d.routePath}'`).join(`,
  `)}
];

export function cspNonce(pathname) {
  return routeClass(pathname).nonce;
}

// A Web-standard Request from whatever the host provides: the edge adapter passes one already; the Node server passes its IncomingMessage (plus).
function toWebRequest(raw, form) {
  if (raw instanceof Request) return raw;
  const init = { method: raw.method || 'GET', headers: new Headers(raw.headers || {}) };
  if (form) init.body = form;
  let u = raw.url || '/';
  if (u.startsWith('http://') || u.startsWith('https://')) {
    try { const p = new URL(u); u = p.pathname + p.search; } catch { u = '/'; }
  }
  return new Request('http://' + (raw.headers?.host || 'localhost') + u, init);
}


// The visitor's address, resolved once per request: a Node socket peer, or the
// platform header an edge runtime leaves (see clientAddress in the runtime).
export { clientAddress, getContext };

export async function runMiddleware(rawReq, form) {
  resetRequestContext();
  if (!middleware || !rawReq) return null;
  const remote = clientAddress(rawReq);
  if (remote) getContext().remoteAddress = remote;
  const res = await middleware(toWebRequest(rawReq, form));
  return res || null;
}

const routes = [
  ${$t}
];

// API routes (pages/api/*.rose): pattern -> HTTP-method handlers. They never render HTML and never reach the client bundle.
const apiRoutes = [
  ${ee.map(({info:d,i:b})=>{let T=(m[b].apiMethods??[]).map(N=>`${N}: ${N}_${b}`).join(", ");return`{ pattern: '${d.pattern}', path: '${d.routePath}', handlers: { ${T} } }`}).join(`,
  `)}
];

// Not-found pages, deepest segment first: the root 404.rose ('/') and any
// pages/<seg>/_notfound.rose, each already composed with its layout chain.
// notFoundFor picks the nearest one up the path - an /admin miss answers
// the admin 404, a public miss the site's - and notFoundPage is the whole
// answer (real 404 status, or the built-in plain 404 when the app has none).
const notFoundRoutes = ${ae};
const notFoundFor = (pathname) => {
  for (const [prefix, render] of notFoundRoutes) {
    if (prefix === '/' || pathname === prefix || pathname.startsWith(prefix + '/')) return render;
  }
  return null;
};

const notFoundFlags = (pathname) => {
  for (const [prefix, render, flags] of notFoundRoutes) {
    if (prefix === '/' || pathname === prefix || pathname.startsWith(prefix + '/')) return flags || null;
  }
  return null;
};
const notFoundPage = async (pathname) => {
  const nf = notFoundFor(pathname);
  if (nf) {
    const flags = notFoundFlags(pathname) || {};
    // A zero-JS not-found document carries no state script (the shell drops it)
    const noJs = flags.csr === false;
    const page = await renderFallback(pathname, nf, noJs);
    // __notFound stamps the document so the client boot paints THIS route instead of re-rendering the matched one: a catch-all whose resolver threw.
    return { ...page, ...flags, status: 404, state: noJs ? '{}' : JSON.stringify({ __notFound: true, ...JSON.parse(page.state) }) };
  }
  return { html: '<h1>404</h1><p>Page not found</p>', state: JSON.stringify({ __route: pathname, __notFound: true }), head: [], status: 404, ...docAttrs(pathname) };
};


const errorPage = ${Oe};


export function docAttrs(pathname) {
  const c = routeClass(pathname);
  return { lang: c.lang, dir: c.dir };
}

// Paint a fallback page (404/500) and serialize its state.
async function renderFallback(pathname, render, noJs = false) {
  // Split mode: the not-found entry's render is a loader object \u2014resolve it through getRender (which memoizes the composed function) exactly like.
  let fn = render;
  if (typeof fn !== 'function' && fn && typeof fn.load === 'function') {
    
    fn = (await fn.load()).render;
  }
  const { html, head } = extractHead(await fn([], ''));
  const state = noJs ? '{}' : JSON.stringify({ __route: pathname, ...JSON.parse(serializeState()) });
  return { html, state, head, ...docAttrs(pathname) };
}

export function matchRoute(pattern, pathname) {
  // Q0 (bug report): one canonical URL per route.
  pathname = pathname.replace(/\\/+$/, '') || '/';
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');
  
  const last = patternParts[patternParts.length - 1];
  if (last && (last.startsWith('*') || last.startsWith('**'))) {
    const fixed = patternParts.slice(0, -1);
    if (pathParts.length < fixed.length) return false;
    if (last.startsWith('*') && !last.startsWith('**') && pathParts.length === fixed.length) return false;
    for (let i = 0; i < fixed.length; i++) {
      if (fixed[i].startsWith(':')) continue;
      if (fixed[i] !== pathParts[i]) return false;
    }
    return true;
  }
  if (patternParts.length !== pathParts.length) return false;
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) continue;
    if (patternParts[i] !== pathParts[i]) return false;
  }
  return true;
}

// Every predicate the servers ask before a render - canStream, isNoJs, isBuffered, shellOff, cspNonce, headersFor, docAttrs.
function routeClass(pathname) {
  let c = __routeClass.get(pathname);
  if (c) return c;
  let route = null;
  let stream = false;
  let buffered = false;
  let shell = false;
  let lang = defaultLocale;
  let dir = localeDir(defaultLocale);
  let first = true;
  for (const r of routes) {
    if (!matchRoute(r.pattern, pathname)) continue;
    if (route === null) route = r;
    if (r.shell === false) shell = true;
    if (r.buffer || r.signal) buffered = true;
    const langIdx = r.pattern.split('/').indexOf(':lang');
    if (langIdx < 0) {
      stream = true;
    } else if (isLocale(pathname.split('/')[langIdx])) {
      stream = true;
      // docAttrs answers from the FIRST matching route alone: its locale, or
      if (first) {
        const l = pathname.split('/')[langIdx];
        lang = l;
        dir = localeDir(l);
      }
    }
    first = false;
  }
  let noJs = false;
  for (const p of noJsRoutes) if (matchRoute(p, pathname)) { noJs = true; break; }
  let nonce = false;
  for (const p of cspNonceRoutes) if (matchRoute(p, pathname)) { nonce = true; break; }
  let headers = null;
  for (const r of routeHeaders) if (matchRoute(r.pattern, pathname)) { headers = r.headers; break; }
  let cache = null;
  for (const r of routeCaches) if (matchRoute(r.pattern, pathname)) { cache = r; break; }
  c = { route, stream, buffered, shell, noJs, nonce, headers, cache, lang, dir, slice: route ? (route.slice ?? null) : null };
  if (__routeClass.size >= 2000) {
    const oldest = __routeClass.keys().next().value;
    if (oldest !== undefined) __routeClass.delete(oldest);
  }
  __routeClass.set(pathname, c);
  return c;
}
const __routeClass = new Map();

// Sliced inline: which dist/slices/<key>.js this pathname's document inlines.
// null for a path that matches no route (the 404 document inlines the
// runtime-only core) and for a zero-JS route (no script at all). The CLI and
// the edge adapter ask this instead of re-deriving pattern -> file; the
// export's existence is also how the edge adapter detects sliced mode.
${Y?`export function sliceKeyFor(pathname) {
  return routeClass(pathname).slice;
}`:"// inline/split mode: no per-route bundle files exist"}

// Head blocks (one per component in the route chain) are pulled out of the page html: the shell injects them into <head>.
function extractHead(rendered) {
  const head = [];
  const html = rendered.replace(/<!--\u27E6h:(\\d+)\u27E7-->([\\s\\S]*?)<!--\u27E6\\/h:\\1\u27E7-->/g, (_, id, content) => {
    head.push(content);
    return '<!--\u27E6h:' + id + '\u27E7--><!--\u27E6/h:' + id + '\u27E7-->';
  });
  return { html, head };
}

// Form: the submitted FormData of a progressive-enhancement POST.
export async function renderPage(pathname, form, options) {
  // Renders DO overlap in one process: prod-server warms every route in the background at startup.
  return isolateRender(() => renderPageIsolated(pathname, form, options));
}

async function renderPageIsolated(pathname, form, options) {
  clearRequestState();
  // Cold-start readiness gate (Oboext #8): await the app's published DB-ready promise before any $data() read.
  const appReady = globalThis.__rosezmAppReady;
  if (appReady) await appReady;
  const route = routeClass(pathname).route;
  if (route) {
      const patternParts = route.pattern.split('/');
      const pathParts = pathname.split('/');
      for (let i = 0; i < patternParts.length; i++) {
        const seg = patternParts[i];
        if (seg.startsWith(':')) setState(seg.slice(1), pathParts[i]);
        
        else if (seg.startsWith('*')) setState(seg.replace(/^\\*+/, ''), pathParts.slice(i));
      }
 // I18n: a [lang] segment naming no dictionary is a 404 - the URL is the contract.
      const langIdx = patternParts.indexOf(':lang');
      if (langIdx >= 0 && !isLocale(pathParts[langIdx])) {
  
        return await notFoundPage(pathname);
      }
 
      const docLang = langIdx >= 0 ? pathParts[langIdx] : defaultLocale;
 // The action dispatch. The page's guard (exported beforeAction) runs FIRST and vetoes with an ActionError - the action-level permission check.
      let actionStatus = 0;
      if (form && route.actions) {
        const actionName = form.get('__action') || 'action';
        const fn = route.actions[actionName];
        if (fn) {
          try {
            if (route.guard) await route.guard(actionName, form);
            const patch = await fn(form);
            if (patch && typeof patch === 'object') {
              for (const key of Object.keys(patch)) {
                const v = patch[key];
                // An incremental patch is RECORDED, not applied: the render's own state declarations apply.
                if (v instanceof StateDelta) setStateDelta(key, v);
                else setState(key, v);
              }
            }
          } catch (err) {
            if (err instanceof ActionError) {
              setState('actionError', { action: actionName, message: err.message, code: err.code, field: err.field });
              actionStatus = err.code;
            } else if (err && err.__rosezm === 'redirect') {
              
              return { redirect: err.path, status: err.status ?? 303, ...docAttrs(pathname) };
            } else if (err && err.__rosezm === 'notFound') {
  
              return await notFoundPage(pathname);
            } else {
              throw err;
            }
          }
        }
      }
      let rendered;
      try {
        rendered = extractHead(await route.render([], ''));
      } catch (err) {
        // The control-flow pair: redirect() and notFound() are THROWN from inside the render (a $data body resolving a slug that no longer exists).
        const signal = err && err.__rosezm;
        if (signal === 'redirect') {
          return { redirect: err.path, status: err.status ?? 307, ...docAttrs(pathname) };
        }
        if (signal === 'notFound') {
          return await notFoundPage(pathname);
        }
        
        console.error('rosezm: render failed for', pathname, err instanceof Error ? err.message : err);
        // F10: in dev the response body carries the real error \u2014message, file:line and the fix hint.
        let devDetail = '';
        if (process.env.rosezm_DEV === '1' && err) {
          const msg = esc(err instanceof Error ? err.message : String(err));
          const file = esc(String(err.file || ''));
          const line = err.line != null ? esc(String(err.line)) : '';
          const hint = esc(String(err.hint || ''));
          const stack = esc(err instanceof Error ? (err.stack || '').split('\\n').slice(1, 7).join('\\n') : '');
          devDetail = '<div style="margin:24px auto;max-width:860px;font:13px/1.6 ui-monospace,monospace;background:#1b1b1f;color:#e6e6ea;border:1px solid #3a3a42;border-radius:10px;padding:20px 24px;text-align:left;white-space:pre-wrap;word-break:break-word">'
            + '<div style="font:600 15px/1.4 system-ui,sans-serif;color:#ff8b8b">Render failed: ' + esc(pathname) + '</div>'
            + '<div style="margin:10px 0 0;color:#ffd479">' + msg + '</div>'
            + (file ? '<div style="margin:6px 0 0;color:#9ad1ff">' + file + (line ? ':' + line : '') + '</div>' : '')
            + (hint ? '<div style="margin:10px 0 0;color:#9fe8b0">Fix: ' + hint + '</div>' : '')
            + (stack ? '<pre style="margin:12px 0 0;color:#8f8f9a">' + stack + '</pre>' : '')
            + '</div>';
        }
        if (errorPage) {
          // ErrorNoJs is a compile-time constant (see the errorNoJs declaration beside errorRender): a zero-JS site's 500 carries no state script.
          const fb = await renderFallback(pathname, errorPage, ${at});
          return { ...fb, html: fb.html + devDetail, status: 500${at?", csr: false":""} };
        }
        return { html: '<h1>500</h1><p>Something went wrong rendering this page.</p>' + devDetail, state: '{}', head: [], status: 500, ...docAttrs(pathname) };
      }
      // __route tells the bootstrap which route this document was rendered for.
    // A zero-JS route ships no state script - but a NATIVE client asking for the
    // JSON half of the render (the /__rosezm/data channel) still needs the values
    // its $data produced, so the withState option asks for them explicitly.
    const noJs = route.csr === false && !(options && options.withState);
    let state = '{}';
    if (!noJs || actionStatus !== 0) {
      const s = serializeState();
      state = '{"__route":' + JSON.stringify(pathname) + (s.length > 2 ? ',' + s.slice(1) : '}');
    }
 // Csr ( auto since #29): false when the compiler found nothing in the route's chain that needs the client (or the route asserted csr = false) .
      // AR (BUG.md): cookies a middleware or page collected via $setCookie ride
      // the render result so every server can merge them into the final
      // response headers - the seam that makes sliding session expiry work
      // without short-circuiting the render.
      const setCookies = (serializeRequestCookies() ?? []) as string[];
      return { html: rendered.html, state, head: rendered.head, setCookies, status: actionStatus || 200, csr: route.csr !== false, shell: route.shell !== false, lang: docLang, dir: localeDir(docLang) };
  }
  return await notFoundPage(pathname);
}

// Would renderPageStream handle this path? (matched route = stream, anything
export function canStream(pathname) {
  return routeClass(pathname).stream;
}


export function shellOff(pathname) {
  return routeClass(pathname).shell;
}

// === API routes === The /api namespace answers JSON, never HTML: an API client that hits an unknown path must not receive the SPA shell.
export function isApi(pathname) {
  return pathname === '/api' || pathname.startsWith('/api/');
}

function toResponse(out) {
  if (out instanceof Response) return out;
  if (out === undefined || out === null) return new Response(null, { status: 204 });
  return new Response(JSON.stringify(out), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

export async function handleApi(method, pathname, request) {
  for (const route of apiRoutes) {
    if (matchRoute(route.pattern, pathname)) {
      // HEAD answers like GET with the body dropped by the host, which is the
      // HTTP contract every static server here already honors. It used to 405
      // on every route that only exported GET - the one method a health
      // check, an uptime monitor or a head-of-request probe actually sends.
      const verb = method === 'HEAD' && !route.handlers.HEAD ? 'GET' : method;
      // hasOwn, not a bare index: the handlers table is an object literal, so a
      // request line naming constructor, toString or valueOf used to find
      // Object.prototype's member and CALL it as the handler - a 200 whose
      // body was the prototype's return value, or a TypeError from the
      // dispatch. Not reachable through Node's HTTP parser (it rejects those
      // methods), but the edge adapter and rosezm/test pass the method through.
      const fn = Object.prototype.hasOwnProperty.call(route.handlers, verb) ? route.handlers[verb] : null;
      if (!fn) {
        return new Response(JSON.stringify({ error: 'method not allowed' }), {
          status: 405,
          headers: { 'content-type': 'application/json', allow: Object.keys(route.handlers).join(', ') },
        });
      }
      // A dynamic segment's value reaches the handler through the request
      // context: getContext().params.id for pages/api/posts/[id].rose. The
      // pattern MATCHED before, but the captured value went nowhere - the
      // docs promised "dynamic segments work", and a handler that cannot
      // read its own param is a 200-shaped lie. The bag is per-request
      // (the servers run each request in its own context scope), so this
      // cannot leak across requests.
      try {
        const patternParts = route.pattern.split('/');
        const pathParts = pathname.split('/');
        const params = {};
        for (let i = 0; i < patternParts.length && i < pathParts.length; i++) {
          const seg = patternParts[i];
          if (seg.startsWith(':')) params[seg.slice(1)] = decodeURIComponent(pathParts[i]);
          else if (seg.startsWith('*')) params[seg.replace(/^\\*+/, '')] = pathParts.slice(i).map(decodeURIComponent);
        }
        // The bag must describe THIS request: a host without a context store
        // (the edge adapter, rosezm/test) reuses one module-level object, so a
        // static route used to inherit the previous request's params - a
        // /api/posts/42 call made /api/health report an id it was never sent.
        // Assigning (rather than only when non-empty) drops the stale value.
        getContext().params = params;
        getContext().url = pathname + (new URL(request.url).search || '');
      } catch { /* a malformed segment must not kill the dispatch */ }
      try {
        // HEAD runs the GET handler and returns its Response untouched: the
        // host drops the body, and the headers a HEAD must report (the app's
        // own, plus the framework ETag the exit derives from the bytes) stay
        // exactly those of the GET. Returning an empty body here instead would
        // hand the caller a response with no validator at all.
        return toResponse(await fn(request));
      } catch (err) {
        
        const signal = err && err.__rosezm;
        if (signal === 'redirect') {
          return new Response(JSON.stringify({ error: 'redirect', location: err.path }), {
            status: err.status ?? 307,
            headers: { 'content-type': 'application/json', location: err.path },
          });
        }
        if (signal === 'notFound') {
          return new Response(JSON.stringify({ error: 'not found' }), {
            status: 404,
            headers: { 'content-type': 'application/json' },
          });
        }
        throw err;
      }
    }
  }
  return new Response(JSON.stringify({ error: 'not found' }), {
    status: 404,
    headers: { 'content-type': 'application/json' },
  });
}

// BC: $data (and any server code) may call fetch('/api/...') with a RELATIVE
// url. Node's fetch needs an absolute one, so every such call used to throw
// and push pages into middleware-preload workarounds. Route the relative call
// to this bundle's own handleApi: same process, the calling request's context
// (its bag rides along), zero network. An absolute url keeps the platform
// fetch. The context's params/url are saved around the dispatch - the api
// handler writes its own, and the page's must still be there when the await
// returns. Symbol.for keeps a dev hot-reload from stacking the wrapper: every
// reload re-patches onto the one true native fetch, never onto the last patch.
const __NATIVE_FETCH = Symbol.for('rosezm.nativeFetch');
if (!globalThis[__NATIVE_FETCH]) globalThis[__NATIVE_FETCH] = globalThis.fetch.bind(globalThis);
globalThis.fetch = async (input, init) => {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.pathname + input.search : '';
  if (!raw.startsWith('/api/') && raw !== '/api') return globalThis[__NATIVE_FETCH](input, init);
  let req;
  try {
    req = new Request('http://rosezm.internal' + raw, init);
  } catch {
    return globalThis[__NATIVE_FETCH](input, init);
  }
  const u = new URL(req.url);
  let ctx = null;
  try { ctx = getContext(); } catch { /* no context store (edge/test) - fine */ }
  const savedParams = ctx?.params;
  const savedUrl = ctx?.url;
  try {
    return await handleApi((init?.method ?? 'GET').toUpperCase(), u.pathname, req);
  } finally {
    if (ctx) { ctx.params = savedParams; ctx.url = savedUrl; }
  }
};

// A default export the platform runtimes accept. Vercel's Node runtime scans
// the bundle and refuses an entry whose default is not a function or an
// http.Server (BUG-009: the refusal named /var/task/server.js - THIS file).
// The floor answers GET documents through the same render the Node server
// uses; the full protocol - streaming, server actions, api dispatch, per-route
// headers - remains prod.mjs / rosezm serve, or the deploy/api entry, which
// wraps this bundle's named exports through the edge adapter.
export default async function rosezmNodeEntry(req, res) {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      res.setHeader('allow', 'GET, HEAD');
      res.end('<h1>405</h1><p>This bare entry answers documents only - run rosezm serve for the full protocol.</p>');
      return;
    }
    const page = await renderPage(url.pathname);
    if (page.redirect) {
      res.statusCode = page.status ?? 302;
      res.setHeader('location', page.redirect);
      res.end();
      return;
    }
    res.statusCode = page.status ?? 200;
    res.setHeader('content-type', 'text/html; charset=utf-8');
    const attrs = (page.lang ? ' lang="' + page.lang + '"' : '') + (page.dir ? ' dir="' + page.dir + '"' : '');
    res.end('<!DOCTYPE html><html' + attrs + '><head>' + (page.head ?? []).join('') + '</head><body><div id="app">' + page.html + '</div><script id="__rosezm_state" type="application/json">' + (page.state ?? '{}').replace(/</g, '\\u003c') + '</script></body></html>');
  } catch {
    res.statusCode = 500;
    res.end('<h1>500</h1><p>Page not rendered</p>');
  }
}

// === Streaming SSR === The static shell (doctype, <head>, body + container open) flushes BEFORE the - possibly slow - render completes: the first byte.
export async function renderPageStream(pathname, write, shellOpen, clientTag) {
  // Isolated for the same reason as renderPage: a streaming render awaits inside route.render()
  return isolateRender(() => renderPageStreamIsolated(pathname, write, shellOpen, clientTag));
}

async function renderPageStreamIsolated(pathname, write, shellOpen, clientTag) {
  clearRequestState();
  // Cold-start readiness gate (Oboext #8): same contract as renderPage \u2014await the app's published DB-ready promise before streaming the shell.
  const appReady = globalThis.__rosezmAppReady;
  if (appReady) await appReady;
  const route = routeClass(pathname).route;
  if (route) {
      const patternParts = route.pattern.split('/');
      const pathParts = pathname.split('/');
      for (let i = 0; i < patternParts.length; i++) {
        const seg = patternParts[i];
        if (seg.startsWith(':')) setState(seg.slice(1), pathParts[i]);
        
        else if (seg.startsWith('*')) setState(seg.replace(/^\\*+/, ''), pathParts.slice(i));
      }
      // i18n: an unknown locale must 404 BEFORE the shell flushes - a
      const langIdx = patternParts.indexOf(':lang');
      if (langIdx >= 0 && !isLocale(pathParts[langIdx])) return 404;
      write(shellOpen);
      let html;
      try {
        // nonce routes: an un-nonced inline <style> would be CSP-blocked, so strip to markers (applyHead re-injects under the nonce). Otherwise keep the head content in the streamed body so page/layout <style> applies on first paint (no FOUC) and no-JS routes stay styled.
        html = routeClass(pathname).nonce ? extractHead(await route.render([], '')).html : await route.render([], '');
      } catch (err) {
        console.error('rosezm: render failed for', pathname, err instanceof Error ? err.message : err);
        // F10: dev carries the real error in the body here too \u2014the shell
        let devDetail = '';
        if (process.env.rosezm_DEV === '1' && err) {
          const msg = esc(err instanceof Error ? err.message : String(err));
          const file = esc(String(err.file || ''));
          const line = err.line != null ? esc(String(err.line)) : '';
          const hint = esc(String(err.hint || ''));
          const stack = esc(err instanceof Error ? (err.stack || '').split('\\n').slice(1, 7).join('\\n') : '');
          devDetail = '<div style="margin:24px auto;max-width:860px;font:13px/1.6 ui-monospace,monospace;background:#1b1b1f;color:#e6e6ea;border:1px solid #3a3a42;border-radius:10px;padding:20px 24px;text-align:left;white-space:pre-wrap;word-break:break-word">'
            + '<div style="font:600 15px/1.4 system-ui,sans-serif;color:#ff8b8b">Render failed: ' + esc(pathname) + '</div>'
            + '<div style="margin:10px 0 0;color:#ffd479">' + msg + '</div>'
            + (file ? '<div style="margin:6px 0 0;color:#9ad1ff">' + file + (line ? ':' + line : '') + '</div>' : '')
            + (hint ? '<div style="margin:10px 0 0;color:#9fe8b0">Fix: ' + hint + '</div>' : '')
            + (stack ? '<pre style="margin:12px 0 0;color:#8f8f9a">' + stack + '</pre>' : '')
            + '</div>';
        }
        html = errorPage ? (routeClass(pathname).nonce ? extractHead(await errorPage([], '')).html : await errorPage([], '')) + devDetail : '<h1>500</h1><p>Something went wrong rendering this page.</p>' + devDetail;
      }
      write(html);
 // Csr: false ( auto since #29): a no-JS route's document ends here - no state script, no inlined bundle.
      if (route.csr === false) {
        write('</div>\\n</body>\\n</html>');
        return 200;
      }
      const state = JSON.stringify({ __route: pathname, ...JSON.parse(serializeState()) });
      // P1-6 (bug report): the JSON data block is embedded in the document.
      const stateSafe = state.replace(/</g, '\\\\u003c');
      write('</div>\\n  <script type="application/json" id="__rosezm_state">' + stateSafe + '</script>\\n  ' + clientTag + '\\n</body>\\n</html>');
      return 200;
  }
  return 404;
}
// Prevent tree-shaking of invalidateRenderCache (called from prod-server.ts / edge.ts on non-GET writes).
void invalidateRenderCache;

// Same reason, for the per-request context store: prod-server.ts installs an AsyncLocalStorage adapter.
export { installContextStore };
`;try{let d=[...D,...ee].map(({info:we})=>we.pattern),b=[...new Set(d)].sort(),T=b.map(we=>JSON.stringify(we)).join(" | ")||"'/'",N=we=>(we.match(/:[\w]+|\*\*[\w]+|\*[\w]+/g)??[]).map(ke=>ke.replace(/^[*:]+/,"")),F=b.map(we=>{let ke=N(we);return ke.length?"  "+JSON.stringify(we)+": { "+ke.map(le=>le+": string | number").join("; ")+` };
`:""}).join(""),P=x.join(t,"src",".rosezm");await C.promises.mkdir(P,{recursive:!0});let S=["// GENERATED by rosezm build - do not edit.","export type RoutePath = "+T+";","export const routePatterns = "+JSON.stringify(b)+" as const;","export type RouteParams = {",F,"};","/** Build a URL from a route pattern and its params. */","export function url(","  path: RoutePath,","  params: RouteParams[keyof RouteParams] = {} as never,","): string {","  let out = path as string;","  for (const [k, v] of Object.entries(params as Record<string, string | number>)) {","    out = out.replace(new RegExp('[:*]+' + k, 'g'), String(v));","  }","  return out;","}"].join(`
`)+`
`,V=x.join(P,"routes.ts");try{await C.promises.readFile(V,"utf8")!==S&&await C.promises.writeFile(V,S)}catch{await C.promises.writeFile(V,S)}}catch{}await C.promises.writeFile(x.join(L,"server-entry.js"),fn),await he;let Pt=nt(x.join(L,"server-entry.js"),{entryPoints:[x.join(L,"server-entry.js")],bundle:!0,outfile:x.join(r,h?"engine.js":"server.js"),format:"esm",platform:"node",write:!0,...dt,...i?{minify:!0,keepNames:!0}:{}},o);Pt.catch(()=>{}),n.cjs&&(Be.push(nt(x.join(L,"server-entry.js"),{entryPoints:[x.join(L,"server-entry.js")],bundle:!0,outfile:x.join(r,"server.cjs"),format:"cjs",platform:"node",write:!0,...dt,...i?{minify:!0,keepNames:!0}:{}},o)),Be[Be.length-1].catch(()=>{}));let xt=m.map((d,b)=>({i:b})).filter(({i:d})=>!l[d].isApi&&!l[d].isMiddleware&&R.has(d)).map(({i:d})=>`import { render as render_${d} } from './comp-${d}.client.js';`).join(`
`),In=ie||Y?"":xt,We=ie?D.map(({info:d,i:b})=>`{ pattern: '${d.pattern}', ${Je(b)} }`).join(`,
  `):D.map(({info:d,i:b})=>`{ pattern: '${d.pattern}', render: ${te(b)} }`).join(`,
  `),Zt=d=>`load: () => __navRoute(${JSON.stringify(d)})`,vt=d=>{let b=d===null?null:new Set(Le(d)),T=[Y?`import { ${ue.join(", ")} } from './runtime.js';`:"",b?m.map((F,P)=>({i:P})).filter(({i:F})=>b.has(F)&&!l[F].isApi&&!l[F].isMiddleware&&R.has(F)).map(({i:F})=>`import { render as render_${F} } from './comp-${F}.client.js';`).join(`
`):""].filter(Boolean).join(`
`),N=D.map(({info:F,i:P})=>d!==null&&P===d?`{ pattern: '${F.pattern}', render: ${te(P)} }`:`{ pattern: '${F.pattern}', ${Zt(F.pattern)} }`).join(`,
  `);return{imports:T,routes:N}},Xt=`[
${Ge.map(d=>`  ['${d.prefix}', { load: () => __navNotFound(${JSON.stringify(d.prefix)}) }${d.flags}],`).join(`
`)}
]`,pn=Ee>=0?"{ load: () => __navError() }":"null",gn=m.find(d=>d.prefetch)?.prefetch??"all",Nt=m.find(d=>d.lazyHydration)?.lazyHydration??!1,lt=m.some(d=>d.vitals===!0),Mt=lt?`


reportVitals();
`:"",qe=l.some(d=>d.pattern.includes(":lang")),ze=qe?`      
      
      
      
      
 
      // (dist/mount.js) renders into a foreign page, whose language and
      
      const seg = langIdx >= 0 ? pathname.split('/')[langIdx] : '';
      const known = !seg || isLocale(seg);
      if (container === document.getElementById('app')) {
        const docLang = known && seg ? seg : __defLocale;
        document.documentElement.lang = docLang;
        const docDir = localeDir(docLang);
        if (docDir) document.documentElement.setAttribute('dir', docDir);
        else document.documentElement.removeAttribute('dir');
      }
      if (!known) {`:"      if (langIdx >= 0 && !isLocale(pathname.split('/')[langIdx])) {",Ye=d=>`
${d.imports}
import { state, setState, resumeState, clearRequestState, resetEffects, wire, isolateStateAsync, restoreState, setRefreshHook, clearMounts, flushMounts, adoptCleanups, handlers, setActionDispatcher, setLocales, setLocalePacks, ensureLocale, isLocale, localeDir, setPrefetchOverride, serializeState, setFxOwner, resetContainerFx, clearHead, esc, applyStorePatch } from './runtime.js';
${d.publish}
${m.some(b=>b.usesStore)?`
// Live store channel: an app that reads a shared $store() keeps one EventSource to
// /__rosezm_store. A server-side write ($store.set/update from a network listener,
// a job, or an action) is pushed here as an {name,value} patch; applyStorePatch
// writes it into the reactive store box, re-running the wire() effects that render
// {store.get()} / {#each store.get()}. No store in the app - no connection.
if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
  try {
    var __storeEs = new EventSource('/__rosezm_store');
    __storeEs.addEventListener('store', function (m) {
      try { var p = JSON.parse(m.data); applyStorePatch(p.name, p.value); } catch (e) {}
    });
  } catch (e) {}
}`:""}

// I18n: the dictionaries baked at build time - the client renders any PRELOADED locale from the bundle.
setLocales(${Re}, '${M}');
setLocalePacks(${JSON.stringify(ce)});
${qe?`// the default locale, kept beside setLocales' own copy so <html lang> can
// follow a route that carries no [lang] segment (a non-i18n page)
const __defLocale = '${M}';`:""}
${lt?`// the app asked for web-vitals. The import is what keeps
// reportVitals alive through minification and tree-shaking; the call is one
// statement at boot, before the first render.
import { reportVitals } from './runtime.js';`:""}
// Lazy hydration: when the app opts in (export const lazyHydration = true in
// the root _layout.rose), the bootstrap defers the initial wire() to
// requestIdleCallback. The flag is set here (module eval runs before the
// bootstrap's start() call) so the bootstrap can read it without a second channel.
if (typeof window !== 'undefined') window.__rosezmLazy = ${JSON.stringify(Nt)};
${Ot}
// The two pack doors, re-exported for an app that wants to warm a language before its visitor asks for it (ensureLocale) or to feed a dictionary.
export { ensureLocale, loadLocale } from './runtime.js';
${d.prefetchDoor}
${Mt}
${d.nav}
// BL: a _middleware.rose only ran on the server, so a wall (an auth check
// answering 302) vanished the moment a visitor navigated CLIENT-SIDE - the
// admin shell painted right there in the browser. When the app HAS a
// middleware, start() asks the server's gate for the target route first: one
// few-byte JSON request, no render, and a redirect is honoured by a full
// navigation (where the middleware fires for real). Apps without a middleware
// get false and keep the old path - no extra request.
const __hasMiddleware = ${He>=0?"true":"false"};
// The middleware's declared walls (export const gated = [...] in
// _middleware.rose), baked at build time. Empty = the middleware can wall
// anything and only it knows - the client asks the gate on every navigation.
const __gatedPrefixes = ${JSON.stringify(wt)};
const routes = [
  ${d.routes}
];

// === Mode B: lazy route chunks === Split mode's registry entries arrive without a render function: loadChain loads the route's module graph (the page).
const loadChain = async (loaders) => {
  const mods = await Promise.all(loaders.map((load) => load()));
  let expr = (closes, children) => mods[0].render(closes, children);
  for (let k = 1; k < mods.length; k++) {
    const inner = expr;
    const outer = mods[k].render;
    expr = async (closes, children) => await outer(closes, await inner(closes, children));
  }
  return { render: expr };
};
const getRender = async (route) => {
  if (typeof route === 'function') return route; 
  // inline mode: the render itself
  return (route.render ??= (await route.load()).render);
};

// Not-found pages, deepest segment first (the server's table, client half): the root 404.rose ('/') and any pages/<seg>/_notfound.rose.
const notFoundRoutes = ${d.notFoundTable};
const notFoundFor = (pathname) => {
  for (const [prefix, render] of notFoundRoutes) {
    if (prefix === '/' || pathname === prefix || pathname.startsWith(prefix + '/')) return render;
  }
  return null;
};

// whose render throws degrades to this instead of failing the response.
const errorPage = ${d.errorRender};

// Paint a fallback page (404/500) into the container, wired like any render.
async function paintFallback(container, page, builtin, keepState = false) {
  if (!keepState) __navReset(container);
  clearMounts(); 
  // a failed render leaves stale mounts behind
  const render = page ? await getRender(page) : null;
  if (render) {
        // a packed locale's dictionary lands before the render
    const closes = [];
    await __withOwner(container, async () => {
        
      const html = await render(closes, '');
      container.innerHTML = html;
      wire(container, closes);
      bindEvents(container);
      flushMounts();
    });
        
    return;
  }
  container.innerHTML = builtin;
}


export async function startNotFound(container, pathname) {
  const el = document.getElementById('__rosezm_state');
  if (el) resumeState(el.textContent);
  await paintFallback(container, notFoundFor(pathname), '<h1>404</h1><p>Page not found</p>', true);
}

export function matchRoute(pattern, pathname) {
  // Q0 (bug report): one canonical URL per route.
  pathname = pathname.replace(/\\/+$/, '') || '/';
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');
  
  const last = patternParts[patternParts.length - 1];
  if (last && (last.startsWith('*') || last.startsWith('**'))) {
    const fixed = patternParts.slice(0, -1);
    if (pathParts.length < fixed.length) return false;
    if (last.startsWith('*') && !last.startsWith('**') && pathParts.length === fixed.length) return false;
    for (let i = 0; i < fixed.length; i++) {
      if (fixed[i].startsWith(':')) continue;
      if (fixed[i] !== pathParts[i]) return false;
    }
    return true;
  }
  if (patternParts.length !== pathParts.length) return false;
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) continue;
    if (patternParts[i] !== pathParts[i]) return false;
  }
  return true;
}

// === Link prefetch === Hover / focus / touch an internal link and the target route renders NOW - $data included - against a throwaway signal map.
let prefetchMode = ${JSON.stringify(gn)};
export function setPrefetchMode(mode) { prefetchMode = mode; }
const PREFETCH_BUDGET = 8;
const PREFETCH_MAX_CACHED = 4;
const prefetchCache = new Map(); 

let prefetchQueue = Promise.resolve();
let prefetchPending = 0;


async function applyParams(route, pathname) {
  const patternParts = route.pattern.split('/');
  const pathParts = pathname.split('/');
  for (let i = 0; i < patternParts.length; i++) {
    const seg = patternParts[i];
    if (seg.startsWith(':')) setState(seg.slice(1), pathParts[i]);
        
    else if (seg.startsWith('*')) setState(seg.replace(/^\\*+/, ''), pathParts.slice(i));
  }
      // streamed response cannot change its status afterwards
  const langIdx = patternParts.indexOf(':lang');
  if (langIdx >= 0) await ensureLocale(pathParts[langIdx]);
}


function __netOk() {
  const c = navigator.connection;
  if (!c) return true;
  if (c.saveData) return false;
  const t = c.effectiveType;
  return t !== 'slow-2g' && t !== '2g';
}

export function prefetch(pathname, source = 'hover') {
  if (prefetchMode === 'off') return;
  if (prefetchMode === 'hover' && source !== 'hover') return;
  if (prefetchMode === 'viewport' && source !== 'viewport') return;
  if (!__netOk()) return; 
  // save-data / 2g: no bytes before the click
  if (prefetchCache.has(pathname)) return;
  if (pathname === location.pathname) return; 
  
  const route = routes.find((r) => matchRoute(r.pattern, pathname));
  if (!route) return;
  if (prefetchPending >= PREFETCH_BUDGET) return; 
  // Budget spent: drop it, a later hover retries P0-1: the link may carry a query (/search?q=cats).
  const qi = pathname.indexOf('?');
  const qOverride = qi >= 0 ? Object.fromEntries(new URLSearchParams(pathname.slice(qi))) : null;
  const p = prefetchQueue.then(async () => {
    try {
      setPrefetchOverride(qOverride);
      // The isolated render also captures the onMount callbacks the route queued and the onCleanup disposers it registered: the paint that consumes.
      const { result, state, mounts, cleanups } = await isolateStateAsync(async () => {
        await applyParams(route, pathname); 
        const closes = [];
        const render = await getRender(route); 
        const html = await render(closes, '');
        return { html, closes };
      });
      const entry = { ...result, state, mounts, cleanups };
      prefetchCache.set(pathname, entry); 
      // Promise -> result evict oldest-first; in-flight promises are never evicted (evicting one would only force a duplicate render)
      while (prefetchCache.size > PREFETCH_MAX_CACHED) {
        const oldest = prefetchCache.keys().next().value;
        if (prefetchCache.get(oldest) instanceof Promise) break;
        prefetchCache.delete(oldest);
      }
      return entry;
    } catch {
      prefetchCache.delete(pathname); 
      return null;
    } finally {
      setPrefetchOverride(null);
      prefetchPending--;
    }
  });
  prefetchPending++;
  prefetchCache.set(pathname, p);
  prefetchQueue = p;
}

export function prefetchStats() {
  return { cached: prefetchCache.size, pending: prefetchPending, mode: prefetchMode, network: __netOk() };
}

// One delegated listener per event type on the app container: survives DOM swaps and cloned blocks, so handlers never need re-binding.
const DELEGATED = ['click', 'input', 'change', 'submit'];
function bindEvents(container) {
  if (container.__rosezm_bound) return;
  container.__rosezm_bound = true;
  for (const ev of DELEGATED) {
    container.addEventListener(ev, (e) => {
      const el = e.target.closest('[data-on-' + ev + ']');
      if (!el || !container.contains(el)) return;
      const fn = el.getAttribute('data-on-' + ev);
      // CM-04: currentTarget is the element the LISTENER sits on (#app) under
      // delegation, so every e.currentTarget.dataset.* read in a handler saw
      // the app root. Redefine it to the element the handler is BOUND to -
      // which is what the name promises and what the web page's own
      // addEventListener would have delivered.
      Object.defineProperty(e, 'currentTarget', { value: el, configurable: true });
      if (fn.startsWith('$action:')) return $action(fn.slice(8), e);
      const h = handlers[fn];
      if (h) h(e);
    });
  }
}

// === Server actions from any event === POST the body to the current route and adopt the response in place: the server runs the selected action.
async function postForm(body, container, pathname) {
 
  const box = container || document.getElementById('app');
  const route = pathname || location.pathname;
  const res = await fetch(route, { method: 'POST', body });
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const next = doc.getElementById('app');
  const st = doc.getElementById('__rosezm_state');
  const paint = () => {
    adopt(box, next ? next.innerHTML : '', st ? st.textContent : '{}', route);
  };
  if (document.startViewTransition) document.startViewTransition(paint);
  else paint();
}

// Call a page's server action by name from any event handler: <button on:click={like}> compiles to $action('like').
export async function $action(name, e) {
  if (e && e.preventDefault) e.preventDefault();
  // F34: the pending flag is ordinary signal state - {#if $actionPending()}
  const [__rvPending, __rvSetPending] = state('actionPending', false);
  __rvSetPending(true);
  const body = new FormData();
  body.append('__action', name);
 // An event inside a mount belongs to that mount - the attribute is kept in step with what is currently mounted.
  const box = e && e.target && e.target.closest ? e.target.closest('[data-rosezm]') : null;
  try {
    return await postForm(body, box || undefined, box ? box.getAttribute('data-rosezm') : undefined);
  } finally {
    __rvSetPending(false);
  }
}
// F17: hand the dispatcher to the runtime, so wire() can serve a server action bound to a non-delegated event (on:keydown="$action:save") the same way.
setActionDispatcher($action);

export { postForm };

// The live signal graph as JSON - the same serializeState the zero-hydration resume uses.
export { serializeState };


// Initial=true: adopt the SSR DOM (zero hydration) - wire reactive markers to the existing nodes and bind events.
function __ownsDoc(container) {
  return container === document.getElementById('app');
}
function __navReset(container) {
  if (__ownsDoc(container)) {
    resetEffects();
    clearRequestState();
    // BH : the head being cleared here belongs to the route we are
    // leaving. wire() no longer clears on a route with no head markers - on
    // first paint those markers may be absent while the head is real.
    clearHead();
  } else {
    resetContainerFx(container);
  }
}
// Attribute everything a render creates (state keys, effects, onCleanups) to
async function __withOwner(container, fn) {
  if (__ownsDoc(container)) return fn();
  setFxOwner(container);
  try {
    return await fn();
  } finally {
    setFxOwner(null);
  }
}
// View Transition on SPA swaps (B9): the DOM swap rides one cross-fade when the browser supports it; reduced-motion users and environments without.
async function __swap(container, html) {
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof document.startViewTransition === 'function' && !reduce) {
    const vt = document.startViewTransition(() => { container.innerHTML = html; });
    await vt.updateCallbackDone.catch(() => {});
  } else {
    container.innerHTML = html;
  }
}

export async function start(container, pathname, initial, skipGate) {
  clearMounts(); 
  // stale mounts from a failed render never fire
  // App-level onLaunch (src/app.rose): exactly once per page load, after the
  // state resumes but before the first render of any route.
  if (typeof __appLaunch === 'function' && !__appLaunched) {
    __appLaunched = true;
    try { await __appLaunch({ path: pathname }); } catch (e) { console.error('rosezm: app onLaunch failed', e); }
  }
  if (initial) {
    const el = document.getElementById('__rosezm_state');
    if (el) resumeState(el.textContent);
  }
  // The server is the only place a middleware runs, so a client-side
  // navigation asks its gate before painting anything. The answer is tiny
  // ({"redirect":...} or 204) - the gate never renders a document.
  // A middleware that declares its walls ('export const gated = ["/admin"]'
  // in _middleware.rose) lets a target OUTSIDE every prefix skip the request
  // entirely - the zero-request navigation, restored. Inside one, or with no
  // list at all, the gate is asked as before.
  if (__hasMiddleware && !initial && !skipGate) {
    const needsGate = !__gatedPrefixes.length || __gatedPrefixes.some((p) => p === '/' || pathname === p || pathname.startsWith(p + '/'));
    if (needsGate) {
    let gate = null;
    try {
      const r = await fetch('/__rosezm/gate?path=' + encodeURIComponent(pathname), { headers: { accept: 'application/json' } });
      // A static deploy has no middleware and answers 404 here: nothing to
      // gate, render from the bundle exactly as before.
      if (r.ok) gate = await r.json().catch(() => null);
      else if (r.status === 401 || r.status === 403) { location.href = pathname; return; }
    } catch { /* offline or the server is gone: render locally */ }
    if (gate && typeof gate.redirect === 'string' && gate.redirect) { location.href = gate.redirect; return; }
    // A wall that answers a bare status (no Location) still refused: let the
    // server paint its own answer instead of rendering the gated route here.
    if (gate && (gate.status === 401 || gate.status === 403)) { location.href = pathname; return; }
    }
  }
  for (const route of routes) {
    if (matchRoute(route.pattern, pathname)) {
      // I18n: an unknown locale paints the 404 page, same as the server (before the prefetch check: a cached entry for a bogus locale is discarded).
      const langIdx = route.pattern.split('/').indexOf(':lang');
${ze}
        
        await paintFallback(container, notFoundFor(pathname), '<h1>404</h1><p>Page not found</p>');
          
        return;
      }
      // Prefetched on hover/focus/touch: the render already ran, so paint its HTML and adopt its signal entries - events then patch the very nodes we.
      let hit = initial ? undefined : prefetchCache.get(pathname);
      if (hit && typeof hit.then === 'function') hit = await hit; 
      // in-flight: land it first
      if (hit) {
        prefetchCache.delete(pathname); 
        
        __navReset(container);
        restoreState(hit.state);
        await __swap(container, hit.html);
        await __withOwner(container, () => {
          wire(container, hit.closes);
          bindEvents(container);
          hit.mounts.forEach((fn) => fn()); 
          adoptCleanups(hit.cleanups); 
        });
          
        return;
      }
      if (!initial) __navReset(container);
      let broken = false;
      let signal = null;
      await __withOwner(container, async () => {
        await applyParams(route, pathname);
        const closes = [];
        let html;
        try {
          const render = await getRender(route); 
          
          html = await render(closes, '');
        } catch (err) {
          
          if (err && err.__rosezm === 'notFound') { signal = 'notFound'; return; }
          if (err && err.__rosezm === 'redirect') { signal = err.path; return; }
          
          console.error('rosezm: client render failed for', pathname, err instanceof Error ? err.message : err);
          broken = true;
          return;
        }
        if (!initial) await __swap(container, html);
        wire(container, closes);
        bindEvents(container);
        flushMounts();
      });
      if (signal === 'notFound') {
        if (!initial) { try { location.assign(pathname); return; } catch {  } }
        await paintFallback(container, notFoundFor(pathname), '<h1>404</h1><p>Page not found</p>');
        return;
      }
      if (signal) {
        location.href = signal; 
        return;
      }
      if (broken) {
        await paintFallback(container, errorPage, '<h1>500</h1><p>Something went wrong rendering this page.</p>');
      }
      return;
    }
  }
  // Unmatched route: the nearest not-found page renders (with its head + interactivity) - a segment's _notfound.rose or the root 404.rose - else //.
${qe?` // the same app-root gate as above - a mount never touches the
  // host document's language or direction.
  if (container === document.getElementById('app')) {
    document.documentElement.lang = __defLocale;
    document.documentElement.removeAttribute('dir');
  }`:""}
  await paintFallback(container, notFoundFor(pathname), '<h1>404</h1><p>Page not found</p>');
}

// Adopt a server-rendered response in place - the JS-enabled half of progressive-enhancement forms: the bootstrap POSTs a <form method="POST">.
export async function adopt(container, html, stateJson, pathname) {
 
  const route0 = pathname || location.pathname;
  __navReset(container);
  clearMounts(); 
  // stale mounts from a failed render never fire
  resumeState(stateJson);
  container.innerHTML = html;
  
  const st = document.getElementById('__rosezm_state');
  if (st) st.textContent = stateJson;
  for (const route of routes) {
    if (matchRoute(route.pattern, route0)) {
      await __withOwner(container, async () => {
        await applyParams(route, route0);
        const closes = [];
        try {
          const render = await getRender(route); 
          
          await render(closes, '');
        } catch {
          return;
        }
        wire(container, closes);
        bindEvents(container);
        flushMounts();
      });
      return;
    }
  }
}
// === refresh() implementation === Re-render the current route in place: the client half of router.refresh() (a router refresh) / (a full invalidation).
setRefreshHook(async () => {
  prefetchCache.delete(location.pathname);
  // skipGate: this route is the one the document already passed the gate for -
  // a refresh must cost zero requests (the render runs in the page).
  await start(document.getElementById('app'), location.pathname, false, true);
});
`,Qt=Y?`
// === Sliced mode: the runtime bridge === The routes this document did NOT
// inline ride the shared nav chunk, whose components resolve the runtime
// through this object instead of bundling a second copy. Published before any
// render runs; the chunk's shim throws if it loads first.
globalThis.__rosezm_rt = { ${ue.join(", ")} };`:"",kt=d=>Y?`
// === Sliced mode: the shared nav chunk === One file holds every route's
// render chain this document did not inline, fetched on the first cross-route
// navigation (or a hover prefetch). __rosezm_navImport is the override seam
// (tests, or a host page with its own loader); the browser default is a plain
// dynamic import of the versioned URL, which 'self' in the CSP allows.
const __navUrl = ${JSON.stringify(d)};
const __navImport = globalThis.__rosezm_navImport || ((u) => import(u));
let __navMod = null;
const __nav = async () => (__navMod ??= await __navImport(__navUrl));
const __navRoute = async (pattern) => (await __nav()).navRenders[pattern];
const __navNotFound = async (prefix) => (await __nav()).navNotFound[prefix];
const __navError = async () => (await __nav()).navError;
`:"",Et=Ye({imports:Y?vt(null).imports:In,routes:Y?vt(null).routes:We,publish:"",nav:"",notFoundTable:Y?Xt:ae,errorRender:Y?pn:Oe,prefetchDoor:""});Y||await C.promises.writeFile(x.join(L,"client-entry.js"),Et);let Yt=Y?(async()=>{W("runtime-global.js",["// Sliced-mode bridge (generated): the nav chunk resolves the runtime","// through the copy the route slice published, so a page runs exactly one","// runtime. Exports are tree-shaken to what the chunk references.","const __rt = globalThis.__rosezm_rt;","if (!__rt) throw new Error('rosezm: the sliced bundle bridge is missing - the route slice did not publish the runtime before the nav chunk loaded');",...X.map(S=>`export const ${S} = __rt.${S};`)].join(`
`)+`
`);let d=[];for(let S=0;S<m.length;S++)l[S].isApi||!R.has(S)||!m[S].client||d.push(C.promises.writeFile(x.join(L,`nav-comp-${S}.client.js`),m[S].client.replace(/from '\.\/runtime\.js'/g,"from './runtime-global.js'").replace(/from '\.\/comp-(\d+)\.client\.js'/g,"from './nav-comp-$1.client.js'")));let b=`
${xt.replace(/from '\.\/comp-(\d+)\.client\.js'/g,"from './nav-comp-$1.client.js'")}
export const navRenders = {
  ${D.map(({info:S,i:V})=>`'${S.pattern}': { render: ${te(V)} },`).join(`
  `)}
};
export const navNotFound = {
  ${Ge.map(S=>`'${S.prefix}': { render: ${S.render} },`).join(`
  `)}
};
export const navError = ${Ee>=0?`{ render: ${te(Ee)} }`:"null"};
`;await Promise.all([...d,C.promises.writeFile(x.join(L,"nav-entry.js"),b)]),await nt(x.join(L,"nav-entry.js"),{entryPoints:[x.join(L,"nav-entry.js")],bundle:!0,outfile:x.join(r,"nav.js"),format:"esm",platform:"browser",minify:!0,write:!0,...dt},o);let T=await C.promises.readFile(x.join(r,"nav.js")),N="/nav.js?v="+sn(T);await Ft(x.join(r,"slices")),await C.promises.mkdir(x.join(r,"slices"),{recursive:!0});let F=[{entryFile:"client-entry.js",outFile:x.join(r,"client.js"),own:null},...D.map(({i:S})=>{let V=U(l[S].pattern);return{entryFile:`slice-entry-${V}.js`,outFile:x.join(r,"slices",`${V}.js`),own:S}})],P=[];for(let{entryFile:S,outFile:V,own:we}of F){let ke=vt(we),le=x.join(L,S);await C.promises.writeFile(le,Ye({imports:ke.imports,routes:ke.routes,publish:Qt,nav:kt(N),notFoundTable:Xt,errorRender:pn,prefetchDoor:`
export { setPrefetchOverride } from './runtime.js';`})),P.push(nt(le+":slice",{entryPoints:[le],bundle:!0,outfile:V,format:"esm",platform:"browser",minify:!0,write:!0,...dt},o))}return await Promise.all(P),{}})():ie?(async()=>(await Ft(x.join(r,"chunks")),nt(x.join(L,"client-entry.js")+":split",{entryPoints:[x.join(L,"client-entry.js")],bundle:!0,format:"esm",platform:"browser",minify:!0,splitting:!0,outdir:r,entryNames:"client",chunkNames:"chunks/[name]-[hash]",write:!0,...dt},o)))():nt(x.join(L,"client-entry.js"),{entryPoints:[x.join(L,"client-entry.js")],bundle:!0,outfile:x.join(r,"client.js"),format:"esm",platform:"browser",minify:!0,write:!0,...dt},o);await Promise.all([Pt,Yt,je]),h&&await C.promises.writeFile(x.join(r,"server.js"),["// VERCEL root entrypoint (BUG-009): the platform hands every request to","// this file by name. The named exports are the engine (the edge adapter","// imports them); the default is the full prod server (http.Server, which","// does not listen when VERCEL is set - the platform drives it).","export * from './engine.js';","export { default } from './prod.mjs';",""].join(`
`),"utf8");for(let d of[x.join(r,h?"engine.js":"server.js"),x.join(r,"prod.mjs")])try{if(!C.existsSync(d))continue;let b=await C.promises.readFile(d,"utf8");if(b.startsWith(I))continue;(/Dynamic require of/.test(b)||/(?<![\w$])require\s*\(/.test(b))&&await C.promises.writeFile(d,I+b,"utf8")}catch{}let Lt=Cs;try{let d=C.readFileSync(x.join(r,"client.js"));Lt=Cs.replace("from '/client.js'",`from '/client.js?v=${sn(d)}'`)}catch{}await C.promises.writeFile(x.join(r,"mount.js"),Lt);let en=x.join(t,"public");if(C.existsSync(en)&&await C.promises.cp(en,x.join(r,"public"),{recursive:!0}),!n.quiet){console.log("zero-JS report:");for(let d of Qo(l,m))console.log("  "+d)}let ft=new Map;for(let{info:d,i:b}of D)if(Wt(l,m,b))for(let T of[b,...mt(l,b)])for(let N of m[T].jsWarnings??[]){let F=ft.get(N);F||(F={why:N,files:new Map},ft.set(N,F));let P=x.relative(t,l[T].filePath).replace(/\\/g,"/"),S=F.files.get(P);S||(S=new Set,F.files.set(P,S)),S.add(d.routePath)}for(let d of ft.values()){let b=new Set;for(let P of d.files.values())for(let S of P)b.add(S);let T=[...d.files.entries()].sort((P,S)=>S[1].size-P[1].size).map(([P,S])=>`${P} (${S.size===1?[...S][0]:`${S.size} routes`})`),N=T.slice(0,4).join(", "),F=T.length>4?`, +${T.length-4} more files`:"";n.quiet||console.warn(`rosezm warning: ${b.size} routes ship zero JavaScript while their chain contains ${d.why} - ${N}${F}`)}return{routes:D.map(({info:d})=>d),bundle:ve,config:p}}async function Yo(e){let s=x.join(e,"src","pages");if(!C.existsSync(s))return[];async function n(t){let r=await C.promises.readdir(t,{withFileTypes:!0}),i=[];for(let o of r){let h=x.join(t,o.name);o.isDirectory()?i.push(...await n(h)):o.name.endsWith(".rose")&&i.push(h)}return i}return n(s)}async function ei(e){let s=x.join(e,"src","components");if(!C.existsSync(s))return[];async function n(t){let r=await C.promises.readdir(t,{withFileTypes:!0}),i=[];for(let o of r){let h=x.join(t,o.name);o.isDirectory()?i.push(...await n(h)):o.name.endsWith(".rose")&&i.push(h)}return i}return n(s)}function ti(e,s){let n=x.dirname(e),t=x.dirname(s);return t===n||t.startsWith(n+x.sep)}function ni(e,s){let n=x.join(s,"src","pages"),r=x.relative(n,e).replace(/\\/g,"/").replace(/\.rose$/,""),i=x.posix.basename(r),o=e.replace(/\\/g,"/").includes("/src/components/"),h=!o&&i==="_layout",u=!o&&(i==="404"||i==="_notfound"),c=!o&&i==="500",f=!o&&(r==="api"||r.startsWith("api/")),a=!o&&r==="_middleware",l=r.split("/").filter($=>$!=="_layout"&&$!=="_notfound");l.length>1&&l[l.length-1]==="index"&&(l=l.slice(0,-1));let p=/^\[\.\.\.(\w+)\]$/,g=/^\[\[\.\.\.(\w+)\]\]$/,_=l.map($=>{let m=g.exec($);if(m)return`**${m[1]}`;let v=p.exec($);return v?`*${v[1]}`:$.startsWith("[")&&$.endsWith("]")?`:${$.slice(1,-1)}`:$}),w;return _.length===0||_.length===1&&_[0]==="index"?w="/":w="/"+_.join("/"),{filePath:e,routePath:w,pattern:w,paramNames:l.flatMap($=>{let m=g.exec($);if(m)return[m[1]];let v=p.exec($);return v?[v[1]]:$.startsWith("[")&&$.endsWith("]")?[$.slice(1,-1)]:[]}),isLayout:h,isNotFound:u,isError:c,isApi:f,isMiddleware:a,isComponent:o}}function Qe(e){return e.charAt(0).toUpperCase()+e.slice(1)}export{j as RoseError,Ei as assertEmittedJsParseable,Ko as assertJsParseable,Si as buildProject,Qo as buildReport,dr as codeFrame,ro as compileComponent,ur as errorInfo,io as extractExports,Ce as lineAt,St as lineOf,Bs as loadConfig,xi as loadPlugins,ei as scanComponentFiles,Yo as scanRoseFiles,Zs as scopeCss,yi as scriptOf,cs as splitScriptBlocks,Ct as templateExprSpans};
