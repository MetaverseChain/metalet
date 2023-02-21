import Mnemonic from 'mvc-lib/mnemonic';
import { Api, API_NET, API_TARGET, mvc, FtManager, NftManager } from '@/lib/meta-contract';
import config, { changeNetworkType } from '@/config';
import { create, select, update } from '@/util/db';
import {
  storageGet,
  storageSet,
  getChromePluginInfo,
  makeMessageResponse,
  getCurrentTab,
  openWindow,
} from '@/util/chromeUtil';
import {
  getFtBalance,
  getMetaIdByZeroAddress,
  getNftSummary,
  getNftUtxo,
  getShowDIDUserInfo,
  uploadMetaIdRaw,
  uploadXpub,
  getXpubLiteBlance,
} from '@/api/common';
import { initMetaId, repairMetaNode } from './helper';

const metaSvAuthorization = config.CONFIG_METASV_AUTHORIZATION;
const P2PKH_UNLOCK_SIZE = 1 + 1 + 71 + 1 + 33;
const P2PKH_DUST_AMOUNT = 1;

let mvcApi;
let feeb = config.CONFIG_TX_FEEB;

// 初始化api
export function initApi(networkType = config.networkType) {
  if (!mvcApi) {
    if (networkType === 'test') {
      mvc.Networks.defaultNetwork = mvc.Networks.testnet;
      mvcApi = new Api(API_NET.TEST, API_TARGET.MVC);
    } else {
      mvc.Networks.defaultNetwork = mvc.Networks.mainnet;
      mvcApi = new Api(API_NET.MAIN, API_TARGET.MVC);
    }

    mvcApi.authorize({
      authorization: metaSvAuthorization,
    });
  }
  return mvcApi;
}

// 生成助记词
export function getMnemonicWords() {
  const mnemonic = Mnemonic.fromRandom();
  return mnemonic.toString().split(' ');
}

// 创建账号
export async function createAccount(message) {
  const { mnemonicStr, derivationPath, alias, password, email, phone } = message.data;
  const mnemonic = Mnemonic.fromString(mnemonicStr);
  const HDPrivateKey = mnemonic.toHDPrivateKey().deriveChild(derivationPath);
  const privateKey = HDPrivateKey.deriveChild(0).deriveChild(0).privateKey; // 0/0地址
  const publicKey = HDPrivateKey.deriveChild(0).deriveChild(0).publicKey;
  const address = privateKey.toAddress().toString();
  const wif = privateKey.toString();
  const pubWif = publicKey.toString();
  const xpub = HDPrivateKey.xpubkey;
  const xprv = HDPrivateKey.xprivkey;
  const timestamp = Date.now();

  let hasOne = await select(xprv);
  if (!hasOne) {
    hasOne = {
      address,
      wif,
      publicKey: pubWif,
      mnemonicStr,
      alias,
      password,
      xpub,
      xprv,
      email,
      phone,
      timestamp,
      userMetaIdInfo: null,
    };
    await create(hasOne);
  }

  return hasOne;
}

// 获取余额
export async function getBalance(message) {
  initApi();
  const { address, xpub } = message.data;
  let { pendingBalance, balance } = await mvcApi.getBalance(address);
  let result = balance + pendingBalance;
  if (xpub) {
    const xpubRes = await getXpubLiteBlance(xpub)
      .then((res) => res.balance)
      .catch(() => 0);
    result = Math.max(result, xpubRes);
  }
  return result;
}

// 获取utxo
export async function getUnspents(message) {
  initApi();
  const { address } = message.data;
  return await mvcApi.getUnspents(address);
}

// 发送
export async function sendAmount(message) {
  initApi();
  const { sendAmount, sendAddress, wif, address } = message.data;
  const utxos = await mvcApi.getUnspents(address);
  const tx = new mvc.Transaction();
  tx.version = 10;
  const privateKeys = [];
  // add input
  utxos.forEach((utxo) => {
    tx.addInput(
      new mvc.Transaction.Input.PublicKeyHash({
        output: new mvc.Transaction.Output({
          script: mvc.Script.buildPublicKeyHashOut(new mvc.Address(address)),
          satoshis: utxo.satoshis,
        }),
        prevTxId: utxo.txId,
        outputIndex: utxo.outputIndex,
        script: mvc.Script.empty(),
      })
    );
    privateKeys.push(mvc.PrivateKey.fromString(wif));
  });
  // // add opreturn
  // tx.addOutput(
  //   new mvc.Transaction.Output({
  //     script: mvc.Script.buildDataOut(sendAddress),
  //     satoshis: 0,
  //   })
  // );

  // add output
  tx.addOutput(
    new mvc.Transaction.Output({
      script: new mvc.Script(new mvc.Address(sendAddress)),
      satoshis: sendAmount,
    })
  );
  // add change and fee
  const unlockSize = tx.inputs.filter((v) => v.output.script.isPublicKeyHashOut()).length * P2PKH_UNLOCK_SIZE;
  let fee = Math.ceil((tx.toBuffer().length + unlockSize + mvc.Transaction.CHANGE_OUTPUT_MAX_SIZE) * feeb);
  const fee2 = Math.ceil((utxos.length * 148 + 34 + 10) * feeb);
  fee = Math.max(fee, fee2);
  tx.fee(fee);
  tx.change(new mvc.Address(address));
  // unlock
  tx.sign(privateKeys);
  // broadcast
  return await mvcApi.broadcast(tx.serialize(true));
}

// 更新费率
export async function updateFeeb(message) {
  const { feeb: reqFeeb } = message.data;
  feeb = reqFeeb;
}

// 获取费率
export async function getFeeb(message) {
  return feeb;
}

// 计算上链费
export async function countFee(message) {
  initApi();
  const { sendAmount, sendAddress, wif, address, unspents } = message.data;
  let utxos;
  if (unspents) {
    utxos = unspents;
  } else {
    utxos = await mvcApi.getUnspents(address);
  }
  const tx = new mvc.Transaction();
  tx.version = 10;
  const privateKeys = [];
  // add input
  utxos.forEach((utxo) => {
    tx.addInput(
      new mvc.Transaction.Input.PublicKeyHash({
        output: new mvc.Transaction.Output({
          script: mvc.Script.buildPublicKeyHashOut(new mvc.Address(address)),
          satoshis: utxo.satoshis,
        }),
        prevTxId: utxo.txId,
        outputIndex: utxo.outputIndex,
        script: mvc.Script.empty(),
      })
    );
    privateKeys.push(mvc.PrivateKey.fromString(wif));
  });
  // add output
  tx.addOutput(
    new mvc.Transaction.Output({
      script: new mvc.Script(new mvc.Address(sendAddress)),
      satoshis: sendAmount,
    })
  );
  // add change and fee
  const unlockSize = tx.inputs.filter((v) => v.output.script.isPublicKeyHashOut()).length * P2PKH_UNLOCK_SIZE;
  let fee = Math.ceil((tx.toBuffer().length + unlockSize + mvc.Transaction.CHANGE_OUTPUT_MAX_SIZE) * feeb);
  const fee2 = Math.ceil((utxos.length * 148 + 34 + 10) * feeb);
  fee = Math.max(fee, fee2);
  return fee;
}

// 查询账号
export async function getAccount(message) {
  const { xprv } = message.data || {};
  return await select(xprv || undefined);
}

// 恢复账号
export async function restoreAccount(message) {
  const { mnemonicStr, derivationPath, restoreType, xprv: restorePrivateKey } = message.data;
  const timestamp = Date.now();
  let obj;
  // 使用助记词恢复
  if (restoreType === 0) {
    const mnemonic = Mnemonic.fromString(mnemonicStr);
    const HDPrivateKey = mnemonic.toHDPrivateKey().deriveChild(derivationPath);
    const privateKey = HDPrivateKey.deriveChild(0).deriveChild(0).privateKey;
    const publicKey = HDPrivateKey.deriveChild(0).deriveChild(0).publicKey;
    const address = privateKey.toAddress().toString();
    const wif = privateKey.toString();
    const pubWif = publicKey.toString();
    const xpub = HDPrivateKey.xpubkey;
    const xprv = HDPrivateKey.xprivkey;

    obj = {
      address,
      wif,
      publicKey: pubWif,
      mnemonicStr,
      alias: null,
      password: null,
      xpub,
      xprv,
      email: null,
      phone: null,
      timestamp,
      userMetaIdInfo: null,
    };
  }
  // 使用私钥恢复
  // if (restoreType === 1) {
  //   const HDPrivateKey = mvc.HDPrivateKey.fromString(restorePrivateKey);
  //   const privateKey = HDPrivateKey.deriveChild(0).deriveChild(0).privateKey;
  //   const wif = privateKey.toString();
  //   const address = privateKey.toAddress().toString();
  //   const xpub = HDPrivateKey.xpubkey;
  //   const xprv = HDPrivateKey.xprivkey;
  //
  //   obj = {
  //     address,
  //     wif,
  //     mnemonicStr: null,
  //     alias: null,
  //     password: null,
  //     xpub,
  //     xprv,
  //     email: null,
  //     phone: null,
  //     timestamp,
  //   };
  // }

  const hasOne = await select(obj.xprv);
  if (!hasOne) {
    await create(obj);
    return obj;
  } else {
    return hasOne;
  }
}

// 更新账号
export async function updateAccount(message) {
  const { xprv, password, alias, email, phone } = message.data;
  const timestamp = Date.now();
  const hasOne = await select(xprv);
  if (!hasOne) {
    throw new Error('account is not exist');
  }
  const updateObj = {
    ...hasOne,
    password,
    alias,
    email,
    phone,
    timestamp,
  };
  await update(updateObj);
  return updateObj;
}

// 检查创建metaId
export async function checkOrCreateMetaId(message) {
  initApi();
  const { xprv, xpub } = message.data;
  const hasOne = await select(xprv);
  if (!hasOne) {
    throw new Error('this account is not exist');
  }
  const { address, email, phone, alias, timestamp, userMetaIdInfo } = hasOne;

  // 10分钟内的新建忽略校验
  if (userMetaIdInfo && timestamp && timestamp + 600000 >= Date.now()) {
    return hasOne;
  }
  // 如果齐全
  if (
    userMetaIdInfo &&
    userMetaIdInfo.email &&
    userMetaIdInfo.infoTxId &&
    userMetaIdInfo.metaId &&
    userMetaIdInfo.metaIdRaw &&
    userMetaIdInfo.name &&
    userMetaIdInfo.phone &&
    userMetaIdInfo.protocolTxId
  ) {
    return hasOne;
  }

  // 预设值
  const userInfo = {
    email: email || 'no-name@some.com',
    phone: phone || '12345678901',
    name: alias || 'no-name',
  };
  const HDPrivateKey = mvc.HDPrivateKey.fromString(xprv);

  // 检查是否有metaid
  const { code: metaIdCode, result: metaIdResult } = await getMetaIdByZeroAddress(address).catch((err) => {
    return {
      code: 10000,
      error: 'error',
      msg: 'error',
      result: null,
    };
  });
  if (metaIdCode !== 200 || !metaIdResult) {
    const { sendRawTxList, userMetaIdInfoRes } = await initMetaId(mvcApi, HDPrivateKey, userInfo, feeb).catch((err) => {
      console.log(err);
      return null;
    });
    hasOne.userMetaIdInfo = userMetaIdInfoRes;
    hasOne.timestamp = Date.now();
    await update(hasOne);

    if (sendRawTxList.length) {
      for (let i = 0; i <= sendRawTxList.length; i++) {
        await uploadMetaIdRaw({
          type: 13,
          raw: sendRawTxList[i],
        });
      }
      await uploadXpub(xpub);
    }

    return hasOne;
  }

  // 检查节点
  const { code: didCode, result: didResult } = await getShowDIDUserInfo(metaIdResult.rootTxId).catch((err) => {
    return {
      code: 10000,
      error: 'error',
      msg: 'error',
      result: null,
    };
  });
  console.log('did', didCode, didResult);
  if (didCode !== 200 || !didResult) {
    const userMetaIdInfoRes = await repairMetaNode(mvcApi, HDPrivateKey, userInfo, feeb, {
      code: didCode,
      result: didResult,
      rootTxId: metaIdResult.rootTxId,
    }).catch((err) => {
      console.log(err);
      return null;
    });
    hasOne.userMetaIdInfo = userMetaIdInfoRes;
    hasOne.timestamp = Date.now();
    await update(hasOne);
    if (userMetaIdInfoRes?.metaIdRaw) {
      await uploadMetaIdRaw({
        type: 13,
        raw: userMetaIdInfoRes.metaIdRaw,
      });
      await uploadXpub(xpub);
    }
    return hasOne;
  }
  return hasOne;
}

// 切换网络
export async function changeNetwork(message) {
  const { networkType } = message.data;
  changeNetworkType(networkType);
}

// 获取当前网络
export async function getNetwork() {
  const res = await storageGet('networkType');
  const resNetwork = (res && res.networkType) || res;
  return resNetwork;
}

// 获取ft列表
export async function getFtList(message) {
  const { address } = message.data;
  const res = await getFtBalance(address);
  const tokenMap = {};
  if (res && Array.isArray(res) && res.length) {
    for (let i of res) {
      const key = i.codeHash + '|' + i.genesis;
      const amount = i.unconfirmed + i.confirmed;
      const name = i.name;
      const symbol = i.symbol;
      const decimal = i.decimal;
      if (!tokenMap[key]) {
        tokenMap[key] = {
          codeHash: i.codeHash,
          genesis: i.genesis,
          amount,
          name,
          symbol,
          decimal,
        };
      } else {
        tokenMap[key].amount = tokenMap[key].amount + amount;
      }
    }
  }
  let list = [];
  for (let key in tokenMap) {
    const item = tokenMap[key];
    if (item.amount > 0) {
      list.push(tokenMap[key]);
    }
  }
  return list;
}

// 获取nft列表
export async function getNftList(message) {
  const { address, nftList } = message.data;
  const res = await getNftSummary(address);
  const finalList = [];
  const codehashList = [];
  for (let i of nftList) {
    codehashList.push(i.codehash);
  }
  if (res && Array.isArray(res) && res.length) {
    for (let i of res) {
      if (codehashList.includes(i.codeHash)) {
        finalList.push(i);
      }
    }
  }
  return finalList;
}

// transfer ft
export async function transferFt(message) {
  const { wif, transferAddress, transferAmount, transferItem } = message.data;
  const { codeHash, genesis } = transferItem;
  const ft = new FtManager({
    network: API_NET.MAIN,
    apiTarget: API_TARGET.MVC,
    feeb: feeb,
    purse: wif,
  });
  ft.api.authorize({
    authorization: metaSvAuthorization,
  });
  const res = await ft.transfer({
    senderWif: wif,
    receivers: [
      {
        address: transferAddress,
        amount: transferAmount,
      },
    ],
    codehash: codeHash,
    genesis,
  });
  return res;
}

// transfer nft
export async function transferNft(message) {
  const { wif, address, transferAddress, transferAmount, transferItem } = message.data;
  const { codeHash, genesis } = transferItem;
  const senderNftUtxos = await getNftUtxo(address);
  if (senderNftUtxos && senderNftUtxos.length) {
    const findOne = senderNftUtxos.find((v) => {
      return v.codeHash === codeHash && v.genesis === genesis;
    });
    if (findOne) {
      const nft = new NftManager({
        network: API_NET.MAIN,
        apiTarget: API_TARGET.MVC,
        feeb: feeb,
        purse: wif,
      });
      nft.api.authorize({
        authorization: metaSvAuthorization,
      });
      const res = await nft.transfer({
        genesis,
        codehash: codeHash,
        receiverAddress: transferAddress,
        senderPrivateKey: wif,
        tokenIndex: findOne.tokenIndex,
      });
      return res;
    }
  }
}

// 保存当前账号
export async function saveCurrentAccount(message) {
  const { xprv } = message.data;
  if (xprv) {
    await storageSet('currentAccount', message.data);
  }
}

// 获取当前账号
export async function getCurrentAccount(message) {
  const res = await storageGet('currentAccount');
  const account = (res && res.currentAccount) || res;
  // if (account && account.xprv) {
  //   delete account.xprv;
  // }
  // if (account && account.wif) {
  //   delete account.wif;
  // }
  // if (account && account.mnemonicStr) {
  //   delete account.mnemonicStr;
  // }
  return account;
}

// 获取插件信息
export async function getPluginInfo(message) {
  return getChromePluginInfo();
}

// 连接钱包
export async function connectWallet(message) {
  const { origin, funcId, type, clientId, time } = message.data;
  const { connectUrl } = getChromePluginInfo();
  const curTab = await getCurrentTab();
  const url = `${connectUrl}?origin=${encodeURIComponent(
    origin
  )}&funcId=${funcId}&time=${time}&clientId=${clientId}&type=${type}&tabId=${curTab.id}&windowId=${curTab.windowId}`;

  setTimeout(() => {
    openWindow(url, {
      focused: true,
      width: 375,
      height: 667,
      type: 'popup',
    });
  }, 0);
}

export async function connectWalletConfirm(message) {
  const { origin, xprv, flag, funcId, type, clientId, time, tabId, windowId } = message.data;
  const finalResult = makeMessageResponse(
    {
      type,
      clientId,
      time,
      funcId,
      from: 'background',
      to: 'contentScript',
    },
    flag,
    0,
    'ok'
  );
  chrome.tabs.sendMessage(Number(tabId), finalResult);
}

// 检查是否已经连接
export async function checkIsConnect(message) {}

// 检查是否已经登陆
export async function checkIsLogin(message) {
  const res = await storageGet('currentAccount');
  if (res && res.currentAccount && res.currentAccount.xprv) {
    return true;
  }
  return false;
}
