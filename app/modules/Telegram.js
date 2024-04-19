const { PythonShell } = require('python-shell');
const EventEmitter = require('events');

class Telegram extends EventEmitter {

  phone;
  apiId;
  apiHash;

  constructor(phone, apiId, apiHash) {
    super();
    this.phone = phone;
    this.apiId = apiId;
    this.apiHash = apiHash;
  }

  auth() {
    return new Promise((resolve, reject) => {
      try {
        const authProcess = new PythonShell('python/auth.py', {
          env: { PYTHONUNBUFFERED: '1' },
          args: [this.apiId, this.apiHash, this.phone]
        });

        authProcess.on('message', message => {
          switch (message) {
            case 'AUTH_REQUIRED':
              this.emit('auth.required');
              break;
            case 'AUTH_SUCCESS':
              this.emit('auth.success');
              break;
          }
        });

        authProcess.on('close', () => resolve());
        authProcess.on('error', error => {
          this.emit('auth.error', error);
          reject(error);
        });
      } catch (error) {
        this.emit('auth.error', error);
        reject(error);
      }
    })
  }

  scrape(fromGroupId, finalGroupId) {
    return new Promise((resolve, reject) => {
      try {
        const scrapeProcess = new PythonShell('python/scrape.py', {
          env: { PYTHONUNBUFFERED: '1' },
          args: [this.apiId, this.apiHash, this.phone, fromGroupId, finalGroupId]
        });

        scrapeProcess.on('message', message => {
          let code, data;
          try { ({ code, data } = JSON.parse(message)) } catch (_) { return }

          switch (code) {
            case 'ADD_USER':
              this.emit('scrape.add_user', data);
              break;
            case 'ERROR':
              this.emit('scrape.error', data);
              break;
            case 'START':
              this.emit('scrape.start');
              break
            case 'CREATED_USERALREADYADDED':
              this.emit('scrape.created_useralreadyadded');
              break;
            case 'CREATED_EXCEPTEDUSERSTRINGS':
              this.emit('scrape.created_excepteduserstrings');
              break;
          }
        });


        scrapeProcess.on('close', () => {
          // Scrape erfolgreich
          this.emit('scrape.closed');
          resolve();
        });

        scrapeProcess.on('error', error => {
          this.emit('scrape.error', error);
          reject(error);
        });
      } catch (error) {
        this.emit('scrape.error', error);
        reject(error);
      }
    });
  }

  async start(fromGroupId, finalGroupId) {
    await this.auth();
    await this.scrape(fromGroupId, finalGroupId);
  }
}

module.exports = Telegram;
