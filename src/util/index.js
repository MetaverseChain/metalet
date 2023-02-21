import { v4 as uuid } from 'uuid';
import config from '@/config';
import dayjs from 'dayjs';
import { Decimal } from 'decimal.js';
import qrcode from 'qrcode';

export function randomId() {
  return uuid();
}

// 初始化当前页面唯一名字
export function initClientName() {
  window.name = `${config.CONFIG_APP_NAME}_${uuid()}`;
}

// 格式化日期
export function formatDate(val, fmt = 'YYYY-MM-DD HH:mm:ss') {
  if (!val) {
    return '';
  }
  return dayjs(val).format(fmt);
}

// 计算屏幕高度 - 用于控制弹窗大小
export function computeScreenSize() {
  let body = document.querySelector('body');
  let html = document.querySelector('html');
  let rootStyle = document.querySelector('#root-style');
  let root = document.querySelector('#root');
  const div = document.createElement('DIV');
  div.setAttribute(
    'style',
    'position: fixed;width: 100%;height: 100%;z-index: -1;top: 0;left: 0;pointer-events: none;'
  );
  body.appendChild(div);
  const height = div.getBoundingClientRect().height;
  const htmlHeight = html.clientHeight;
  const bodyHeight = body.clientHeight;
  if (height === 600 && height === htmlHeight && height === bodyHeight) {
    setTimeout(() => {
      root.style.width = '375px';
      root.style.height = height + 'px';
      root.style.overflowX = 'hidden';
      root.style.overflowY = 'auto';
    }, 0);
  }
  div.remove();

  if (!rootStyle || rootStyle.getAttribute('data-height') !== `${height}`) {
    if (rootStyle) {
      rootStyle.remove();
    }
    const style = document.createElement('STYLE');
    style.setAttribute('id', 'root-style');
    style.setAttribute('data-height', `${height}`);
    style.innerHTML = `:root {--screenHeight: ${height}px;}`;
    body.appendChild(style);
  }
}

// 计算字体大小 - 计算html font-size
export function computeHtmlFontSize() {
  let screenWidth = Math.min(window.innerWidth, 1000);
  let html = document.querySelector('html');
  let body = document.querySelector('body');
  if (screenWidth >= 1000) {
    html.style.fontSize = '100px';
    body.style.fontSize = '16px';
  } else {
    let fontSize = (screenWidth / 750) * 100;
    html.style.fontSize = fontSize + 'px';
    body.style.fontSize = 0.32 + 'rem';
  }
}

// 获取用户浏览器语言
export function getLocateLanguage() {
  return 'en';
  // const lang = ((navigator.language ? navigator.language : navigator.userLanguage) || 'en').toLowerCase();
  // return lang.split('-')[0];
}

// 单位换算
export function satoshisToSpace(satoshis) {
  if (!satoshis || satoshis <= 0) {
    return 0;
  }
  const d = new Decimal(satoshis);
  return d.div(100000000).toFixed(8);
}

// 单位换算
export function spaceTosatoshis(space) {
  if (!space || space <= 0) {
    return 0;
  }
  const d = new Decimal(space);
  return d.mul(100000000);
}

// 单位换算 - 转法币
export function satoshisToLcy(satoshis, rate) {
  if (!satoshis || satoshis <= 0 || !rate) {
    return 0;
  }
  const d = new Decimal(satoshis);
  return d.div(100000000).mul(rate).toFixed(10);
}

// 创建二维码
export function createQrCode(text) {
  return qrcode.toDataURL(text, {
    margin: 0,
    errorCorrectionLevel: 'H',
    width: 200,
  });
}

// 检查网络
export async function checkNetwork() {
  // const mainIsOk = await fetch(config.CONFIG_API_SHOWMONEY_HOST)
  //   .then(() => true)
  //   .catch((err) => {
  //     console.log('main network can not use');
  //     return false;
  //   });
  // const testIsOk = await fetch(config.CONFIG_API_SHOWMONEY_HOST_TEST)
  //   .then(() => true)
  //   .catch((err) => {
  //     console.log('test network can not use');
  //     return false;
  //   });
  //
  // if (mainIsOk) {
  //   return 'main';
  // } else if (testIsOk) {
  //   return 'test';
  // } else {
  //   return 'main';
  // }
  return 'test';
}

// sleep
export function sleep(delay = 1000) {
  return new Promise((r) => {
    let timer = setTimeout(() => {
      clearTimeout(timer);
      r();
    }, delay);
  });
}

// checkReady
export function checkReady(timeout = 10000) {
  let starTime = Date.now();
  return new Promise((r) => {
    let timer = setInterval(() => {
      if (global?._isReady || window?._isReady || Date.now() - starTime >= timeout) {
        clearInterval(timer);
        r();
      }
    }, 1000);
  });
}
