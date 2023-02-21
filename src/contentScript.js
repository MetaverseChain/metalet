import { v4 as uuid } from 'uuid';
import { initExtPageMessageListener, sendMessageFromExtPageToBackground } from '@/util/chromeUtil';

const contentScriptId = `contentScript-${uuid()}`;

// inject script
const script = document.createElement('SCRIPT');
script.src = chrome.runtime.getURL('metalet.js');
const targetEle = document?.querySelector('head') || document?.querySelector('body') || document;
targetEle.append(script);

// init event
initExtPageMessageListener();
window.addEventListener('message', async (e) => {
  try {
    if (!e || !e.data) {
      throw new Error('no response message');
    }
    if (e.data.to !== 'contentScript' || e.data.from !== 'injectClient') {
      // ignore
      return;
    }
    console.log('injectClient -> contentScript', e);
    const { type, data, clientId, time, specialNotSend } = e.data;
    const funcId = `${clientId}_${type}_${time}`;
    const res = await sendMessageFromExtPageToBackground(type, data, contentScriptId, 'contentScript');
    if (res && res.matchingData) {
      res.matchingData.originClientId = res.matchingData.clientId;
      res.matchingData.clientId = clientId;
      res.matchingData.originTime = res.matchingData.time;
      res.matchingData.time = time;
      res.matchingData.originFuncId = res.matchingData.funcId;
      res.matchingData.funcId = funcId;
      res.matchingData.originFrom = res.matchingData.from;
      res.matchingData.originTo = res.matchingData.to;
      res.matchingData.from = 'contentScript';
      res.matchingData.to = 'injectClient';
    }
    window.postMessage(res, location.origin);
  } catch (err) {
    console.error(err);
  }
});
