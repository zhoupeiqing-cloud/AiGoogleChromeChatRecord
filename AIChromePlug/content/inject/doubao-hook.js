(function () {
  if (window.__AI_RECORDER_DOUBAO_HOOK__) return;
  window.__AI_RECORDER_DOUBAO_HOOK__ = true;

  var EVENT_NAME = 'ai-recorder-doubao-capture';
  var LIST_EVENT = 'ai-recorder-doubao-conversation-list';
  var MESSAGES_EVENT = 'ai-recorder-doubao-messages';

  function isCompletionUrl(url) {
    return typeof url === 'string' && /\/chat\/completion|\/samantha\/chat\/completion/.test(url);
  }

  function isConversationListUrl(url) {
    return typeof url === 'string' && /conversation[\/_-]?(list|lists)|conversation_list|recent_conversation|history_conversation|\/im\/conversation|\/thread\/list|\/samantha\/thread|thread\/list|chat_list|conv_list|get_conversation|list_conversation|recent_thread/i.test(url);
  }

  function isMessageHistoryUrl(url) {
    return typeof url === 'string' && /message[\/_-]?(list|lists)|conversation[\/_-]?(detail|info|messages|message_list)|get_message|chat_history|thread\/message|message_list/i.test(url);
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

  function extractConversationIdFromJson(json) {
    if (!json || typeof json !== 'object') return '';
    return asText(json.conversation_id)
      || asText(json.conversationId)
      || asText(json.chat_id)
      || asText(json.thread_id)
      || asText(json.data && json.data.conversation_id)
      || asText(json.data && json.data.conversationId)
      || '';
  }

  function extractListFromJson(json) {
    var items = [];
    if (!json || typeof json !== 'object') return items;

    var arrays = [
      json.data && json.data.conversation_list,
      json.data && json.data.conversations,
      json.data && json.data.items,
      json.data && json.data.thread_list,
      json.conversations,
      json.items,
      json.conversation_list
    ];

    var arr = null;
    for (var i = 0; i < arrays.length; i++) {
      if (Array.isArray(arrays[i]) && arrays[i].length) {
        arr = arrays[i];
        break;
      }
    }
    if (!arr) return items;

    for (var j = 0; j < arr.length; j++) {
      var it = arr[j] || {};
      var id = asText(it.conversation_id)
        || asText(it.conversationId)
        || asText(it.id)
        || asText(it.thread_id)
        || asText(it.chat_id);
      if (!id) continue;
      var title = asText(it.title)
        || asText(it.name)
        || asText(it.summary)
        || asText(it.topic)
        || '未命名对话';
      items.push({ conversationId: id, title: title });
    }
    return items;
  }

  function mapApiRole(msg) {
    var role = asText(msg.role) || asText(msg.message_role) || asText(msg.sender);
    if (role === 'user' || role === 'human' || role === '1') return 'user';
    return 'assistant';
  }

  function extractMessagesFromJson(json, url) {
    var messages = [];
    if (!json || typeof json !== 'object') return messages;

    var conversationId = extractConversationIdFromJson(json);
    try {
      var parsedUrl = new URL(url, window.location.origin);
      conversationId = conversationId
        || parsedUrl.searchParams.get('conversation_id')
        || parsedUrl.searchParams.get('conversationId')
        || '';
    } catch (e) {}

    var arrays = [
      json.data && json.data.message_list,
      json.data && json.data.messages,
      json.data && json.data.msg_list,
      json.messages,
      json.message_list
    ];

    var arr = null;
    for (var i = 0; i < arrays.length; i++) {
      if (Array.isArray(arrays[i]) && arrays[i].length) {
        arr = arrays[i];
        break;
      }
    }
    if (!arr) return { conversationId: conversationId, messages: messages };

    for (var k = 0; k < arr.length; k++) {
      var msg = arr[k] || {};
      var content = asText(msg.content)
        || asText(msg.text)
        || asText(msg.message)
        || asText(msg.answer);
      if (!content) continue;
      messages.push({
        role: mapApiRole(msg),
        content: content,
        timestamp: Date.now()
      });
    }

    return { conversationId: conversationId, messages: messages };
  }

  function handleHistoryJson(url, json) {
    if (isConversationListUrl(url)) {
      emitList(extractListFromJson(json));
      return;
    }
    if (isMessageHistoryUrl(url)) {
      var parsed = extractMessagesFromJson(json, url);
      if (parsed.conversationId && parsed.messages.length) {
        emitMessages(parsed.conversationId, parsed.messages);
      }
    }
  }

  function parseResponseJson(response, url) {
    var contentType = (response.headers && response.headers.get('content-type')) || '';
    if (contentType.indexOf('json') < 0 && contentType.indexOf('text') < 0) return;
    response.clone().text().then(function (text) {
      try {
        var json = JSON.parse(text);
        handleHistoryJson(url, json);
      } catch (e) {}
    }).catch(function () {});
  }

  function emit(role, content, conversationId) {
    if (!content) return;
    window.dispatchEvent(new CustomEvent(EVENT_NAME, {
      detail: { role: role, content: content, conversationId: conversationId || '' }
    }));
  }

  function asText(value) {
    if (typeof value === 'string') return value.trim();
    if (value == null) return '';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
      return value.map(asText).filter(Boolean).join('\n').trim();
    }
    if (typeof value === 'object') {
      if (typeof value.text === 'string') return value.text.trim();
      if (typeof value.content === 'string') return value.content.trim();
      if (value.content && typeof value.content === 'object') return asText(value.content);
    }
    return '';
  }

  function parseBody(body) {
    if (!body) return null;
    if (typeof body === 'string') {
      try { return JSON.parse(body); } catch (e) { return null; }
    }
    if (body instanceof URLSearchParams) {
      try { return JSON.parse(body.toString()); } catch (e) { return null; }
    }
    return null;
  }

  function extractConversationId(url, body) {
    try {
      var parsed = new URL(url, window.location.origin);
      var webTabId = parsed.searchParams.get('web_tab_id');
      if (webTabId) return webTabId;
    } catch (e) {}

    var data = parseBody(body);
    if (!data) return '';

    return asText(data.conversation_id)
      || asText(data.conversationId)
      || asText(data.chat_id)
      || asText(data.local_conversation_id)
      || '';
  }

  function extractUserText(body) {
    var data = parseBody(body);
    if (!data) return '';

    if (Array.isArray(data.messages)) {
      for (var i = data.messages.length - 1; i >= 0; i--) {
        var msg = data.messages[i];
        if (msg && msg.role === 'user') {
          var text = asText(msg.content);
          if (text) return text;
        }
      }
    }

    var paths = [
      data.message,
      data.query,
      data.prompt,
      data.text,
      data.content,
      data.input,
      data.local_message && data.local_message.text,
      data.local_message && data.local_message.content
    ];

    for (var j = 0; j < paths.length; j++) {
      var text = asText(paths[j]);
      if (text) return text;
    }

    return deepFindUserText(data);
  }

  function deepFindUserText(node, depth) {
    if (!node || depth > 8) return '';
    if (typeof node === 'string') return node.trim();

    if (Array.isArray(node)) {
      for (var i = node.length - 1; i >= 0; i--) {
        var found = deepFindUserText(node[i], depth + 1);
        if (found) return found;
      }
      return '';
    }

    if (typeof node !== 'object') return '';

    if (node.role === 'user') {
      var userText = asText(node.content) || asText(node.text);
      if (userText) return userText;
    }

    var keys = ['message', 'messages', 'prompt', 'query', 'text', 'content', 'local_message'];
    for (var k = 0; k < keys.length; k++) {
      if (node[keys[k]] != null) {
        var nested = deepFindUserText(node[keys[k]], depth + 1);
        if (nested) return nested;
      }
    }

    return '';
  }

  function extractDeltaText(json) {
    if (!json || typeof json !== 'object') return '';

    var candidates = [
      json.text,
      json.content,
      json.answer,
      json.reply,
      json.output,
      json.message && json.message.content,
      json.message && json.message.text,
      json.content && json.content.text,
      json.content && json.content.content,
      json.delta && json.delta.text,
      json.delta && json.delta.content,
      json.patch && json.patch.text,
      json.patch && json.patch.content,
      json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content,
      json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content
    ];

    for (var i = 0; i < candidates.length; i++) {
      var text = asText(candidates[i]);
      if (text) return text;
    }

    return '';
  }

  function parseSSEText(raw) {
    if (!raw) return '';
    var accumulated = '';
    var lines = raw.split('\n');

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line || line === 'data:[DONE]' || line === 'data: [DONE]') continue;

      var payload = line.indexOf('data:') === 0 ? line.slice(5).trim() : line;
      if (!payload || payload === '[DONE]') continue;

      try {
        var json = JSON.parse(payload);
        var delta = extractDeltaText(json);
        if (delta) {
          if (delta.indexOf(accumulated) === 0) {
            accumulated = delta;
          } else if (accumulated.indexOf(delta) === 0) {
            // keep longer accumulated
          } else {
            accumulated += delta;
          }
        }
      } catch (e) {}
    }

    return accumulated.trim();
  }

  async function consumeStream(response, conversationId) {
    if (!response.body) return;

    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    var accumulated = '';

    while (true) {
      var result = await reader.read();
      if (result.done) break;

      buffer += decoder.decode(result.value, { stream: true });
      var parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (var i = 0; i < parts.length; i++) {
        var chunkText = parseSSEText(parts[i]);
        if (!chunkText) continue;

        if (chunkText.indexOf(accumulated) === 0) {
          accumulated = chunkText;
        } else if (accumulated.indexOf(chunkText) !== 0) {
          accumulated += chunkText;
        }

        emit('assistant', accumulated, conversationId);
      }
    }

    var tail = parseSSEText(buffer);
    if (tail) {
      if (tail.indexOf(accumulated) === 0) accumulated = tail;
      else if (accumulated.indexOf(tail) !== 0) accumulated += tail;
    }

    if (accumulated) emit('assistant', accumulated, conversationId);
  }

  function handleCompletion(url, body, response) {
    var conversationId = extractConversationId(url, body);
    var userText = extractUserText(body);
    if (userText) emit('user', userText, conversationId);

    var contentType = (response.headers && response.headers.get('content-type')) || '';

    if (contentType.indexOf('text/event-stream') >= 0 || contentType.indexOf('stream') >= 0) {
      consumeStream(response.clone(), conversationId);
      return;
    }

    response.clone().text().then(function (text) {
      var assistantText = parseSSEText(text);
      if (!assistantText) {
        try {
          var json = JSON.parse(text);
          assistantText = extractDeltaText(json);
        } catch (e) {}
      }
      if (assistantText) emit('assistant', assistantText, conversationId);
    }).catch(function () {});
  }

  var originalFetch = window.fetch;
  window.fetch = function () {
    var args = arguments;
    var input = args[0];
    var init = args[1] || {};
    var url = typeof input === 'string' ? input : (input && input.url) || '';

    return originalFetch.apply(this, args).then(function (response) {
      try {
        if (isCompletionUrl(url)) {
          var body = init.body;
          if (!body && input && input.body) body = input.body;
          handleCompletion(url, body, response);
        } else if (isConversationListUrl(url) || isMessageHistoryUrl(url)) {
          parseResponseJson(response, url);
        }
      } catch (e) {}
      return response;
    });
  };

  var originalOpen = XMLHttpRequest.prototype.open;
  var originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this.__aiRecorderUrl = url;
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    var xhr = this;
    var url = xhr.__aiRecorderUrl || '';

    if (isCompletionUrl(url)) {
      xhr.addEventListener('load', function () {
        try {
          var conversationId = extractConversationId(url, body);
          var userText = extractUserText(body);
          if (userText) emit('user', userText, conversationId);

          var assistantText = parseSSEText(xhr.responseText || '');
          if (!assistantText) {
            try {
              assistantText = extractDeltaText(JSON.parse(xhr.responseText || '{}'));
            } catch (e) {}
          }
          if (assistantText) emit('assistant', assistantText, conversationId);
        } catch (e) {}
      });
    } else if (isConversationListUrl(url) || isMessageHistoryUrl(url)) {
      xhr.addEventListener('load', function () {
        try {
          handleHistoryJson(url, JSON.parse(xhr.responseText || '{}'));
        } catch (e) {}
      });
    }

    return originalSend.apply(this, arguments);
  };

  console.log('[AI Recorder] 豆包接口 hook 已注入');
})();