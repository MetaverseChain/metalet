import { Net } from '.';
import * as Utils from './utils';
type ReqConfig = {
  uri?: string;
  method?: string;
  timeout?: number;
  body?: any;
  headers?: any;
};
type HttpConfig = {
  timeout?: number;
  headers?: any;
};
export class BrowserNet {
  static _xmlRequest(reqConfig: ReqConfig, callback: Function) {
    const { uri, method, body, headers } = reqConfig;
    fetch(uri, {
      method,
      headers,
      cache: 'no-cache',
      redirect: 'follow',
      referrerPolicy: 'no-referrer-when-downgrade',
      body,
    })
      .then(async (res) => {
        console.log('REQ:', method, uri, res);
        const { status } = res;
        if (status >= 200 && status <= 207) {
          let resultData;
          try {
            resultData = await res.json();
          } catch (err) {
            await res.text();
          }
          callback(null, resultData);
        } else {
          callback('EC_REQ_FAILED');
        }
      })
      .catch((err) => {
        console.log(err);
        callback('EC_REQ_FAILED');
      });
  }
  static httpGet(url: string, params: any, cb?: Function, config?: any) {
    let str = '';
    let cnt = 0;
    for (var id in params) {
      if (cnt != 0) str += '&';
      str += id + '=' + params[id];
      cnt++;
    }
    if (str) {
      url += '?' + str;
    }

    config = config || {};
    let headers = config.headers || {};
    let timeout = config.timeout || Net.timeout;
    let reqData: ReqConfig = {
      uri: url,
      method: 'GET',
      timeout,
      headers,
    };
    const handlerCallback = (resolve: Function, reject: Function) => {
      this._xmlRequest(reqData, (err: any, body: any) => {
        if (err) {
          reject(err);
          return;
        }
        if (typeof body == 'string') {
          try {
            body = JSON.parse(body);
          } catch (e) {}
        }
        resolve(body);
      });
    };

    if (typeof cb === 'function') {
      handlerCallback(
        (result: any) => Utils.invokeCallback(cb, null, result),
        (err: any) => Utils.invokeCallback(cb, err)
      );
      return;
    }

    return new Promise((resolve, reject) => {
      handlerCallback(resolve, reject);
    });
  }

  static async httpPost(url: string, params: any, cb?: Function, config?: HttpConfig) {
    let postData: any;

    config = config || {};

    let headers = config.headers || {};
    let timeout = config.timeout || Net.timeout;
    headers['content-type'] = headers['content-type'] || 'application/json';
    if (headers['content-type'] == 'application/x-www-form-urlencoded') {
      let arr = [];
      for (var id in params) {
        arr.push(`${id}=${params[id]}`);
      }
      postData = arr.join('&');
    } else if (headers['content-type'] == 'text/plain') {
      postData = params;
    } else {
      postData = JSON.stringify(params);
    }

    if (headers['content-encoding'] == 'gzip') {
      postData = await Utils.gzip(Buffer.from(postData));
    }

    const reqData = {
      uri: url,
      method: 'POST',
      body: postData,
      headers: headers,
      timeout: timeout,
    };
    const handlerCallback = (resolve: Function, reject: Function) => {
      this._xmlRequest(reqData, (err: any, body: any) => {
        if (err) {
          reject(err);
          return;
        }
        if (typeof body == 'string') {
          try {
            body = JSON.parse(body);
          } catch (e) {}
        }
        resolve(body);
      });
    };

    if (typeof cb === 'function') {
      handlerCallback(
        (result: any) => Utils.invokeCallback(cb, null, result),
        (err: any) => Utils.invokeCallback(cb, err)
      );
      return;
    }

    return new Promise((resolve, reject) => {
      handlerCallback(resolve, reject);
    });
  }
}
