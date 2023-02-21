import { v4 as uuid } from 'uuid';
import { ERR_CODE_OK, ERR_CODE_UNKNOW, msgCodeMap } from '@/constant/errCode';

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

class Metalet {
  clientId = `injectClient-${uuid()}`;
  msgMap = {};

  constructor() {
    this.initMessageListener();
  }

  initMessageListener() {
    if (!this.msgMap) {
      this.msgMap = {};
    }
    window.addEventListener('message', (e) => {
      try {
        if (!e || !e.data || !e.data.matchingData) {
          return;
        }
        if (e.data.matchingData.to !== 'injectClient' || e.data.matchingData.from !== 'contentScript') {
          return;
        }
        console.log('contentScript -> injectClient', e);
        const { matchingData } = e.data;
        const { funcId } = matchingData;
        if (funcId in this.msgMap && typeof this.msgMap[funcId] === 'function') {
          this.msgMap[funcId](e.data);
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  sendMessage(type, data = null, from = 'injectClient', to = 'contentScript') {
    return new Promise((resolve, reject) => {
      const clientId = this.clientId;
      const time = Date.now();
      if (window?.postMessage) {
        window.postMessage({ type, data, clientId, time, from, to }, location.origin);
      } else {
        throw new Error('send message unSupport');
      }
      const funcId = `${clientId}_${type}_${time}`;
      this.msgMap[funcId] = (finalResult) => {
        const { code, msg } = finalResult;
        if (code !== 0) {
          reject(finalResult);
        } else {
          resolve(finalResult);
        }
        this.msgMap[funcId] = null;
        delete this.msgMap[funcId];
      };
    });
  }

  addMsgFunc(funcId, func) {
    this.msgMap[funcId] = func;
  }

  async getPluginInfo() {
    const res = await this.sendMessage('getPluginInfo');
    return res.data;
  }

  async checkLogin() {
    const res = await this.sendMessage('checkIsLogin');
    return res.data;
  }

  async getAccount() {
    const res = await this.sendMessage('getCurrentAccount');
    return res.data;
  }

  async getPublicKey() {
    const res = await this.getAccount();
    return res.publicKey;
  }

  async getAddress() {
    const res = await this.getAccount();
    return res.address;
  }

  async getBalance() {
    const address = await this.getAddress();
    const res = await this.sendMessage('getBalance', { address });
    return res.data;
  }

  async connectWallet(origin = location.origin) {
    const type = 'wattingConnect';
    const clientId = this.clientId;
    const time = Date.now();
    const funcId = `${clientId}_${type}_${time}`;

    await this.sendMessage('connectWallet', {
      origin,
      funcId,
      type,
      clientId,
      time,
    });

    return new Promise((resolve) => {
      this.msgMap[funcId] = (res) => resolve(res);
    });
  }
}

window.Metalet = Metalet;
window.metalet = new Metalet();
