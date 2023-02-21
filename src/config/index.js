import { storageSet } from '@/util/chromeUtil';

const appConf = {
  env: process.env.env,
  mode: process.env.mode,
  version: process.env.version,
  networkType: process.env.CONFIG_NETWORK_TYPE,
  ...process.env.appEnv,
};

export async function changeNetworkType(val) {
  appConf.networkType = val;
  if (chrome?.storage?.sync?.set) {
    await storageSet('networkType', val);
  }
  return val;
}

export default appConf;
