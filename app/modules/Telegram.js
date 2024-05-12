const { PythonShell } = require('python-shell');
const EventEmitter = require('events');

class Telegram extends EventEmitter {

  phone;
  apiId;
  apiHash;

  #authProcess;
  #scrapeProcess;

  constructor(phone, apiId, apiHash) {
    super();
    this.phone = phone;
    this.apiId = apiId;
    this.apiHash = apiHash;
  }

  auth() {
    return new Promise((resolve, reject) => {
      try {
        this.#authProcess = new PythonShell('python/auth.py', {
          env: { PYTHONUNBUFFERED: '1' },
          args: [this.apiId, this.apiHash, this.phone]
        });

        this.#authProcess.on('message', message => {
          switch (message) {
            case 'AUTH_REQUIRED':
              this.emit('auth.required');
              break;
            case 'AUTH_SUCCESS':
              this.emit('auth.success');
              break;
          }
        });

        this.#authProcess.on('close', () => resolve());
        this.#authProcess.on('error', error => {
          this.emit('auth.error', error);
          reject(error);
        });
      } catch (error) {
        this.emit('auth.error', error);
        reject(error);
      }
    })
  }

  scrape(fromGroupId, finalGroupId, maxUsers = undefined) {
    return new Promise((resolve, reject) => {
      try {
        this.#scrapeProcess = new PythonShell('python/scrape.py', {
          env: { PYTHONUNBUFFERED: '1' },
          args: [this.apiId, this.apiHash, this.phone, fromGroupId, finalGroupId, maxUsers || -1]
        });

        this.#scrapeProcess.on('message', message => {
          let code, data;
          try { ({ code, data } = JSON.parse(message)) } catch (_) { return }

          switch (code) {
            case 'ADD_USER':
              this.emit('scrape.add_user', data);
              break;
            case 'ERROR':
              this.emit('scrape.error', data);
              break
            case 'CREATED_USERALREADYADDED':
              this.emit('scrape.created_useralreadyadded');
              break;
            case 'CREATED_EXCEPTEDUSERSTRINGS':
              this.emit('scrape.created_excepteduserstrings');
              break;
            case 'FROM_GROUP_TITLE':
              this.emit('scrape.from_group_title', data);
              break;
            case 'MAX_USERS_REACHED':
              this.emit('scrape.max_users_reached', data);
              break;
          }
        });


        this.#scrapeProcess.on('close', () => {
          this.emit('scrape.closed');
          resolve();
        });

        this.#scrapeProcess.on('error', error => {
          this.emit('scrape.error', error);
          reject(error);
        });
      } catch (error) {
        this.emit('scrape.error', error);
        reject(error);
      }
    });
  }

  exit() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.#authProcess  ?.kill('SIGTERM');
        this.#scrapeProcess?.kill('SIGTERM');
        resolve();
      }, 5e3);

      Promise.all([
        new Promise(resolve => this.#authProcess   ? this.#authProcess  ?.end(() => resolve()) : resolve()),
        new Promise(resolve => this.#scrapeProcess ? this.#scrapeProcess?.end(() => resolve()) : resolve()),
      ]).then(() => resolve());
    });
  }
}

module.exports = Telegram;
