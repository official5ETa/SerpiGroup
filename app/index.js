const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const dotenv = require('dotenv');

dotenv.config();
for (const envVarName of [
  'TELEGRAM_API_TOKEN',
  'MYTELEGRAM_ID',
  'MYTELEGRAM_HASH',
  'MYTELEGRAM_PHONE',
  'FINAL_GROUP_ID'
]) if (process.env[envVarName] === undefined) {
    console.error(envVarName + ' env var is not set');
    process.exit(1);
  }

(async () => {

  await new Promise((resolve, reject) =>
    exec(
      `python3 auth.py ${process.env.MYTELEGRAM_ID} ${process.env.MYTELEGRAM_HASH} ${process.env.MYTELEGRAM_PHONE}`,
      error => error ? reject(error) : resolve()
    ).stdout.on('data', (data) => {
        console.log(data.toString());
      })
  );

  const telegram = new TelegramBot(process.env.TELEGRAM_API_TOKEN, { polling: true });

  const finalGroup = await telegram.getChat(process.env.FINAL_GROUP_ID).catch(() => {
    console.error('could not find group with ID:', process.env.FINAL_GROUP_ID);
    process.exit(1);
  });

  console.info('final group found:', finalGroup['username']);

  telegram.on('message', async (msg) => {
    for (const member of [msg['new_chat_member'], msg['new_chat_members']])
      if (member && member.id === (await telegram.getMe()).id) {

        const chat = msg['chat'];
        if (chat) {
          console.log('Bot got added to Group:', chat.title, `[${chat.id}]`);

          await new Promise(async (resolve) => {
            const pyProcess = exec(
              'python3 scrape.py'
                + ` ${process.env.MYTELEGRAM_ID} ${process.env.MYTELEGRAM_HASH} ${process.env.MYTELEGRAM_PHONE}`
                + ` ${chat.id} ${finalGroup['id']} ${(await telegram.getMe()).id}`,
              error => {
                if (error) console.error(error);
                resolve()
              }
            );

            pyProcess.stdout.on('data', (data) => {
              console.log(data.toString());
            });
          });

          console.log("done inviting new users");
        }
        break;
      }
  });
  console.log('listening for messages...');
})();