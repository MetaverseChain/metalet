import { sendMessageFromExtPageToBackground } from '@/util/chromeUtil';
import store from '@/store';

// 实例化界面前先初始化数据
export async function initData() {
  // 选择网络
  const { data: networkType } = await sendMessageFromExtPageToBackground('getNetwork');
  await store.dispatch('system/setNetworkType', networkType);
  // 获取并设置账号信息
  const { data } = await sendMessageFromExtPageToBackground('getAccount');
  await store.dispatch('account/setAccountList', data);
  const lastAccount = localStorage.getItem('account');
  if (lastAccount && data.length) {
    const hasAccount = data.find((v) => v.xprv === lastAccount);
    if (hasAccount) {
      await store.dispatch('account/setCurrentAccount', hasAccount);
      //屏蔽生成metaid
      // await sendMessageFromExtPageToBackground('checkOrCreateMetaId', hasAccount);
      sendMessageFromExtPageToBackground('saveCurrentAccount', hasAccount);
    }
  }
  //初始化nft列表
  const nftList = store.state.token.nftList;
  if (nftList.length === 0) {
    store.dispatch('token/addNft', { codehash: '62de3500752a71955c836b21d9fd94bc90fe24c2', genesis: 'system' });
  }
}
