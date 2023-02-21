import config from '@/config';
import { getAddressUtxo, getInitSat, getTxIdRaw } from '@/api/common';

import { mvc } from '@/lib/meta-contract';
const ECIES = require('mvc-lib/ecies');

const P2PKH_UNLOCK_SIZE = 1 + 1 + 71 + 1 + 33;
const P2PKH_DUST_AMOUNT = 1;

// key path
const keyPathMap = {
  Root: {
    keyPath: '0/0',
    parentKeyPath: '0/0',
    parentNode: null,
  },
  Info: {
    keyPath: '0/1',
    parentKeyPath: '0/0',
    parentNode: 'Root',
  },
  name: {
    keyPath: '0/2',
    parentKeyPath: '0/1',
    parentNode: 'Info',
  },
  email: {
    keyPath: '0/3',
    parentKeyPath: '0/1',
    parentNode: 'Info',
  },
  phone: {
    keyPath: '0/4',
    parentKeyPath: '0/1',
    parentNode: 'Info',
  },
  Protocols: {
    keyPath: '0/2',
    parentKeyPath: '0/0',
    parentNode: 'Root',
  },
};

// 获取私钥
function getPathPrivateKey(HDPrivateKey, keyPath = '0/0') {
  const divs = keyPath.split('/');
  let pk = HDPrivateKey;
  for (let i of divs) {
    pk = pk.deriveChild(+i);
  }
  return pk.privateKey;
}

// 获取地址
function getPathAddress(HDPrivateKey, keyPath = '0/0') {
  const privateKey = getPathPrivateKey(HDPrivateKey, keyPath);
  return privateKey.toAddress();
}

// 获取公钥
function getPathPublicKey(HDPrivateKey, keyPath = '0/0') {
  const privateKey = getPathPrivateKey(HDPrivateKey, keyPath);
  return privateKey.publicKey;
}

// 获取key path
function getKeyPathByNodeName(nodeName = 'Root') {
  let keyPath = '';
  let tmpNodeName = nodeName;
  while (keyPathMap[tmpNodeName]) {
    const node = keyPathMap[tmpNodeName];
    keyPath = node.keyPath + (keyPath ? '/' + keyPath : '');
    tmpNodeName = node.parentNode;
  }
  return keyPath;
}

// 加密
function eciesEncryptData(data, privateKey, publicKey) {
  const ecies = ECIES().privateKey(privateKey).publicKey(publicKey);
  return ecies.encrypt(data);
}

// 延时
function sleep(delay = 400) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, delay);
  });
}

// 获取utxos
function getUtxos(mvcApi, address) {
  return mvcApi.getUnspents(address);
}

// 创建metaid
export async function initMetaId(mvcApi, HDPrivateKey, userInfo, feeb) {
  // 生成一堆节点对应的地址
  const rootAddress = getPathAddress(HDPrivateKey);
  const rootPrivateKey = getPathPrivateKey(HDPrivateKey);
  const protocolAddress = getPathAddress(HDPrivateKey, getKeyPathByNodeName('Protocols'));
  const infoAddress = getPathAddress(HDPrivateKey, getKeyPathByNodeName('Info'));
  const infoPrivateKey = getPathPrivateKey(HDPrivateKey, getKeyPathByNodeName('Info'));
  const nameAddress = getPathAddress(HDPrivateKey, getKeyPathByNodeName('name'));
  const emailAddress = getPathAddress(HDPrivateKey, getKeyPathByNodeName('email'));
  const phoneAddress = getPathAddress(HDPrivateKey, getKeyPathByNodeName('phone'));

  // 判断余额够不够
  const { pendingBalance, balance } = await mvcApi.getBalance(rootAddress.toString());
  if (pendingBalance + balance < 2000) {
    await getInitSat({
      address: rootAddress.toString(),
      xpub: HDPrivateKey.xpubkey.toString(),
    });
    await sleep();
  }

  // 获取utxo
  let utxoTmp = await getUtxos(mvcApi, rootAddress.toString());
  for (let utxo of utxoTmp) {
    utxo.privateKey = rootPrivateKey.toString();
  }

  // 假设对象(最后返回这对象)
  const { name, email, phone } = userInfo;
  let sendRawTxList = [];
  let userMetaIdInfo = {
    metaId: '',
    protocolTxId: '',
    infoTxId: '',
    name: '',
    phone: '',
    email: '',
    metaIdRaw: '',
  };
  const metaIdTag = config.networkType === 'test' ? 'testmetaid' : 'metaid';

  // 创建root节点
  await createNode({
    mvcApi,
    HDPrivateKey,
    nodeName: 'Root',
    parentTxId: 'NULL',
    metaIdTag,
    encrypt: 'NULL',
    encoding: 'NULL',
    dataType: 'NULL',
    version: '1.0.1',
    utxos: utxoTmp,
    feeb,
  }).then(async (res) => {
    console.log('resres321', res);
    userMetaIdInfo.metaId = res.id;
    userMetaIdInfo.metaIdRaw = res.toString();
    sendRawTxList.push(res.toString());
    await sleep();
    utxoTmp = await getUtxos(mvcApi, rootAddress.toString());
    for (let utxo of utxoTmp) {
      utxo.privateKey = rootPrivateKey.toString();
    }
  });

  // 创建protocol节点
  await createNode({
    mvcApi,
    HDPrivateKey,
    nodeName: 'Protocols',
    parentTxId: userMetaIdInfo.metaId,
    metaIdTag,
    version: 'NULL',
    utxos: utxoTmp,
    changeAddress: rootAddress.toString(),
    feeb,
  }).then(async (res) => {
    userMetaIdInfo.protocolTxId = res.id;
    sendRawTxList.push(res.toString());
    await sleep();
    utxoTmp = await getUtxos(mvcApi, rootAddress.toString());
    for (let utxo of utxoTmp) {
      utxo.privateKey = rootPrivateKey.toString();
    }
  });

  // 创建info节点
  await createNode({
    mvcApi,
    HDPrivateKey,
    nodeName: 'Info',
    parentTxId: userMetaIdInfo.metaId,
    metaIdTag,
    version: 'NULL',
    utxos: utxoTmp,
    changeAddress: infoAddress.toString(),
    feeb,
  }).then(async (res) => {
    userMetaIdInfo.infoTxId = res.id;
    sendRawTxList.push(res.toString());
    await sleep();
    utxoTmp = await getUtxos(mvcApi, infoAddress.toString());
    for (let utxo of utxoTmp) {
      utxo.privateKey = infoPrivateKey.toString();
    }
  });

  // 创建name节点
  await createNode({
    mvcApi,
    HDPrivateKey,
    nodeName: 'name',
    parentTxId: userMetaIdInfo.infoTxId,
    metaIdTag,
    version: 'NULL',
    utxos: utxoTmp,
    data: name,
    changeAddress: infoAddress.toString(),
    feeb,
  }).then(async (res) => {
    userMetaIdInfo.name = res.id;
    sendRawTxList.push(res.toString());
    await sleep();
    utxoTmp = await getUtxos(mvcApi, infoAddress.toString());
    for (let utxo of utxoTmp) {
      utxo.privateKey = infoPrivateKey.toString();
    }
  });

  // 创建email节点
  await createNode({
    mvcApi,
    HDPrivateKey,
    nodeName: 'email',
    parentTxId: userMetaIdInfo.infoTxId,
    metaIdTag,
    version: 'NULL',
    utxos: utxoTmp,
    encrypt: 1,
    data: email,
    changeAddress: infoAddress.toString(),
    feeb,
  }).then(async (res) => {
    userMetaIdInfo.email = res.id;
    sendRawTxList.push(res.toString());
    await sleep();
    utxoTmp = await getUtxos(mvcApi, infoAddress.toString());
    for (let utxo of utxoTmp) {
      utxo.privateKey = infoPrivateKey.toString();
    }
  });

  // 创建phone节点
  await createNode({
    mvcApi,
    HDPrivateKey,
    nodeName: 'phone',
    parentTxId: userMetaIdInfo.infoTxId,
    metaIdTag,
    version: 'NULL',
    utxos: utxoTmp,
    encrypt: 1,
    data: phone,
    changeAddress: rootAddress.toString(),
    feeb,
  }).then((res) => {
    console.log('初始化PHONE', res);
    userMetaIdInfo.phone = res.id;
    sendRawTxList.push(res.toString());
  });

  return { userMetaIdInfo, sendRawTxList };
}

// 创建节点
export async function createNode({
  mvcApi,
  HDPrivateKey,
  parentTxId = 'NULL',
  metanetName = 'mvc',
  nodeName = '',
  metaIdTag = 'metaid',
  appId = 'WalletTag:Metalet',
  encrypt = 0,
  version = '1.0.1',
  data = 'NULL',
  dataType = 'text/plain',
  encoding = 'UTF-8',
  utxos,
  changeAddress = '',
  feeb = 0.5,
}) {
  const nodeKeyPath = getKeyPathByNodeName(nodeName);
  const nodeAddres = getPathAddress(HDPrivateKey, nodeKeyPath).toString();
  const nodePrivateKey = getPathPrivateKey(HDPrivateKey, nodeKeyPath);
  const nodePublicKey = getPathPublicKey(HDPrivateKey, nodeKeyPath);

  if (encrypt === 1) {
    data = eciesEncryptData(data, nodePrivateKey, nodePublicKey).toString('hex');
  }

  const scriptPayload = [
    metanetName,
    nodePublicKey.toString(),
    parentTxId,
    metaIdTag,
    nodeName,
    data,
    encrypt.toString(),
    version,
    dataType,
    encoding,
  ];

  const tx = new mvc.Transaction();
  tx.version = 10;
  // add input
  let _utxos = [];
  let _privateKeys = [];
  for (let i = 0; i < utxos.length; i++) {
    const utxo = utxos[i];
    _utxos.push({
      txId: utxo.txId,
      outputIndex: utxo.outputIndex,
      satoshis: utxo.satoshis,
      script: mvc.Script.buildPublicKeyHashOut(utxo.address).toHex(),
    });
    _privateKeys.push(utxo.privateKey);
  }
  tx.from(_utxos);

  // add output
  if (scriptPayload) {
    tx.addOutput(
      new mvc.Transaction.Output({
        script: mvc.Script.buildSafeDataOut(scriptPayload),
        satoshis: 0,
      })
    );
  }
  if (appId) {
    tx.addOutput(
      new mvc.Transaction.Output({
        script: mvc.Script.buildSafeDataOut(appId),
        satoshis: 0,
      })
    );
  }

  // fee
  const unlockSize = tx.inputs.filter((v) => v.output.script.isPublicKeyHashOut()).length * P2PKH_UNLOCK_SIZE;
  let fee = Math.ceil((tx.toBuffer().length + unlockSize + mvc.Transaction.CHANGE_OUTPUT_MAX_SIZE) * feeb);
  const fee2 = Math.ceil((utxos.length * 148 + 34 + 10) * feeb);
  tx.fee(Math.max(fee, fee2));

  // add change
  tx.change(changeAddress || nodeAddres);

  // sign
  tx.sign(_privateKeys);

  const res = await mvcApi.broadcast(tx.toString());
  if (!res) {
    throw 'broadcast error';
  }
  return tx;
}

// 修复补全节点
export async function repairMetaNode(mvcApi, HDPrivateKey, userInfo, feeb, didCheckRes) {
  const { code: didCode, rootTxId } = didCheckRes;

  // 无root节点
  if (didCode === 601) {
    return await initMetaId(mvcApi, HDPrivateKey, userInfo, feeb);
  }

  // 生成一堆节点对应的地址
  const rootAddress = getPathAddress(HDPrivateKey);
  const rootPrivateKey = getPathPrivateKey(HDPrivateKey);
  const protocolAddress = getPathAddress(HDPrivateKey, getKeyPathByNodeName('Protocols'));
  const infoAddress = getPathAddress(HDPrivateKey, getKeyPathByNodeName('Info'));
  const infoPrivateKey = getPathPrivateKey(HDPrivateKey, getKeyPathByNodeName('Info'));
  const nameAddress = getPathAddress(HDPrivateKey, getKeyPathByNodeName('name'));
  const emailAddress = getPathAddress(HDPrivateKey, getKeyPathByNodeName('email'));
  const phoneAddress = getPathAddress(HDPrivateKey, getKeyPathByNodeName('phone'));

  // 判断余额够不够
  const { pendingBalance, balance } = await mvcApi.getBalance(rootAddress.toString());
  if (pendingBalance + balance < 2000) {
    await getInitSat({
      address: rootAddress.toString(),
      xpub: HDPrivateKey.xpubkey.toString(),
    });
    await sleep();
  }

  // 获取utxo
  let utxoTmp = await getUtxos(mvcApi, rootAddress.toString());
  for (let utxo of utxoTmp) {
    utxo.privateKey = rootPrivateKey.toString();
  }

  // 假设对象(最后返回这对象)
  const { name, email, phone } = userInfo;
  let userMetaIdInfo = {
    metaId: rootTxId,
    protocolTxId: '',
    infoTxId: '',
    name: '',
    phone: '',
    email: '',
    metaIdRaw: '',
  };
  const metaIdTag = config.networkType === 'test' ? 'testmetaid' : 'metaid';

  // 判断情况
  switch (didCode) {
    // 只有root,没有其余节点
    case 620:
    // 有root, 无info
    case 610:
    // 有root, 无protocol

    case 602: {
      break;
    }
    // 有info, 无name/email/phone
    case 603:
    case 604:
    case 605: {
      // 取infoTxid
      const addressUtxosRes = await getAddressUtxo(infoAddress.toString());
      if (!addressUtxosRes || !Array.isArray(addressUtxosRes) || !addressUtxosRes.length) {
        break;
      }
      const targetOne = addressUtxosRes.find((v) => {
        return v.txid;
      });
      if (!targetOne) {
        break;
      }
      userMetaIdInfo.infoTxId = targetOne.txid;
      // 把钱全部转到info节点下
      const tx = new mvc.Transaction();
      tx.version = 10;
      // add input
      let _utxos = [];
      let _privateKeys = [];
      for (let i = 0; i < utxoTmp.length; i++) {
        const utxo = utxoTmp[i];
        _utxos.push({
          txId: utxo.txId,
          outputIndex: utxo.outputIndex,
          satoshis: utxo.satoshis,
          script: mvc.Script.buildPublicKeyHashOut(utxo.address).toHex(),
        });
        _privateKeys.push(utxo.privateKey);
      }
      tx.from(_utxos);
      // add output
      const unlockSize = tx.inputs.filter((v) => v.output.script.isPublicKeyHashOut()).length * P2PKH_UNLOCK_SIZE;
      let fee = Math.ceil((tx.toBuffer().length + unlockSize + mvc.Transaction.CHANGE_OUTPUT_MAX_SIZE) * feeb);
      const fee2 = Math.ceil((utxoTmp.length * 148 + 34 + 10) * feeb);
      tx.fee(Math.max(fee, fee2));
      // add change
      tx.change(infoAddress.toString());
      // sign
      tx.sign(_privateKeys);
      await mvcApi.broadcast(tx.toString());
      await sleep();
      utxoTmp = await getUtxos(mvcApi, infoAddress.toString());
      for (let utxo of utxoTmp) {
        utxo.privateKey = infoPrivateKey.toString();
      }
    }
  }

  if (!userMetaIdInfo.metaIdRaw && userMetaIdInfo.metaId) {
    const { hex } = await getTxIdRaw(userMetaIdInfo.metaId);
    userMetaIdInfo.metaIdRaw = hex;
  }

  if (!userMetaIdInfo.protocolTxId) {
    // 创建protocol节点
    await createNode({
      mvcApi,
      HDPrivateKey,
      nodeName: 'Protocols',
      parentTxId: userMetaIdInfo.metaId,
      metaIdTag,
      version: 'NULL',
      utxos: utxoTmp,
      changeAddress: rootAddress.toString(),
      feeb,
    }).then(async (res) => {
      userMetaIdInfo.protocolTxId = res.id;
      await sleep();
      utxoTmp = await getUtxos(mvcApi, rootAddress.toString());
      for (let utxo of utxoTmp) {
        utxo.privateKey = rootPrivateKey.toString();
      }
    });
  }

  if (!userMetaIdInfo.infoTxId) {
    // 创建info节点
    await createNode({
      mvcApi,
      HDPrivateKey,
      nodeName: 'Info',
      parentTxId: userMetaIdInfo.metaId,
      metaIdTag,
      version: 'NULL',
      utxos: utxoTmp,
      changeAddress: infoAddress.toString(),
      feeb,
    }).then(async (res) => {
      userMetaIdInfo.infoTxId = res.id;
      await sleep();
      utxoTmp = await getUtxos(mvcApi, infoAddress.toString());
      for (let utxo of utxoTmp) {
        utxo.privateKey = infoPrivateKey.toString();
      }
    });
  }

  if (!userMetaIdInfo.name) {
    // 创建name节点
    await createNode({
      mvcApi,
      HDPrivateKey,
      nodeName: 'name',
      parentTxId: userMetaIdInfo.infoTxId,
      metaIdTag,
      version: 'NULL',
      utxos: utxoTmp,
      data: name,
      changeAddress: infoAddress.toString(),
      feeb,
    }).then(async (res) => {
      userMetaIdInfo.name = res.id;
      await sleep();
      utxoTmp = await getUtxos(mvcApi, infoAddress.toString());
      for (let utxo of utxoTmp) {
        utxo.privateKey = infoPrivateKey.toString();
      }
    });
  }

  if (!userMetaIdInfo.email) {
    // 创建email节点
    await createNode({
      mvcApi,
      HDPrivateKey,
      nodeName: 'email',
      parentTxId: userMetaIdInfo.infoTxId,
      metaIdTag,
      version: 'NULL',
      utxos: utxoTmp,
      encrypt: 1,
      data: email,
      changeAddress: infoAddress.toString(),
      feeb,
    }).then(async (res) => {
      userMetaIdInfo.email = res.id;
      await sleep();
      utxoTmp = await getUtxos(mvcApi, infoAddress.toString());
      for (let utxo of utxoTmp) {
        utxo.privateKey = infoPrivateKey.toString();
      }
    });
  }

  if (!userMetaIdInfo.phone) {
    console.log('userMetaIdInfo.phone is null', 123);
    // 创建phone节点
    await createNode({
      mvcApi,
      HDPrivateKey,
      nodeName: 'phone',
      parentTxId: userMetaIdInfo.infoTxId,
      metaIdTag,
      version: 'NULL',
      utxos: utxoTmp,
      encrypt: 1,
      data: phone,
      changeAddress: rootAddress.toString(),
      feeb,
    }).then((res) => {
      userMetaIdInfo.phone = res.id;
    });
  }

  return userMetaIdInfo;
}
