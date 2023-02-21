import { BrowserNet } from './BrowserNet';

function toLowerHeader(headers) {
  let newHeaders = {};
  for (var id in headers) {
    let lowerId = id.toLowerCase();
    newHeaders[lowerId] = headers[id];
  }
  return newHeaders;
}

export class Net {
  //default timeout
  static timeout = 3 * 60 * 1000;

  static httpGet(url: string, params: any, config?: any) {
    if (config && config.headers) {
      config.headers = toLowerHeader(config.headers);
    }

    if (config && config.headers) {
      //remove unsafe header,should be added in browser
      delete config.headers['accept-encoding'];

      return BrowserNet.httpGet(url, params, null, config);
    }
  }

  static httpPost(url: string, params: any, config?: any) {
    if (config && config.headers) {
      config.headers = toLowerHeader(config.headers);
    }

    if (config && config.headers) {
      delete config.headers['accept-encoding'];
    }
    return BrowserNet.httpPost(url, params, null, config);
  }
}
