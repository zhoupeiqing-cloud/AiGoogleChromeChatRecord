(function () {
  if (window.__AI_RECORDER_QIANWEN_HOOK__) return;
  window.__AI_RECORDER_QIANWEN_HOOK__ = true;

  var LIST_EVENT = 'ai-recorder-qianwen-conversation-list';
  var MESSAGES_EVENT = 'ai-recorder-qianwen-messages';

  function asText(value) {
    if (typeof value === 'string') return value.trim();
    if (value == null) return '';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map(asText).filter(Boolean).join('\n').trim();
    if (typeof value === 'object') {
      if (typeof value.text === 'string') return value.text.trim();
      if (typeof value.content === 'string') return value.content.trim();
      if (value.content && typeof value.content === 'object') return asText(value.content);
    }
    return '';
  }

  function isSessionListUrl(url) {
    if (typeof url !== 'string') return false;
    return /\/api\/v1\/session\/list/i.test(url) || /session\/list/i.test(url);
  }

  function isMessageListUrl(url) {
    return typeof url === 'string' && /\/api\/v1\/session\/msg\/list/i.test(url);
  }

  function sessionUrl(id) {
    return location.origin + '/chat/' + encodeURIComponent(String(id));
  }

  function cleanTitle(title) {
    var t = (title || '').replace(/\s+/g, ' ').trim();
    t = t.replace(/^千问\s*[-–—|:：\s]*阿里.*$/i, '').replace(/^[-–—\s|｜]+/, '').trim();
    if (!t || t === '千问' || t === '新对话') return '';
    if (/^千问\s*[-–—|:：\s]*阿里/i.test(t)) return '';
    if (/阿里(?:旗下|AI)/i.test(t) && t.length <= 32) return '';
    return t.slice(0, 120);
  }

  function emitList(items) {
    if (!items || !items.length) return;
    window.dispatchEvent(new CustomEvent(LIST_EVENT, { detail: { items: items } }));
  }

  function emitMessages(conversationId, messages) {
    if (!conversationId || !messages || !messages.length) return;
    window.dispatchEvent(new CustomEvent(MESSAGES_EVENT, {
      detail: { conversationId: conversationId, messages: messages }
    }));
  }

  function extractSessions(json) {
    var items = [];
    if (!json || typeof json !== 'object') return items;
    var data = json.data || json;
    var arr = data.items || data.list || data.sessions || [];
    if (!Array.isArray(arr)) return items;
    for (var i = 0; i < arr.length; i++) {
      var it = arr[i] || {};
      var id = it.sessionId || it.session_id || it.id;
      if (!id) continue;
      items.push({
        conversationId: String(id),
        title: cleanTitle(it.summary || it.title || '') || '未命名对话',
        url: sessionUrl(id)
      });
    }
    return items;
  }

  function extractFromRecord(item) {
    var out = [];
    var reqs = item.request_messages || [];
    for (var r = 0; r < reqs.length; r++) {
      var uc = asText(reqs[r].content) || asText(reqs[r]);
      if (uc) out.push({ role: 'user', content: uc, timestamp: Date.now() });
    }
    var resps = item.response_messages || item.qwen_response_messages || [];
    for (var a = 0; a < resps.length; a++) {
      var ac = asText(resps[a].content) || asText(resps[a]);
      if (ac) out.push({ role: 'assistant', content: ac, timestamp: Date.now() });
    }
    return out;
  }

  function extractMessages(json) {
    var out = [];
    if (!json || typeof json !== 'object') return out;
    var data = json.data || json;
    var arr = data.list || data.messages || data.items || [];
    if (!Array.isArray(arr)) return out;
    for (var i = 0; i < arr.length; i++) {
      out = out.concat(extractFromRecord(arr[i] || {}));
    }
    return out;
  }

  function parseJson(text) {
    try { return JSON.parse(text); } catch (e) { return null; }
  }

  function handleResponse(url, text) {
    if (isSessionListUrl(url)) {
      var listJson = parseJson(text);
      if (listJson) emitList(extractSessions(listJson));
      return;
    }
    if (isMessageListUrl(url)) {
      var m = url.match(/session_id=([^&]+)/i);
      var sid = m ? decodeURIComponent(m[1]) : '';
      var msgs = extractMessages(parseJson(text));
      if (sid && msgs.length) emitMessages(sid, msgs);
    }
  }

  var origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function () {
      var args = arguments;
      var url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
      return origFetch.apply(this, args).then(function (resp) {
        try {
          if (isSessionListUrl(url) || isMessageListUrl(url)) {
            resp.clone().text().then(function (text) { handleResponse(url, text); }).catch(function () {});
          }
        } catch (e) {}
        return resp;
      });
    };
  }

  var origOpen = XMLHttpRequest.prototype.open;
  var origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__aiRecorderQianwenUrl = url;
    return origOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    var xhr = this;
    var url = xhr.__aiRecorderQianwenUrl || '';
    xhr.addEventListener('load', function () {
      try {
        if (xhr.responseType && xhr.responseType !== '' && xhr.responseType !== 'text') return;
        handleResponse(url, xhr.responseText || '');
      } catch (e) {}
    });
    return origSend.apply(this, arguments);
  };
})();
