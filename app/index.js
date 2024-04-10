const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');

dotenv.config();

const telegram = new TelegramBot(process.env.TELEGRAM_API_TOKEN, { polling: true });

const finalGroupId = process.env.FINAL_GROUP_ID;
if (!finalGroupId) {
  console.error('FINAL_GROUP_ID env var is not set');
  process.exit(1);
}

(async () => {

  const finalGroup = await telegram.getChat(finalGroupId).catch(() => {
    console.error('could not find group with ID:', finalGroupId);
    process.exit(1);
  });

  console.info('final group found:', finalGroup.username);

  let inviteLink;
  try {
    inviteLink = await telegram.exportChatInviteLink(finalGroup.id);
  } catch (_) {
    console.error(_);
    try {
      inviteLink = await telegram.createChatInviteLink(finalGroup.id);
    } catch (_) {
      console.error('could not create invite link');
      console.error(_);
      process.exit(1);
    }
  }

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 1080 },
    args: [
      '--no-sandbox',
      `--display=${process.env.DISPLAY}`
    ]
  });
  const page = await browser.newPage();
  await page.goto('https://web.telegram.org/a/');

  try {
    console.log('auth form detected');

    const phoneNumber = process.env.PHONE_NUMBER;
    if (phoneNumber) {
      console.log("autofillin phone number:", phoneNumber);

      await page.waitForSelector('#auth-qr-form button[type=button]');
      await page.click('#auth-qr-form button[type=button]');
      await page.waitForSelector('#auth-phone-number-form');

      await page.waitForSelector('input#sign-in-phone-number');
      await page.type('input#sign-in-phone-number', phoneNumber);
      await new Promise(resolve => setTimeout(() => resolve(), 1e3));

      await page.waitForSelector('#auth-phone-number-form button[type=submit]');
      await page.click('#auth-phone-number-form button[type=submit]');

      console.info('waiting for authentication...');
    }
    else console.info('wating for login...');

  } catch (_) {
    console.warn('no auth form detected! continuing');
  }

  try {
    await page.waitForSelector('#LeftColumn', { timeout: 5 * 60 * 1e3 });
  } catch (_) {
    console.error('login timeout');
    process.exit(1);
  }
  console.log('logged in successfully!');

  for (const page of await browser.pages())
    if (page.url() === 'about:blank')
      await page.close();

  telegram.on('message', async (msg) => {
    for (const member of [msg['new_chat_member'], msg['new_chat_members']])
      if (member && member.id === (await telegram.getMe()).id) {

        const chat = msg['chat'];
        if (chat) {
          console.log('Bot got added to Chat:', chat.title, `[${chat.id}]`);

          const groupPage = await browser.newPage();
          await groupPage.goto('https://web.telegram.org/a/#' + chat.id);
          await groupPage.waitForSelector('#LeftColumn');

          await groupPage.waitForSelector('.chat-info-wrapper');
          const infoBoundingBox = await (await groupPage.$('.chat-info-wrapper')).boundingBox();
          await groupPage.mouse.click(infoBoundingBox.x + 20, infoBoundingBox.y + infoBoundingBox.height / 2);

          await new Promise(resolve => setTimeout(() => resolve(), 2e3));
          await groupPage.waitForSelector('.shared-media');
          for (const tabElement of await groupPage.$$('.TabList > *')) {
            if (await tabElement.evaluate(node => node['innerText'].toUpperCase().includes('MEMBERS'))) {
              const tabElementBoundingBox = await tabElement.boundingBox();
              await groupPage.mouse.click(tabElementBoundingBox.x + tabElementBoundingBox.width / 2, tabElementBoundingBox.y + tabElementBoundingBox.height / 2);
              break;
            }
          }

          const telegramBotId = (await telegram.getMe()).id;
          const newUsers = [];

          // TODO: autoscroll!!!
          for (const chatId of await groupPage.$$eval('.shared-media .ListItem .ChatInfo [data-peer-id]', async items =>
            items.map(item => item.getAttribute('data-peer-id'))
          ))
            if (chatId && chatId !== telegramBotId.toString() && !newUsers.some(({ id }) => id === chatId)) {
              const user = await telegram.getChat(chatId);
              if (user && !user.username.endsWith('_bot')) newUsers.push(user);
            }

          await groupPage.close();

          for (const user of newUsers) {
            console.log('inviting user:', user.username, `[${user.id}]`);
            await telegram.sendMessage(user.id, `Du wurdest zur Gruppe eingeladen! Trete über folgenden Link bei: ${inviteLink}`);
          }

          console.log("done inviting new users");
        }
        break;
      }
  });
  console.log('listening for messages...');
})();