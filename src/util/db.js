let db;
let dbName = 'db';
let storeName = 'account';

export function initDb() {
  return new Promise((resolve, reject) => {
    const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    const req = indexedDB.open(dbName, 1);
    req.onsuccess = function (event) {
      db = event.target.result;
      resolve(db);
    };
    req.onerror = function (error) {
      console.error('open db error', error);
      reject();
    };
    req.onupgradeneeded = function (event) {
      db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        const objectStore = db.createObjectStore(storeName, { keyPath: 'xprv' });
        objectStore.createIndex('address', 'address', { unique: false });
        objectStore.createIndex('wif', 'wif', { unique: false });
      }
    };
  });
}

export function create(data) {
  return new Promise((resolve, reject) => {
    let transaction = db.transaction([storeName], 'readwrite');
    let objectStore = transaction.objectStore(storeName);
    let request = objectStore.add(data);
    request.onsuccess = (e) => {
      resolve(e.target.result);
    };
    request.onerror = (e) => {
      console.error('db create error', e);
      reject();
    };
  });
}

export function select(key) {
  return new Promise((resolve, reject) => {
    let transaction = db.transaction([storeName], 'readwrite');
    let objectStore = transaction.objectStore(storeName);
    let request = key === undefined ? objectStore.getAll() : objectStore.get(key);
    request.onsuccess = (e) => {
      resolve(e.target.result);
    };
    request.onerror = (e) => {
      console.error('db select error', e);
      reject();
    };
  });
}

export function update(data) {
  return new Promise((resolve, reject) => {
    let transaction = db.transaction([storeName], 'readwrite');
    let objectStore = transaction.objectStore(storeName);
    let request = objectStore.put(data);
    request.onsuccess = (e) => {
      resolve(e.target.result);
    };
    request.onerror = (e) => {
      console.error('db update error', e);
      reject();
    };
  });
}

export function remove(data) {
  return new Promise((resolve, reject) => {
    let transaction = db.transaction([storeName], 'readwrite');
    let objectStore = transaction.objectStore(storeName);
    let request = objectStore.delete(data);
    request.onsuccess = (e) => {
      resolve(e.target.result);
    };
    request.onerror = (e) => {
      console.error('db update error', e);
      reject();
    };
  });
}
