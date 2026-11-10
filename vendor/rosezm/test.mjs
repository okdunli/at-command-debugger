import*as ye from"fs";import*as br from"os";import*as ae from"path";import{pathToFileURL as yr}from"url";import*as N from"fs";import*as x from"path";import*as qs from"os";import{pathToFileURL as Br,fileURLToPath as Ut}from"url";import*as pt from"esbuild";var L=class extends Error{code;file;line;hint;constructor(s,n,t={}){super(n),this.name="RoseError",this.code=s,this.file=t.file,this.line=t.line,this.hint=t.hint}info(){let s={code:this.code};return this.file!==void 0&&(s.file=this.file),this.line!==void 0&&(s.line=this.line),s.message=this.message,this.hint!==void 0&&(s.hint=this.hint),s}};function At(e,s){let n=1,t=Math.min(s,e.length);for(let r=0;r<t;r++)e[r]===`
`&&n++;return n}function Me(e,s){return s&&s.index!==void 0?At(e,s.index):void 0}function Ar(e,s){return`$setState('${e}', ${s})`}function Tr(e){if(!e)return[];let s=[];for(let n of e.matchAll(/\b(?:let|const|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=;\n]*)?=\s*\$derived\b/g))s.includes(n[1])||s.push(n[1]);return s}function Cr(e){let s="",n=0;for(;n<e.length;){let t=e[n];if(t==="/"&&(e[n+1]==="/"||e[n+1]==="*")){let r=e[n+1]==="/"?e.indexOf(`
`,n)<0?e.length:e.indexOf(`
`,n):e.indexOf("*/",n)<0?e.length:e.indexOf("*/",n)+2;s+=e.slice(n,r).replace(/[^\n]/g," "),n=r;continue}if(t==="'"||t==='"'||t==="`"){let r=n+1;for(;r<e.length&&e[r]!==t;)e[r]==="\\"?r+=2:r++;r=Math.min(r+1,e.length),s+=t+" ".repeat(Math.max(0,r-n-2))+(r-n>1?t:""),n=r;continue}s+=t,n++}return s}function os(e){if(!e)return null;let s=Cr(e);for(let n of Tr(e))if(new RegExp(`(?<![\\w$.]|\\b(?:let|const|var)\\s{1,4})\\b${n}\\s*(?:\\+\\+|--|\\+=|-=|\\*=|/=|%=|=(?!=))|(?:\\+\\+|--)(?:\\s{1,4})${n}\\b(?![\\w$.])`).test(s))return n;return null}var jr=["+=","-=","*=","/=","%="],rs=[/[(,.<>=!&|+\-*/%?:]$/,/(?:&&|\|\||=>|\.\.)$/];function is(e,s){if(!e)return e;let n=i=>i.replace(/=/g,""),t="",r=0;for(;r<e.length;){let i=e.indexOf("{",r);if(i<0){t+=n(e.slice(r));break}t+=n(e.slice(r,i));let o=Or(e,i);if(o<0){t+=n(e.slice(i));break}t+=e.slice(i,o),r=o}return Tn(t,s).replace(/\u0001/g,"=")}function Or(e,s){let n=0;for(let t=s;t<e.length;t++){let r=e[t];if(r==='"'||r==="'"||r==="`"){for(t++;t<e.length;t++)if(e[t]==="\\")t++;else if(e[t]===r)break;continue}if(r==="{")n++;else if(r==="}"&&--n===0)return t+1}return-1}function Tn(e,s,n=Ar){if(!e)return e;let t=/(?:^|[^\w$])(?:let|const|var|function|class|new|case|import|export|interface|type)\s+$/,r=/(?:^|[^\w$])case[^:;{}]*:\s*$|(?:^|[^\w$])default\s*:\s*$/,i=m=>t.test(m)||r.test(m),o=m=>!!m&&/[A-Za-z_$]/.test(m),d="",u="",c=(m,b)=>{if(d+=m,!b)return;let w=m.replace(/\s+$/,"");w&&(u=(u+w).slice(-64))},f=()=>u.endsWith("=>")?"=>":u.replace(/\s+$/,"").slice(-1),a=0,l=m=>{let b=e[m],w=m+1;for(;w<e.length&&e[w]!==b;){if(e[w]==="\\"){w+=2;continue}if(b==="`"&&e[w]==="$"&&e[w+1]==="{"){let y=1;for(w+=2;w<e.length&&y>0;)e[w]==="{"?y++:e[w]==="}"&&y--,w++;continue}w++}return Math.min(w+1,e.length)},p=m=>{let b=m,w=0;for(;b<e.length;){let y=e[b];if(y==="'"||y==='"'||y==="`"){b=l(b);continue}if(y==="/"&&(e[b+1]==="/"||e[b+1]==="*")){b=e[b+1]==="/"?e.indexOf(`
`,b)<0?e.length:e.indexOf(`
`,b):e.indexOf("*/",b)<0?e.length:e.indexOf("*/",b)+2;continue}if(y==="("||y==="["||y==="{"){w++,b++;continue}if(y===")"||y==="]"||y==="}"){if(w===0)return b;w--,b++;continue}if(w>0){b++;continue}if(y===";")return b;if(y===`
`){let g=e.slice(m,b).replace(/\s+$/,"");if(g===""||rs[0].test(g)||rs[1].test(g)||/delegate$/.test(g)){b++;continue}return b}b++}return b};for(;a<e.length;){let m=e[a];if(m==="'"||m==='"'||m==="`"){let R=l(a);c(e.slice(a,R),!0),a=R;continue}if(m==="/"&&e[a+1]==="/"){let R=e.indexOf(`
`,a),j=R<0?e.length:R;c(e.slice(a,j),!1),a=j;continue}if(m==="/"&&e[a+1]==="*"){let R=e.indexOf("*/",a),j=R<0?e.length:R+2;c(e.slice(a,j),!1),a=j;continue}if((m==="+"||m==="-")&&e[a+1]===m&&["",";","{","}","(",",","=>"].includes(f())){let R=a+2;for(;R<e.length&&e[R]!==`
`&&/[ \t]/.test(e[R]);)R++;if(o(e[R])&&!(R>0&&/[\w$.]/.test(e[R-1]))){let j=R;for(;j<e.length&&/[\w$]/.test(e[j]);)j++;let J=e.slice(R,j);if(s(J)&&!t.test(u)){c(n(J,`${J}() ${m==="-"?"-":"+"} 1`),!0),a=j;continue}}c(m,!0),a++;continue}if(!o(m)||a>0&&/[\w$.]/.test(e[a-1])){c(m,!0),a++;continue}let b=a;for(;b<e.length&&/[\w$]/.test(e[b]);)b++;let w=e.slice(a,b);if(!s(w)||t.test(u)){c(w,!0),a=b;continue}let y=e.slice(b).match(/^[ \t]*/)[0].length,g=e.slice(b+y),S=f();if((g.startsWith("++")||g.startsWith("--"))&&!/[\w$.]/.test(g.slice(2,3))&&(["",";","{","}","(",")",",","=>"].includes(S)||r.test(u))){c(n(w,`${w}() ${g.startsWith("--")?"-":"+"} 1`),!0),a=b+y+2;continue}let E=null,v=1;for(let R of jr)if(g.startsWith(R)){E=R.slice(0,-1),v=2;break}if((E!==null||/^=(?!=)/.test(g))&&(["",";","{","}",")","=>"].includes(S)||r.test(u))){let R=b+y+v,j=p(R),J=e.slice(R,j).trim();if(J){if(E===null){let A=new RegExp(`^(?:--\\s*${w}$|${w}\\s*--$)`).test(J),W=new RegExp(`^\\+\\+\\s*${w}$|^${w}\\s*\\+\\+$`).test(J);if(A||W){c(n(w,`${w}() ${A?"-":"+"} 1`),!0),a=j;continue}}c(n(w,E===null?J:`${w}() ${E} (${J})`),!0),a=j;continue}}c(w,!0),a=b}return d}import Ht from"node:fs";import Cn from"node:path";var as=64,Pr=30*60*1e3;async function Nr(e){for(let s=0;;s++)try{await Ht.promises.rm(e,{force:!0});return}catch(n){if(s>=2||!/EPERM|EBUSY|EACCES/.test(String(n)))throw n;await new Promise(t=>setTimeout(t,50*(s+1)))}}async function Mr(e){for(let s=0;s<e.length;s+=as)await Promise.all(e.slice(s,s+as).map(Nr))}async function Lr(e){try{return await Ht.promises.readdir(e,{withFileTypes:!0})}catch{return[]}}async function Jt(e){let s=await Lr(e),n=[],t=[];for(let r of s)r.isDirectory()?t.push(Cn.join(e,r.name)):n.push(Cn.join(e,r.name));await Mr(n),await Promise.all(t.map(r=>Jt(r))),await Ht.promises.rmdir(e).catch(()=>{})}function ls(e){Ht.promises.readdir(e).then(s=>{let n=Date.now();for(let t of s){let r=Cn.join(e,t);Ht.promises.stat(r).then(i=>{i.isDirectory()&&n-i.mtimeMs>Pr&&Jt(r).catch(()=>{})}).catch(()=>{})}}).catch(()=>{})}function Tt(e){let s=2166136261,n=typeof e=="string"?new TextEncoder().encode(e):e;for(let t=0;t<n.length;t++)s^=n[t],s=Math.imul(s,16777619);return(s>>>0).toString(36)}var cs={"mini-program":["weapp","qq","alipay","baidu","toutiao"],miniprogram:["weapp","qq","alipay","baidu","toutiao"],native:["flutter","android","arkts","xcode"],desktop:["electron","python","dotnet","java","cpp"],web:["web"]},Ir=new Set(["weapp","qq","alipay","baidu","toutiao","flutter","android","arkts","xcode","electron","python","dotnet","java","cpp","web","vue"]),us={"mp-weixin":"weapp","mp-qq":"qq","mp-alipay":"alipay","mp-baidu":"baidu","mp-toutiao":"toutiao"};function ds(e,s){let n=s.toLowerCase(),t=e.trim().toLowerCase(),r=us[t]??t,i=cs[r];return i?i.includes(n):r===n}function hs(e){let s=e.trim().toLowerCase();return us[s]?!0:cs[s]!==void 0||Ir.has(s)}function fs(e,s="web",n=[]){let t=/^[ \t]*(?:\/\/|<!--|\/\*)\s*#(ifdef|ifndef|endif)\b([ \t\S]*?)(?:\*\/|-->)?[ \t]*$/gm,r=e.split(`
`),i=[],o=[],d=()=>o.every(Boolean);for(let u of r){let c=t.exec(u);if(t.lastIndex=0,c){let f=c[1],a=(c[2]??"").trim().split(/\s+/)[0].toLowerCase();if(f==="endif"){o.length?o.pop():n.push("#endif with no matching #ifdef - left as written");continue}hs(a)||n.push(`#${f} ${a} names an unknown target or family - treated as false`);let l=ds(a,s);o.push(f==="ifdef"?l:!l);continue}d()&&i.push(u)}return o.length&&n.push(`${o.length} #ifdef without #endif - the tail is kept as written`),i.join(`
`)}function ps(e,s="web",n=[]){let t=s.toLowerCase(),r=e;for(let i=0;i<40;i++){let o=/\{#(ifdef|ifndef)\s+([^}]*)\}/.exec(r);if(!o)break;let d=o[1],u=o[2].trim().toLowerCase(),c=ds(u,t),f=d==="ifdef"?c:!c;hs(u)||n.push(`{#${d} ${u}} names an unknown target or family - treated as false`);let a=o.index+o[0].length,l=1,p=-1,m=-1,b=/\{#(ifdef|ifndef)\b|\{:(else)\b|\{\/(ifdef|ifndef)\}/g;b.lastIndex=a;for(let g=b.exec(r);g;g=b.exec(r))if(g[1])l++;else if(g[3]){if(l--,l===0){m=g.index;break}}else g[2]&&l===1&&(p=g.index);if(m<0){n.push(`{#${d} ${u}} has no {/${d}} - left as written`);break}let w=p>=0?p+7:m,y=p>=0?f?r.slice(a,p):r.slice(w,m):f?r.slice(a,m):"";r=r.slice(0,o.index)+y+r.slice(m+d.length+3)}return r}import dt from"node:fs";function ms(e){try{let s=dt.openSync(e,"r"),n=Buffer.alloc(64),t=dt.readSync(s,n,0,64,0);return dt.closeSync(s),t<24?null:n[0]===137&&n[1]===80&&n[2]===78&&n[3]===71?{width:n.readUInt32BE(16),height:n.readUInt32BE(20)}:n.slice(0,3).toString("latin1")==="GIF"?{width:n.readUInt16LE(6),height:n.readUInt16LE(8)}:n.slice(0,4).toString("latin1")==="RIFF"&&n.slice(8,12).toString("latin1")==="WEBP"?zr(n):n[0]===255&&n[1]===216?Fr(e):null}catch{return null}}function zr(e){let s=e.slice(12,16).toString("latin1");if(s==="VP8 ")return{width:e.readUInt16LE(26)&16383,height:e.readUInt16LE(28)&16383};if(s==="VP8L"){let n=e.readUInt32LE(21);return{width:(n&16383)+1,height:(n>>14&16383)+1}}if(s==="VP8X"){let n=e.readUIntLE(24,3)+1,t=e.readUIntLE(27,3)+1;return{width:n,height:t}}return null}function Fr(e){let s=dt.openSync(e,"r");try{let n=Buffer.alloc(4),t=2;for(let r=0;r<64;r++){if(dt.readSync(s,n,0,4,t)<4)return null;if(n[0]!==255){t+=1;continue}let i=n[1];if(i===216||i===1||i>=208&&i<=215){t+=2;continue}let o=dt.readSync(s,n,0,2,t+2)<2?0:n.readUInt16BE(2);if(i>=192&&i<=207&&i!==196&&i!==200&&i!==204){let d=Buffer.alloc(8);return dt.readSync(s,d,0,8,t+4),{width:d.readUInt16BE(3),height:d.readUInt16BE(1)}}t+=2+o}return null}finally{dt.closeSync(s)}}import cn from"node:fs";import gs from"node:path";function Dr(e){if(!e.startsWith("---"))return{frontmatter:{},body:e};let s=e.indexOf(`
---`,3);if(s<0)return{frontmatter:{},body:e};let n=e.slice(4,s),t=e.slice(e.indexOf(`
`,s+1)+1).replace(/^\s*\n/,""),r={};for(let i of n.split(`
`)){let o=/^(\w[\w-]*):\s*(.*)$/.exec(i.trim());if(!o)continue;let[,d,u]=o,c=/^\[(.+)\]$/.exec(u.trim());r[d]=c?c[1].split(",").map(f=>f.trim().replace(/^["']|["']$/g,"")):u.trim().replace(/^["']|["']$/g,"")}return{frontmatter:r,body:t}}function qr(e,s){return e.replace(/{{(\w[\w.]*)}}/g,(n,t)=>{let r=t.split(".").reduce((i,o)=>i==null?i:i[o],s);return r==null?"":String(r)})}function ws(e,s){s&&(e=qr(e,s));let n=[],t=e.replace(/```(\w*)\n([\s\S]*?)```/g,(u,c,f)=>(n.push(`<pre data-lang="${c}"><code>${f.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</code></pre>`),`\0CODE${n.length-1}\0`)),r=u=>u.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*]+)\*/g,"<em>$1</em>").replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" rel="noopener">$1</a>'),i=[],o=null,d=()=>{o&&(i.push(`</${o}>`),o=null)};for(let u of t.split(`
`)){let c=/^(#{1,4})\s+(.*)$/.exec(u),f=/^\s*[-*]\s+(.*)$/.exec(u),a=/^\s*\d+\.\s+(.*)$/.exec(u);c?(d(),i.push(`<h${c[1].length}>${r(c[2])}</h${c[1].length}>`)):f?(o!=="ul"&&(d(),i.push("<ul>"),o="ul"),i.push(`<li>${r(f[1])}</li>`)):a?(o!=="ol"&&(d(),i.push("<ol>"),o="ol"),i.push(`<li>${r(a[1])}</li>`)):u.trim()===""?d():u.startsWith("\0CODE")?(d(),i.push(u)):(d(),i.push(`<p>${r(u)}</p>`))}return d(),i.join(`
`).replace(/\u0000CODE(\d+)\u0000/g,(u,c)=>n[Number(c)])}function ys(e){let s={};if(!cn.existsSync(e))return s;for(let n of cn.readdirSync(e,{withFileTypes:!0})){if(!n.isDirectory())continue;let t=[],r=gs.join(e,n.name);for(let i of cn.readdirSync(r)){if(!i.endsWith(".md"))continue;let o=cn.readFileSync(gs.join(r,i),"utf-8"),{frontmatter:d,body:u}=Dr(o);if(String(d.draft??"").toLowerCase()==="true")continue;let c=i.replace(/\.md$/,""),f=ws(u),a=u.replace(/[#*`\[\]()>-]/g," ").split(/\s+/).filter(Boolean).length,l=[],p=f.replace(/<h([1-4])>([^<]+)<\/h\1>/g,(m,b,w)=>{let y=w.toLowerCase().replace(/[^\w\s-]/g,"").trim().replace(/\s+/g,"-");return l.push({level:Number(b),text:w,id:y}),`<h${b} id="${y}">${w}</h${b}>`});t.push({slug:c,frontmatter:d,body:u,html:p,readingTime:Math.max(1,Math.round(a/200)),wordCount:a,toc:l,excerpt:String(d.summary??"")||(f.match(/<p>([\s\S]*?)<\/p>/)?.[1]??"").replace(/<[^>]+>/g,"").slice(0,160)})}t.sort((i,o)=>String(o.frontmatter.date??"").localeCompare(String(i.frontmatter.date??""))),s[n.name]=t}return s}globalThis.__rosezmContentMk=ws;var jn=new Map;function rt(e,s,n){let t=Qr(),r={...s,define:{...Kr(),...s.define??{}}};if(e+=`|env:${t}`,!n||s.splitting)return pt.build(r);let i=jn.get(e);return i?i.rebuild().catch(o=>{throw jn.delete(e),o}):pt.context(r).then(o=>(jn.set(e,o),o.rebuild()))}var Hr=/<script>([\s\S]*?)<\/script>/,Bs=/<script\b(?![^>]*\b(?:type|src)=)[^>]*>([\s\S]*?)<\/script>/g;function bs(e){let s=[...e.matchAll(Bs)].map(u=>({start:u.index,end:u.index+u[0].length,code:u[1]})),n=e;for(let u=s.length-1;u>=0;u--){let c=s[u],f=e.slice(c.start,e.indexOf(">",c.start)+1);n=n.slice(0,c.start)+f+" ".repeat(c.code.length)+"</script>"+n.slice(c.end)}let t=n.match(dn),r=t&&t.index!==void 0?t.index:-1,i=t&&t.index!==void 0?t.index+t[0].length:-1,o=s.filter(u=>!(r>=0&&u.start>=r&&u.end<=i)),d=e;for(let u=o.length-1;u>=0;u--){let c=o[u];d=d.slice(0,c.start)+d.slice(c.end)}return{script:o.map(u=>u.code).join(`
`),rest:d}}var Hs=/<template>([\s\S]*?)<\/template>/,dn=/<head>([\s\S]*?)<\/head>/,Js="<style>([\\s\\S]*?)<\\/style>",Jr=e=>[...e.matchAll(new RegExp(Js,"g"))].map(s=>s[1]),Ws=e=>e.replace(new RegExp(Js,"g"),""),_s=/(?<=^|[;}{\n])[ \t]*(?:let|const|var)\s+(\w+)[^\n;{}=]*=\s*\$(state|data|kv|persist|derived)\b/g,Wr=/^\s+as\s+[^;\n]+/,$s=/\$setState\(([^,]+),\s*([^)]+)\)/g,Ur=/<slot\s*\/>|<slot>([\s\S]*?)<\/slot>/g,Vr=/<slot\s+((?=[^>]*\bname\s*=)[^>]*?)(?:\/>|>([\s\S]*?)<\/slot>)/g;function xs(e){let s=/\bname\s*=\s*["'](\w+)["']/.exec(e)?.[1];if(!s)throw new L("E-TEMPLATE",'<slot> with attributes must declare a name: <slot name="row" ... />',{hint:'a slot carrying attributes is a NAMED slot - it must declare which one: <slot name="row" item={post} />'});let n=[...e.matchAll(/\b(\w+)\s*=\s*\{([^}]*)\}/g)].filter(t=>t[1]!=="name").map(t=>`['${t[1]}', (${t[2].trim()})]`);return`${JSON.stringify(s)}, [${n.join(", ")}]`}var Gr="<p>This section failed to render.</p>",Zr=new Set(["GET","POST","PUT","PATCH","DELETE","HEAD","OPTIONS"]),ht={loader:{".js":"ts"}},Vt="rosezm_PUBLIC_",Xr=/^[A-Za-z_$][\w$]*$/,Bn=()=>Object.entries(process.env).filter(e=>e[0].startsWith(Vt)&&typeof e[1]=="string").sort(([e],[s])=>e<s?-1:e>s?1:0),Qr=()=>mn(JSON.stringify(Bn()));function Kr(){let e=Object.fromEntries(Bn()),s={};for(let[n,t]of Object.entries(e))Xr.test(n)&&(s[`import.meta.env.${n}`]=JSON.stringify(t).replace(/</g,"\\u003c"));return s["import.meta.env"]=JSON.stringify(e).replace(/</g,"\\u003c"),s}function vs(e){return[...e.matchAll(/\bimport\.meta\.env\.([A-Za-z_$][\w$]*)/g)].map(s=>s[1])}function un(e,s){let n={"(":")","[":"]","{":"}"}[e[s]]??"";if(!n)return-1;let t=0;for(let r=s;r<e.length;r++)if(e[r]===e[s])t++;else if(e[r]===n&&(t--,t===0))return r;return-1}function Yr(e,s){let n={")":"(","]":"[","}":"{"}[e[s]]??"";if(!n)return-1;let t=0;for(let r=s;r>=0;r--)if(e[r]===e[s])t++;else if(e[r]===n&&(t--,t===0))return r;return-1}function eo(e,s){let n=0;for(let t=s;t<e.length;t++){let r=e[t];if(r==="("||r==="["||r==="{"){n++;continue}if(r===")"||r==="]"||r==="}"){if(n===0)return t;n--;continue}if(n===0&&(r===","||r===";"))return t}return e.length}function to(e){let s=Qt(e),n=[],t=(r,i)=>{let o=[];for(let d of s.slice(r,i).matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g))o.push(d[1]);return o};for(let r of s.matchAll(/\bfunction\b/g)){let i=r.index+r[0].length;for(;i<s.length&&/\s/.test(s[i]);)i++;for(s[i]==="*"&&i++;i<s.length&&/[A-Za-z_$]/.test(s[i]);)i++;for(;i<s.length&&/\s/.test(s[i]);)i++;if(s[i]!=="(")continue;let o=un(s,i);if(o<0)continue;let d=o+1;for(;d<s.length&&/\s/.test(s[d]);)d++;if(s[d]===":"){for(d++;d<s.length&&/[^{};\n]/.test(s[d]);)d++;for(;d<s.length&&/\s/.test(s[d]);)d++}if(s[d]!=="{")continue;let u=un(s,d);if(u<0)continue;let c=new Set(Xt(e.slice(i+1,o)));for(let f of t(d,u))c.add(f);n.push({start:i,end:u+1,names:c})}for(let r of s.matchAll(/=>/g)){let i=r.index,o=i-1;for(;o>=0&&/\s/.test(s[o]);)o--;let d="",u=i;if(s[o]===")"){let l=Yr(s,o);if(l<0)continue;d=e.slice(l+1,o),u=l}else if(/[A-Za-z_$]/.test(s[o]??"")){let l=o;for(;l>=0&&/[\w$]/.test(s[l]);)l--;d=e.slice(l+1,o+1),u=l+1}else continue;let c=i+2;for(;c<s.length&&/\s/.test(s[c]);)c++;let f=s[c]==="{"?un(s,c)+1:eo(s,c);if(f<=0)continue;let a=new Set(Xt(d));if(s[c]==="{")for(let l of t(c,f))a.add(l);n.push({start:u,end:f,names:a})}return n.sort((r,i)=>r.start-i.start)}function ot(e,s,n){if(s.length===0&&!n)return e;let t=to(e),r=(o,d)=>{for(let u of t){if(u.start>o)break;if(o<u.end&&u.names.has(d))return!0}return!1},i=(o,d=0)=>{let u="",c=0;for(;c<o.length;){let f=o[c];if(f==="'"||f==='"'){let a=c+1;for(;a<o.length&&o[a]!==f;)o[a]==="\\"&&a++,a++;u+=o.slice(c,Math.min(a+1,o.length)),c=a+1;continue}if(f==="`"){for(u+=f,c++;c<o.length&&o[c]!=="`";){if(o[c]==="\\"){u+=o.slice(c,c+2),c+=2;continue}if(o[c]==="$"&&o[c+1]==="{"){let a=1,l=c+2;for(;l<o.length&&a>0&&(o[l]==="{"?a++:o[l]==="}"&&a--,a!==0);)l++;u+="${"+i(o.slice(c+2,l),d+c+2)+"}",c=l+1;continue}u+=o[c],c++}u+="`",c++;continue}if(f==="/"&&o[c+1]==="/"){let a=o.indexOf(`
`,c),l=a===-1?o.length:a;u+=o.slice(c,l),c=l;continue}if(f==="/"&&o[c+1]==="*"){let a=o.indexOf("*/",c+2),l=a===-1?o.length:a+2;u+=o.slice(c,l),c=l;continue}if(f==="/"&&Hn(o,c)){let a=Jn(o,c);u+=o.slice(c,a),c=a;continue}if(/[A-Za-z_$]/.test(f)){let a=c;for(;a<o.length&&/[\w$]/.test(o[a]);)a++;let l=o.slice(c,a);if((l==="as"||l==="satisfies")&&!/[\w$.]/.test(u[u.length-1]??"")){u+=l;let E=a;for(;E<o.length&&/\s/.test(o[E]);)E++;if(u+=o.slice(a,E),o[E]==="{"||o[E]==="("||o[E]==="["){let v=0,k=E,R="";for(;k<o.length;k++){let j=o[k];if(R){j==="\\"?k++:j===R&&(R="");continue}if(j==="'"||j==='"'||j==="`"){R=j;continue}if(j==="{"||j==="("||j==="[")v++;else if((j==="}"||j===")"||j==="]")&&(v--,v===0))break}u+=o.slice(E,k+1),c=k+1;continue}else{let v=E,k=0;for(;v<o.length;){let R=o[v];if(R==="<")k++;else if(R===">")k=Math.max(0,k-1);else if(R==="["&&o[v+1]==="]"){v+=2;continue}else if(k===0&&!/[\w$.:<>| ]/.test(R))break;v++}u+=o.slice(E,v),c=v;continue}c=E;continue}let p=u.length?u[u.length-1]:"",m=o[a]??"",b=m==="?"&&o[a+1]===":",w=p==="@",y=!/[\w$.]/.test(p)&&!/[\w$:(]/.test(m)&&!b,g=y&&!w&&s.includes(l)&&!r(d+c,l),S=y&&n!=null&&Object.prototype.hasOwnProperty.call(n,l);u+=g?`${l}()`:S?`${n[l]}()`:l,c=a;continue}u+=f,c++}return u};return i(e)}var Us=/^\s*#(?:if|each|await|key|snippet|boundary|island|defer)\b/,Vs=/^\s*\/(?:if|each|await|key|snippet|boundary|island|defer)\s*$/,Gs=/^\s*:(?:else|then|catch|fallback)\b/,no=/^\s*#each\s+([\s\S]+?)\s+as\s+(\{[^{}]*\}|\[[^[\]]*\]|\w+)(?:\s*,\s*(\w+))?(?:\s*\(([\s\S]+)\))?\s*$/,so=/^\s*#snippet\s+(\w+)(?:\s*\(([\s\S]*)\))?\s*$/,ro=/^\s*:(?:then|catch)\s+([A-Za-z_$][\w$]*)\s*$/;function Xt(e){return e.replace(/^[{[]/,"").replace(/[}\]]$/,"").split(",").map(n=>{let t=n.split("=")[0].trim(),r=t.indexOf(":");return r>=0?t.slice(r+1).trim():t}).filter(n=>/^[A-Za-z_$][\w$]*$/.test(n))}function Zs(e,s){let n=[],t=0;for(;t<e.length;){let r=Xo(e.slice(t),s);if(!r)break;if(r.selfClosing){t+=r.end;continue}let i=fn(e,t+r.end,r.name),o=i>=0?i+r.name.length+3:e.length;n.push([t+r.start,o]),t=o}return n}function oo(e,s){let n=[],t=0,r=s.size>0?Zs(e,s):[],i=0,o=-1;for(let d of Ot(e)){for(;i<r.length&&r[i][0]<=d.start;)o=r[i++][1];if(d.start<o)continue;let u=d.expr;if(Vs.test(u)){t>0&&t--;continue}if(Us.test(u)){t++;continue}if(!Gs.test(u)&&t===0){let c=/^\s*@const\s+([A-Za-z_$][\w$]*)\s*=/.exec(u);c&&n.push(c[1])}}return n}function Nn(e,s,n,t){if(s.length===0&&!n)return e;let r="",i=0,o=[new Set],d=()=>o[o.length-1],u=p=>o.some(m=>m.has(p)),c=t?.ownScope?p=>{for(let m=o.length-1;m>=0;m--)if(o[m].has(p))return m===0;return!1}:p=>!u(p),f=()=>[s.filter(p=>!u(p)),n?Object.fromEntries(Object.entries(n).filter(([p])=>c(p))):void 0],a=[];if(t?.comps&&t.comps.size>0)for(let[p,m]of Zs(e,t.comps))a.push({pos:p,open:!0}),a.push({pos:m,open:!1});let l=0;for(let p of Ot(e)){for(;l<a.length&&a[l].pos<=p.start;)a[l].open?o.push(new Set):o.length>1&&o.pop(),l++;let m=p.expr;if(Vs.test(m)){o.length>1&&o.pop(),r+=e.slice(i,p.end+1),i=p.end+1;continue}if(Us.test(m)){let g=no.exec(m);if(g){let[,k,R,j,J]=g,[A,W]=f(),G=` as ${R}${j?`, ${j}`:""}`;o.push(new Set([...Xt(R),...j?[j]:[]]));let Z=J!=null&&J.trim()!==""?` (${ot(J,...f())})`:"";r+=e.slice(i,p.start)+`{#each ${ot(k,A,W)}${G}${Z}}`,i=p.end+1;continue}let S=so.exec(m);if(S){o.push(new Set(S[2]?Xt(S[2]):[])),r+=e.slice(i,p.end+1),i=p.end+1;continue}let[E,v]=f();r+=e.slice(i,p.start)+"{"+ot(m,E,v)+"}",o.push(new Set),i=p.end+1;continue}if(Gs.test(m)){d().clear();let g=ro.exec(m);if(g){d().add(g[1]),r+=e.slice(i,p.end+1),i=p.end+1;continue}let[S,E]=f();r+=e.slice(i,p.start)+"{"+ot(m,S,E)+"}",i=p.end+1;continue}let b=/^\s*@const\s+([A-Za-z_$][\w$]*)\s*=([\s\S]*)$/.exec(m),[w,y]=f();if(b){let g=b[2],S=ot(g,w,y);d().add(b[1]),r+=e.slice(i,p.start)+(S===g?e.slice(p.start,p.end+1):`{@const ${b[1]} =${S}}`),i=p.end+1;continue}r+=e.slice(i,p.start)+"{"+ot(m,w,y)+"}",i=p.end+1}return r+e.slice(i)}function Ot(e){let s=[],n=0;for(;n<e.length;){if(e[n]==="{"){let t=Kt(e,n);if(t>n+1){s.push({start:n,end:t,expr:e.slice(n+1,t)}),n=t+1;continue}}n++}return s}function io(e,s){let n=s;for(;n<e.length;){if(e[n]==="{"){let t=Kt(e,n);if(t>n+1)return{index:n,end:t,expr:e.slice(n+1,t)}}n++}return null}function Kt(e,s){let n=0,t=s;for(;t<e.length;){let r=e[t];if(r==="'"||r==='"'){t=at(e,t);continue}if(r==="`"){t=pn(e,t);continue}if(r==="/"){let i=wt(e,t);if(i!==null){t=i;continue}}if(r==="{")n++;else if(r==="}"&&--n===0)return t;t++}return-1}function it(e,s){let n=s+2,t=1;for(;n<e.length;){let r=e[n];if(r==="'"||r==='"'){n=at(e,n);continue}if(r==="`"){n=pn(e,n);continue}if(r==="{")t++;else if(r==="}"&&--t===0)return n+1;n++}return-1}function at(e,s){let n=e[s],t=s+1;for(;t<e.length;){if(e[t]==="\\"){t+=2;continue}if(e[t]===n)return t+1;t++}return t}function pn(e,s){let n=s+1;for(;n<e.length;){let t=e[n];if(t==="\\"){n+=2;continue}if(t==="`")return n+1;if(t==="$"&&e[n+1]==="{"){let r=Kt(e,n+1);n=r<0?e.length:r+1;continue}n++}return n}function Xs(e,s){let n=s;for(;n>=0&&/[\w$]/.test(e[n]);)n--;return n===s?"":e.slice(n+1,s+1)}function wt(e,s){let n=e[s];if(n==='"'||n==="'")return at(e,s);if(n==="`")return pn(e,s);if(n!=="/"||e[s+1]==="/"||e[s+1]==="*")return null;let t=s-1;for(;t>=0&&/\s/.test(e[t]);)t--;if(t>=0&&!"(,=:[!&|?{};+-*%~^".includes(e[t])){let o=Xs(e,t);if(!["return","typeof","case","in","of","new","delete","void","do","else","instanceof","yield","await"].includes(o))return null}let r=s+1,i=!1;for(;r<e.length;){let o=e[r];if(o==="\\"){r+=2;continue}if(o===`
`)return null;if(i)o==="]"&&(i=!1);else if(o==="[")i=!0;else if(o==="/"){r++;break}r++}if(r>e.length)return null;for(;r<e.length&&/[dgimsuvy]/.test(e[r]);)r++;return r}function ks(e){let s="",n=0;for(;n<e.length;){let t=wt(e,n);if(t!==null){s+=e.slice(n,t),n=t;continue}if(e.startsWith("//",n)){for(;n<e.length&&e[n]!==`
`;)n++;continue}if(e.startsWith("/*",n)){for(n+=2;n<e.length&&!e.startsWith("*/",n);)n++;n=Math.min(n+2,e.length);continue}if(e.startsWith("<!--",n)){for(n+=4;n<e.length&&!e.startsWith("-->",n);)n++;n=Math.min(n+3,e.length);continue}s+=e[n++]}return s}function ao(e){let s=/typeof\s+(?:window|document|navigator|location|localStorage|sessionStorage)\s*(!==|===)\s*["']undefined["']/y,n=a=>{for(;a<e.length&&/\s/.test(e[a]);)a++;return a},t=a=>{let l=0,p=a+1;for(;p<e.length;){let m=e[p],b=wt(e,p);if(b!==null){p=b;continue}if(m==="("||m==="["||m==="{")l++;else if(m===")"||m==="]"||m==="}"){if(l--,l<0)return-1}else{if(l===0&&m===":")return p;if(l===0&&m==="?"){let w=t(p);if(w<0)return-1;p=w+1;continue}}p++}return-1},r=a=>{let l=0;for(;a<e.length;){let p=e[a],m=wt(e,a);if(m!==null){a=m;continue}if(p==="("||p==="["||p==="{")l++;else if(p===")"||p==="]"||p==="}"){if(l===0)return a;l--}else{if(l===0&&(p===","||p===";"))return a;if(l===0&&p==="?"){let b=t(a);if(b<0)return e.length;a=b+1;continue}}a++}return e.length},i=a=>{let l=0,p=a;for(;p<e.length;){let m=e[p],b=wt(e,p);if(b!==null){p=b;continue}if(m==="{")l++;else if(m==="}"&&(l--,l===0))return p;p++}return e.length},o=a=>{let l=0;for(;a<e.length;){let p=e[a],m=wt(e,a);if(m!==null){a=m;continue}if(p==="("||p==="["||p==="{")l++;else if(p===")"||p==="]"||p==="}"){if(l===0)return a;l--}else if(l===0&&(p===";"||p===`
`))return a;a++}return e.length},d=(a,l)=>{let p=l-1;for(;p>=0&&/\s/.test(a[p]);)p--;if(p<0||a[p]!=="(")return!1;for(p--;p>=0&&/\s/.test(a[p]);)p--;return p>=1&&a[p]==="f"&&a[p-1]==="i"&&(p<2||!/[\w$]/.test(a[p-2]))},u=[],c=0;for(;c<e.length;){let a=wt(e,c);if(a!==null){c=a;continue}s.lastIndex=c;let l=s.exec(e);if(!l){c++;continue}let p=l[1]==="!==",m=n(c+l[0].length),b=e.slice(m,m+2);if(b==="&&"&&p)u.push([m+2,r(m+2)]);else if(b==="||"&&!p)u.push([m+2,r(m+2)]);else if(e[m]==="?"){let w=t(m);w<0?p&&u.push([m+1,e.length]):p?u.push([m+1,w]):u.push([w+1,r(w+1)])}else if(e[m]===")"&&d(e,c)){let w,y=n(m+1);e[y]==="{"?(w=i(y),p&&u.push([y+1,w])):(w=o(y),p&&u.push([y,w]));let g=n(w+1);if(e.startsWith("else",g)){let S=n(g+4);if(e[S]==="{"){let E=i(S);p||u.push([S+1,E])}else{let E=o(S);p||u.push([S,E])}}}c=m}if(u.length===0)return e;let f=[...e];for(let[a,l]of u)for(let p=a;p<l&&p<f.length;p++)f[p]!==`
`&&(f[p]=" ");return f.join("")}async function lo(e){let s=x.join(e,"rosezm.config.js");if(!N.existsSync(s))return{plugins:[],i18n:{}};let n=await import(Br(s).href+`?t=${Date.now()}`);return{plugins:n.default??[],i18n:n.i18n??{},pwa:n.pwa??void 0,brotli:n.brotli??void 0,csp:n.csp??void 0,watch:n.watch??void 0}}function Ss(e,s,n){let t=[],r=(o,d)=>{let u=x.resolve(x.dirname(s),o),c=n.get(u);if(!c)throw new L("E-IMPORT",`${x.basename(s)}: cannot import '${o}' - no .rose file at ${u}. A component lives under src/components/ (or src/pages/) and is imported by relative path.`,{file:s,line:At(e,d),hint:`create ${u} (a .rose component) or fix the import path - a .rose import resolves to a file, never to a package`});return c},i=e.replace(/import\s+(\w+)\s+from\s*(['"])([^'"]+\.rose)\2/g,(o,d,u,c,f)=>{let a=r(c,f);return t.push({name:d,specifier:c,index:a.index}),`import { render as ${d} } from ${u}__rose_${a.index}__${u}`});return i=i.replace(/import\s*(\{[^}]*\})\s+from\s*(['"])([^'"]+\.rose)\2/g,(o,d,u,c,f)=>{let a=r(c,f),l=/\bas\s+(\w+)/.exec(d)?.[1]??"render";return t.push({name:l,specifier:c,index:a.index}),`import ${d} from ${u}__rose_${a.index}__${u}`}),i=i.replace(/(\bfrom\s*)(['"])(\.\.?\/[^'"]+)(['"])/g,(o,d,u,c,f)=>{if(u!==f)return o;let a=x.resolve(x.dirname(s),c).replace(/\\/g,"/"),l=a;if(!N.existsSync(l)){let p=a.replace(/\.(js|mjs|cjs)$/,".ts");if(p!==a&&N.existsSync(p))l=p;else return o}return`${d}${u}${l}${u}`}),{script:i,imports:t}}function On(e,s){return e.replace(/from\s*(['"])__rose_(\d+)__\1/g,(n,t,r)=>`from ${t}./comp-${r}.${s}.js${t}`)}var co=/^(?:node:|(?:fs|path|os|crypto|http|https|net|tls|stream|child_process|worker_threads|dns|cluster|better-sqlite3|sqlite3|pg|mysql2|mongodb|redis|ioredis)$)/;function uo(e){let s=[];for(let n of e.matchAll(/import\s+(type\s+)?[\s\S]*?from\s*['"]([^'"]+)['"]/g))n[1]||co.test(n[2])&&s.push(n[2]);return s}function Qs(e){let s=[];for(let n=0;;){let t=Ct(e,"each",n);if(!t)break;n=t.index+1;let r=it(e,t.index),i=t[5];r<0||i==null||s.push({names:new Set([...Xt(t[2]??""),...t[3]?[t[3]]:[]]),contentStart:r,contentEnd:r+i.length,items:(t[1]??"").trim()})}return s}function Ks(e,s,n){let t=0;for(let r of e.slice(s,n).matchAll(/\{#(?:snippet|key|await)\b|\{\/(?:snippet|key|await)\s*\}/g))if(t+=r[0][1]==="/"?-1:1,t>0)return!0;return!1}function ho(e,s,n="<template>",t="",r=!1){let i=[],o=0,d=null,u="",c=e,f=0,a={window:"w",document:"d"},l={preventDefault:()=>"e.preventDefault()",stopPropagation:()=>"e.stopPropagation()",self:w=>`const __self = e.target.closest && e.target.closest('[data-${w}-' + e.type + ']'); if (__self && e.target !== __self) return;`},p={once:w=>`const __o = e.target && e.target.closest ? e.target.closest('[data-${w}-' + e.type + ']') : null; if (__o) __o.removeAttribute('data-${w}-' + e.type);`},m=[...Object.keys(l),...Object.keys(p),...Object.keys(a)],b=(w,y)=>r?` ${w}={__hk(${JSON.stringify(y)})}`:` ${w}="${y}"`;for(;;){let w=/\bon:(\w+)((?:\|\w+)*)\s*=\s*\{/.exec(c);if(!w){u+=c;break}let y=!1,g=w[2]?w[2].slice(1).split("|"):[],S=g.filter(A=>a[A]);if(S.length>1)throw new L("E-TEMPLATE",`${n}: on:${w[1]} carries both |${S.join(" and |")}`,{hint:"a handler binds to one target - the element (default), |window or |document"});let E=S.length?"on"+a[S[0]]:"on";for(let A of g)if(!m.includes(A))throw new L("E-TEMPLATE",`${n}: unknown event modifier |${A}`,{hint:`the supported modifiers are ${m.map(W=>"|"+W).join(" ")} - capture/passive are listener options a delegated listener cannot carry per element; anything else belongs inside the handler body`});u+=c.slice(0,w.index);let v=w.index+w[0].length,k=1;for(;v<c.length;){let A=c[v];if(A==='"'||A==="'"){v=at(c,v);continue}if(A==="`"){v=pn(c,v);continue}if(A==="{")k++;else if(A==="}"&&(k--,k===0))break;v++}let R=c.slice(w.index+w[0].length,v).trim(),j=new Set;for(let A of e.matchAll(/\{#each\s+[\s\S]+?\s+as\s+([A-Za-z_$][\w$]*)\s*(?:,\s*([A-Za-z_$][\w$]*))?/g))j.add(A[1]),A[2]&&j.add(A[2]);if(/=>/.test(R)&&!/^\w+$/.test(R)){let A=[...j].filter(W=>new RegExp(`\\b${W}\\b`).test(R));if(A.length>0){let W=f+w.index,G=(d??=Qs(e)).filter(fe=>W>=fe.contentStart&&W<fe.contentEnd).sort((fe,ge)=>fe.contentStart-ge.contentStart).pop()??null;if(G!=null&&!Ks(e,G.contentStart,W)&&A.every(fe=>G.names.has(fe)))y=!0;else{let fe=A.find(ge=>!G||!G.names.has(ge))??A[0];throw new L("E-TEMPLATE",`${n}: this inline handler reads the {#each} variable "${fe}" but is hoisted to the page module, where it does not exist`,{file:n,line:At(e,f+w.index),hint:`name the handler in the script block (function onX(e) { ... }) and write on:${w[1]}={onX} - the named form closes over nothing and works for every item`})}}}let J=A=>{if(!g.length)return A;let W=g.filter(Z=>l[Z]).map(Z=>l[Z](E)),G=g.filter(Z=>p[Z]).map(Z=>p[Z](E));return`(e) => {${W.length?" "+W.join("; ")+";":""} (${A})(e);${G.length?" "+G.join("; ")+";":""} }`};if(g.length&&s.has(R))throw new L("E-TEMPLATE",`${n}: event modifiers are not supported on the server action ${R}`,{hint:"$action already preventDefaults - drop the modifiers, or bind a local handler that calls $action"});if(y){let A=t?`__rh_${t}_`:"__rh_";u+=`data-${E}-${w[1]}={__rhreg(${JSON.stringify(A)}, ${g.length?J(R):R})}`,o++}else if(g.length){let A=t?`__h_${t}_${i.length}`:`__h${i.length}`;u+=b(`data-${E}-${w[1]}`,A),i.push({event:w[1],fn:`${A}: ${J(R)}`})}else if(s.has(R))u+=`data-on-${w[1]}="$action:${R}"`;else if(/^\w+$/.test(R))u+=b(`data-on-${w[1]}`,R),i.push({event:w[1],fn:R});else{let A=t?`__h_${t}_${i.length}`:`__h${i.length}`;u+=b(`data-on-${w[1]}`,A),i.push({event:w[1],fn:`${A}: ${R}`})}f+=v+1,c=c.slice(v+1)}return{template:u,bindings:i,inlineCount:o}}function fo(e){let s;try{s=N.readFileSync(e,"utf-8")}catch{return[]}let n=s.replace(Bs,""),t=Ws(n),r=t.match(Hs)?.[1]??t.replace(dn,"").trim(),i=[];for(let o of r.matchAll(/<slot\s+([^>]*?)\/?>/g)){let d=/\bname\s*=\s*["'](\w+)["']/.exec(o[1]);if(!d)continue;let u=[...o[1].matchAll(/\b(\w+)\s*=\s*\{/g)].map(c=>c[1]).filter(c=>c!=="name");i.push({name:d[1],props:u})}return i}function Es(e){let s=[],n=[],t=null,r=0,i=o=>r<=0&&/from\s*['"][^'"]+['"]\s*;?\s*$/.test(o);for(let o of e.split(`
`)){if(t){t.push(o);for(let d of o)d==="{"||d==="("?r++:(d==="}"||d===")")&&r--;i(o)&&(s.push(t.join(`
`)),t=null);continue}if(/^\s*import\b/.test(o)){t=[o],r=0;for(let d of o)d==="{"||d==="("?r++:(d==="}"||d===")")&&r--;i(o)&&(s.push(o),t=null);continue}n.push(o)}return t&&s.push(t.join(`
`)),{imports:s.join(`
`),rest:n.join(`
`)}}var Wt=new Map,Rs=new Map;function Ys(e){let s=Rs.get(e);return s||(s=new Set,Rs.set(e,s)),s}var er=[],po=2e3,As=new WeakMap,Ts=new WeakMap;function mo(e){let s=As.get(e);if(s===void 0){let n=[];for(let[t,r]of e)n.push(`${t}#${r.index}:${r.scopeKey}:${r.slots.join("|")}`);s=n.join(";"),As.set(e,s)}return s}function go(e){let s=Ts.get(e);if(s===void 0){let n=[];for(let t of e){if(!t.transform)continue;let r;try{r=String(t.transform)}catch{r="opaque"}n.push(`${t.name}${mn(r)}`)}s=n.join(""),Ts.set(e,s)}return s}function wo(e,s,n,t,r){let i;try{i=N.statSync(e)}catch{return null}let o=[e,String(i.mtimeMs),String(i.size),s,n?"1":"0",mo(t),go(r)],d=Ys(e);for(let u of d)try{o.push(`${u}${String(N.statSync(u).mtimeMs)}`)}catch{o.push(`${u}gone`)}for(let u of er)try{o.push(`watch:${u}${String(N.statSync(u).mtimeMs)}`)}catch{}return o.join("\0")}var yo=(()=>{try{return String(N.statSync(Ut(import.meta.url)).mtimeMs)}catch{return"noid"}})(),jt=(()=>{try{let e=x.join(qs.tmpdir(),"rosezm-compile-cache");return N.mkdirSync(e,{recursive:!0}),e}catch{return null}})(),bo=0;function mn(e){let s=2166136261;for(let n=0;n<e.length;n++)s^=e.charCodeAt(n),s=Math.imul(s,16777619);return(s>>>0).toString(16).padStart(8,"0")}function tr(e){return x.join(jt,mn(e+"|"+yo)+".json")}function _o(e){if(!jt||process.env.rosezm_NO_DISK_CACHE==="1")return null;try{let s=JSON.parse(N.readFileSync(tr(e),"utf-8"));if(s&&typeof s=="object"&&typeof s.ssr=="string")return s}catch{}return null}function $o(e,s){if(!jt||process.env.rosezm_NO_DISK_CACHE==="1")return;let n=tr(e),t=JSON.stringify(s);N.promises.writeFile(n,t).catch(()=>{N.promises.mkdir(jt,{recursive:!0}).then(()=>N.promises.writeFile(n,t)).catch(()=>{})});try{if(!(bo++&511)){let r=N.readdirSync(jt);if(r.length>5e3)for(let i of r)try{N.unlinkSync(x.join(jt,i))}catch{}}}catch{}}async function xo(e,s,n,t,r,i){let o=wo(e,n,t,i,r);if(o){let u=Wt.get(o);if(u)return{...u};let c=_o(o);if(c)return c}let d=await vo(e,s,n,t,r,i);if(o){if(Wt.size>=po){let u=Wt.keys().next().value;u!==void 0&&Wt.delete(u)}Wt.set(o,d),$o(o,d)}return d}function Cs(e,s){let n=e.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+hotVary\s*=\s*\[([\s\S]*?)\]\s*;?/);if(!n)return;let t=[];for(let r of n[1].split(",")){let i=r.trim().replace(/^['"`]|['"`]$/g,"");if(!i)continue;let o=i.toLowerCase();if(!/^[a-z0-9!#$%&'*+.^_`|~-]+$/.test(o))throw new L("E-EXPORT",`${s}: export const hotVary must list request header names (got '${i}')`,{file:s,line:Me(e,n),hint:"hotVary is a list of the request headers this route negotiates on, e.g. export const hotVary = ['x-locale', 'x-rv-url']"});if(o==="accept-encoding")throw new L("E-EXPORT",`${s}: hotVary must not name accept-encoding - the server stores raw bytes and re-negotiates the encoding on every request`,{file:s,line:Me(e,n),hint:"drop accept-encoding from hotVary; it is already handled per request"});o==="cookie"||o==="accept-language"||t.includes(o)||t.push(o)}return t.length?t:void 0}async function vo(e,s,n,t=!1,r=[],i=new Map){let o=await N.promises.readFile(e,"utf-8");for(let $ of r)if($.transform)try{let C=await $.transform(o,e);if(typeof C=="string")o=C;else{o=C.code;for(let F of C.deps??[])Ys(e).add(F)}}catch(C){throw new L("E-PLUGIN",`plugin ${$.name} failed on ${x.basename(e)}: ${C instanceof Error?C.message:String(C)}`,{file:e,hint:"the error above came from inside the plugin - fix its transform() (or remove the plugin from rosezm.config.js)"})}if(o=fs(o,"web"),t){let $=bs(o).script,C=[...new Set([...[...$.matchAll(/(?:^|\n)\s*export\s+(?:async\s+)?function\s+(\w+)\s*\(/g)].map(U=>U[1]),...[...$.matchAll(/(?:^|\n)\s*export\s+(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:function\b|(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>)/g)].map(U=>U[1])])].filter(U=>Zr.has(U)),F=/getContext\s*\(/.test($)||/\$store\s*\(/.test($)||/\$query\s*\(/.test($),V=/\$store\s*\(/.test($),ie=$.includes("__rosezmAuth"),ce=!F&&/(?:^|\n)\s*export\s+(?:const|let|var)\s+prerender\s*=\s*true\b/.test($),Ne=Es(Ss($,e,i).script),Se=new Set([...$.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]\.\/runtime\.js['"]/g)].flatMap(U=>U[1].split(",").map(Ke=>Ke.trim().split(/\s+as\s+/)[0]).filter(Boolean))),Be=hi.filter(U=>!Se.has(U)),Ge=Be.length>0?`import { ${Be.join(", ")} } from './runtime.js';
`:"";return{ssr:"",client:"",stateKeys:[],actionNames:[],guardName:null,style:"",hasParams:!1,api:`${Ge}${On(`${Ne.imports}
${Ne.rest}`,"ssr").trim()}`,apiMethods:C,hasPrerender:ce,usesContext:F,usesStore:V,usesrosezmAuth:ie,hotVary:Cs($,e)}}let{script:d,rest:u}=bs(o),c=u.replace(dn,""),f=Jr(c),a=n==="_layout"||n.endsWith("/_layout"),l=$=>nr($.replace(/:global\(([^()]*)\)/g,"$1")),p=f.join(`
`),m=p.trim()?a?l(p):sr(p,n):"",b=Ws(c),w=Ss(d,e,i),y=w.script,g=y.includes("__rosezmAuth"),S=w.imports,{imports:E,rest:v}=Es(y);if(x.basename(e)!=="_middleware.rose")for(let $ of uo(E)){let C=E.indexOf($);throw new L("E-NODE-ONLY",`${e}: cannot import '${$}' in a page or component - it never reaches the browser. This module's script ships to the client (its $data bodies included), so move the import to src/pages/_middleware.rose or a pages/api/*.rose handler: those are server-only, and the rows travel to the page through getContext() / $data.`,{file:e,line:C>=0?At(E,C):void 0,hint:`'${$}' is a server-only module: import it inside src/pages/_middleware.rose (or a pages/api/*.rose handler) instead - a page/component script ships to the browser`})}let k=i.get(e)?.scopeKey.startsWith("components/")??!1;if(k&&/\$data\s*\(/.test(y))throw new L("E-EXPORT",`${e}: $data() is not allowed in a component - an imported component renders synchronously inside its parent. Fetch in the page's $data (or pages/_middleware.rose) and pass the value down as a prop: <Card user={user()}>.`,{file:e,hint:"move the fetch to the page (or the middleware) and pass the value down as a prop"});let R=/getContext\s*\(/.test(y)||/\$store\s*\(/.test(y)||/\$query\s*\(/.test(y),j=/\$store\s*\(/.test(y),J=/(?:^|\n)\s*export\s+(?:(?:const|let|var)\s+|(?:async\s+)?function\s+)params\b/.test(y),A=y.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+revalidate\s*=\s*(\d+)\s*;?/),W=A?Number(A[1]):void 0,G=y.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+cache\s*=\s*(\d+)\s*;?/),Z=G?Number(G[1]):void 0,fe=Cs(y,e),ge=y.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+prefetch\s*=\s*['"`](\w+)['"`]\s*;?/),B=ge?ge[1]:void 0;if(B&&!["off","hover","viewport","all"].includes(B))throw new L("E-EXPORT",`${e}: export const prefetch must be 'off', 'hover', 'viewport' or 'all'`,{file:e,line:Me(y,ge),hint:"prefetch is the app-global link strategy, declared once in the root _layout.rose: 'off' | 'hover' (default) | 'viewport' | 'all'"});let T=y.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+lazyHydration\s*=\s*(true|false)\s*;?/),H=T?T[1]==="true":void 0;if(T&&!H)throw new L("E-EXPORT",`${e}: export const lazyHydration must be true (or be absent - hydration is eager by default)`,{file:e,line:Me(y,T),hint:"omit the export entirely, or set it to exactly true - lazy hydration is opt-in per app, declared once in the root _layout.rose"});let te=y.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+vitals\s*=\s*([^;\n]+)\s*;?/),we=te?te[1].trim()==="true":void 0;if(te&&!we)throw new L("E-EXPORT",`${e}: export const vitals must be true (or be absent - the hook ships only when an app asks for it)`,{file:e,line:Me(y,te),hint:"omit the export entirely, or set it to exactly true - the web-vitals hook is opt-in per app"});let Te=y.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+bundle\s*=\s*['"`](\w+)['"`]\s*;?/),Pe=Te?Te[1]:void 0;if(Pe&&!["inline","split","sliced"].includes(Pe))throw new L("E-EXPORT",`${e}: export const bundle must be 'inline', 'split' or 'sliced'`,{file:e,line:Me(y,Te),hint:"'inline' (default) is the single-document mode; 'split' is mode B for large apps - route-level chunks, loaded on demand; 'sliced' inlines the runtime plus each route's own render chain and shares the rest via a nav chunk"});let Ee=y.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+csr\s*=\s*(true|false)\s*;?/),pe=Ee?Ee[1]!=="false":void 0,_e=y.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+shell\s*=\s*(true|false)\s*;?/),z=_e?_e[1]!=="false":void 0,Le=y.match(/(?:^|\n)\s*export\s+(?:const|let|var)\s+buffer\s*=\s*(true|false)\s*;?/),Je=Le?Le[1]!=="false":void 0,Y=/\b(?:redirect|notFound)\s*\(/.test(y)||void 0;if(pe===!1){let $=/\son:[a-z]+\s*=/.exec(o)??/\b(?:onMount|onCleanup|refresh)\s*\(/.exec(y);if($){let C=$===(/\son:[a-z]+\s*=/.exec(o)??void 0)?o:y;throw new L("E-EXPORT",`${e}: csr = false cannot ship ${$[0].trim()} - event wiring, onMount/onCleanup and refresh() all need the client bundle. (Forms still work without JS: a native POST runs the server action.)`,{file:e,line:Me(C,$),hint:'drop csr = false (let the compiler decide), or remove the client-only code - a native <form method="POST"> server action works without the bundle'})}}let X,D=Ps(y,"headers");if(D){let $;try{$=new Function(`return ${D}`)()}catch{throw new L("E-EXPORT",`${e}: export const headers must be an object literal`,{file:e,hint:"write it as one literal: export const headers = { 'x-robots-tag': 'noindex' }"})}if(!$||typeof $!="object"||Array.isArray($)||Object.values($).some(C=>typeof C!="string"))throw new L("E-EXPORT",`${e}: export const headers must be a flat map of string -> string`,{file:e,hint:"every value must be a string literal (a number or an array fails here instead of shipping verbatim)"});X=$}let re,oe=Ps(y,"csp");if(oe){let $;try{$=new Function(`return ${oe}`)()}catch{throw new L("E-EXPORT",`${e}: export const csp must be an object literal`,{file:e,hint:"write it as one literal: export const csp = { nonce: true }"})}let C=$?.nonce;if(C!==void 0&&typeof C!="boolean")throw new L("E-EXPORT",`${e}: csp.nonce must be a boolean`,{file:e,hint:"csp.nonce is a switch: true (per-request nonce, the route becomes dynamic) or absent (the default hashed policy)"});re=C===!0}let{clean:ne,exports:$e,actions:Ce,props:ue,guard:se}=So(v),Q=ne,ee=new Set(Ce.map($=>$.name)),me=[];/\son:[a-z]+\s*=/.test(o)&&me.push("event wiring (on:)"),/\sbind:(?:value|checked|group|open)\s*=/.test(o)&&me.push("a two-way binding (bind:)"),(/<form[^>]*\son:[a-z]+\s*=/i.test(o)||/\$action:|data-on-/.test(o))&&me.push("a form bound to a client dispatch ($action)");let Fe=y.match(/\b(?:onMount|onCleanup|refresh|adopt)\s*\(|(?:\$action|\$effect)\s*\(/);Fe&&me.push(`${Fe[0].replace(/\s*\($/,"")}()`),o.includes("{#defer")&&me.push("{#defer} progressive content"),o.includes("{#await")&&me.push("{#await} async block");let We=me.length>0,De=[];if(!We){let $=ks(o),C=ks(y),F=ao(C);/\son[a-z]+\s*=\s*["'][^"']*["']/i.test($)&&De.push('an inline on* attribute (e.g. onclick="...") - it cannot fire without the bundle; use on:click or set csr = true'),/javascript:/i.test($)&&De.push("a javascript: URL - it needs the bundle to run; link to a real route"),/\b(?:eval|new Function)\s*\(/.test(F)&&De.push("eval()/new Function() - client code the predicate cannot see"),/\b(?:document|window|localStorage|sessionStorage)\s*\.|\b(?:add|remove)EventListener\s*\(|\brequestAnimationFrame\s*\(|\bMutationObserver\b|\bnavigator\s*\.|\blocation\s*\.\s*(?:href|assign|replace|reload|pathname|search|hash|origin)\b|\b(?:setTimeout|setInterval)\s*\(/.test(F)&&De.push("browser-only code (document./window./addEventListener/a timer/...) - a JS-free document never ships this script to the browser, so it throws on the server or runs there and never reaches the client; if the route needs the browser, set csr = true")}let Ze=b.match(Hs),Xe=u.match(dn)?.[1]??"",de=Ze?Ze[1]:b.replace(Hr,"").trim(),Oe=m?ko(Is(de,s),n):Is(de,s),Ie=Ro(Q),lt=Ie.filter($=>$.kind==="state"||$.kind==="kv"||$.kind==="persist"),Ue=Ie.filter($=>$.kind==="derived").map($=>$.name),bt=[...lt.map($=>$.name),...Ie.filter($=>$.kind==="data").map($=>$.name),...Ue],xe=new Map;lt.forEach($=>xe.set($.name,`set${Ye($.name)}`));{let $=Qt(y),C=new Set;for(let F of $.matchAll(/(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g))C.add(F[1]);for(let F of $.matchAll(/(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g))C.add(F[1]);for(let F of lt){let V=xe.get(F.name);if(C.has(V))throw new L("E-SCRIPT",`${e}: the automatic setter "${V}" for $state("${F.name}") collides with a same-named declaration in the script`,{file:e,hint:`rename your function, or drop the auto setter and write $setState("${F.name}", v) - the explicit form never collides`});if(zs.has(F.name))throw new L("E-SCRIPT",`${e}: the $state name "${F.name}" collides with the framework's runtime import of the same name`,{file:e,hint:`rename the variable (e.g. ${F.name}_status) - a name matching a runtime export (${[...zs].slice(0,4).join(", ")}...) makes the bundle self-reference and 500 at render`})}}let Lt=(()=>{let $=["state","derived","kv","persist"],C=Ie.map((ce,Ne)=>({d:ce,i:Ne})).filter(({d:ce})=>$.includes(ce.kind)),F=new Set(C.map(({d:ce})=>ce.name)),V=[],ie=new Set;for(let ce=0;ce<=C.length;ce++){let Ne=!1;for(let{d:Se,i:Be}of C){if(ie.has(Se.name))continue;[...new Set([...Se.expr.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)].map(U=>U[1]))].filter(U=>F.has(U)&&U!==Se.name).every(U=>ie.has(U))&&(V.push(Be),ie.add(Se.name),Ne=!0)}if(!Ne)break}return V})(),_t=$=>{let C=k?`${n}:${$.name}`:$.name,F=k?`__ik(${JSON.stringify(C)})`:JSON.stringify(C);if($.kind==="state")return`const [${$.name}, ${xe.get($.name)}] = state(${F}, ${$.expr});`;let ie=$.expr.includes("=>")||$.expr.startsWith("function")?$.expr:`() => (${$.expr})`;if($.kind==="persist")return`const [${$.name}, ${xe.get($.name)}] = persistState(${F}, ${$.expr});`;if($.kind==="derived")return`const ${$.name} = () => (${ot($.expr,bt)});`;if($.kind==="kv"){let ce=/^(.*)\s*,\s*(\d+)\s*$/s.exec($.expr),Ne=ce?ce[1]:$.expr,Se=ce?ce[2]:"300";return`const __seeded_${$.name} = isSeeded(${F});
const [${$.name}, set${Ye($.name)}] = state(${F}, null);
if (!__seeded_${$.name}) { const __v_${$.name} = await globalThis.__rosezmKvApi.kvMemo(${k?`__ik(${JSON.stringify("__kvh:"+n+":"+$.name)})`:JSON.stringify("__kvh:"+n+":"+$.name)}, ${Ne}, ${Se}); set${Ye($.name)}(__v_${$.name}); markSeeded(${F}); }`}return`const __seeded_${$.name} = isSeeded(${F});
const [${$.name}, set${Ye($.name)}] = state(${F}, null);
if (!__seeded_${$.name}) { const __v_${$.name} = await $data(${ie}); set${Ye($.name)}(__v_${$.name}); markSeeded(${F}); }`},$t=[],xt="",vt=0;Ie.forEach(($,C)=>{let F=Ao(Q,$.start)===0;if(!F){if($.kind==="derived")throw new Error(`${e}: $derived must be a top-level declaration - inside a function body a plain const arrow already does this natively`);$t.push($)}xt+=Q.slice(vt,$.start)+(F?`'__rvdecl${C}__';`:""),vt=$.end}),xt+=Q.slice(vt);let xn=new Set(lt.map($=>$.name)),It=$=>xn.has($),kt=os(Q);if(kt)throw new L("E-STATE",`${e}: ${kt} is a $derived value and is written here - a $derived is read-only`,{hint:`make ${kt} a $state, or derive a different name from it`});let Ve=Tn(xt,It).replace($s,($,C,F)=>{let V=C.trim().replace(/^['"`]|['"`]$/g,"");if(Ue.includes(V))throw new Error(`${e}: $setState('${V}', ...) - a $derived value is read-only; make it $state or derive a different expression`);return`${xe.get(V)||`set${Ye(V)}`}(${F})`});if(Ve=ot(Ve,bt),[...Ve.matchAll(/'__rvdecl(\d+)__';/g)].length===Lt.length){let C=0;Ve=Ve.replace(/'__rvdecl(\d+)__';/g,(F,V)=>_t(Ie[Lt[C++]??Number(V)]))}else Ve=Ve.replace(/'__rvdecl(\d+)__';/g,(C,F)=>_t(Ie[Number(F)]));let en=$t.filter($=>$.kind==="state").map(_t).join(`
`),St=$t.filter($=>$.kind==="data").map(_t).join(`
`),tn=is(Oe,It).replace($s,($,C,F)=>{let V=C.trim().replace(/^['"`]|['"`]$/g,"");if(Ue.includes(V))throw new L("E-STATE",`${e}: $setState('${V}', ...) in a template handler - a $derived value is read-only`,{hint:`make ${V} a $state, or derive a different name from it`});return`${xe.get(V)||`set${Ye(V)}`}(${F})`}),kn=Nn(tn,bt).replace(/<img\b(?![^>]*?\sloading=)/gi,'<img loading="lazy"').replace(/<img\b(?![^>]*?\sdecoding=)/gi,'<img decoding="async"'),zt=n.replace(/[^\w]/g,"_").replace(/^_+|_+$/g,"").slice(-40),ct=ho(kn,ee,e,zt,k),Ft=ct.inlineCount,He=Ie.filter($=>$.kind!=="derived").map($=>$.name),qe=[],tt=0,nn=new Set(S.map($=>$.name)),Et=new Set(ue.map($=>$.name)),Rt=!1,sn=ct.template.replace(/\sbind:(value|checked|this|open)\s*=\s*\{([\w$]+)(?:\(\))?((?:\.[\w$]+(?:\(\))?)*)\}/g,($,C,F,V,ie,ce)=>{let Ne=ce.lastIndexOf("<",ie),Se=Ne>=0?ce.slice(Ne,ie):"",Be=/^<([a-zA-Z][^\s/>]*)/.exec(Se)?.[1]??"",Ge=F+V,U=F,Ke=V.split(".").filter(Boolean).map(ze=>ze.replace(/\(\)$/,"")),Bt=Ke.length>0;if(!He.includes(U)&&!Et.has(U)&&!Bt)throw new Error(`${e}: bind:${C}={${Ge}} must name a $state declaration`+(He.length?` (state keys here: ${He.join(", ")})`:" (this file declares no $state)"));if(Bt&&!He.includes(U)){let be=Qs(ct.template).filter(st=>ie>=st.contentStart&&ie<st.contentEnd).sort((st,Rr)=>st.contentStart-Rr.contentStart).pop()??null;if(!be||!be.names.has(U)||Ks(ct.template,be.contentStart,ie))throw new Error(`${e}: bind:${C}={${Ge}} binds a field of "${U}", which is not a $state declaration`+(He.length?` (state keys here: ${He.join(", ")})`:" (this file declares no $state)"));let Ae=be.items,nt=[...xe.keys()].find(st=>Ae===st||Ae===`${st}()`);if(!nt)throw new Error(`${e}: bind:${C}={${Ge}} - the {#each} source "${Ae}" is not a plain $state read, so the row edit has no state to write back through. Copy the row into a $state and bind through it`);let En=xe.get(nt),ns=Ke;Rt=!0,Ft++;let Er=C==="checked"?"e.target.checked":"__rvraw(e)",Rn=`(e) => __rvrow(${En}, ${Ae}, ${U}, ${JSON.stringify(ns)}, ${Er})`,An=zt?`__rh_${zt}_`:"__rh_",ss=`${U}${ns.map(st=>`.${st}`).join("")}`;return C==="checked"?` checked={${ss}} data-on-change={__rhreg(${JSON.stringify(An)}, ${Rn})}`:` value={${ss}} data-on-input={__rhreg(${JSON.stringify(An)}, ${Rn})} data-on-change={__rhreg(${JSON.stringify(An)}, ${Rn})}`}if(C==="this")return k?` data-bind-this={__ik(${JSON.stringify(`${n}:${U}`)})}`:` data-bind-this="${U}"`;if(!He.includes(U)){let ze="on"+Ye(C)+"Change",be=`__rvbind_${n.replace(/\W/g,"_")}_${tt++}`,Ae=nt=>k?` data-on-${nt}={__hk(${JSON.stringify(be)})}`:` data-on-${nt}="${be}"`;return/^<select[\s>]/i.test(Se)&&/\smultiple\b/i.test(Se)?(qe.push({event:"change",fn:`${be}: (e) => __p.${ze}?.(Array.from(e.target.selectedOptions, (o) => o.value))`}),` data-selmulti={(__rvlive('value', ${U}) || []).join(',')}${Ae("change")}`):C==="checked"?(qe.push({event:"change",fn:`${be}: (e) => __p.${ze}?.(e.target.checked)`}),` checked={__rvlive('checked', ${U})}${Ae("change")}`):C==="open"?(qe.push({event:"toggle",fn:`${be}: (e) => __p.${ze}?.(e.target.open)`}),` open={__rvlive('open', ${U})}${Ae("toggle")}`):(qe.push({event:"input",fn:`${be}: (e) => { const t = e.target; const raw = t.type === 'number' || t.type === 'range' ? t.valueAsNumber : t.value; __p.${ze}?.(typeof raw === 'number' && Number.isNaN(raw) ? null : raw); }`}),` value={__rvlive('value', ${U})}${Ae("input")}${Ae("change")}`)}if(Bt){Rt=!0;let ze=xe.get(U),be=`${U}()`+Ke.map(En=>`.${En}`).join(""),Ae=`__rvbind_${n.replace(/\W/g,"_")}_${tt++}`,nt=`${ze}(__rvsetpath(${U}(), ${JSON.stringify(Ke)}, ${C==="checked"?"e.target.checked":"__rvraw(e)"}))`;return C==="checked"?(qe.push({event:"change",fn:`${Ae}: (e) => { ${nt}; }`}),` checked={${be}}${k?` data-on-change={__hk(${JSON.stringify(Ae)})}`:` data-on-change="${Ae}"`}`):(qe.push({event:"input",fn:`${Ae}: (e) => { ${nt}; }`}),qe.push({event:"change",fn:`${Ae}: (e) => { ${nt}; }`}),` value={${be}}${k?` data-on-input={__hk(${JSON.stringify(Ae)})} data-on-change={__hk(${JSON.stringify(Ae)})}`:` data-on-input="${Ae}" data-on-change="${Ae}"`}`)}if(Be&&nn.has(Be)){let ze=xe.get(U),be="on"+Ye(C)+"Change";return` ${C}={${U}()} __live-${C}={${U}} ${be}={${ze}}`}if(C==="value"&&/^<select[\s>]/i.test(Se)&&/\smultiple\b/i.test(Se)){let ze=xe.get(U),be=`__rvbind_${n.replace(/\W/g,"_")}_${tt++}`;return qe.push({event:"change",fn:`${be}: (e) => ${ze}(Array.from(e.target.selectedOptions, (o) => o.value))`}),` data-selmulti={${U}().join(',')} data-on-change="${be}"`}if(C==="open"){let ze=xe.get(U),be=`__rvbind_${n.replace(/\W/g,"_")}_${tt++}`;return qe.push({event:"toggle",fn:`${be}: (e) => ${ze}(e.target.open)`}),` open={${U}()}${k?` data-on-toggle={__hk(${JSON.stringify(be)})}`:` data-on-toggle="${be}"`}`}let ln=xe.get(U),Sn=C==="checked"?"change":"input",ut=`__rvbind_${n.replace(/\W/g,"_")}_${tt++}`;qe.push({event:Sn,fn:C==="checked"?`${ut}: (e) => ${ln}(e.target.checked)`:`${ut}: (e) => { const t = e.target; const raw = t.type === 'number' || t.type === 'range' ? t.valueAsNumber : t.value; ${ln}(typeof raw === 'number' && Number.isNaN(raw) ? null : raw); }`});let Sr=C==="checked"?k?` data-on-change={__hk(${JSON.stringify(ut)})}`:` data-on-change="${ut}"`:k?` data-on-input={__hk(${JSON.stringify(ut)})} data-on-change={__hk(${JSON.stringify(ut)})}`:` data-on-input="${ut}" data-on-change="${ut}"`;return` ${C}={${U}()}${Sr}`}),rn=new Map(S.map($=>{let C=x.resolve(x.dirname(e),$.specifier),F=i.get(C);return[$.name,{index:F.index,slots:F.slots}]})),Dt=[],on=0,mt=!Et.size||!/<(input|textarea|select)[\s>]/i.test(sn)?sn:Pt(sn,$=>{let{tag:C,attrs:F}=$;if(!/^(input|textarea|select)$/i.test(C)||/\sdata-on-input=|\sdata-selmulti=/.test(F))return null;let V=/\svalue\s*=\s*\{([\w$]+)\}/.exec(F);if(!V||!Et.has(V[1]))return null;let ie=V[1],ce=`__rvbind_${n.replace(/\W/g,"_")}_${tt++}`;qe.push({event:"input",fn:`${ce}: (e) => { const t = e.target; const raw = t.type === 'number' || t.type === 'range' ? t.valueAsNumber : t.value; __p.onValueChange?.(typeof raw === 'number' && Number.isNaN(raw) ? null : raw); }`});let Ne=/^select$/i.test(C)&&/\smultiple\b/i.test(F),Se=F.replace(V[0],` value={__rvlive('value', ${ie})}`),Be=U=>k?` data-on-${U}={__hk(${JSON.stringify(ce)})}`:` data-on-${U}="${ce}"`,Ge=Ne?` data-selmulti={(__rvlive('value', ${ie}) || []).join(',')}${Be("change")}`:`${Be("input")}${Be("change")}`;return Se+Ge}),h=mt.includes("bind:group")?Pt(mt,$=>{let{tag:C,attrs:F}=$,V=/\sbind:group\s*=\s*\{([\w$]+)(?:\(\))?\}/.exec(F);if(!V)return null;let ie=V[1],ce=!He.includes(ie);if(ce&&!Et.has(ie))throw new L("E-TEMPLATE",`${e}: bind:group={${ie}} must name a $state declaration`,{hint:"the group state holds the selected value (radio) or an ARRAY of checked values (checkbox) - declare it: let "+ie+' = $state("")'});if(!ce&&nn.has(C)){let Sn=xe.get(ie);return F.replace(V[0],` group={${ie}()} __live-group={${ie}} onGroupChange={${Sn}}`)}if(!/\stype\s*=\s*["'](radio|checkbox)["']/.test(F))throw new L("E-TEMPLATE",`${e}: bind:group is for radio and checkbox inputs`,{hint:'<input type="radio" value="v" bind:group={state}> holds the selected value; type="checkbox" holds an ARRAY of the checked values (declare the state as $state([]))'});let Ne=/\stype\s*=\s*["']checkbox["']/.test(F),Se=/\svalue\s*=\s*"([^"]*)"|\svalue\s*=\s*'([^']*)'/.exec(F);if(!Se||/\{/.test(Se[0]))throw new L("E-TEMPLATE",`${e}: a bind:group input needs a static value attribute`,{hint:'<input type="radio" value="free" bind:group={plan}> - the value IS what the state receives'});if(/\schecked\s*=/.test(F))throw new L("E-TEMPLATE",`${e}: a bind:group input cannot also carry checked=`,{hint:"the group state alone decides which inputs are checked"});let Be=ce?"":xe.get(ie),Ge=`__rvbg_${n.replace(/\W/g,"_")}_${on++}`,U=JSON.stringify(Se[1]??Se[2]),Ke=ce?`__rvlive('group', ${ie})`:`${ie}()`,Bt=Ne?`${Ke}.includes(${U})`:`${Ke} === ${U}`,ln=Ne?ce?`__p.onGroupChange?.(e.target.checked ? [...${Ke}, ${U}] : ${Ke}.filter((x) => x !== ${U}))`:`${Be}(e.target.checked ? [...${ie}(), ${U}] : ${ie}().filter((x) => x !== ${U}))`:ce?"__p.onGroupChange?.(e.target.value)":`${Be}(e.target.value)`;return Dt.push({event:"change",fn:`${Ge}: (e) => { ${ln}; }`}),F.replace(V[0],` checked={${Bt}}${k?` data-on-change={__hk(${JSON.stringify(Ge)})}`:` data-on-change="${Ge}"`}`)}):mt,_=ct.bindings.concat(qe,Dt),P=h.replace(/\suse:([\w-]+)(\s*=\s*\{([\s\S]*?)\})?/g,($,C,F,V)=>F?` data-use="${C}" data-use-param={JSON.stringify(${V})}`:` data-use="${C}"`),I=ps(P,"web"),q=Mo(I,e),M=Po(q),O=zo(M,e),K=Lo(O,e),ve=Io(K,e),je=jo(ve,e),he=Do(je),le=qo(he),Re=Ho(le.template,e),Qe=Fo(Re.template,e),an=Zo(Qe.replace(Vr,($,C,F)=>{let V=`{__slot(${xs(C)})}`;if(F){if(/\{[^{}]*\}/.test(F))throw new L("E-TEMPLATE",`${e}: slot fallback content must be static markup`,{hint:"a {expr} inside a slot fallback has no reactive scope here - render the dynamic part in the parent and pass it as the slot content"});return`{__slot(${xs(C)}, ${JSON.stringify(F)})}`}return V}).replace(Ur,($,C)=>C&&C.trim()?`{__slotDefault(${JSON.stringify(C)})}`:"{__slot__}"),rn);Go(an,e);let Gn=new Set;{let $=Qt(y),C=new Set(lt.map(V=>V.name)),F=V=>/^(?:async\s*)?(?:function\b|\([^)]*\)\s*=>)/.test(V)||/^(?:async\s*)?\(/.test(V)&&V.includes("=>")||/^(?:async\s+)?[A-Za-z_$][\w$]*\s*=>/.test(V);for(let V of $.matchAll(/(?:^|\n)\s*(?:export\s+)?(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;]{0,200})/g))C.has(V[1])||/^\s*\$state\b/.test(V[2])||F(V[2].trim())||Gn.add(V[1])}Mn=0,Gt=e,hn=new Set,Ln=!0,Fn=new Set(Gn);let Zn=et(an,"h","__c",null,0,!0,rn);Ln=!1,Fn=new Set;let Xn=In,$r=zn;In="",zn={},hn=new Set;let Qn=Dn;if(Dn=null,Qn)throw new L("E-TEMPLATE",`${e}: {@const ${Qn}} is declared twice at the top level`,{file:e,hint:"a const cannot be redeclared in the same scope - rename one of them, or wrap the second in a block ({#if}/{#each}) where it shadows the first instead of colliding with it"});for(let $ of _)/^\w+$/.test($.fn)||($.fn=ot($.fn,[],$r));let qt=Xe.trim()?Wo(Xe):"";if(!k&&m){let C=`<style id="${"rosezm-style-"+n.replace(/[^a-zA-Z0-9_-]/g,"-")}">${m}</style>`;qt=(qt?qt+`
`:"")+`__hd += ${JSON.stringify(C)};`}let Kn=/<slot\s+[^>]*\bname\s*=/.test(Oe),Yn=Ce.length>0?`${$e}
${Ce.map($=>$.stmt).join(`
`)}`:$e,es=se?`
${se}`:"",xr=x.basename(e)==="_middleware.rose",ts=Bo(le.count,le.holds)+(Re.blocks.length?`
`+Jo(Re.blocks):""),vr=xr?`${Nt}

${E}

${Yn}
${es}

${Ve}
`:fi(Ve+ts,Zn,en,Yn,qt,ue,Kn,E,k,es,Ce.length>0,St,Xn,Ft>0,Rt),kr=pi(Ve+ts,Zn,en,_,$e,qt,ue,Kn,E,k,St,Xn,Ft>0,Rt);return{ssr:On(vr,"ssr"),client:On(kr,"client"),stateKeys:He,actionNames:[...ee],guardName:se?"beforeAction":null,style:m,hasParams:J,usesContext:R,usesStore:j,revalidate:W,cache:Z,hotVary:fe,csr:pe,shell:z,buffer:Je,controlSignal:Y,prefetch:B,lazyHydration:H,vitals:we,bundle:Pe,needsClient:We,clientReasons:me,jsWarnings:De,headers:X,cspNonce:re,usesrosezmAuth:g,props:ue,roseImports:S,isComponent:k}}function nr(e){return e.replace(/(-?\d*\.?\d+)rpx/g,(s,n)=>{let t=Number(n)/2;return t===0?"0":`${Math.round(t*100)/100}px`})}function js(e){return e.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^"']+/g,s=>s[0]==='"'||s[0]==="'"?s:s.replace(/\s+/g," ").replace(/\s*([:;{},])\s*/g,"$1").trim()).trim()}function sr(e,s){let n=`[data-rosezm-c="${s}"]`,t=u=>{let c=u.trim();if(!c.includes(":global"))return`${n} ${c}, ${n}${c}`;let f=c.replace(/:global\([^()]*\)/g,l=>l.slice(8,-1)).trim();return c.replace(/:global\([^()]*\)/g,"").trim()?`${n} ${f}, ${n}${f}`:f},r=nr(e.replace(/\/\*[\s\S]*?\*\//g,"")),i="",o="",d=0;for(;d<r.length;){let u=r[d];if(u==="{"){let c=1,f=d+1;for(;f<r.length&&c>0;)r[f]==="{"?c++:r[f]==="}"&&c--,f++;let a=r.slice(d+1,f-1),l=o.trim();if(l.startsWith("@"))i+=`${l}{${/^@(?:-[\w]+-)?keyframes/.test(l)?js(a):sr(a,s)}}`;else if(l){let p=l.split(",").map(m=>t(m)).join(",");i+=`${p}{${js(a)}}`}o="",d=f;continue}u!=="}"&&u!==`
`&&u!=="\r"?o+=u:u==="}"&&(o=""),d++}return i.trim()}function ko(e,s){let n=` data-rosezm-c="${s}"`,t="",r=0,i=0;for(;i<e.length;){let o=e.indexOf("<",i);if(o===-1){t+=e.slice(i);break}t+=e.slice(i,o);let d=o+1,u="",c=0,f=0;for(;d<e.length;){let b=e[d];if(u)b===u&&(u="");else if(b==='"'||b==="'")u=b;else if(b==="(")c++;else if(b===")")c=Math.max(0,c-1);else if(b==="{")f++;else if(b==="}")f=Math.max(0,f-1);else if(b===">"&&c===0&&f===0)break;d++}let a=e.slice(o,d+1),l=/^<\//.test(a),p=a.match(/^<\/?([a-zA-Z][\w-]*)/),m=/\/>$/.test(a)||p&&rr.has(p[1].toLowerCase());if(p&&!l&&r===0&&!m){let b=a.endsWith("/>")?a.length-2:a.length-1;t+=a.slice(0,b)+n+a.slice(b),r++}else t+=a,p&&(r+=l?-1:m?0:1);i=d+1}return t}var rr=new Set(["img","br","hr","input","meta","link","source","wbr"]),Os=/^[ \t]*export\s+(?:(const|let|var)|(?:async\s+)?function)\s+(\w+)/gm;function Ps(e,s){let n=new RegExp(`(?:^|\\n)\\s*export\\s+(?:const|let|var)\\s+${s}\\s*=\\s*`).exec(e);if(!n)return null;let t=n.index+n[0].length;if(e[t]!=="{")return null;let r=t,i=0;for(;t<e.length;t++){let o=e[t];if(o==="{")i++;else if(o==="}"&&(i--,i===0)){t++;break}}return e.slice(r,t)}function So(e){let s=[],n=[],t=[],r=[],i="",o=0,d;for(Os.lastIndex=0;d=Os.exec(e);){let u=d[1],c=d.index+d[0].indexOf("export"),f=c+d[0].length-d[0].indexOf("export");if(u){let m=0,b=!1;for(;f<e.length;){let w=e[f];if(w==="("||w==="{"||w==="[")m++;else if(w===")"||w==="}"||w==="]"){if(m--,m===0&&b){f++;break}}else if(m===0&&w==="="){let y=f>0?e[f-1]:"",g=f+1<e.length?e[f+1]:"";y!=="="&&y!=="!"&&y!=="<"&&y!==">"&&g!=="="&&g!==">"&&(b=!0)}else if(m===0&&w===";"){f++;break}else if(m===0&&w===`
`){let y=e.slice(f+1);if(!/^\s*[.([{+\-*/?:,=&|]/.test(y)){f++;break}}f++}e[f]===";"&&f++}else{for(;f<e.length&&e[f]!=="{";)f++;let m=0;for(;f<e.length;){let b=e[f];if(b==="{")m++;else if(b==="}"&&(m--,m===0)){f++;break}f++}}i+=e.slice(o,c);let a=e.slice(c,f).trim(),l=a.match(/^export\s+async\s+function\s+(\w+)/);if(a.match(/^export\s+(?:async\s+)?function\s+(\w+)/)?.[1]==="beforeAction")r.push(a);else if(l)n.push({name:l[1],stmt:a});else if(u==="let"){let m=/^export\s+let\s+(\w+)/.exec(a);if(m){let b=0,w="",y=-1;for(let S=m[0].length;S<a.length;S++){let E=a[S];if(w){E==="\\"?S++:E===w&&(w="");continue}if(E==="'"||E==='"'||E==="`"){w=E;continue}if(E==="("||E==="["||E==="{")b++;else if(E===")"||E==="]"||E==="}")b--;else if(b===0&&E==="="){let v=S>0?a[S-1]:"",k=S+1<a.length?a[S+1]:"";if(v==="="||v==="!"||v==="<"||v===">"||k==="="||k===">")continue;y=S;break}}let g=y>=0?a.slice(y+1).replace(/;\s*$/,"").trim():"";t.push({name:m[1],def:g===""?null:g})}else s.push(a)}else s.push(a);o=f}return i+=e.slice(o),{clean:i,exports:s.join(`
`),actions:n,props:t,guard:r.join(`
`)}}var Eo=new Set("(,=:[!&|?{};+-*%<>~^".split(""));function Hn(e,s){let n=s-1;for(;n>=0&&/\s/.test(e[n]);)n--;if(n<0)return!0;let t=e[n];if(Eo.has(t))return!0;if(/[A-Za-z0-9_$]/.test(t)){let r=Xs(e,n);return r?["return","typeof","instanceof","in","of","new","delete","void","throw","case","do","else"].includes(r):!1}return!1}function Jn(e,s,n=e.length){let t=s+1,r=!1;for(;t<n;){let i=e[t];if(i==="\\"){t+=2;continue}if(r){i==="]"&&(r=!1),t++;continue}if(i==="["){r=!0,t++;continue}if(i==="/"||i===`
`)break;t++}for(e[t]==="/"&&t++;t<n&&/[a-z]/.test(e[t]);)t++;return t}function Ro(e){let s=[],n=Qt(e);_s.lastIndex=0;let t;for(;t=_s.exec(n);){let r=t.index+t[0].length,i=()=>{for(;r<e.length&&/\s/.test(e[r]);)r++};if(i(),e[r]==="<"){let a=0;for(;r<e.length;){let l=e[r];if(l==="<")a++;else if(l===">"&&e[r-1]!=="="){if(a--,a===0){r++;break}}else l==="="&&e[r+1]===">"&&r++;r++}i()}if(e[r]!=="(")continue;let o=r+1,d=1,u=o;for(;u<e.length&&d>0;){let a=e[u];a==="("?d++:a===")"&&d--,u++}let c=u,f=Wr.exec(e.slice(u));f&&(c=u+f[0].length),e[c]===";"&&c++,s.push({name:t[1],kind:t[2],expr:e.slice(o,u-1).trim(),start:t.index,end:c})}return s}function Ao(e,s){let n=0,t=0;for(;t<s;){let r=e[t];if(r==="'"||r==='"'||r==="`"){let i=r;for(t++;t<s;){if(e[t]==="\\"){t+=2;continue}if(e[t]===i){t++;break}if(i==="`"&&e[t]==="$"&&e[t+1]==="{"){let o=1;for(t+=2;t<s&&o>0;)e[t]==="{"?o++:e[t]==="}"&&o--,t++;continue}t++}continue}if(r==="/"&&e[t+1]==="/"){let i=e.indexOf(`
`,t);t=i===-1?e.length:i;continue}if(r==="/"&&e[t+1]==="*"){let i=e.indexOf("*/",t+2);t=i===-1?e.length:i+2;continue}if(r==="/"&&Hn(e,t)){t=Jn(e,t,s);continue}r==="{"?n++:r==="}"&&n--,t++}return n}function Qt(e){let s="",n=0,t=(r,i)=>{for(let o=r;o<i&&o<e.length;o++)s+=e[o]===`
`?`
`:" "};for(;n<e.length;){let r=e[n];if(r==="'"||r==='"'||r==="`"){let i=r,o=n+1;for(;o<e.length;){if(e[o]==="\\"){o+=2;continue}if(e[o]===i){o++;break}if(i==="`"&&e[o]==="$"&&e[o+1]==="{"){let d=Kt(e,o+1);o=d<0?e.length:d+1;continue}o++}t(n,Math.min(o,e.length)),n=o;continue}if(r==="/"&&e[n+1]==="/"){let i=e.indexOf(`
`,n),o=i===-1?e.length:i;t(n,o),n=o;continue}if(r==="/"&&e[n+1]==="*"){let i=e.indexOf("*/",n+2),o=i===-1?e.length:i+2;t(n,o),n=o;continue}if(r==="/"&&Hn(e,n)){let i=Jn(e,n);t(n,i),n=i;continue}s+=r,n++}return s}var To=new Set(["true","false","null","undefined","NaN","Infinity"]);function ft(e,s,n){if(!s)return e;let t=new RegExp(s.source,(s.flags.includes("g")?s.flags.replace("g",""):s.flags)+"y"),r="",i=0,o=e.length;for(;i<o;){let d=e[i];if(d==="/"&&e[i+1]==="/"){let c=e.indexOf(`
`,i),f=c<0?o:c;r+=e.slice(i,f),i=f;continue}if(d==="/"&&e[i+1]==="*"){let c=e.indexOf("*/",i+2),f=c<0?o:c+2;r+=e.slice(i,f),i=f;continue}if(d==='"'||d==="'"){let c=i+1;for(;c<o;){if(e[c]==="\\"){c+=2;continue}if(e[c]===d){c+=1;break}c+=1}r+=e.slice(i,c),i=c;continue}if(d==="`"){let c=i+1,f="";for(;c<o;){if(e[c]==="\\"){c+=2;continue}if(e[c]==="`"){c+=1;break}if(e[c]==="$"&&e[c+1]==="{"){let a=1,l=c+2;for(;l<o&&a>0&&(e[l]==="{"?a+=1:e[l]==="}"&&(a-=1),a!==0);)l+=1;f+=ft(e.slice(c+2,l),s,n),c=l+1;continue}c+=1}r+=e.slice(i,c),i=c;continue}t.lastIndex=i;let u=t.exec(e);if(u){r+=n,i+=u[0].length;continue}r+=d,i+=1}return r}function Ns(e){let s=e.trim();return/^[A-Za-z_$][\w$]*$/.test(s)&&Fn.has(s)?s:/^[A-Za-z_$][\w$]*$/.test(s)&&s!=="__s"&&!To.has(s)?`${s}()`:s}var Co=!0;function jo(e,s){if(!e.includes("{#key"))return e;for(let n=0;n<10;n++){let t=/\{#key\b/g;t.lastIndex=0;let r=t.exec(e);if(!r)return e;let i=it(e,r.index);if(i<0)return e;let o=e.slice(r.index+5,i-1).trim();if(!o)return e;let d=i,u=/\{[#\/](?:key|if|each|boundary|island)\b/g;u.lastIndex=d;let c=1,f=-1,a;for(;a=u.exec(e);){if(a[0].startsWith("{#")){let l=it(e,a.index);l>=0&&(u.lastIndex=l),c++;continue}if(c--,c===0){f=a.index;break}}if(f<0)throw new L("E-TEMPLATE",`${s}: {#key ${o}} is never closed`,{hint:"every {#key} needs its {/key}"});e=e.slice(0,r.index)+`{#each [${o}] as __rvkv}`+e.slice(d,f)+"{/each}"+e.slice(f+6)}return e}function Oo(e){let s=/\{#(?:if|each|boundary|island)\b|\{\/(?:if|each|boundary|island)\s*\}|\{:else(?:\s+if\s+[^}]*)?\}/g,n="",t=0,r=!1;for(;;){let i=e.slice(t),d=/\{#(if|each)\b/g.exec(i);if(!d){n+=e.slice(t);break}let u=d[1],c=it(i,d.index);if(c<0){n+=e.slice(t);break}let f=i.slice(d.index+2+u.length,c-1),a=t+d.index,l=t+c,p=Wn(u,f);if(!p){n+=e.slice(t,l),t=l;continue}let m=u==="if"?p[0].trim():"";n+=e.slice(t,a),s.lastIndex=l;let b=1,w=-1,y=0,g=[],S;for(;S=s.exec(e);){let A=S[0];if(A.startsWith("{:else")){if(b===1){let W=/^\{:else\s+if\s+([^}]*)\}$/.exec(A);g.push({at:S.index,len:A.length,cond:W?W[1].trim():null})}continue}if(A.startsWith("{#")){let W=it(e,S.index);W>=0&&(s.lastIndex=W),b++;continue}if(b--,b===0){w=S.index,y=A.length;break}}if(w<0){n+=e.slice(a);break}if(g.length===0){n+=e.slice(a,l),t=l,r=!0;continue}let E=e.slice(l,w);if(u==="each"){let A=[...g].reverse().find(ge=>ge.cond===null);if(!A){n+=e.slice(a,w+y),t=w+y;continue}let W=A.at-l,G=E.slice(0,W),Z=E.slice(W+A.len),fe=p[0];n+=e.slice(a,l)+G+`{/each}{#if !(${fe}.length)}${Z}{/if}`,t=w+y,r=!0;continue}let v=[],k=0;for(let A=0;A<g.length;A++){let W=g[A],G=W.at-l;v.push({cond:A===0?null:g[A-1].cond,body:E.slice(k,G)}),k=G+W.len}v.push({cond:g[g.length-1].cond,body:E.slice(k)});let R=v.shift(),j=A=>{if(!A.length)return"";let W=A[0],G=A.slice(1);if(W.cond==null)return W.body;let Z=`{#if ${W.cond}}${W.body}{/if}`;return G.length&&(Z+=`{#if !(${W.cond})}`+j(G)+"{/if}"),Z},J=`{#if ${m}}${R.body}{/if}`;v.length&&(J+=`{#if !(${m})}`+j(v)+"{/if}"),n+=J,t=w+y,r=!0}return{template:n,changed:r}}function Po(e){if(!/\sclass\s*=\s*"/.test(e)||!/\sclass\s*=\s*\{/.test(e))return e;let s=/<([a-zA-Z][^\s>/]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g,n="",t=0,r;for(s.lastIndex=0;r=s.exec(e);){let[i,o,d,u]=r,c=/\sclass\s*=\s*"([^"]*)"/.exec(d);if(!c)continue;let f=/\sclass\s*=\s*\{/.exec(d);if(!f||f.index===c.index)continue;let a=d.indexOf("{",f.index),l=1,p=a+1;for(;p<d.length&&l>0;){let E=d[p];if(E==='"'||E==="'"){p=at(d,p);continue}E==="{"?l++:E==="}"&&l--,p++}if(l!==0)continue;let m=d.slice(a+1,p-1),b=JSON.stringify(c[1]),w=` class={((v) => v == null ? ${b} : typeof v === 'object' ? ({ ${b}: true, ...v }) : (${b} + ' ' + v))(${m})}`,y=Math.min(c.index,f.index),g=Math.max(c.index+c[0].length,p),S=d.slice(0,y)+w+d.slice(g);n+=e.slice(t,r.index)+`<${o}${S}${u}>`,t=r.index+i.length}return n+=e.slice(t),n}function No(e,s){let n=/^<([a-zA-Z][^\s>/]*)/.exec(e.slice(s));if(!n)return null;let t=s+n[0].length,r="",i=0;for(;t<e.length;){let o=e[t];if(r)o===r&&(r="");else if(o==='"'||o==="'")r=o;else if(o==="{")i++;else if(o==="}")i=Math.max(0,i-1);else if(o===">"&&i===0){let u=e.slice(s,t+1).endsWith("/>")?"/":"",c=u?t-1:t;return{start:s,end:t+1,tag:n[1],attrs:e.slice(s+n[0].length,c),selfClose:u}}t++}return null}function Pt(e,s){let n="",t=0,r=0;for(;r<e.length;){let i=e.indexOf("<",r);if(i<0)break;let o=No(e,i);if(!o){r=i+1;continue}let d=s(o);n+=e.slice(t,o.start)+(d===null?e.slice(o.start,o.end):`<${o.tag}${d}${o.selfClose}>`),t=o.end,r=o.end}return n+=e.slice(t),n}function Mo(e,s){return e.includes("class:")?Pt(e,n=>{let t=n.attrs;if(!t.includes("class:"))return null;let r=[],i=/\sclass:([\w-]+)\s*=\s*\{/g,o;for(;o=i.exec(t);){let l=o.index+o[0].length,p=1;for(;l<t.length&&p>0;){let m=t[l];if(m==='"'||m==="'"){l=at(t,l);continue}m==="{"?p++:m==="}"&&p--,l++}if(p!==0)throw new L("E-TEMPLATE",`${s}: class:${o[1]}={...} is missing its closing brace`,{file:s,hint:"the binding expression needs a matching } before the tag ends"});r.push({name:o[1],expr:t.slice(o.index+o[0].length,l-1),start:o.index,end:l})}let d=/(\sclass\s*=\s*)("([^"]*)"|'([^']*)'|\{[^}]*\})/,u=d.exec(t);if(u&&u[2].startsWith("{"))throw new L("E-TEMPLATE",`${s}: <${n.tag}> has both class={...} and class: directives`,{file:s,hint:'merge them: move the dynamic part into a class:NAME={expr} and keep the rest in class="..."'});let c=u?u[3]??u[4]??"":"",f=`(${JSON.stringify(c)}`;for(let l of r)f+=`+((${l.expr})?${JSON.stringify(" "+l.name)}:'')`;f+=")";let a=t;for(let l=r.length-1;l>=0;l--)a=a.slice(0,r[l].start)+a.slice(r[l].end);return u?a=a.replace(d,` class={${f}}`):a=` class={${f}}`+a,a}):e}function Lo(e,s){return/\s(?:transition|in|out):/.test(e)?Pt(e,n=>{let t=n.attrs;if(!t.includes("transition:")&&!/\s(?:in|out):/.test(t))return null;let r=[],i=/\s(transition|in|out):([\w-]+)(?:\s*=\s*\{)?/g,o;for(;o=i.exec(t);){let a=o.index,l=o.index+o[0].length,p="";if(o[0].endsWith("{")){let m=1,b=l;for(;b<t.length&&m>0;){let w=t[b];if(w==='"'||w==="'"){b=at(t,b);continue}w==="{"?m++:w==="}"&&m--,b++}if(m!==0)throw new L("E-TEMPLATE",`${s}: transition:${o[1]}={...} is missing its closing brace`,{file:s,hint:"the transition params expression needs a matching } before the tag ends"});p=t.slice(l,b-1),l=b}r.push({dir:o[1]==="transition"?"":o[1],name:o[2],params:p,start:a,end:l})}if(r.length===0)return null;let d="";for(let a of r)d&&(d+="|"),d+=(a.dir?a.dir+":":"")+a.name+(a.params?":"+a.params:"");let u=t;for(let a=r.length-1;a>=0;a--)u=u.slice(0,r[a].start)+u.slice(r[a].end);let c=/\sdata-transition\s*=\s*("([^"]*)"|'([^']*)'|\{[^}]*\})/,f=c.exec(u);if(f){let a=f[2]??f[3]??"";u=u.replace(c,` data-transition="${a}${d?(a?"|":"")+d:""}"`)}else u=` data-transition="${d}"`+u;return u}):e}function Io(e,s){return e.includes("animate:")?Pt(e,n=>{let t=n.attrs;if(!t.includes("animate:"))return null;let r=[],i=/\sanimate:([\w-]+)(?:\s*=\s*\{)?/g,o;for(;o=i.exec(t);){let a=o.index,l=o.index+o[0].length,p="";if(o[0].endsWith("{")){let m=1,b=l;for(;b<t.length&&m>0;){let w=t[b];if(w==='"'||w==="'"){b=at(t,b);continue}w==="{"?m++:w==="}"&&m--,b++}if(m!==0)throw new L("E-TEMPLATE",`${s}: animate:${o[1]}={...} is missing its closing brace`,{file:s,hint:"the animate params expression needs a matching } before the tag ends"});p=t.slice(l,b-1),l=b}r.push({name:o[1],params:p,start:a,end:l})}let d="";for(let a of r)d&&(d+="|"),d+=a.name+(a.params?":"+a.params:"");let u=t;for(let a=r.length-1;a>=0;a--)u=u.slice(0,r[a].start)+u.slice(r[a].end);let c=/\sdata-animate\s*=\s*("([^"]*)"|'([^']*)'|\{[^}]*\})/,f=c.exec(u);if(f){let a=f[2]??f[3]??"";u=u.replace(c,` data-animate="${a}${d?(a?"|":"")+d:""}"`)}else u=` data-animate="${d}"`+u;return u}):e}function zo(e,s){return e.includes("style:")?Pt(e,n=>{let t=n.attrs;if(!t.includes("style:"))return null;let r=[],i=/\sstyle:([\w-]+)\s*=\s*\{/g,o;for(;o=i.exec(t);){let l=o.index+o[0].length,p=1;for(;l<t.length&&p>0;){let m=t[l];if(m==='"'||m==="'"){l=at(t,l);continue}m==="{"?p++:m==="}"&&p--,l++}if(p!==0)throw new L("E-TEMPLATE",`${s}: style:${o[1]}={...} is missing its closing brace`,{file:s,hint:"the binding expression needs a matching } before the tag ends"});r.push({prop:o[1],expr:t.slice(o.index+o[0].length,l-1),start:o.index,end:l})}let d=/(\sstyle\s*=\s*)("([^"]*)"|'([^']*)'|\{[^}]*\})/,u=d.exec(t);if(u&&u[2].startsWith("{"))throw new L("E-TEMPLATE",`${s}: <${n.tag}> has both style={...} and style: directives`,{file:s,hint:'keep the static declarations in style="..." and move the dynamic ones to style:PROP={expr}'});let c=u?u[3]??u[4]??"":"",f=`${JSON.stringify(c.endsWith(";")||c===""?c:c+";")}`;for(let l of r)f+=`+${JSON.stringify(l.prop+":")}+(${l.expr})+';'`;let a=t;for(let l=r.length-1;l>=0;l--)a=a.slice(0,r[l].start)+a.slice(r[l].end);return u?a=a.replace(d,` style={${f}}`):a=` style={${f}}`+a,a}):e}function Fo(e,s){if(!e.includes("{:fallback"))return e;for(let n=0;n<10;n++){let t=/\{#boundary\}|\{\/boundary\}|\{:fallback\}/g,r="",i=0,o=!1,d;for(;d=t.exec(e);){if(d[0]!=="{#boundary}")continue;let u=d.index,c=u+d[0].length,f=1,a=-1,l;for(;l=t.exec(e);){if(l[0]==="{#boundary}"){f++;continue}if(l[0]==="{/boundary}"&&(f--,f===0)){a=l.index;break}}if(a<0)break;let p=e.slice(c,a),m=/\{#(boundary|if|each|key|island)(?:\s+[^}]*)?\}|\{\/(?:boundary|if|each|key|island)\s*\}|\{:fallback\}/g,b=["boundary"],w=1,y=-1,g=0,S;for(m.lastIndex=0;S=m.exec(p);){let R=S[0];if(R==="{:fallback}"){if(b[b.length-1]!=="boundary")throw new L("E-TEMPLATE",`${s}: {:fallback} must sit directly inside a {#boundary} block`,{hint:"move it out of the {#if}/{#each} it sits in, or keep the conditional fallback in the parent"});if(y>=0)throw new L("E-TEMPLATE",`${s}: a {#boundary} can carry only one {:fallback}`,{hint:"remove the extra {:fallback} segment"});y=S.index,g=R.length;continue}if(R.startsWith("{#")){w++,b.push(R.slice(2,R.length-1).trim().split(/\s/)[0]);continue}w--,b.pop()}if(y<0)continue;let E=p.slice(0,y),v=p.slice(y+g),k=Buffer.from(v,"utf-8").toString("base64");r+=e.slice(i,u)+`{#boundary __fb="${k}"}`+E+"{/boundary}",i=a+11,o=!0}if(!o)break;e=r+e.slice(i)}return e}function Do(e){for(let s=0;s<40;s++){if(!/\{:else\b/.test(e))return e;let n=Oo(e);if(e=n.template,!n.changed)return e}return e}function qo(e){if(!Co){let o=/\{#defer(?:\s+hold=\\d+)?\}/g,d="",u=0;for(;;){o.lastIndex=u;let c=o.exec(e);if(!c)break;let f=c.index,a=c[0].length,l=e.indexOf("{/defer}",f+a);if(l<0)break;d+=e.slice(u,f)+e.slice(f+a,l),u=l+8}return{template:u===0?e:d,count:0,holds:[]}}let s=0,n=[],t="",r=0,i=/\{#defer(?:\s+hold=(\d+))?\}/g;for(;;){i.lastIndex=r;let o=i.exec(e);if(!o)break;let d=o.index,u=o[0].length,c=o[1]?Number(o[1]):0,f=1,a=d+u,l=-1;for(;a<e.length;){i.lastIndex=a;let b=i.exec(e),w=b?b.index:-1,y=e.indexOf("{/defer}",a);if(y<0)break;if(w>=0&&w<y){f++,a=w+b[0].length;continue}if(f--,f===0){l=y;break}a=y+8}if(l<0)break;let p=e.slice(d+u,l);n.push(c);let m=++s;t+=e.slice(r,d),t+="{#if __rvDefer"+m+"()}"+p+`{/if}
{#if !__rvDefer`+m+'()}<div class="rv-defer-loading"></div>{/if}',r=l+8}return s===0?{template:e,count:0,holds:[]}:(t+=e.slice(r),{template:t,count:s,holds:n})}function Bo(e,s=[]){let n="";for(let t=1;t<=e;t++){n+="const [__rvDefer"+t+", set__rvDefer"+t+'] = state("__rvdefer'+t+`", false);
`;let r=s[t-1]||0;n+=r>0?"onMount(function () { setTimeout(function () { set__rvDefer"+t+"(true); }, "+r+`); });
`:"onMount(function () { requestAnimationFrame(function () { requestAnimationFrame(function () { set__rvDefer"+t+`(true); }); }); });
`}return n}function Ho(e,s){let n="",t=0,r=0,i=[];for(;;){let o=e.indexOf("{#await",t);if(o<0)break;let d=o+7,u=1;for(;d<e.length&&u>0;){let T=e[d];T==="{"?u++:T==="}"&&u--,d++}if(u!==0)break;let c=e.slice(o+7,d-1).trim();if(!c)throw new L("E-TEMPLATE",`${s}: {#await} needs a promise expression`,{file:s,hint:"write {#await fetchUsers()}...{:then users}...{/await}"});let f=/\b(then|catch)\s+[A-Za-z_$][\w$]*\s*$/.exec(c);if(f)throw new L("E-TEMPLATE",`${s}: {#await ${c}} puts the ${f[1]} branch in the opener`,{file:s,hint:`write the branch on its own line inside the block:
{#await ${c.replace(/\s+(then|catch)\s+[A-Za-z_$][\w$]*\s*$/,"")}}
  ...ending
{:${f[1]} ${f[0].trim().split(/\s+/)[1]}}
  ${f[1]==="then"?"fulfilled":"rejected"}
{/await}`});let a=/\{\#(if|each|boundary|island|await)\b/g,l=/\{\/(if|each|boundary|island|await)\}/g,p=/\{:then\b([^}]*)\}/g,m=/\{:catch\b([^}]*)\}/g,b=1,w=d,y=-1,g=-1,S=-1,E="",v="";for(;;){a.lastIndex=w,l.lastIndex=w,p.lastIndex=w,m.lastIndex=w;let T=a.exec(e),H=l.exec(e),te=p.exec(e),we=m.exec(e),Te=[[T,"open"],[H,"close"],[te,"then"],[we,"catch"]],Pe=1/0,Ee="",pe=null;for(let[_e,z]of Te)_e&&_e.index<Pe&&(Pe=_e.index,Ee=z,pe=_e);if(!pe)break;if(Ee==="open"){b++,w=pe.index+pe[0].length;continue}if(Ee==="close"){if(b===1&&pe[1]==="await"){S=pe.index;break}b--,w=pe.index+pe[0].length;continue}b===1&&(Ee==="then"&&y<0?(y=pe.index,E=pe[1]):Ee==="catch"&&g<0&&(g=pe.index,v=pe[1])),w=pe.index+pe[0].length}if(S<0||y<0)break;let k=y+7+E.length,R=g>=0?g+8+v.length:-1,j=e.slice(d,y),J=e.slice(k,g>=0?g:S),A=g>=0?e.slice(R,S):"",W=E.trim(),G=v.trim(),Z=/^\w+$/.test(W)?W:`__rvAwaitThen${r+1}`,fe=g>=0?/^\w+$/.test(G)?G:`__rvAwaitCatch${r+1}`:"";r++;let ge=r,B=`__rvAwait${ge}`;i.push({n:ge,expr:c,thenVar:Z,catchVar:fe}),n+=e.slice(t,o),n+=`{#if ${B}().status === 'pending'}`+j+`{/if}
`,n+=`{#each (${B}().status === 'resolved' ? [${B}().value] : []) as ${Z}}`+J+`{/each}
`,g>=0&&(n+=`{#each (${B}().status === 'rejected' ? [${B}().error] : []) as ${fe}}`+A+`{/each}
`),t=S+8}return r===0?{template:e,blocks:i}:(n+=e.slice(t),{template:n,blocks:i})}function Jo(e){let s="";for(let n of e){let t=`__rvAwait${n.n}`;s+=`const [${t}, set${t}] = state("__rvawait${n.n}", { status: 'pending', value: null, error: null });
`,s+=`onMount(function () {
`,s+=`  Promise.resolve(${n.expr}).then(function (__rvAwaitVal) {
`,s+=`    set${t}({ status: 'resolved', value: __rvAwaitVal });
`,s+=`  }).catch(function (__rvAwaitErr) {
`,s+=`    set${t}({ status: 'rejected', error: __rvAwaitErr });
`,s+=`  });
`,s+=`});
`}return s}function Wn(e,s){if(e==="if"){let t=/^\s*([\s\S]+?)\s*$/.exec(s);return t?[t[1]]:null}if(e==="each"){let t=/^\s*([\s\S]+?)\s+as\s+(\{[^{}]*\}|\[[^[\]]*\]|\w+)(?:\s*,\s*(\w+))?(?:\s*\(([\s\S]+)\))?\s*$/.exec(s);return t?[t[1],t[2],t[3]??"",t[4]??""]:null}if(e==="boundary")return[s];if(e==="island"){let t=/^\s*(?:name="([^"]*)")?(?:\s*hydrate="([^"]*)")?\s*$/.exec(s);return t?[t[1]??"",t[2]??""]:null}let n=/^\s*(\w+)(?:\s*\(([\s\S]+)\))?\s*$/.exec(s);return n?[n[1],n[2]??""]:null}function Ct(e,s,n){let t=new RegExp(`\\{#${s}\\b`,"g"),r=new RegExp(`\\{/${s}\\}`,"g");t.lastIndex=n;let i;for(;i=t.exec(e);){let o=i.index,d=it(e,o);if(d<0)continue;let u=Wn(s,e.slice(o+2+s.length,d-1));if(!u)continue;let c=1,f=d;for(;;){t.lastIndex=f,r.lastIndex=f;let a=t.exec(e),l=r.exec(e);if(!l)break;if(a&&a.index<l.index){let p=it(e,a.index);c++,f=p<0?a.index+a[0].length:p;continue}if(f=l.index+l[0].length,--c===0){let p=e.slice(d,l.index),m=[e.slice(o,f),...u,p];return m.index=o,m}}t.lastIndex=d}return null}function Wo(e){let s=/<(style|script|noscript)\b[^>]*>/iy,n="",t="",r=0,i=0,o=()=>{t.trim()&&(n+=et(t,"__hd","__hc",null,r++,!1)),t=""};for(;i<e.length;){if(e.startsWith("<!--",i)){let u=e.indexOf("-->",i+4);i=u<0?e.length:u+3;continue}s.lastIndex=i;let d=s.exec(e);if(d){let u=d[1].toLowerCase(),c=e.toLowerCase().indexOf(`</${u}`,i+d[0].length),f=c<0?-1:e.indexOf(">",c),a=f<0?e.length:f+1;o(),n+=ir(d[0],"__hd","__hc",null),n+=ti(e.slice(i+d[0].length,a),"__hd","__hc",null),i=a;continue}t+=e[i++]}return o(),n}var Uo=new Set(["if","each","boundary","island","await","snippet"]),Ms=new Map;function Vo(e){let s=Ms.get(e);return s||(s={open:new RegExp(`\\{#${e}\\b`,"g"),close:new RegExp(`\\{/${e}\\}`,"g")},Ms.set(e,s)),s}function Go(e,s){let n=[],t=/<(style|script|noscript)\b[^>]*>/gi,r;for(;r=t.exec(e);){let a=r[1].toLowerCase(),l=e.toLowerCase().indexOf(`</${a}`,r.index+r[0].length),p=l<0?-1:e.indexOf(">",l),m=p<0?e.length:p+1;n.push([r.index,m]),t.lastIndex=m}let i=/<!--[\s\S]*?-->/g,o;for(;o=i.exec(e);)n.push([o.index,o.index+o[0].length]);n.sort((a,l)=>a[0]-l[0]);let d=a=>n.some(([l,p])=>a>=l&&a<p),u=/\{([:/])(\w+)\}/g,c;for(;c=u.exec(e);){if(d(c.index))continue;let[,a,l]=c;if(!(a==="/"&&Uo.has(l))){if(a==="/")throw new L("E-TEMPLATE",`${s}: {/${l}} does not close anything`,{file:s,line:Me(e,c),hint:"the closers are {/if}, {/each} and {/boundary} - one per block you opened"});if(l==="else"){let p=(w,y,g)=>{let S=0,E;for(w.lastIndex=0;(E=w.exec(e))&&!(E.index>=g);)d(E.index)||S++;let v=new RegExp(y,"g"),k=0;for(;(E=v.exec(e))&&!(E.index>=g);)d(E.index)||k++;return S-k},m=p(/\{#if\b/g,"\\{/if\\b",c.index),b=p(/\{#each\b/g,"\\{/each\\b",c.index);if(m<=0&&b<=0)throw new L("E-TEMPLATE",`${s}: a stray {:else} with no {#if} or {#each} above it`,{file:s,line:Me(e,c),hint:"{:else} belongs inside an {#if} ... {/if} or {#each} ... {/each} block"});continue}if(l==="fallback")throw new L("E-TEMPLATE",`${s}: a stray {:fallback} with no {#boundary} above it`,{file:s,line:Me(e,c),hint:"{:fallback} belongs directly inside a {#boundary} ... {/boundary} block"});if(l==="then"||l==="catch"){let p=(w,y)=>{w.lastIndex=0;let g=0,S;for(;(S=w.exec(e))&&!(S.index>=y);)d(S.index)||g++;return g},m=p(/\{#await\b/g,c.index),b=p(/\{\/await\b/g,c.index);if(m<=b)throw new L("E-TEMPLATE",`${s}: a stray {:${l}} with no {#await} above it`,{file:s,line:Me(e,c),hint:"{:then} / {:catch} belong inside an {#await} ... {/await} block"});continue}throw new L("E-TEMPLATE",`${s}: {:${l}} is not a rosezm directive`,{file:s,line:Me(e,c),hint:"rosezm templates support {#if}/{:else}, {#each} and {#boundary}"})}}let f=/\{#(if|each|boundary|island|await)\b/g;for(;c=f.exec(e);){if(d(c.index))continue;let a=c[1],l=it(e,c.index);if(l<0)continue;let p=e.slice(c.index+2+a.length,l-1);if(a==="each"&&!Wn("each",p))throw new L("E-TEMPLATE",`${s}: {#each ${p.trim()}} is missing its item name`,{file:s,line:Me(e,c),hint:"write {#each items() as item} - the name after `as` is what the block body reads (item.id, item.name)"});let{open:m,close:b}=Vo(a),w=1,y=l;for(;;){m.lastIndex=y,b.lastIndex=y;let g=m.exec(e),S=b.exec(e);if(!S)break;if(g&&g.index<S.index){let E=it(e,g.index);y=E<0?g.index+g[0].length:E;continue}if(y=S.index+S[0].length,--w===0)break}if(w!==0)throw new L("E-TEMPLATE",`${s}: unclosed {#${a}} - every block needs its {/${a}}`,{file:s,line:Me(e,c),hint:`add the matching {/${a}} (an inner {#if} or {#each} closes first, deepest first)`})}}function Zo(e,s){let n=/<([a-zA-Z][\w-]*)((?:\s+[\w:-]+(?:=(?:"[^"]*"|'[^']*'|`[^`]*`|[^\s"'>]+))?)*)\s*(\/?)>/g;return e.replace(n,(t,r,i,o)=>{if(s.has(r)||!/\{/.test(i))return t;let d=i.replace(/([\w:-]+)=("([^"]*)"|'([^']*)'|`([^`]*)`)/g,(u,c,f,a,l,p)=>{let m=a??l??p??"";if(!/\{/.test(m)||p===void 0&&m.includes("`"))return u;let b=Ot(m);if(b.length===0)return u;let w="",y=0;for(let g of b)y<g.start&&(w+=(w?" + ":"")+JSON.stringify(m.slice(y,g.start))),w+=(w?" + ":"")+`(${g.expr})`,y=g.end+1;return y<m.length&&(w+=(w?" + ":"")+JSON.stringify(m.slice(y))),`${c}={${w}}`});return`<${r}${d}${o?" /":""}>`})}var Mn=0,Ln=!1,In="",zn={},hn=new Set,Fn=new Set,Dn=null,Gt="";function et(e,s,n,t,r,i=!0,o=new Map,d=0,u="__iid",c=""){let f="",a=e,l=0,p=0,m=0,b=/\{#island\b/.test(e),w=i&&(!b||d>0),y=()=>`${r}_${m++}`;if(r===0&&(f+=`const __snip = {};
`),r===0){let T=/<svelte:(window|body|head|document)\b[^>]*>/i.exec(e);if(T){let H=T[1].toLowerCase();throw new L("E-TEMPLATE",`rosezm has no <svelte:${H}> element - window-level events are a modifier on any host element (on:keydown|${H==="document"?"document":"window"}={fn})`,{hint:`use on:keydown|${H==="document"?"document":"window"}={fn}. Any element can carry it - the listener is attached to ${H==="document"?"document":"window"} at wire time, so no wrapper element is needed. See GOTCHAS.md: window/document level events.`})}}let g=new Map,S=oo(e,o),E=new Set(S).size===S.length;if(S.length>0&&E){let T={};for(let H of S){let te=`__rvct${Mn++}`;g.set(H,te),T[H]=te}a=Nn(e,[],T,{ownScope:!0,comps:o})}let v=T=>{let H,te=-1;return()=>((te!==p||H===void 0||H!==null&&H.index<l)&&(H=T(l),te=p),H)},k=/<(style|script|noscript)\b[^>]*>/g,R=null,j=v(T=>Ct(a,"if",T)),J=v(T=>Ct(a,"each",T)),A=v(T=>Ct(a,"boundary",T)),W=v(T=>Ct(a,"island",T)),G=v(T=>Ct(a,"snippet",T)),Z=v(T=>io(a,T)),fe=v(T=>{let H=o.size>0?or(a,T,o):null;return H?{index:H.start,tag:H}:null}),ge=v(T=>{k.lastIndex=T;let H=k.exec(a);return H?{index:H.index,tag:H[0],name:H[1].toLowerCase()}:null}),B=v(T=>{let H=a.indexOf("<!--",T);if(H<0)return null;let te=a.indexOf("-->",H+4);return{index:H,end:te<0?a.length:te+3}});for(;l<a.length;){let T=j(),H=J(),te=A(),we=Z(),Te=we?Object.assign([a.slice(we.index,we.end+1),we.expr],{index:we.index}):null,Pe=fe()?.tag??null,Ee=W(),pe=G(),_e=[];T?.index!==void 0&&_e.push({type:"if",match:T,index:T.index}),H?.index!==void 0&&_e.push({type:"each",match:H,index:H.index}),te?.index!==void 0&&_e.push({type:"boundary",match:te,index:te.index}),Ee?.index!==void 0&&_e.push({type:"island",match:Ee,index:Ee.index}),pe?.index!==void 0&&_e.push({type:"snippet",match:pe,index:pe.index}),Te?.index!==void 0&&_e.push({type:"expr",match:Te,index:Te.index}),Pe&&_e.push({type:"comp",match:Te,index:Pe.start,tag:Pe});let z=_e.length>0?_e.reduce((Y,X)=>Y.index<=X.index?Y:X):null,Le=ge();if(Le&&z&&Le.index<z.index){R===null&&(R=a.toLowerCase());let Y=R.indexOf(`</${Le.name}`,Le.index+Le.tag.length),X=Y<0?-1:a.indexOf(">",Y),D=X<0?a.length:X+1;f+=ke(a.slice(l,Le.index),s,n,t),f+=ir(Le.tag,s,n,t),f+=ke(a.slice(Le.index+Le.tag.length,D),s,n,t),l=D;continue}let Je=B();if(Je&&(!z||Je.index<z.index)){f+=ke(a.slice(l,Je.end),s,n,t),l=Je.end;continue}if(!z){f+=ke(a.slice(l),s,n,t);break}if(z.type==="if"){let[,Y,X]=z.match,D=a.slice(l,z.index);D&&(f+=ke(D,s,n,t));let re=Ns(Y),oe=y(),ne=t??"__s",$e=et(X.trim(),"h","__c",ne,r+1,w,o,d,u,c);f+=`const __b${oe} = (__s, __c) => { let h = ''; ${$e} return h; };
`,w?f+=`${s} += ifMark(${n}, () => (${re}), __b${oe}${t?`, ${t}`:""});
`:f+=`${s} += (${re}) ? __b${oe}(${t??"undefined"}, []) : '';
`,l=z.index+z.match[0].length}else if(z.type==="each"){let[,Y,X,D,re,oe]=z.match,ne=a.slice(l,z.index);ne&&(f+=ke(ne,s,n,t));let $e=Ns(Y),Ce=y(),ue=/^[{[]/.test(X),se=ue?null:new RegExp(`\\b${X}\\b`,"g"),Q=D?new RegExp(`\\b${D}\\b`,"g"):null,ee="",me=0;for(let de of Ot(oe.trim())){let Oe=se?ft(de.expr,se,"__s"):de.expr;Q&&(Oe=ft(Oe,Q,"__i")),ee+=oe.trim().slice(me,de.start)+"{"+Oe+"}",me=de.end+1}ee+=oe.trim().slice(me);let Fe=re?(()=>{let de=re.trim();return se&&(de=ft(de,se,"__s")),Q&&(de=ft(de,Q,"__i")),de})():"__i",We=`${c?`(${c}) + "/" + `:""}String(${Fe})`,De=et(ee,"h","__c","__s",r+1,w,o,d,u,We),Ze=ue?`const ${X} = __s; ${De}`:De,Xe="";if(re){if(ue)throw new L("E-TEMPLATE",`${Gt}: a keyed {#each} keys on a named item's property - write {#each xs as x (x.id)}, not a destructuring pattern`,{file:Gt,hint:"name the item first, then key on one of its properties"});let de=re.trim();se&&(de=ft(de,se,"__s")),Q&&(de=ft(de,Q,"__i")),Xe=`, (__s, __i) => (${de})`}if(f+=`const __b${Ce} = (__s, __c, __i) => { let h = ''; ${Ze} return h; };
`,w)f+=`${s} += eachMark(${n}, () => (${$e}), __b${Ce}${Xe});
`;else{let de=ue?"__s":X;f+=`${s} += (${$e}).map((${de}, __i) => __b${Ce}(${de}, [], __i)).join('');
`}l=z.index+z.match[0].length}else if(z.type==="boundary"){let[,Y,X]=z.match,D="";if(Y){let se=/__fb="([A-Za-z0-9+/=]*)"/.exec(Y);se&&(D=Buffer.from(se[1],"base64").toString("utf-8"))}let re=X,oe=a.slice(l,z.index);oe&&(f+=ke(oe,s,n,t));let ne=y(),$e=/\$action:|<form[\s>]/.test(re),Ce=et(re.trim(),"h",n,t,r+1,w,o,d,u,c);f+=`const __b${ne} = (__c) => { let h = ''; ${Ce} return h; };
`;let ue="";if(D.trim()){let se=et(D.trim(),"h",n,t,r+1,w,o,d,u,c);ue=`const __bf${ne} = (__c) => { let h = ''; ${se} return h; };
`}f+=ue,f+=`let __bd${ne} = '';
`,f+=$e?`try { $actionErrorOrThrow(); __bd${ne} = __b${ne}(${n}); } catch (e) { $setBoundaryError(e); __bd${ne} = ${ue?`__bf${ne}(${n})`:"$boundaryFallback(e)"}; }
`:`try { __bd${ne} = __b${ne}(${n}); } catch (e) { $setBoundaryError(e); __bd${ne} = ${ue?`__bf${ne}(${n})`:JSON.stringify(Gr)}; }
`,f+=`${s} += __bd${ne};
`,l=z.index+z.match[0].length}else if(z.type==="snippet"){let[,Y,X,D]=z.match,re=a.slice(l,z.index);re&&(f+=ke(re,s,n,t)),y();let oe=X?X.split(",").map($e=>$e.trim()).filter(Boolean).join(","):"",ne=et(D.trim(),"h","__c","__s",r+1,w,o,d,u,c);f+=`__snip.${Y} = (__s, __c${oe?","+oe:""}) => { let h = ''; ${ne} return h; };
`,l=z.index+z.match[0].length}else if(z.type==="comp"){let Y=z.tag;Y.start>l&&(f+=ke(a.slice(l,Y.start),s,n,t));let X=o.get(Y.name),D=y(),re="";if(Y.selfClosing)l=Y.end;else{let ee=fn(a,Y.end,Y.name);if(ee<0)throw new L("E-TEMPLATE",`unclosed <${Y.name}> - every component tag needs its matching close tag`,{hint:`add the matching </${Y.name}> (or close the tag with /> when it takes no children)`});re=a.slice(Y.end,ee),l=ee+Y.name.length+3}let{def:oe,named:ne}=Yo(re),$e=oe.trim().length>0;$e&&(f+=`const __ch${D} = (__s, __c) => { let h = ''; ${et(oe,"h","__c",t,r+1,w,o,d,u,c)} return h; };
`);let Ce=ne.map(([ee,me])=>{let Fe=X.slots.find(Ze=>Ze.name===ee),We=me;for(let Ze of Fe?.props??[]){let Xe=new RegExp(`\\b${Ze}\\b`,"g"),de="",Oe=0;for(let Ie of Ot(We))de+=We.slice(Oe,Ie.start)+"{"+ft(Ie.expr,Xe,`__s.${Ze}`)+"}",Oe=Ie.end+1;We=de+We.slice(Oe)}let De=`(${u}${c?` + "/" + (${c})`:""} + (__si || ''))`;return`${JSON.stringify(ee)}: (__s, __c, __si) => { let h = ''; ${et(We,"h","__c",t,r+1,w,o,d,De,"")} return h; }`}),ue=Qo(Y.attrs).filter(ee=>ee.name!=="slot").map(ee=>{if(ee.kind==="spread")return`...(${ee.value})`;let me=ee.name.startsWith("on:")?`on${Ye(ee.name.slice(3))}`:ee.name,Fe=ee.kind==="expr"?`(${ee.value})`:ee.kind==="str"?JSON.stringify(ee.value):"true";return`${JSON.stringify(me)}: ${Fe}`}).join(", "),se=$e?`__ch${D}(${t??"undefined"}, ${n})`:"''",Q=`(${u} + ${JSON.stringify("/c"+Y.start)}${c?` + (${c})`:""})`;f+=`${s} += ${Y.name}(${n}, ${se}, { ${ue} }, { ${Ce.join(", ")} }, ${Q});
`}else if(z.type==="island"){let[,Y,X,D]=z.match,re=a.slice(l,z.index);re&&(f+=ke(re,s,n,t));let oe=X==="visible"||X==="idle"?` data-rv-island-hydrate="${X}"`:"";f+=`${s} += ${JSON.stringify(`<div data-rv-island="${Y||""}"${oe}>`)};
`;let ne=et(D.trim(),"h","__c",t,r+1,i,o,d+1,u,c);f+=ne,f+=`${s} += '</div>';
`,l=z.index+z.match[0].length}else{let[,Y]=z.match,X=Y.trim(),D=a.slice(l,z.index),re=/^@const\s+([A-Za-z_$][\w$]*)\s*=\s*([\s\S]+)$/.exec(X);if(re){D&&(f+=ke(D,s,n,t));let Q=re[1],ee=a.slice(z.index+z.match[0].length),me=g.get(Q);l=z.index+z.match[0].length,me===void 0&&(me=`__rvct${Mn++}`,a=Nn(ee,[],{[Q]:me}),l=0,p++);let Fe=`const ${me} = () => (${re[2].trim()});
`;Ln&&r===0?(hn.has(Q)?Dn=Q:hn.add(Q),In+=Fe,zn[Q]=me):f+=Fe;continue}if(X==="__slot__"){D&&(f+=ke(D,s,n,t)),f+=di(s),l=z.index+z.match[0].length;continue}let oe=/^__slotDefault\(("(?:[^"\\]|\\.)*")\)$/.exec(X);if(oe){D&&(f+=ke(D,s,n,t)),f+=`${s} += __slotDefault(children, ${oe[1]});
`,l=z.index+z.match[0].length;continue}let ne=/^__slot\((['"])(\w+)\1, \[([\s\S]*?)\](?:,\s*("(?:[^"\\]|\\.)*"))?\)$/.exec(X);if(ne){D&&(f+=ke(D,s,n,t));let Q=ne[4]?`, ${ne[4]}`:"",ee=`(__iid + ${JSON.stringify("/s"+z.index)}${c?` + "/" + (${c})`:""})`;f+=`${s} += __slotBlock(${n}, __sl, ${JSON.stringify(ne[2])}, [${ne[3]}]${Q}, ${ee});
`,l=z.index+z.match[0].length;continue}let $e=/^@html\s+([\s\S]+)$/.exec(X);if($e){D&&(f+=ke(D,s,n,t));let Q=$e[1].trim();if(!w)f+=`${s} += String(${Q} ?? '');
`;else{let ee=t?`(${t}) => (${Q})`:`() => (${Q})`;f+=`${s} += rawMark(${n}, ${ee}${t?`, ${t}`:""});
`}l=z.index+z.match[0].length;continue}let Ce=/^@debug\b([\s\S]*)$/.exec(X);if(Ce){D&&(f+=ke(D,s,n,t));let Q=Ce[1].trim().replace(/,$/,"");f+=Q?`console.log('[rosezm:debug]', { ${Q} });
`:`console.log('[rosezm:debug]'); debugger;
`,l=z.index+z.match[0].length;continue}let ue=/^@render\s+([A-Za-z_$][\w$]*)\s*\(([\s\S]*)\)\s*$/.exec(X);if(ue){if(new RegExp(`\\{#snippet\\s+${ue[1]}\\b`).test(a.slice(z.index+z.match[0].length)))throw new L("E-TEMPLATE",`${Gt}: {@render ${ue[1]}} runs before its {#snippet ${ue[1]}} is defined`,{file:Gt,hint:"move the {#snippet} definition above the {@render} call - definitions register as the statement stream reaches them"});D&&(f+=ke(D,s,n,t));let ee=ue[2].trim();f+=`${s} += ((__snip && __snip.${ue[1]}) ? __snip.${ue[1]}(${t??"null"}, ${n}${ee?", "+ee:""}) : '');
`,l=z.index+z.match[0].length;continue}let se=ei(a,z.index)?/([\w-]+)=\s*$/.exec(D)??null:null;if(se){let Q=D.slice(0,D.length-se[0].length);Q&&(f+=ke(Q,s,n,t)),f+=ui(se[1],X,s,n,t,w)}else{D&&(f+=ke(D,s,n,t));let Q=a.slice(z.index+z.match[0].length);if(/=[\"'][^\"']*$/.test(D))f+=`${s} += esc(${X});
`;else{let me=Q.length>0&&!/^<[a-zA-Z/!]/.test(Q)&&!Q.startsWith("{");f+=li(X,s,n,t,w,me)}}l=z.index+z.match[0].length}}return f=f.replace(/\+= "\s*([a-zA-Z][\w-]*)=";\r?\n\s*\w+\s*\+=\s*textMark\((\w+), (.+?), 1, ([^;]+?)\);/g,(T,H,te,we,Te)=>`+= attrMark(${te}, ${we}, '${H}', ${Te});`),f}function gn(e,s){let n=s+1,t="",r=0;for(;n<e.length;){let i=e[n];if(t)i===t&&(t="");else if(i==='"'||i==="'")t=i;else if(i==="{")r++;else if(i==="}")r=Math.max(0,r-1);else if(i===">"&&r===0)return n+1;n++}return-1}function or(e,s,n){let t=s;for(;t<e.length;){let r=e.indexOf("<",t);if(r<0)return null;let i=/^<([a-zA-Z][\w-]*)/.exec(e.slice(r,r+64));if(i&&n.has(i[1])){let o=gn(e,r);if(o>0){let d=e.slice(r,o),u=/\/>$/.test(d);return{start:r,end:o,name:i[1],attrs:d.slice(1+i[1].length,u?-2:-1),selfClosing:u}}}t=r+1}return null}function Xo(e,s){return or(e,0,s)}function fn(e,s,n){let t=new RegExp(`<(/?)${n}(?=[\\s/>])`,"g");t.lastIndex=s;let r=1,i;for(;i=t.exec(e);){let o=gn(e,i.index);if(o<0)return-1;if(i[1]==="/"){if(r--,r===0)return i.index}else/\/>$/.test(e.slice(i.index,o))||r++}return-1}function Qo(e){let s=[],n=0;for(;n<e.length;){let t=/^\s*\{\.\.\.([^}]*)\}/.exec(e.slice(n));if(t){s.push({name:"...",kind:"spread",value:t[1].trim()}),n+=t[0].length;continue}let r=/^\s*([\w:.-]+)/.exec(e.slice(n));if(!r)break;n+=r[0].length;let i=/^\s*=\s*/.exec(e.slice(n));if(!i){s.push({name:r[1],kind:"bool",value:""});continue}n+=i[0].length;let o=e[n];if(o==="{"){let d=1,u=n+1;for(;u<e.length&&d>0;)e[u]==="{"?d++:e[u]==="}"&&d--,u++;s.push({name:r[1],kind:"expr",value:e.slice(n+1,u-1).trim()}),n=u}else if(o==='"'||o==="'"){let d=e.indexOf(o,n+1);s.push({name:r[1],kind:"str",value:e.slice(n+1,d<0?e.length:d)}),n=d<0?e.length:d+1}else break}return s}function Ko(e,s){let n=0;for(;n<e.length;){let t=e.indexOf("<",n);if(t<0)return;let r=/^<(\/?)([a-zA-Z][\w-]*)/.exec(e.slice(t,t+64));if(!r){n=t+1;continue}let i=gn(e,t);if(i<0)return;let o=/\bslot\s*=\s*["'](\w+)["']/.exec(e.slice(t,i));if(o&&r[1]!=="/")throw new L("E-TEMPLATE",`slot="${o[1]}" on <${r[2]}> is nested inside slot="${s}" - a slot must be a direct child of the component`,{hint:"move the inner <slot> out of the outer one - a slot is a direct child of the component tag, never nested in another slot"});n=i}}function Yo(e){let s="",n=new Map,t=0,r=0,i=0,o=[];for(;t<e.length;){let d=e.indexOf("<",t),u=e.indexOf("{#",t),c=e.indexOf("{/",t),f=[d,u,c].filter(g=>g>=0);if(f.length===0){s+=e.slice(t);break}let a=Math.min(...f);if(a>t&&(s+=e.slice(t,a)),a===u||a===c){let g=e.indexOf("}",a),S=e.slice(a,g<0?e.length:g+1);if(a===u){let E=/^\{#(\w+)/.exec(S);o.push({header:S,type:E?E[1]:""}),i++}else i=Math.max(0,i-1),o.length&&o.pop();s+=S,t=a+S.length;continue}let l=/^<(\/?)([a-zA-Z][\w-]*)/.exec(e.slice(a,a+64));if(!l){s+="<",t=a+1;continue}let p=gn(e,a);if(p<0){s+=e.slice(a);break}let m=e.slice(a,p),b=/\/>$/.test(m),w=rr.has(l[2].toLowerCase());if(l[1]==="/"){r=Math.max(0,r-1),s+=m,t=p;continue}!b&&!w&&r++;let y=/\bslot\s*=\s*["'](\w+)["']/.exec(m)?.[1];if(y&&r===1&&i===0){if(b||w)n.set(y,(n.get(y)??"")+m.replace(/\s*slot\s*=\s*["']\w+["']/,""));else{let g=fn(e,p,l[2]);if(g<0)throw new L("E-TEMPLATE",`unclosed <${l[2]}> inside slot="${y}"`,{hint:`add the matching </${l[2]}>`});let S=`</${l[2]}>`,E=e.slice(p,g);Ko(E,y),n.set(y,(n.get(y)??"")+m.replace(/\s*slot\s*=\s*["']\w+["']/,"")+E+S),r=Math.max(0,r-1),t=g+S.length;continue}t=p;continue}if(y&&i>0){let g=m.replace(/\s*slot\s*=\s*["']\w+["']/,""),S="";for(let k of o)S+=k.header;if(S+=g,b||w){for(let k=o.length-1;k>=0;k--)S+=`{/${o[k].type}}`;n.set(y,(n.get(y)??"")+S),t=p;continue}let E=fn(e,p,l[2]);if(E<0)throw new L("E-TEMPLATE",`unclosed <${l[2]}> inside slot="${y}"`,{hint:`add the matching </${l[2]}>`});let v=`</${l[2]}>`;S+=e.slice(p,E)+v;for(let k=o.length-1;k>=0;k--)S+=`{/${o[k].type}}`;n.set(y,(n.get(y)??"")+S),r=Math.max(0,r-1),t=E+v.length;continue}if(y)throw new L("E-TEMPLATE",`slot="${y}" on <${l[2]}> must be a direct child of the component, or wrapped only by an {#if}/{#each}/{#boundary} block - it is nested inside another element`,{hint:'place the element with slot="..." directly inside the component tag, or inside a single {#if}/{#each} block - wrapping it in another element is not yet supported'});s+=m,t=p}return{def:s,named:[...n.entries()]}}function ei(e,s){let t=e.slice(0,s).lastIndexOf("<");if(t<0||!/^<[a-zA-Z]/.test(e.slice(t)))return!1;let r=t+1,i="",o=0;for(;r<s;){let d=e[r];if(i)d===i&&(i="");else if(d==='"'||d==="'")i=d;else if(d==="{")o++;else if(d==="}")o=Math.max(0,o-1);else if(d===">"&&o===0)return!1;r++}return!0}function ke(e,s,n,t){return e?`${s} += ${JSON.stringify(e)};
`:""}function ti(e,s,n,t){if(!e.includes("{@html"))return ke(e,s,n,t);let r="",i=0,o=e.indexOf("{@html");for(;o!==-1;){let u=Kt(e,o);if(u<0)break;let c=/^@html\s+([\s\S]+)$/.exec(e.slice(o+1,u));if(c){let f=e.slice(i,o);f&&(r+=`${s} += ${JSON.stringify(f)};
`),r+=`${s} += String(${c[1].trim()} ?? '');
`,i=u+1}o=e.indexOf("{@html",u+1)}if(i===0)return ke(e,s,n,t);let d=e.slice(i);return d&&(r+=`${s} += ${JSON.stringify(d)};
`),r}function ir(e,s,n,t){let r=Ot(e);if(r.length===0)return ke(e,s,n,t);let i=`${s} += `,o=0;return r.forEach((d,u)=>{let c=e.slice(o,d.start),f=c.endsWith("=");u>0&&(i+=" + "),i+=JSON.stringify(f?c+'"':c),i+=` + esc(${d.expr})`,f&&(i+=` + '"'`),o=d.end+1}),o<e.length&&(i+=" + "+JSON.stringify(e.slice(o))),i+`;
`}var ni=/<img\b(?:[^<>]|\{[^{}]*\})*>/g,si={".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".gif":"image/gif",".webp":"image/webp",".svg":"image/svg+xml",".ico":"image/x-icon"},ri=8192,oi=16384;function ii(e,s){let n=x.extname(s),t=x.basename(s,n),r=s.slice(0,s.length-(t+n).length),i;try{i=N.readdirSync(x.join(e,x.dirname(s)))}catch{return[]}let o=new RegExp("^"+t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\.w(\\d+)"+n.replace(".","\\.")+"$","i"),d=[];for(let u of i){let c=o.exec(u),f=c?Number(c[1]):0;f>0&&d.push({url:`${r}${t}.w${f}${n}`,width:f})}return d.sort((u,c)=>u.width-c.width)}var Ls=new Map;function ai(e){let s;try{s=N.statSync(e)}catch{return null}let n=Ls.get(e);if(n&&n.mtime===s.mtimeMs)return{buffer:n.buffer,dims:n.dims};let t;try{t=N.readFileSync(e)}catch{return null}let r=ms(e),i={mtime:s.mtimeMs,buffer:t,dims:r};return Ls.set(e,i),{buffer:t,dims:i.dims}}function Is(e,s){return e.replace(ni,n=>{let t=n.match(/\bsrc="(\/[^"{}]+)"/);if(!t)return n;let r=x.extname(t[1]).toLowerCase(),i=si[r];if(!i)return n;let o=x.join(s,t[1]),d=ai(o);if(!d)return n;let u=d.buffer,f=/\swidth=/.test(n)||/\sheight=/.test(n)?null:d.dims,a=m=>f?m.replace(/<img\b/,`<img width="${f.width}" height="${f.height}"`):m,l=r===".svg"?oi:ri;if(u.length>l){let b=/\ssrcset=/.test(n)||/\ssizes=/.test(n)?[]:ii(s,t[1]);if(!b.length)return a(n);let w=b.map(y=>`${y.url} ${y.width}w`).join(", ");return a(n.replace(/<img\b/,`<img srcset="${w}"`))}let p=r===".svg"?`data:image/svg+xml,${u.toString("utf-8").replace(/%/g,"%25").replace(/#/g,"%23").replace(/"/g,"%22")}`:`data:${i};base64,${u.toString("base64")}`;return a(n.replace(t[0],`src="${p}"`))})}function li(e,s,n,t,r=!0,i=!1){if(!r)return`${s} += esc(${e});
`;let o=t?`(${t}) => (${e})`:`() => (${e})`,d=i?", 1":t?", 0":"";return t&&(d+=`, ${t}`),`${s} += textMark(${n}, ${o}${d});
`}var ci=new Set(["checked","disabled","readonly","required","selected","multiple","autofocus","open"]);function ui(e,s,n,t,r,i=!0){if(!i)return`${n} += '${e}="' + esc(${s}) + '"';
`;let o=r?`(${r}) => (${s})`:`() => (${s})`,d=r?`, ${r}`:"";return ci.has(e)?`${n} += boolAttrMark(${t}, ${o}, '${e}'${d});
`:`${n} += attrMark(${t}, ${o}, '${e}'${d});
`}function di(e){return`${e} += String(children);
`}var Nt="import { state, setState, persistState, $data, hasState, isSeeded, markSeeded, esc, refresh, onMount, onCleanup, $effect, getContext, $query, $t, bestLocale, localeDir, ensureLocale, loadLocale, handlers, directives, $cookies, $sessionCookie, $setCookie, $isLocal, serializeRequestCookies, $store, $udp, $tcp, $listen, $websocket, $mqtt, parseLoRaWAN, ActionError, $actionError, $actionErrorOrThrow, $actionPending, $boundaryFallback, $setBoundaryError, $boundaryError, $append, $prepend, $merge, applyStateDeltas, textMark, attrMark, boolAttrMark, ifMark, eachMark, headMark, rawMark, slotBlockMark, redirect, notFound, aggregate, loader, encodeSdui, decodeSdui, setPath as __rvsetpath, writeRowField as __rvrow } from './runtime.js';",zs=new Set(Nt.replace(/^import\s*\{/,"").replace(/\}\s*from[\s\S]*$/,"").split(",").map(e=>e.trim()).filter(Boolean)),hi=Nt.replace(/^import\s*\{/,"").replace(/\}\s*from[\s\S]*$/,"").split(",").map(e=>e.trim()).filter(Boolean);function ar(e){return e.length===0?"":e.map(s=>`const ${s.name} = __p.${s.name}${s.def?` ?? (${s.def})`:""};`).join(`
`)}var lr=`const __slot = (sl, name, pairs) => {
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
};`,cr=`
const __rvraw = (e) => {
  const t = e.target;
  const raw = t.type === 'number' || t.type === 'range' ? t.valueAsNumber : t.value;
  return typeof raw === 'number' && Number.isNaN(raw) ? null : raw;
};
`,ur=`
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
`;function fi(e,s,n,t="",r="",i=[],o=!1,d="",u=!1,c="",f=!1,a="",l="",p=!1,m=!1){let b=r?`
const __head = () => { let __hd = ''; ${r} return __hd; };
__html += headMark(closes, __head);`:"",w=f||p?`
const $setState = (key, value) => setState(key, value);`:"",y=p?ur:"",g=m?cr:"";return`
${Nt}

${d}

${t}
${c}
${w}

${o?lr:""}

export ${u?"function":"async function"} render(closes, children, __props, __slots, __iid = '') {
  ${u?`// BUG.md P1: the call site's instance id suffixes every state key and
  // handler name this render registers - two instances of one component get
  // two disjoint scopes instead of overwriting each other.
  const __ik = (k) => __iid ? k + '#' + __iid : k;
  const __hk = __ik;`:""}
  ${i.length>0?"const __p = __props || {};":""}
  ${o?"const __sl = __slots || {};":""}
  ${ar(i)}
  ${i.length>0?"const __rvlive = (k, v) => { const g = __p['__live-' + k]; return typeof g === 'function' ? g() : v; };":""}
  ${e}
  ${n}
  ${a}
  ${l}
  ${y}
  ${g}

  ${u?"":"applyStateDeltas();"}
  const __root = (__c, children) => { let h = ''; ${s} return h; };
  let __html = ${u?"":"await "}__root(closes, children);${b}
  return __html;
}
`}function pi(e,s,n,t,r="",i="",o=[],d=!1,u="",c=!1,f="",a="",l=!1,p=!1){let m=new Set,b=t.filter(v=>m.has(v.fn)?!1:(m.add(v.fn),!0)),w=b.length>0?c?b.map(v=>{let k=v.fn.indexOf(": ");return k<0?`handlers[__hk(${JSON.stringify(v.fn)})] = ${v.fn};`:`handlers[__hk(${JSON.stringify(v.fn.slice(0,k))})] = ${v.fn.slice(k+2)};`}).join(`
`):`Object.assign(handlers, { ${b.map(v=>v.fn).join(", ")} });`:"",y=b.length>0||l?"const $setState = (key, value) => setState(key, value);":"",g=l?ur:"",S=p?cr:"",E=i?`
const __head = () => { let __hd = ''; ${i} return __hd; };
__html += headMark(closes, __head);`:"";return`
${Nt}

${u}

${r}
${y?`
${y}
`:""}
${d?lr:""}

export ${c?"function":"async function"} render(closes, children, __props, __slots, __iid = '') {
  ${c?`// BUG.md P1: see generateSSR - the instance id scopes state and handlers.
  const __ik = (k) => __iid ? k + '#' + __iid : k;
  const __hk = __ik;`:""}
  ${o.length>0?"const __p = __props || {};":""}
  ${d?"const __sl = __slots || {};":""}
  ${ar(o)}
  ${o.length>0?"const __rvlive = (k, v) => { const g = __p['__live-' + k]; return typeof g === 'function' ? g() : v; };":""}
  ${e}
  ${n}
  ${f}
  ${a}
  ${S}
  ${w}
  ${g}
  const __root = (__c, children) => { let h = ''; ${s} return h; };
  let __html = ${c?"":"await "}__root(closes, children);${E}
  return __html;
}
`}var yt=(e,s)=>e.map((n,t)=>({li:n,i:t})).filter(({li:n})=>n.isLayout&&yi(n.filePath,e[s].filePath)).sort((n,t)=>t.li.filePath.length-n.li.filePath.length).map(({i:n})=>n),Zt=(e,s,n)=>s[n].csr===!0||s[n].needsClient||qn(e,s,n)?!1:!yt(e,n).some(t=>s[t].needsClient),qn=(e,s,n)=>s[n].shell===!1||yt(e,n).some(t=>s[t].shell===!1);function mi(e,s){return e.map((n,t)=>({info:n,i:t})).filter(({info:n})=>!n.isLayout&&!n.isNotFound&&!n.isError&&!n.isApi&&!n.isMiddleware&&!n.isComponent).map(({info:n,i:t})=>{if(Zt(e,s,t))return`${n.routePath}  zero-JS  nothing in the chain needs the client`;let r=[t,...yt(e,t)].filter(o=>s[o].needsClient).map(o=>`${(s[o].clientReasons??["needs the client"]).join(" + ")} in ${x.basename(e[o].filePath)}`).join("; "),i=s[t].csr===!0?" (csr = true forces the bundle)":"";return`${n.routePath}  client JS  ${r}${i}`})}var Fs=`

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
`,Pn=new Map,Ds=null;async function dr(e,s,n={}){let t=x.resolve(e),r=x.resolve(s),i=n.minify!==!1,o=n.incremental===!0,d=process.env.VERCEL==="1"||process.env.VERCEL==="true";await N.promises.mkdir(r,{recursive:!0});let u=(await N.promises.readdir(r)).filter(h=>/^(?:comp-\d+\.(?:ssr|client)|runtime|(?:server|client)-entry)\.js$/.test(h));await Promise.all(u.map(h=>N.promises.rm(x.join(r,h),{force:!0})));let[c,f]=await Promise.all([gi(t),wi(t)]),a=[...c,...f];if(c.length===0)throw new L("E-ROUTE",`no .rose pages found under ${x.join(t,"src","pages")} - run rosezm from a project root, or pass one: rosezm build <dir>`,{file:x.join(t,"src","pages"),hint:"create src/pages/index.rose in that directory (or run the command from the project root)"});let l=a.map(h=>({...bi(h,t)}));if(n.pages?.length){let h=O=>!O.isComponent&&!O.isLayout&&!O.isNotFound&&!O.isError&&!O.isApi&&!O.isMiddleware,_=new Set(n.pages.map(O=>O.replace(/\/+$/,"")||"/")),P=l.filter(h).map(O=>O.pattern),I=[..._].filter(O=>!P.includes(O));if(I.length)throw new L("E-ROUTE",`--pages names ${I.join(", ")} - no such route`,{hint:`routes: ${P.join(", ")}`});let q=l.map(O=>!h(O)||_.has(O.pattern));l=l.filter((O,K)=>q[K]);let M=a.filter((O,K)=>q[K]);a.length=0,a.push(...M)}let p=await lo(t);er=(p.watch??[]).map(h=>x.isAbsolute(h)?h:x.join(t,h));let m=p.plugins,b=a.map((h,_)=>{let P=l[_].isComponent?x.join(t,"src"):x.join(t,"src","pages");return x.relative(P,h).replace(/\\/g,"/").replace(/\.rose$/,"")}),w=new Map(a.map((h,_)=>[h,{index:_,scopeKey:b[_],slots:fo(h)}])),y=pt.transform("export default 0",{loader:"js"}).catch(()=>{}),g=await Promise.all(a.map((h,_)=>xo(h,x.join(t,"public"),b[_],l[_].isApi,m,w)));await y;{let h=new Set(Bn().map(([I])=>I)),_=[],P=new Set;for(let I=0;I<g.length;I++)for(let q of[...vs(g[I].ssr),...vs(g[I].client)]){if(h.has(q)||P.has(q))continue;P.add(q);let M=`${x.relative(t,a[I]).replace(/\\/g,"/")} reads import.meta.env.${q}`;_.push(q.startsWith(Vt)?`  ${M}
    -> it has the public prefix but is not set in this build's environment (an unset public var is undefined in the bundle; the server render does not fall back to it)`:`  ${M}
    -> only ${Vt}* is exposed to the client; rename it to ${Vt}${q} if it is public config, or keep it server-only (it stays undefined here, in dev and in the bundle)`)}_.length>0&&console.warn(`rosezm warning: import.meta.env.<name> carries only ${Vt}* variables:
${_.join(`
`)}`)}let S=new Map;a.forEach((h,_)=>{let P=[];for(let I of g[_].roseImports??[]){let q=x.resolve(x.dirname(a[_]),I.specifier),M=w.get(q);M&&P.push(M.index)}S.set(_,P)});let E=(h,_=new Set)=>{if(g[h].needsClient)return x.basename(a[h]);if(_.has(h))return null;_.add(h);for(let P of S.get(h)??[]){let I=E(P,_);if(I)return I}return null};g.forEach((h,_)=>{if(h.needsClient)return;let P=E(_);P&&(h.needsClient=!0,h.clientReasons=[...h.clientReasons??[],`imported component ${P} needs the client`])});let v=h=>{let _=[],P=new Set([h]),I=q=>{for(let M of S.get(q)??[])if(!P.has(M)){if(P.add(M),l[M].isComponent)for(let O of g[M].actionNames)_.push({name:O,j:M});I(M)}};return I(h),_},k=new Set,R=h=>{if(!k.has(h)){k.add(h);for(let _ of g[h].roseImports??[]){let P=x.resolve(x.dirname(a[h]),_.specifier),I=w.get(P);I&&R(I.index)}}};a.forEach((h,_)=>{l[_].isComponent||R(_)});let j=g.map((h,_)=>k.has(_)&&l[_].isComponent?h.style:"").filter(Boolean).join(`
`);j?await N.promises.writeFile(x.join(r,"styles.css"),j):await N.promises.rm(x.join(r,"styles.css"),{force:!0});let J={};try{let h=x.join(t,"src","locales"),_=(await N.promises.readdir(h)).filter(I=>I.endsWith(".json")),P=await Promise.all(_.map(async I=>[I.slice(0,-5),JSON.parse(await N.promises.readFile(x.join(h,I),"utf-8"))]));J=Object.fromEntries(P)}catch{J={}}let A=J.en?"en":Object.keys(J).sort()[0]??"en",W=JSON.stringify(J).replace(/</g,"\\u003c"),G=p.i18n.preload??Object.keys(J),Z=Object.keys(J).filter(h=>!G.includes(h));for(let h of G)J[h]||console.warn(`rosezm: i18n.preload lists '${h}' but there is no src/locales/${h}.json - ignored`);if(await N.promises.rm(x.join(r,"locales"),{recursive:!0,force:!0}),Z.length>0){let h=x.join(r,"locales");await N.promises.mkdir(h,{recursive:!0});for(let _ of Z)await N.promises.writeFile(x.join(h,`${_}.json`),JSON.stringify(J[_]))}let fe=Object.fromEntries(Object.keys(J).filter(h=>!Z.includes(h)).map(h=>[h,J[h]])),ge=JSON.stringify(fe).replace(/</g,"\\u003c"),B=x.join(t,".rosezm-build"),T=x.join(B,`${process.pid}-${mn(x.resolve(t))}`),H=N.existsSync(T);await N.promises.mkdir(T,{recursive:!0});let te=new Date;await N.promises.utimes(T,te,te),(!H||Ds!==T)&&(Pn.clear(),Ds=T),ls(B);let we=[x.join(x.dirname(Ut(import.meta.url)),"..","cli","content.ts"),x.join(x.dirname(Ut(import.meta.url)),"..","src","cli","content.ts")],Te=we.find(h=>N.existsSync(h))??we[0];N.copyFileSync(Te,x.join(T,"content-md.ts"));let Pe=m.filter(h=>h&&(h.onRequest||h.onResponse));if(Pe.length>0){let h=x.relative(T,x.join(t,"rosezm.config.js")).replace(/\\/g,"/");await N.promises.writeFile(x.join(T,"plugins.js"),`
import config from ${JSON.stringify(h)};

const list = Array.isArray(config) ? config : [];
export const hooks = list
  .filter((p) => p && (p.onRequest || p.onResponse))
  .map((p) => ({ name: p.name, onRequest: p.onRequest ? p.onRequest.bind(p) : null, onResponse: p.onResponse ? p.onResponse.bind(p) : null }));

export const hasRequestHooks = hooks.some((p) => p.onRequest);
export const hasResponseHooks = hooks.some((p) => p.onResponse);
`)}let Ee=["../runtime/index.ts","../src/runtime/index.ts"].map(h=>Ut(new URL(h,import.meta.url))).find(h=>N.existsSync(h));if(!Ee)throw new L("E-INTERNAL","rosezm: the runtime source (src/runtime/index.ts) was not found next to the compiler",{hint:"the published package ships src/ beside dist-cli/ - reinstall it, or run from a checkout"});let pe=rt(Ee,{entryPoints:[Ee],bundle:!0,outfile:x.join(T,"runtime.js"),format:"esm",platform:"browser",write:!0},o),_e=(()=>{let h=x.dirname(Ut(import.meta.url));for(let _ of[x.join(h,"..","cli","prod-server.ts"),x.join(h,"..","src","cli","prod-server.ts")])if(N.existsSync(_))return _;return x.join(h,"..","cli","prod-server.ts")})(),z="import { createRequire as __cr } from 'node:module'; import { fileURLToPath as __f2p } from 'node:url'; import { dirname as __dn } from 'node:path'; const require = __cr(import.meta.url); const __filename = __f2p(import.meta.url); const __dirname = __dn(__filename);",Le=o?Promise.resolve({}):rt(_e,{entryPoints:[_e],bundle:!0,outfile:x.join(r,"prod.mjs"),format:"esm",platform:"node",write:!0,banner:{js:z},...ht,...i?{minify:!0,keepNames:!0}:{}},o);pe.catch(()=>{}),Le.catch(()=>{});let Je=[];if(n.cjs){Je.push(rt(_e,{entryPoints:[_e],bundle:!0,outfile:x.join(r,"prod.cjs"),format:"cjs",platform:"node",write:!0,define:{"import.meta.url":"__rosezmMetaUrl"},banner:{js:"const __rosezmMetaUrl = require('node:url').pathToFileURL(__filename).href;"},...ht,...i?{minify:!0,keepNames:!0}:{}},o));for(let h of Je)h.catch(()=>{})}let Y=[],X=(h,_)=>{Pn.get(h)!==_&&(Pn.set(h,_),Y.push(N.promises.writeFile(x.join(T,h),_)))};for(let h=0;h<g.length;h++){let _=g[h].api??g[h].ssr;X(`comp-${h}.ssr.js`,_),l[h].isApi||X(`comp-${h}.client.js`,g[h].client)}for(let h=0;h<Y.length;h+=64)await Promise.all(Y.slice(h,h+64));let D=l.map((h,_)=>({info:h,i:_})).filter(({info:h})=>!h.isLayout&&!h.isNotFound&&!h.isError&&!h.isApi&&!h.isMiddleware&&!h.isComponent).sort((h,_)=>{let P=M=>{let O=M.split("/");return[O.filter(K=>K.startsWith("**")).length,O.filter(K=>K.startsWith("*")).length,O.filter(K=>K.startsWith(":")).length]},I=P(h.info.pattern),q=P(_.info.pattern);for(let M=0;M<3;M++)if(I[M]!==q[M])return I[M]-q[M];return h.info.filePath<_.info.filePath?-1:1}),re=l.map((h,_)=>({info:h,i:_})).filter(({info:h})=>h.isApi).sort((h,_)=>{let P=M=>{let O=M.split("/");return[O.filter(K=>K.startsWith("**")).length,O.filter(K=>K.startsWith("*")).length,O.filter(K=>K.startsWith(":")).length]},I=P(h.info.pattern),q=P(_.info.pattern);for(let M=0;M<3;M++)if(I[M]!==q[M])return I[M]-q[M];return h.info.filePath<_.info.filePath?-1:1}),oe=h=>{let _=`render_${h}`;for(let P of yt(l,h))_=`(async (closes, children) => await render_${P}(closes, await (${_})(closes, children)))`;return _},ne=x.join(t,"src","pages","_layout.rose"),$e=a.findIndex((h,_)=>g[_].bundle&&h!==ne);if($e>=0)throw new L("E-BUNDLE",`${x.basename(a[$e])}: export const bundle switches the whole app's bundle mode, so it belongs in the root layout (src/pages/_layout.rose)`,{file:a[$e],hint:"move `export const bundle = 'split'` (or 'inline') to src/pages/_layout.rose - the mode is per-app, not per-page"});let Ce=g[a.indexOf(ne)]?.bundle??"inline",ue=Ce==="split",se=Ce==="sliced",Q=h=>"s"+Tt(h),ee=Nt.replace(/^import\s*\{/,"").replace(/\}\s*from[\s\S]*$/,"").split(",").map(h=>h.trim()).filter(Boolean),me=(()=>{let h=P=>P.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),_=new Set;for(let P of g){if(!P.client)continue;let I=P.client.replace(/^import\s*\{[^}]*\}\s*from\s*'\.\/runtime\.js';/m,"");for(let q of ee)_.has(q)||new RegExp(`(?<![\\w$])${h(q)}(?![\\w$])`).test(I)&&_.add(q)}return ee.filter(P=>_.has(P))})(),Fe=h=>[h,...yt(l,h)],We=h=>`load: () => loadChain([${Fe(h).map(_=>`() => import('./comp-${_}.client.js')`).join(", ")}])`,De=h=>Zt(l,g,h),Ze=g.map((h,_)=>{if(!k.has(_))return"";if(l[_].isMiddleware)return`import * as middlewareMod from './comp-${_}.ssr.js';`;if(l[_].isApi){let le=(g[_].apiMethods??[]).map(Re=>`${Re} as ${Re}_${_}`).join(", ");return le?`import { ${le} } from './comp-${_}.ssr.js';`:`import './comp-${_}.ssr.js';`}let P=!l[_].isLayout&&!l[_].isNotFound,I=P?g[_].actionNames:[],q=I.map(he=>`${he} as ${he}_${_}`).join(", "),M=P?(()=>{let he=new Set(I),le=[],Re=new Set;for(let Qe of v(_))if(!(he.has(Qe.name)||Re.has(Qe.j))){Re.add(Qe.j);for(let gt of g[Qe.j].actionNames)le.push(`${gt} as ${gt}_${Qe.j}`)}return le.join(", ")})():"",O=P&&g[_].guardName?`beforeAction as beforeAction_${_}`:"",K=[q,O].filter(Boolean).join(", "),ve=M?M.split(", ").reduce((he,le)=>{let Re=le.split(" as ")[1],Qe=Number(Re.slice(Re.lastIndexOf("_")+1)),gt=he.findIndex(an=>an.endsWith(`comp-${Qe}.ssr.js';`));return gt>=0?he[gt]=he[gt].replace(" };",`, ${le} };`):he.push(`import { ${le} } from './comp-${Qe}.ssr.js';`),he},[]):[],je=ve.length?`
${ve.join(`
`)}`:"";return(K?`import { render as render_${_}, ${K} } from './comp-${_}.ssr.js';`:`import { render as render_${_} } from './comp-${_}.ssr.js';`)+je}).join(`
`),Xe=l.map((h,_)=>({info:h,i:_})).filter(({info:h})=>h.isNotFound).map(({info:h,i:_})=>{let P=x.relative(x.join(t,"src","pages"),h.filePath).replace(/\\/g,"/"),I=x.posix.dirname(P),q=I==="."?"/":"/"+I,M=[];qn(l,g,_)&&M.push("shell: false"),Zt(l,g,_)&&M.push("csr: false");let O=M.length?`, { ${M.join(", ")} }`:"";return{prefix:q,render:oe(_),flags:O}}).sort((h,_)=>_.prefix.length-h.prefix.length),de=`[
${Xe.map(h=>`  ['${h.prefix}', ${h.render}${h.flags}],`).join(`
`)}
]`,Oe=l.findIndex(h=>h.isError),Ie=Oe>=0?oe(Oe):"null",lt=Oe>=0?Zt(l,g,Oe):!1,Ue=l.findIndex(h=>h.isMiddleware),bt=[];if(Ue>=0){let h=await N.promises.readFile(a[Ue],"utf8"),_=/<script>([\s\S]*?)<\/script>/.exec(h)?.[1]??"",P=Qt(_),I=P.search(/\bexport\s+const\s+gated\s*=\s*\[/);if(I>=0){let q=_.indexOf("[",I),M=un(P,P.indexOf("[",I));if(M<0)throw new L("E-EXPORT",`${a[Ue]}: export const gated is not a closed array`,{file:a[Ue],hint:"the value must be an array of string prefixes, e.g. export const gated = ['/admin']"});let O=_.slice(q+1,M),K=[...O.matchAll(/(['"])((?:\\.|(?!\1).)*)\1/g)].map(je=>je[2]);if(O.replace(/(['"])((?:\\.|(?!\1).)*)\1/g,"").replace(/,/g,"").trim()||K.some(je=>!je.startsWith("/")))throw new L("E-EXPORT",`${a[Ue]}: export const gated accepts string path prefixes only`,{file:a[Ue],hint:`got ${JSON.stringify(O.trim())} - e.g. export const gated = ['/admin', '/vault']`});bt=K}}let xe=x.join(t,"src","app.rose"),Lt="";if(N.existsSync(xe)){let h=await N.promises.readFile(xe,"utf8"),_=/<script>([\s\S]*?)<\/script>/.exec(h)?.[1]??"";if(!_.trim())throw new L("E-EXPORT",`${xe}: an app.rose needs a <script> block with its lifecycle exports`,{file:xe,hint:"export function onLaunch() {...} (and optionally onShow/onHide/onError and a globalData object)"});let P=pt.transformSync(_,{loader:"ts",format:"esm",target:"es2020"}).code,I=je=>{let he=new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${je}\\s*\\([^)]*\\)\\s*\\{`).exec(P);if(!he)return null;let le=0;for(let Re=he.index+he[0].length-1;Re<P.length;Re++)if(P[Re]==="{")le++;else if(P[Re]==="}"&&(le--,le===0))return`${/(?:export\s+)?((?:async\s+)?function\s+\w+\s*\([^)]*\))/.exec(he[0])[1]} {${P.slice(he.index+he[0].length,Re+1)}`;return null},q=I("onLaunch"),M=I("onShow"),O=I("onHide"),K=I("onError"),ve=/(?:export\s+)?const\s+globalData\s*=\s*(\{[\s\S]*?\n?\})\s*;?/.exec(P)?.[1]??null;if(!q&&!M&&!O&&!K&&!ve)throw new L("E-EXPORT",`${xe}: no lifecycle exports found in the script`,{file:xe,hint:"export function onLaunch() {...} (and optionally onShow/onHide/onError and a globalData object)"});Lt=`
// App-level lifecycle from src/app.rose: onLaunch once at boot, onShow/onHide
// on visibilitychange, onError on window.onerror, globalData on window.__rosezmApp.
// Guarded on window: the same bundle also runs in Node for SSR, where none of
// this exists (the same guard the lazy-hydration flag below uses).
if (typeof window !== 'undefined') {
window.__rosezmApp = ${ve?`(${ve})`:"{}"};
${q?`var __appLaunch = ${q};`:""}
${M?`var __appShow = ${M};`:""}
${O?`var __appHide = ${O};`:""}
${K?`var __appErr = ${K};`:""}
var __appLaunched = false;
window.addEventListener('error', function (e) { if (typeof __appErr === 'function') { try { __appErr(e.error || new Error(e.message)); } catch (x) {} } });
window.addEventListener('unhandledrejection', function (e) { if (typeof __appErr === 'function') { try { __appErr(e.reason instanceof Error ? e.reason : new Error(String(e.reason))); } catch (x) {} } });
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible' && typeof __appShow === 'function') { try { __appShow(); } catch (x) {} }
  if (document.visibilityState === 'hidden' && typeof __appHide === 'function') { try { __appHide(); } catch (x) {} }
});
}`}let _t=D.map(({info:h,i:_})=>{let P=new Set(g[_].actionNames),I=v(_).filter(le=>!P.has(le.name)),q=[...g[_].actionNames.map(le=>`${le}: ${le}_${_}`),...I.map(le=>`${le.name}: ${le.name}_${le.j}`)].join(", ");if(g[_].csr===!1&&g[_].needsClient)throw new L("E-EXPORT",`${h.filePath}: csr = false but this route needs the client bundle (${(g[_].clientReasons??["needs the client"]).join(" + ")}).`,{file:h.filePath,hint:"remove csr = false (the compiler decides zero-JS by itself), or remove the client-only code listed above"});if(g[_].csr===!1){let le=yt(l,_).find(Re=>g[Re].needsClient);if(le!==void 0)throw new L("E-EXPORT",`${h.filePath}: csr = false cannot ship under ${l[le].filePath} - the layout needs the client bundle (event wiring, onMount/onCleanup, refresh() or a server action).`,{file:h.filePath,hint:"a layout needing the runtime bundles every route under it - drop csr = false here, or make the layout content-only"})}let M=De(_)?", csr: false":"",O=qn(l,g,_)?", shell: false":"",K=g[_].buffer?", buffer: true":"",ve=g[_].controlSignal?", signal: true":"",je=g[_].guardName?`, guard: beforeAction_${_}`:"",he=se&&!De(_)?`, slice: '${Q(h.pattern)}'`:"";return`{ pattern: '${h.pattern}', path: '${h.routePath}', render: ${oe(_)}, actions: ${q?`{ ${q} }`:"null"}${je}${M}${O}${K}${ve}${he} }`}).join(`,
  `),$t=g.some(h=>h.usesrosezmAuth),xt=g.some(h=>/\$(?:udp|tcp|listen|mqtt)\s*\(/.test((h.ssr||"")+(h.client||"")+(h.api||""))),vt=g.some(h=>/\$websocket\s*\(/.test((h.ssr||"")+(h.client||"")+(h.api||""))),xn=`
${Ze}
import { renderMarkdown } from './content-md.ts';
${$t?"import crypto from 'node:crypto';":"// no route references __rosezmAuth: the node:crypto auth helpers are omitted, keeping the bundle edge-loadable"}
${xt?`import * as __rosezmDgram from 'node:dgram';
import * as __rosezmNet from 'node:net';`:"// no route opens a network listener ($udp/$tcp/$listen): the node:dgram/node:net imports are omitted, keeping the bundle edge-loadable"}
${vt?`import * as __rosezmHttp from 'node:http';
import * as __rosezmCrypto from 'node:crypto';`:"// no route opens a WebSocket server ($websocket): the node:http/node:crypto imports are omitted, keeping the bundle edge-loadable"}
import { setState, persistState, clearRequestState, isolateRender, serializeState, resetRequestContext, clientAddress, installContextStore, setRequestQuery, getRequestQuery, getContext, serializeRequestCookies, isLocale, setLocales, localeList, localeDir, setStoreTransport, applyStorePatch, ActionError, StateDelta, setStateDelta, esc, __startNetwork, __stopNetwork, $udp, $tcp, $listen, $websocket, $mqtt } from './runtime.js';
export { __startNetwork, __stopNetwork };
${Pe.length>0?"import { hooks as __pluginHooks, hasRequestHooks as __hasRequestHooks, hasResponseHooks as __hasResponseHooks } from './plugins.js';":`// no plugin declares a runtime hook, so there is no plugins
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


setLocales(${W}, '${A}');


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
export const defaultLocale = '${A}';

// Route params maps, re-exported for the build's prerender step: routePath -> the component's exported params (a static map or a function).
${D.filter(({i:h})=>g[h].hasParams).map(({i:h})=>`import * as comp_${h} from './comp-${h}.ssr.js';`).join(`
`)}

export const routeParams = {
  ${D.filter(({info:h,i:_})=>g[_].hasParams).map(({info:h,i:_})=>`'${h.routePath}': comp_${_}.params`).join(`,
  `)}
};

// Routes whose component reads the request context (getContext()), mutates a shared store ($store()), reads the query ($query(), P0-1)
export const dynamicRoutes = [
  ${D.filter(({i:h})=>g[h].usesContext||g[h].cspNonce||g[h].buffer||g[h].controlSignal||g[h].needsClient).map(({info:h})=>`'${h.routePath}'`).join(`,
  `)}
];

// Routes that the prerender function should skip (not bake into static files).
export const prerenderSkipRoutes = [
  ${D.filter(({i:h})=>g[h].usesContext||g[h].cspNonce||g[h].buffer||g[h].controlSignal).map(({info:h})=>`'${h.routePath}'`).join(`,
  `)}
];

// Which api routes opt into build-time baking (export const prerender = true): routePath -> boolean.
${re.filter(({i:h})=>g[h].hasPrerender).map(({i:h})=>`import * as api_${h} from './comp-${h}.ssr.js';`).join(`
`)}

export const apiPrerender = {
  ${re.map(({info:h,i:_})=>`'${h.routePath}': ${g[_].hasPrerender?`api_${_}.prerender === true`:"false"}`).join(`,
  `)}
};


export const revalidate = [
  ${D.filter(({i:h})=>g[h].revalidate!==void 0&&!g[h].usesContext).map(({info:h,i:_})=>`{ pattern: '${h.pattern}', seconds: ${g[_].revalidate} }`).join(`,
  `)}
];

// Per-request render memo (export const cache = N): a dynamic route's whole renderPage result is memoized for N seconds.
// A page that reads getContext() holds per-request state (the middleware
// put the caller's identity there), so its render must not be memoized: the
// second request in the window replayed the FIRST request's whole page -
// another user's context, in the same slot. The revalidate list above
// already refuses such a page; the memo did not, and now it does too.
export const routeCaches = [
  ${D.filter(({i:h})=>g[h].cache!==void 0&&!g[h].usesContext).map(({info:h,i:_})=>`{ pattern: '${h.pattern}', seconds: ${g[_].cache} }`).join(`,
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
  ${[...D,...re].filter(({i:h})=>g[h].hotVary).map(({info:h,i:_})=>`{ pattern: '${h.pattern}', dims: ${JSON.stringify(g[_].hotVary)} }`).join(`,
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
const contentCollections = ${JSON.stringify(ys(x.join(t,"src","content")))};
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
${xt?`// The isomorphic runtime's $udp/$tcp reach Node's dgram/net only through these globals; injecting them at server boot is what lets __startNetwork() turn a registered spec into a bound socket.
(globalThis as any).__rosezm_dgram = __rosezmDgram;
(globalThis as any).__rosezm_net = __rosezmNet;`:""}
${vt?`// The isomorphic runtime's $websocket performs the RFC 6455 handshake (sha1) on a node:http upgrade socket; both reach it only through these globals.
(globalThis as any).__rosezm_http = __rosezmHttp;
(globalThis as any).__rosezm_crypto = __rosezmCrypto;`:""}
globalThis.__rosezmExtras = { v, jobs, sse, udp: $udp, tcp: $tcp, listen: $listen, websocket: $websocket, mqtt: $mqtt };
${$t?`
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
export const middleware = ${Ue>=0?"middlewareMod.handle ?? null":"null"};

// Routes whose DOCUMENTS ship without the client bundle ( decided by the compiler since #29): HTML + CSS only - no runtime, no state script.
export const noJsRoutes = [
  ${D.filter(({i:h})=>De(h)).map(({info:h})=>`'${h.pattern}'`).join(`,
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
  ${D.filter(({i:h})=>g[h].headers).map(({info:h,i:_})=>`{ pattern: '${h.pattern}', headers: ${JSON.stringify(g[_].headers)} }`).join(`,
  `)}
];

export function headersFor(pathname) {
  return routeClass(pathname).headers;
}


export const cspNonceRoutes = [
  ${D.filter(({i:h})=>g[h].cspNonce).map(({info:h})=>`'${h.routePath}'`).join(`,
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
  ${_t}
];

// API routes (pages/api/*.rose): pattern -> HTTP-method handlers. They never render HTML and never reach the client bundle.
const apiRoutes = [
  ${re.map(({info:h,i:_})=>{let P=(g[_].apiMethods??[]).map(I=>`${I}: ${I}_${_}`).join(", ");return`{ pattern: '${h.pattern}', path: '${h.routePath}', handlers: { ${P} } }`}).join(`,
  `)}
];

// Not-found pages, deepest segment first: the root 404.rose ('/') and any
// pages/<seg>/_notfound.rose, each already composed with its layout chain.
// notFoundFor picks the nearest one up the path - an /admin miss answers
// the admin 404, a public miss the site's - and notFoundPage is the whole
// answer (real 404 status, or the built-in plain 404 when the app has none).
const notFoundRoutes = ${de};
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


const errorPage = ${Ie};


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
${se?`export function sliceKeyFor(pathname) {
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
          const fb = await renderFallback(pathname, errorPage, ${lt});
          return { ...fb, html: fb.html + devDetail, status: 500${lt?", csr: false":""} };
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
`;try{let h=[...D,...re].map(({info:ve})=>ve.pattern),_=[...new Set(h)].sort(),P=_.map(ve=>JSON.stringify(ve)).join(" | ")||"'/'",I=ve=>(ve.match(/:[\w]+|\*\*[\w]+|\*[\w]+/g)??[]).map(je=>je.replace(/^[*:]+/,"")),q=_.map(ve=>{let je=I(ve);return je.length?"  "+JSON.stringify(ve)+": { "+je.map(he=>he+": string | number").join("; ")+` };
`:""}).join(""),M=x.join(t,"src",".rosezm");await N.promises.mkdir(M,{recursive:!0});let O=["// GENERATED by rosezm build - do not edit.","export type RoutePath = "+P+";","export const routePatterns = "+JSON.stringify(_)+" as const;","export type RouteParams = {",q,"};","/** Build a URL from a route pattern and its params. */","export function url(","  path: RoutePath,","  params: RouteParams[keyof RouteParams] = {} as never,","): string {","  let out = path as string;","  for (const [k, v] of Object.entries(params as Record<string, string | number>)) {","    out = out.replace(new RegExp('[:*]+' + k, 'g'), String(v));","  }","  return out;","}"].join(`
`)+`
`,K=x.join(M,"routes.ts");try{await N.promises.readFile(K,"utf8")!==O&&await N.promises.writeFile(K,O)}catch{await N.promises.writeFile(K,O)}}catch{}await N.promises.writeFile(x.join(T,"server-entry.js"),xn),await pe;let It=rt(x.join(T,"server-entry.js"),{entryPoints:[x.join(T,"server-entry.js")],bundle:!0,outfile:x.join(r,d?"engine.js":"server.js"),format:"esm",platform:"node",write:!0,...ht,...i?{minify:!0,keepNames:!0}:{}},o);It.catch(()=>{}),n.cjs&&(Je.push(rt(x.join(T,"server-entry.js"),{entryPoints:[x.join(T,"server-entry.js")],bundle:!0,outfile:x.join(r,"server.cjs"),format:"cjs",platform:"node",write:!0,...ht,...i?{minify:!0,keepNames:!0}:{}},o)),Je[Je.length-1].catch(()=>{}));let kt=g.map((h,_)=>({i:_})).filter(({i:h})=>!l[h].isApi&&!l[h].isMiddleware&&k.has(h)).map(({i:h})=>`import { render as render_${h} } from './comp-${h}.client.js';`).join(`
`),Vn=ue||se?"":kt,Ve=ue?D.map(({info:h,i:_})=>`{ pattern: '${h.pattern}', ${We(_)} }`).join(`,
  `):D.map(({info:h,i:_})=>`{ pattern: '${h.pattern}', render: ${oe(_)} }`).join(`,
  `),en=h=>`load: () => __navRoute(${JSON.stringify(h)})`,St=h=>{let _=h===null?null:new Set(Fe(h)),P=[se?`import { ${me.join(", ")} } from './runtime.js';`:"",_?g.map((q,M)=>({i:M})).filter(({i:q})=>_.has(q)&&!l[q].isApi&&!l[q].isMiddleware&&k.has(q)).map(({i:q})=>`import { render as render_${q} } from './comp-${q}.client.js';`).join(`
`):""].filter(Boolean).join(`
`),I=D.map(({info:q,i:M})=>h!==null&&M===h?`{ pattern: '${q.pattern}', render: ${oe(M)} }`:`{ pattern: '${q.pattern}', ${en(q.pattern)} }`).join(`,
  `);return{imports:P,routes:I}},tn=`[
${Xe.map(h=>`  ['${h.prefix}', { load: () => __navNotFound(${JSON.stringify(h.prefix)}) }${h.flags}],`).join(`
`)}
]`,vn=Oe>=0?"{ load: () => __navError() }":"null",kn=g.find(h=>h.prefetch)?.prefetch??"all",zt=g.find(h=>h.lazyHydration)?.lazyHydration??!1,ct=g.some(h=>h.vitals===!0),Ft=ct?`


reportVitals();
`:"",He=l.some(h=>h.pattern.includes(":lang")),qe=He?`      
      
      
      
      
 
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
      if (!known) {`:"      if (langIdx >= 0 && !isLocale(pathname.split('/')[langIdx])) {",tt=h=>`
${h.imports}
import { state, setState, resumeState, clearRequestState, resetEffects, wire, isolateStateAsync, restoreState, setRefreshHook, clearMounts, flushMounts, adoptCleanups, handlers, setActionDispatcher, setLocales, setLocalePacks, ensureLocale, isLocale, localeDir, setPrefetchOverride, serializeState, setFxOwner, resetContainerFx, clearHead, esc, applyStorePatch } from './runtime.js';
${h.publish}
${g.some(_=>_.usesStore)?`
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
setLocales(${ge}, '${A}');
setLocalePacks(${JSON.stringify(Z)});
${He?`// the default locale, kept beside setLocales' own copy so <html lang> can
// follow a route that carries no [lang] segment (a non-i18n page)
const __defLocale = '${A}';`:""}
${ct?`// the app asked for web-vitals. The import is what keeps
// reportVitals alive through minification and tree-shaking; the call is one
// statement at boot, before the first render.
import { reportVitals } from './runtime.js';`:""}
// Lazy hydration: when the app opts in (export const lazyHydration = true in
// the root _layout.rose), the bootstrap defers the initial wire() to
// requestIdleCallback. The flag is set here (module eval runs before the
// bootstrap's start() call) so the bootstrap can read it without a second channel.
if (typeof window !== 'undefined') window.__rosezmLazy = ${JSON.stringify(zt)};
${Lt}
// The two pack doors, re-exported for an app that wants to warm a language before its visitor asks for it (ensureLocale) or to feed a dictionary.
export { ensureLocale, loadLocale } from './runtime.js';
${h.prefetchDoor}
${Ft}
${h.nav}
// BL: a _middleware.rose only ran on the server, so a wall (an auth check
// answering 302) vanished the moment a visitor navigated CLIENT-SIDE - the
// admin shell painted right there in the browser. When the app HAS a
// middleware, start() asks the server's gate for the target route first: one
// few-byte JSON request, no render, and a redirect is honoured by a full
// navigation (where the middleware fires for real). Apps without a middleware
// get false and keep the old path - no extra request.
const __hasMiddleware = ${Ue>=0?"true":"false"};
// The middleware's declared walls (export const gated = [...] in
// _middleware.rose), baked at build time. Empty = the middleware can wall
// anything and only it knows - the client asks the gate on every navigation.
const __gatedPrefixes = ${JSON.stringify(bt)};
const routes = [
  ${h.routes}
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
const notFoundRoutes = ${h.notFoundTable};
const notFoundFor = (pathname) => {
  for (const [prefix, render] of notFoundRoutes) {
    if (prefix === '/' || pathname === prefix || pathname.startsWith(prefix + '/')) return render;
  }
  return null;
};

// whose render throws degrades to this instead of failing the response.
const errorPage = ${h.errorRender};

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
let prefetchMode = ${JSON.stringify(kn)};
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
${qe}
        
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
${He?` // the same app-root gate as above - a mount never touches the
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
`,nn=se?`
// === Sliced mode: the runtime bridge === The routes this document did NOT
// inline ride the shared nav chunk, whose components resolve the runtime
// through this object instead of bundling a second copy. Published before any
// render runs; the chunk's shim throws if it loads first.
globalThis.__rosezm_rt = { ${me.join(", ")} };`:"",Et=h=>se?`
// === Sliced mode: the shared nav chunk === One file holds every route's
// render chain this document did not inline, fetched on the first cross-route
// navigation (or a hover prefetch). __rosezm_navImport is the override seam
// (tests, or a host page with its own loader); the browser default is a plain
// dynamic import of the versioned URL, which 'self' in the CSP allows.
const __navUrl = ${JSON.stringify(h)};
const __navImport = globalThis.__rosezm_navImport || ((u) => import(u));
let __navMod = null;
const __nav = async () => (__navMod ??= await __navImport(__navUrl));
const __navRoute = async (pattern) => (await __nav()).navRenders[pattern];
const __navNotFound = async (prefix) => (await __nav()).navNotFound[prefix];
const __navError = async () => (await __nav()).navError;
`:"",Rt=tt({imports:se?St(null).imports:Vn,routes:se?St(null).routes:Ve,publish:"",nav:"",notFoundTable:se?tn:de,errorRender:se?vn:Ie,prefetchDoor:""});se||await N.promises.writeFile(x.join(T,"client-entry.js"),Rt);let rn=se?(async()=>{X("runtime-global.js",["// Sliced-mode bridge (generated): the nav chunk resolves the runtime","// through the copy the route slice published, so a page runs exactly one","// runtime. Exports are tree-shaken to what the chunk references.","const __rt = globalThis.__rosezm_rt;","if (!__rt) throw new Error('rosezm: the sliced bundle bridge is missing - the route slice did not publish the runtime before the nav chunk loaded');",...ee.map(O=>`export const ${O} = __rt.${O};`)].join(`
`)+`
`);let h=[];for(let O=0;O<g.length;O++)l[O].isApi||!k.has(O)||!g[O].client||h.push(N.promises.writeFile(x.join(T,`nav-comp-${O}.client.js`),g[O].client.replace(/from '\.\/runtime\.js'/g,"from './runtime-global.js'").replace(/from '\.\/comp-(\d+)\.client\.js'/g,"from './nav-comp-$1.client.js'")));let _=`
${kt.replace(/from '\.\/comp-(\d+)\.client\.js'/g,"from './nav-comp-$1.client.js'")}
export const navRenders = {
  ${D.map(({info:O,i:K})=>`'${O.pattern}': { render: ${oe(K)} },`).join(`
  `)}
};
export const navNotFound = {
  ${Xe.map(O=>`'${O.prefix}': { render: ${O.render} },`).join(`
  `)}
};
export const navError = ${Oe>=0?`{ render: ${oe(Oe)} }`:"null"};
`;await Promise.all([...h,N.promises.writeFile(x.join(T,"nav-entry.js"),_)]),await rt(x.join(T,"nav-entry.js"),{entryPoints:[x.join(T,"nav-entry.js")],bundle:!0,outfile:x.join(r,"nav.js"),format:"esm",platform:"browser",minify:!0,write:!0,...ht},o);let P=await N.promises.readFile(x.join(r,"nav.js")),I="/nav.js?v="+Tt(P);await Jt(x.join(r,"slices")),await N.promises.mkdir(x.join(r,"slices"),{recursive:!0});let q=[{entryFile:"client-entry.js",outFile:x.join(r,"client.js"),own:null},...D.map(({i:O})=>{let K=Q(l[O].pattern);return{entryFile:`slice-entry-${K}.js`,outFile:x.join(r,"slices",`${K}.js`),own:O}})],M=[];for(let{entryFile:O,outFile:K,own:ve}of q){let je=St(ve),he=x.join(T,O);await N.promises.writeFile(he,tt({imports:je.imports,routes:je.routes,publish:nn,nav:Et(I),notFoundTable:tn,errorRender:vn,prefetchDoor:`
export { setPrefetchOverride } from './runtime.js';`})),M.push(rt(he+":slice",{entryPoints:[he],bundle:!0,outfile:K,format:"esm",platform:"browser",minify:!0,write:!0,...ht},o))}return await Promise.all(M),{}})():ue?(async()=>(await Jt(x.join(r,"chunks")),rt(x.join(T,"client-entry.js")+":split",{entryPoints:[x.join(T,"client-entry.js")],bundle:!0,format:"esm",platform:"browser",minify:!0,splitting:!0,outdir:r,entryNames:"client",chunkNames:"chunks/[name]-[hash]",write:!0,...ht},o)))():rt(x.join(T,"client-entry.js"),{entryPoints:[x.join(T,"client-entry.js")],bundle:!0,outfile:x.join(r,"client.js"),format:"esm",platform:"browser",minify:!0,write:!0,...ht},o);await Promise.all([It,rn,Le]),d&&await N.promises.writeFile(x.join(r,"server.js"),["// VERCEL root entrypoint (BUG-009): the platform hands every request to","// this file by name. The named exports are the engine (the edge adapter","// imports them); the default is the full prod server (http.Server, which","// does not listen when VERCEL is set - the platform drives it).","export * from './engine.js';","export { default } from './prod.mjs';",""].join(`
`),"utf8");for(let h of[x.join(r,d?"engine.js":"server.js"),x.join(r,"prod.mjs")])try{if(!N.existsSync(h))continue;let _=await N.promises.readFile(h,"utf8");if(_.startsWith(z))continue;(/Dynamic require of/.test(_)||/(?<![\w$])require\s*\(/.test(_))&&await N.promises.writeFile(h,z+_,"utf8")}catch{}let Dt=Fs;try{let h=N.readFileSync(x.join(r,"client.js"));Dt=Fs.replace("from '/client.js'",`from '/client.js?v=${Tt(h)}'`)}catch{}await N.promises.writeFile(x.join(r,"mount.js"),Dt);let on=x.join(t,"public");if(N.existsSync(on)&&await N.promises.cp(on,x.join(r,"public"),{recursive:!0}),!n.quiet){console.log("zero-JS report:");for(let h of mi(l,g))console.log("  "+h)}let mt=new Map;for(let{info:h,i:_}of D)if(Zt(l,g,_))for(let P of[_,...yt(l,_)])for(let I of g[P].jsWarnings??[]){let q=mt.get(I);q||(q={why:I,files:new Map},mt.set(I,q));let M=x.relative(t,l[P].filePath).replace(/\\/g,"/"),O=q.files.get(M);O||(O=new Set,q.files.set(M,O)),O.add(h.routePath)}for(let h of mt.values()){let _=new Set;for(let M of h.files.values())for(let O of M)_.add(O);let P=[...h.files.entries()].sort((M,O)=>O[1].size-M[1].size).map(([M,O])=>`${M} (${O.size===1?[...O][0]:`${O.size} routes`})`),I=P.slice(0,4).join(", "),q=P.length>4?`, +${P.length-4} more files`:"";n.quiet||console.warn(`rosezm warning: ${_.size} routes ship zero JavaScript while their chain contains ${h.why} - ${I}${q}`)}return{routes:D.map(({info:h})=>h),bundle:Ce,config:p}}async function gi(e){let s=x.join(e,"src","pages");if(!N.existsSync(s))return[];async function n(t){let r=await N.promises.readdir(t,{withFileTypes:!0}),i=[];for(let o of r){let d=x.join(t,o.name);o.isDirectory()?i.push(...await n(d)):o.name.endsWith(".rose")&&i.push(d)}return i}return n(s)}async function wi(e){let s=x.join(e,"src","components");if(!N.existsSync(s))return[];async function n(t){let r=await N.promises.readdir(t,{withFileTypes:!0}),i=[];for(let o of r){let d=x.join(t,o.name);o.isDirectory()?i.push(...await n(d)):o.name.endsWith(".rose")&&i.push(d)}return i}return n(s)}function yi(e,s){let n=x.dirname(e),t=x.dirname(s);return t===n||t.startsWith(n+x.sep)}function bi(e,s){let n=x.join(s,"src","pages"),r=x.relative(n,e).replace(/\\/g,"/").replace(/\.rose$/,""),i=x.posix.basename(r),o=e.replace(/\\/g,"/").includes("/src/components/"),d=!o&&i==="_layout",u=!o&&(i==="404"||i==="_notfound"),c=!o&&i==="500",f=!o&&(r==="api"||r.startsWith("api/")),a=!o&&r==="_middleware",l=r.split("/").filter(y=>y!=="_layout"&&y!=="_notfound");l.length>1&&l[l.length-1]==="index"&&(l=l.slice(0,-1));let p=/^\[\.\.\.(\w+)\]$/,m=/^\[\[\.\.\.(\w+)\]\]$/,b=l.map(y=>{let g=m.exec(y);if(g)return`**${g[1]}`;let S=p.exec(y);return S?`*${S[1]}`:y.startsWith("[")&&y.endsWith("]")?`:${y.slice(1,-1)}`:y}),w;return b.length===0||b.length===1&&b[0]==="index"?w="/":w="/"+b.join("/"),{filePath:e,routePath:w,pattern:w,paramNames:l.flatMap(y=>{let g=m.exec(y);if(g)return[g[1]];let S=p.exec(y);return S?[S[1]]:y.startsWith("[")&&y.endsWith("]")?[y.slice(1,-1)]:[]}),isLayout:d,isNotFound:u,isError:c,isApi:f,isMiddleware:a,isComponent:o}}function Ye(e){return e.charAt(0).toUpperCase()+e.slice(1)}import*as Mt from"fs";import*as $n from"path";import*as hr from"esbuild";var fr=$n.join(process.cwd(),"dist");var wn=null;function pr(){try{let e=$n.join(fr,"client.js"),s=Mt.statSync(e);return(!wn||wn.mtimeMs!==s.mtimeMs)&&(wn={mtimeMs:s.mtimeMs,v:Tt(Mt.readFileSync(e))}),wn.v}catch{return""}}function mr(){let e=pr();return e?`/client.js?v=${e}`:"/client.js"}var yn=null;function _i(){let e=$n.join(fr,"styles.css");try{let s=Mt.statSync(e);return(!yn||yn.mtimeMs!==s.mtimeMs)&&(yn={mtimeMs:s.mtimeMs,source:Mt.readFileSync(e,"utf-8")}),yn.source}catch{return""}}var Un=`
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
`,Yt=null;function gr(){if(Yt===null)if(globalThis.__rosezm_SKIP_MINIFY)Yt=Un;else try{Yt=hr.transformSync(Un,{minify:!0}).code}catch{Yt=Un}return Yt}var bn=null;function $i(){let e=pr();return(bn===null||bn.v!==e)&&(bn={v:e,s:`
import { start, startNotFound, prefetch, postForm, prefetchStats, serializeState } from '${mr()}';
${gr()}`}),bn.s}var _n=null;function xi(e){if(_n!==null&&_n.for===e)return _n.out;let s=/\bexport\s*\{([^}]*)\}\s*;?\s*$/.exec(e),n=e,t="";s&&(n=e.slice(0,s.index)+e.slice(s.index+s[0].length),t=s[1].split(",").map(i=>{let o=i.split(" as ").map(d=>d.trim());return o.length===1||o[0]===o[1]?"":o[0]&&o[1]?`var ${o[1]} = ${o[0]};`:""}).join(""));let r=`
${n}
${t}
${gr()}`;return _n={for:e,out:r},r}var vi=`<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\u{1F339}</text></svg>">`,ki=`
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
  `;var Si=ki.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^"']+/g,e=>e[0]==='"'||e[0]==="'"?e:e.replace(/\s+/g," ").replace(/\s*([:;{},])\s*/g,"$1").trim()).trim();function Ei(e){let s=new Map,n=[],t=new Map,r=(i,o)=>{s.has(i)||(s.set(i,o),n.push(i))};for(let i of e){for(let o of i.matchAll(/<title[^>]*>[\s\S]*?<\/title>/gi))r("title",o[0]);for(let o of i.matchAll(/<(\w+)((?:\s+[\w:-]+(?:=(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(?:\/>|>([\s\S]*?)<\/\1\s*>|>)/gi)){let d=o[1].toLowerCase();if(d==="title")continue;let u=o[2],c=y=>{let g=u.match(new RegExp(`\\s${y}=(?:"([^"]*)"|'([^']*)')`,"i"));return g?g[1]??g[2]:null},f=u.match(/\sid=(?:"([^"]*)"|'([^']*)')/i),a=c("name"),l=c("property"),p=c("rel"),m=c("charset"),b;a!==null?b=`${d}:${a}`:l!==null?b=`${d}:${l}`:p!==null?b=`${d}:${p}${Ri(p,c)}`:m!==null?b=`${d}:${m}`:f?b=`${d}:${f[1]??f[2]}`:(b=`${d}:#${t.get(d)??0}`,t.set(d,(t.get(d)??0)+1)),b=b.replace(/"/g,"");let w=o[0].replace(/^<\w+/,y=>`${y} data-rosezm-head="${b}"`);r(b,w)}}return n.map(i=>s.get(i)).join(`
  `)}function Ri(e,s){return/(^|\s)canonical(\s|$)/i.test(e)?"":`@${s("href")??s("type")??s("as")??""}`}function Ai(e,s=""){let n=s?` nonce="${s}"`:"";if(e)return`<script type="module"${n}>${xi(e)}</script>`;let t=mr();return`${`<link rel="modulepreload" href="${t}" crossorigin>`}
<script type="module"${n} src="${t}" fetchpriority="high"></script>
<script type="module"${n}>${$i()}</script>`}function wr(e,s,n,t=[],r=_i(),i=!0,o="en",d="",u="",c=!0,f=""){let a=Ei(t),l=u?a.replace(/<script\b([^>]*)>/gi,(J,A)=>/\bnonce=/.test(A)?J:`<script${A} nonce="${u}">`):a,p=` lang="${o}"${d?` dir="${d}"`:""}`,m="",b=l.replace(/<(html|body)\b([^>]*)>/gi,(J,A,W)=>{let G=W.replace(/\s*data-rosezm-head="[^"]*"/,"");return A==="html"?p=G:m=G,""}),w=/<title>/i.test(a)?"":"<title>rosezm</title>",y=/rel=["']?icon/i.test(a)?"":`
  ${vi}`,g=b?`
  ${b}`:"",S=r?`
  <style>${r}</style>`:"",E=s.replace(/</g,"\\u003c"),v=i?`
  <script type="application/json" id="__rosezm_state">${E}</script>
  ${Ai(n,u)}`:"",k=i&&c?'<div id="app">':"",R=i&&c?"</div>":"",j=i&&c&&!S?`
  <style>${Si}</style>`:"";return`<!DOCTYPE html>
<html${p}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="${f||"width=device-width, initial-scale=1.0"}">${g}${y}
  ${w}${j}${S}
</head>
<body${m}>
  ${k}${e}${R}${v}
</body>
</html>`}var Ti=["document","Node","NodeFilter","FormData","DOMParser","location","fetch","Event","CustomEvent","MutationObserver","requestAnimationFrame"];function Ci(e){let s=ae.dirname(ae.resolve(e));for(;;){if(ye.existsSync(ae.join(s,"src","pages")))return s;let n=ae.dirname(s);if(n===s)throw new Error(`rosezm/test: ${e} is not inside a project (no src/pages found above it)`);s=n}}function ji(e,s){let n=ae.relative(ae.join(s,"src","pages"),ae.resolve(e)).replace(/\\/g,"/").replace(/\.rose$/,"");return n==="index"?"/":"/"+n.split("/").map(r=>r.startsWith("[")&&r.endsWith("]")?`:${r.slice(1,-1)}`:r).join("/")}function _r(e,s){ye.mkdirSync(s,{recursive:!0});for(let n of ye.readdirSync(e,{withFileTypes:!0})){let t=ae.join(e,n.name),r=ae.join(s,n.name);n.isDirectory()?_r(t,r):ye.copyFileSync(t,r)}}function Oi(e){return Object.entries(e).map(([s,n])=>`${s}={${JSON.stringify(n)??"undefined"}}`).join(" ")}async function Pi(e,s={}){let n=ae.resolve(e);if(!ye.existsSync(n))throw new Error(`rosezm/test: no such file: ${n}`);let t=Ci(n),r=ae.relative(t,n).replace(/\\/g,"/"),i=r.startsWith("src/components/"),o=s.dir??ye.mkdtempSync(ae.join(br.tmpdir(),"rosezm-test-"));for(let v of["src","public"]){let k=ae.join(t,v);ye.existsSync(k)&&_r(k,ae.join(o,v))}for(let v of["rosezm.config.js"]){let k=ae.join(t,v);ye.existsSync(k)&&ye.copyFileSync(k,ae.join(o,v))}let d;if(i){let v=ae.relative(ae.join(o,"src","pages"),ae.join(o,r)).replace(/\\/g,"/"),k=Oi(s.props??{}),R=`<script>
  import Target from '${v}';
</script>

<template>
  <Target ${k} />
</template>
`;ye.writeFileSync(ae.join(o,"src","pages","__rosezm_test.rose"),R),d="/__rosezm_test"}else d=s.route??ji(n,t);let u=ae.join(o,"dist");await dr(o,u);let c=v=>{let k=v.replace(/\.js$/,".import.mjs");return ye.copyFileSync(v,k),k},f=c(ae.join(u,"server.js")),a=c(ae.join(u,"client.js")),l=await import(yr(f).href),p=ye.readFileSync(ae.join(u,"client.js"),"utf-8"),m="";try{m=ye.readFileSync(ae.join(u,"styles.css"),"utf-8")}catch{}s.keep&&console.log(`rosezm/test: built ${n} -> ${u}`),!s.dir&&!s.keep&&process.once("exit",()=>{try{ye.rmSync(o,{recursive:!0,force:!0})}catch{}});let b=(v,k)=>({status:v.status??200,html:v.html,state:v.state?JSON.parse(v.state):{},head:v.head??[],csr:v.csr,shell:v.shell,lang:v.lang??"en",dir:v.dir??"",document:wr(v.html,v.state,p,v.head??[],m,v.csr!==!1,v.lang??"en",v.dir??"","",v.shell!==!1),redirect:k}),w=(v,k={},R)=>{let j=new Headers(k.headers??{});for(let[W,G]of Object.entries(k.cookies??{}))j.append("cookie",`${W}=${G}`);let J=k.method??"GET",A=J!=="GET"&&J!=="HEAD";return new Request(`http://localhost${v}`,{method:J,headers:j,body:A?R??void 0:void 0})},y=async(v,k,R)=>{let j=v.indexOf("?"),J=j>=0?Object.fromEntries(new URLSearchParams(v.slice(j+1))):null,A=j>=0?v.slice(0,j):v;j>=0?l.setQuery?.(J):l.setQuery?.({});let W="location"in globalThis,G=globalThis.location,Z=!1;if(W)try{globalThis.location=void 0,Z=!0}catch{}try{if(l.middleware){let ge=await l.runMiddleware(w(v,k,R),R);if(ge)return{status:ge.status,html:await ge.text(),state:{},head:[],lang:"en",dir:"",document:await ge.text(),redirect:ge.headers.get("location")??void 0}}let fe=await l.renderPage(A,R);return b(fe)}finally{Z&&(globalThis.location=G)}},g=0,S=d;return{route:d,dir:o,get:async(v=d,k)=>y(v,k??{}),post:async(v,k={})=>{let R=k.route??d,j=new FormData;for(let[J,A]of Object.entries(v??{}))j.append(J,String(A));return y(R,k,j)},api:async(v,k,R={})=>{if(l.middleware){let Z=await l.runMiddleware(w(k,R));if(Z)return{status:Z.status,body:await Z.text(),headers:{location:Z.headers.get("location")??""}}}let j=await l.handleApi(v,k,w(k,R)),J=await j.text(),A=J;try{A=JSON.parse(J)}catch{}let W={},G=j.headers.getSetCookie?.()??[];return j.headers.forEach((Z,fe)=>{G.length&&fe.toLowerCase()==="set-cookie"||(W[fe]=Z)}),G.length&&(W["set-cookie"]=G),{status:j.status,body:A,headers:W}},mount:async(v={})=>{let k=s.dom?.window??s.dom??globalThis;if(!k?.document||!k?.DOMParser)throw new Error('rosezm/test: mount() needs a DOM. Pass one - test("src/components/Counter.rose", { dom: new JSDOM() }) - or run under a jsdom environment.');let R=await y(d,v),j=k.document,J=j.getElementById("app")??j.body,A=j.getElementById("__rosezm_state");A||(A=j.createElement("script"),A.id="__rosezm_state",j.body.appendChild(A)),A.textContent=typeof R.state=="string"?R.state:JSON.stringify(R.state),J.innerHTML=R.html;let W=B=>{let T=B.indexOf("?");return{pathname:T>=0?B.slice(0,T):B,search:T>=0?B.slice(T):"",href:`http://localhost${B}`}},G=new Map;for(let B of Ti)G.set(B,globalThis[B]),globalThis[B]=k[B]??globalThis[B];globalThis.location=W(S),globalThis.fetch=async(B,T)=>{let H=String(B),te=H.startsWith("http")?new URL(H):null,we=te?te.pathname+te.search:H,Te=we.indexOf("?"),Pe=Te>=0?we.slice(0,Te):we;if(Pe.startsWith("/locales/")&&Pe.endsWith(".json")){let pe=ae.join(u,Pe.slice(1));return ye.existsSync(pe)?{ok:!0,json:async()=>JSON.parse(ye.readFileSync(pe,"utf-8"))}:{ok:!1,json:async()=>({})}}g++;let Ee=await y(we,v,T?.body);return{ok:Ee.status<400,status:Ee.status,text:async()=>Ee.document}};let Z=await import(yr(a).href);await Z.start(J,W(d).pathname,!0);let fe=B=>B?j.querySelector(B):J,ge={route:d,document:j,window:k,text:B=>fe(B)?.textContent??"",html:B=>fe(B)?.outerHTML??null,exists:B=>!!j.querySelector(B),click:async B=>{let T=j.querySelector(B);if(!T)throw new Error(`rosezm/test: no element matches ${B}`);T.dispatchEvent(new k.MouseEvent("click",{bubbles:!0,cancelable:!0})),await new Promise(H=>setTimeout(H,0))},fill:(B,T)=>{let H=j.querySelector(B);if(!H)throw new Error(`rosezm/test: no element matches ${B}`);H.value=T,H.dispatchEvent(new k.Event("input",{bubbles:!0}))},key:(B,T,H="keydown")=>{let te=j.querySelector(B);if(!te)throw new Error(`rosezm/test: no element matches ${B}`);te.dispatchEvent(new k.KeyboardEvent(H,{key:T,bubbles:!0,cancelable:!0}))},submit:async(B="form",T)=>{let H=j.querySelector(B);if(!H)throw new Error(`rosezm/test: no form matches ${B}`);let te=new k.FormData(H);for(let[we,Te]of Object.entries(T??{}))te.append(we,String(Te));await Z.postForm(te)},action:async(B,T)=>{let H=new k.FormData;H.append("__action",B);for(let[te,we]of Object.entries(T??{}))H.append(te,String(we));await Z.postForm(H)},navigate:async B=>{S=B,globalThis.location=W(B),await Z.start(J,W(B).pathname,!1)},state:()=>{let B=j.getElementById("__rosezm_state");return B?.textContent?JSON.parse(B.textContent):{}},requestCount:()=>g};return ge.restore=()=>{for(let[B,T]of G)globalThis[B]=T},ge}}}var ca=Pi;export{ca as default,Pi as test};
