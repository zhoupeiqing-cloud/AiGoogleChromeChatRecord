function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["assets/jspdf.es.min-C65NuaZ2.js","assets/preload-helper-Dxd-94ss.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
import{_ as L}from"./preload-helper-Dxd-94ss.js";const D={qianwen:"千问",doubao:"豆包"};function u(t){return{...t,title:t.title||"未命名对话",messages:Array.isArray(t.messages)?t.messages:[],tags:Array.isArray(t.tags)?t.tags:[]}}function z(t,o={}){const e=u(t),{includeTimestamp:n=!0,includeRole:i=!0}=o;let r=`# ${e.title}

`;if(r+=`> 平台: ${_(e.platform)} | 时间: ${g(e.createdAt)}

`,r+=`---

`,!e.messages.length)return r+=`_暂无消息正文_

`,r;for(const a of e.messages){if(i){const s=a.role==="user"?"👤 用户":"🤖 AI";r+=`### ${s}

`}n&&a.timestamp&&(r+=`_${T(a.timestamp)}_

`),r+=`${a.content}

`,r+=`---

`}return r}function B(t,o={}){let e=`# AI 对话记录导出

`;e+=`> 导出时间: ${g(Date.now())} | 共 ${t.length} 条对话

`,e+=`---

`;for(const n of t)e+=z(n,o),e+=`

`;return e}function P(t,o={}){const e=u(t),{includeTimestamp:n=!0,includeRole:i=!0}=o,r=e.messages.length?e.messages.map(a=>{const s=a.role==="user"?"用户":"AI",c=a.role==="user"?"user":"assistant",h=n&&a.timestamp?`<div class="msg-time">${f(T(a.timestamp))}</div>`:"",b=i?`<div class="msg-role">${s}</div>`:"";return`
        <div class="msg ${c}">
          ${b}
          ${h}
          <div class="msg-content">${f(a.content)}</div>
        </div>
        `}).join(""):'<p class="empty-msg">暂无消息正文（请在对话页点击右下角 💾 保存当前条，或 📥 一键保存侧栏全部对话）</p>';return`
    <div class="export-doc">
      <h1>${f(e.title)}</h1>
      <div class="meta">
        平台：${f(_(e.platform))} ·
        保存时间：${f(g(e.createdAt))} ·
        ${e.messages.length} 条消息
      </div>
      ${r}
    </div>
  `}function R(t,o={}){const e=t.map((n,i)=>`
        <section class="conv-section">
          ${i>0?"<hr />":""}
          ${P(n,o)}
        </section>
      `).join("");return`
    <div class="export-doc export-all">
      <h1>AI 对话记录导出</h1>
      <div class="meta">导出时间：${f(g(Date.now()))} · 共 ${t.length} 条对话</div>
      ${e}
    </div>
  `}const C=`
  .export-doc {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
      "Microsoft YaHei", sans-serif;
    color: #1f2937;
    line-height: 1.6;
    font-size: 14px;
    background: #fff;
  }
  .export-doc h1 {
    font-size: 22px;
    margin: 0 0 8px;
    word-break: break-word;
  }
  .export-doc .meta {
    color: #6b7280;
    font-size: 12px;
    margin-bottom: 20px;
  }
  .export-doc hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 24px 0;
  }
  .msg {
    margin-bottom: 16px;
    padding: 12px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    page-break-inside: avoid;
  }
  .msg.user {
    border-left: 4px solid #2563eb;
    background: #f8fafc;
  }
  .msg.assistant {
    border-left: 4px solid #16a34a;
    background: #fff;
  }
  .msg-role {
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 4px;
  }
  .msg-time {
    font-size: 11px;
    color: #9ca3af;
    margin-bottom: 6px;
  }
  .msg-content {
    white-space: pre-wrap;
    word-break: break-word;
  }
  .empty-msg {
    padding: 16px;
    color: #6b7280;
    font-size: 13px;
    background: #f9fafb;
    border: 1px dashed #d1d5db;
    border-radius: 8px;
  }
`;async function q(t){await chrome.storage.session.set({pdfExportJob:t});const o=chrome.runtime.getURL("src/options/index.html#/pdf-export");await chrome.tabs.create({url:o,active:!0})}async function J(t,o={}){const e=u(t),n=P(e,o),i=`${E(e.title)}.pdf`;await k(n,i)}async function N(t,o={}){const e=t.map(u);if(!e.length)throw new Error("没有可导出的对话");const n=R(e,o),i=`AI对话记录_${j()}.pdf`;await k(n,i)}function W(t,o,e="text/markdown"){const n=new Blob([t],{type:`${e};charset=utf-8`});A(n,o)}function A(t,o){const e=URL.createObjectURL(t),n=document.createElement("a");n.href=e,n.download=o,document.body.appendChild(n),n.click(),document.body.removeChild(n),URL.revokeObjectURL(e)}async function k(t,o){const[{jsPDF:e},n]=await Promise.all([L(()=>import("./jspdf.es.min-C65NuaZ2.js").then(s=>s.j),__vite__mapDeps([0,1])),L(()=>import("./html2canvas.esm-CBrSDip1.js"),__vite__mapDeps([]))]),i=n.default,r=F(t),a=H();document.body.appendChild(r),document.body.appendChild(a),await S(r);try{const s=await i(r,{scale:2,useCORS:!0,allowTaint:!0,logging:!1,backgroundColor:"#ffffff",onclone:(M,l)=>{l.style.opacity="1",l.style.visibility="visible",l.style.transform="none",l.style.position="relative",l.style.left="0",l.style.top="0",l.style.zIndex="1",l.style.background="#ffffff"}});if(s.width===0||s.height===0)throw new Error("PDF 渲染失败，请重试");if(!I(s))throw new Error("PDF 内容渲染为空，请确认对话有消息正文后重试");const c=new e({unit:"mm",format:"a4",orientation:"portrait"}),h=c.internal.pageSize.getWidth(),b=c.internal.pageSize.getHeight(),d=10,w=h-d*2,y=b-d*2,m=s.height*w/s.width,v=s.toDataURL("image/jpeg",.95);let p=m,x=d;for(c.addImage(v,"JPEG",d,x,w,m),p-=y;p>0;)x=d-(m-p),c.addPage(),c.addImage(v,"JPEG",d,x,w,m),p-=y;const $=c.output("blob");if(!$.size)throw new Error("PDF 生成失败，文件为空");await U($,o)}finally{r.remove(),a.remove()}}function F(t){const o=document.createElement("div");return o.setAttribute("data-pdf-export","true"),o.style.cssText=["position: fixed","left: 0","top: 0","width: 794px","padding: 24px","box-sizing: border-box","background: #ffffff","color: #1f2937","overflow: visible","opacity: 1","visibility: visible","z-index: 2147483646","pointer-events: none"].join(";"),o.innerHTML=`<style>${C}</style>${t}`,o}function H(){const t=document.createElement("div");return t.setAttribute("data-pdf-overlay","true"),t.style.cssText=["position: fixed","inset: 0","background: #ffffff","display: flex","align-items: center","justify-content: center","z-index: 2147483647",'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',"font-size: 16px","color: #374151"].join(";"),t.textContent="正在生成 PDF，请稍候...",t}function I(t){const o=t.getContext("2d");if(!o)return!1;const e=Math.min(t.width,200),n=Math.min(t.height,200),{data:i}=o.getImageData(0,0,e,n);for(let r=3;r<i.length;r+=4)if(i[r]>0)return!0;return!1}async function S(t){await new Promise(o=>{requestAnimationFrame(()=>requestAnimationFrame(()=>o()))}),t.offsetHeight}async function U(t,o){var n;const e=URL.createObjectURL(t);if(typeof chrome<"u"&&((n=chrome.downloads)!=null&&n.download)){await new Promise((i,r)=>{chrome.downloads.download({url:e,filename:o,saveAs:!1,conflictAction:"uniquify"},a=>{const s=chrome.runtime.lastError;if(setTimeout(()=>URL.revokeObjectURL(e),6e4),s){r(new Error(s.message));return}if(a===void 0){r(new Error("无法启动下载，请检查浏览器下载权限"));return}i()})});return}A(t,o),URL.revokeObjectURL(e)}function E(t){return(t.replace(/[\\/:*?"<>|]/g,"_").trim()||"对话记录").slice(0,50)}function _(t){return D[t]||t}function j(){return new Date().toLocaleDateString("zh-CN").replace(/\//g,"-")}function g(t){return new Date(t).toLocaleDateString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}function T(t){return new Date(t).toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"})}function f(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}export{N as a,J as b,z as c,W as d,B as e,q as s};
