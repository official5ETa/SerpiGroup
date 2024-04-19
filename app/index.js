const dotenv = require('dotenv');
const Telegram = require("./modules/Telegram");

dotenv.config();
for (const envVarName of [
  'MYTELEGRAM_ID',
  'MYTELEGRAM_HASH',
  'MYTELEGRAM_PHONE',
  'FROM_GROUP_ID',
  'FINAL_GROUP_ID'
]) if (process.env[envVarName] === undefined) {
    console.error(envVarName + ' env var is not set');
    process.exit(1);
  }



const telegram = new Telegram(process.env.MYTELEGRAM_PHONE, process.env.MYTELEGRAM_ID, process.env.MYTELEGRAM_HASH);

telegram.on('auth.required', () => console.warn(telegram.phone, '|', 'auth required'));
telegram.on('auth.success', () => console.info(telegram.phone, '|', 'authorized'));

telegram.on('scrape.error', e => console.error(telegram.phone, '|', e));
telegram.on('scrape.start', () => console.info(telegram.phone, '|', 'started'));
telegram.on('scrape.add_user', user => console.log(telegram.phone, '|', 'added user:', user.username, `(${user.firstname} ${user.lastname})`));

telegram.start(process.env.FROM_GROUP_ID, process.env.FINAL_GROUP_ID).then();