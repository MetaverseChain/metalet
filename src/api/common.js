import config from '@/config';
import { get, post } from '@/util/request';

export function getExchangeRate() {
  return get({
    url: '/wxcore/legalbsv/getExchangeRate',
    host: config.networkType === 'test' ? config.CONFIG_API_SHOWMONEY_HOST_TEST : config.CONFIG_API_SHOWMONEY_HOST,
  });
}

export function getMetaIdByZeroAddress(zeroAddress) {
  return get({
    url: `/metaid-base/v1/meta/root/${zeroAddress}`,
    host: config.networkType === 'test' ? config.CONFIG_API_SHOWMONEY_HOST_TEST : config.CONFIG_API_SHOWMONEY_HOST,
  });
}

export function getShowDIDUserInfo(rootTxId) {
  return get({
    url: `/metaid-base/v1/meta/user/${rootTxId}`,
    host: config.networkType === 'test' ? config.CONFIG_API_SHOWMONEY_HOST_TEST : config.CONFIG_API_SHOWMONEY_HOST,
  });
}

export function getInitSat(data) {
  return post({
    url: '/nodemvc/api/v1/pri/wallet/sendInitSatsForMetaSV',
    host: config.networkType === 'test' ? config.CONFIG_API_SHOWMONEY_HOST_TEST : config.CONFIG_API_SHOWMONEY_HOST,
    data,
  });
}

export function getAddressUtxo(address) {
  return get({
    url: `/address/${address}/utxo`,
    host: config.networkType === 'test' ? config.CONFIG_API_HOST_TEST : config.CONFIG_API_HOST,
  });
}

export function getTxIdRaw(txid) {
  return get({
    url: `/tx/${txid}/raw`,
    host: config.networkType === 'test' ? config.CONFIG_API_HOST_TEST : config.CONFIG_API_HOST,
  });
}

export function uploadMetaIdRaw(data) {
  return post({
    url: `/metaid-base/v1/meta/upload/raw`,
    host: config.networkType === 'test' ? config.CONFIG_API_SHOWMONEY_HOST_TEST : config.CONFIG_API_SHOWMONEY_HOST,
    data,
  });
}

export function uploadXpub(xPub) {
  return get({
    url: `/metaid-base/v1/meta/xpub/${xPub}`,
    host: config.networkType === 'test' ? config.CONFIG_API_SHOWMONEY_HOST_TEST : config.CONFIG_API_SHOWMONEY_HOST,
  });
}

export function getFtBalance(address) {
  const params = {
    url:
      config.networkType === 'test'
        ? `/contract/ft/address/${address}/balance`
        : `/contract/ft/address/${address}/balance`,
    host: config.networkType === 'test' ? config.CONFIG_API_HOST_TEST : config.CONFIG_API_HOST,
  };
  return get(params);
}

export function getNftSummary(address) {
  const params = {
    url:
      config.networkType === 'test'
        ? `/contract/nft/address/${address}/summary`
        : `/contract/nft/address/${address}/summary`,
    host: config.networkType === 'test' ? config.CONFIG_API_HOST_TEST : config.CONFIG_API_HOST,
  };
  return get(params);
}

export function getNftUtxo(address) {
  const params = {
    url:
      config.networkType === 'test' ? `/contract/nft/address/${address}/utxo` : `/contract/nft/address/${address}/utxo`,
    host: config.networkType === 'test' ? config.CONFIG_API_HOST_TEST : config.CONFIG_API_HOST,
  };
  return get(params);
}

export function getXpubLiteBlance(xpub) {
  return get({
    url: `/xpubLite/${xpub}/balance`,
    host: config.networkType === 'test' ? config.CONFIG_API_HOST_TEST : config.CONFIG_API_HOST,
    headers: {
      authorization: config.CONFIG_METASV_AUTHORIZATION,
    },
  });
}
