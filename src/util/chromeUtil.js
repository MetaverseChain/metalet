import { ERR_CODE_OK, ERR_CODE_UNKNOW, msgCodeMap } from '@/constant/errCode';

export function checkSenderFrom(sender) {
  if (!sender || !sender.url) {
    return 'unknow';
  }

  if (sender.url.indexOf('popup.html') > -1) {
    return 'popup';
  }
  if (sender.url.indexOf('options.html') > -1) {
    return 'options';
  }
}

export function makeMessageResponse(matchingData = {}, data = null, code = ERR_CODE_OK, msg) {
  if (code in msgCodeMap) {
    msg = msgCodeMap[code];
  } else {
    msg = msgCodeMap[ERR_CODE_UNKNOW];
  }
  const result = {
    data,
    code,
    msg,
    matchingData,
  };
  return result;
}

export function openTab(url, otherParams = {}) {
  return new Promise((resolve) => {
    chrome?.tabs?.create({ ...otherParams, url }, function (tab) {
      resolve(tab);
    });
  });
}

export function openWindow(url, otherParams = {}) {
  return new Promise((resolve) => {
    chrome?.windows?.create({ ...otherParams, url }, function (tab) {
      resolve(tab);
    });
  });
}

export function initExtPageMessageListener(customValidFunc) {
  if (!initExtPageMessageListener.msgMap) {
    initExtPageMessageListener.msgMap = {};
  }

  chrome?.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
    try {
      if (!message) {
        throw new Error('no response message');
      }
      if (!message.matchingData) {
        throw new Error('no response matchingData');
      }
      console.log(`${message.matchingData.from} -> ${message.matchingData.to}`, message);
      const { matchingData } = message;
      const { funcId } = matchingData;
      if (
        funcId in initExtPageMessageListener.msgMap &&
        typeof initExtPageMessageListener.msgMap[funcId] === 'function'
      ) {
        if (typeof customValidFunc === 'function') {
          const validRes = customValidFunc(message);
          if (!validRes) {
            return;
          }
        }
        initExtPageMessageListener.msgMap[funcId](message);
      }
    } catch (err) {
      console.error(err);
    }
    sendResponse();
  });
}

export function sendMessageFromExtPageToBackground(
  type,
  data = null,
  clientId = window.name,
  from = 'extPage',
  to = 'background'
) {
  return new Promise((resolve, reject) => {
    const time = Date.now();
    let sendOk = false;
    if (chrome?.runtime?.sendMessage) {
      chrome?.runtime?.sendMessage({ type, data, clientId, time, from, to });
    } else {
      throw new Error('send message unSupport');
    }
    const funcId = `${clientId}_${type}_${time}`;

    initExtPageMessageListener.msgMap[funcId] = (finalResult) => {
      sendOk = true;
      const { code, msg } = finalResult;
      if (code !== 0) {
        reject(finalResult);
        if (window && window.globalToast) {
          window.globalToast({
            message: msg,
          });
        }
      } else {
        resolve(finalResult);
      }
      initExtPageMessageListener.msgMap[funcId] = null;
      delete initExtPageMessageListener.msgMap[funcId];
    };
  });
}

export function storageGet(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(Array.isArray(key) ? key : [key], (res) => {
      resolve(res);
    });
  });
}

export function storageSet(key, value) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(
      {
        [key]: value,
      },
      () => {
        resolve();
      }
    );
  });
}

export function getChromePluginInfo() {
  const pluginId = chrome.runtime.id;
  const popupUrl = `chrome-extension://${pluginId}/popup.html`;
  const loginUrl = popupUrl + '#/welcome';
  const connectUrl = popupUrl + '#/connect';
  return {
    pluginId,
    popupUrl,
    loginUrl,
    connectUrl,
  };
}

export function getCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.getCurrent((tab) => {
      if (tab) {
        resolve(tab);
      } else {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs.length > 0) {
            resolve(tabs[0]);
          } else {
            resolve();
          }
        });
      }
    });
  });
}
