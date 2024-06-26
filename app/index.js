const { existsSync, readFileSync } = require("fs");
const Telegram = require("./modules/Telegram");



/**
 * @type {{
 *   runtime: number | null,
 *   maxUsers: number | null,
 *   finalGroupId: string | null,
 *   fromGroupIds: string[],
 *   api: {
 *     phone: string,
 *     id: string,
 *     hash: string
 *   }[]
 * }}
 */
const params = {
  runtime: null,
  maxUsers: null,
  finalGroupId: null,
  fromGroupIds: [],
  api: []
};



if (existsSync('shared/config.yml')) {
  const config = require('yaml').parse(readFileSync('shared/config.yml', 'utf8'));
  params.runtime = config['runtime'];
  params.maxUsers = config['max_users'];
  params.finalGroupId = config['final_group_id'];
  params.fromGroupIds = config['from_group_ids'];
  params.api = config['api'].map(({ phone, id, hash }) => ({ phone, id, hash }));
}



else {
  console.warn('no config.yml found! Using env vars');

  require('dotenv').config();
  for (const envVarName of [
    'FINAL_GROUP_ID',
    'FROM_GROUP_ID',
    'API_PHONE',
    'API_ID',
    'API_HASH'
  ]) if (process.env[envVarName] === undefined)
    throw new Error('env var is not set: ' + envVarName);

  params.runtime  = process.env.RUNTIME   ? parseInt(process.env.RUNTIME  ) : null;
  params.maxUsers = process.env.MAX_USERS ? parseInt(process.env.MAX_USERS) : null;
  params.finalGroupId = process.env.FINAL_GROUP_ID;
  params.fromGroupIds = [process.env.FROM_GROUP_ID];
  params.api = [{
    phone: process.env.API_PHONE,
    id: process.env.API_ID,
    hash: process.env.API_HASH
  }];
}



if (!params.finalGroupId)
  throw new Error('no finalGroupId set');
if (!params.fromGroupIds.length)
  throw new Error('no fromGroupIds set');
if (!params.api.length)
  throw new Error('no apis set');

console.info(
  '\n----------------------------------------------------------------',
                    '\nfinal group id: ', params.finalGroupId,
                    '\nfrom groups:    ', params.fromGroupIds.length,
                    '\napis:           ', params.api.length,
  params.runtime  ? '\nruntime:         '+params.runtime + 'ms' : '',
  params.maxUsers ? '\nmax users:       '+params.maxUsers : '',
  '\n----------------------------------------------------------------\n'
);



const bots = [];

for (const api of params.api) {
  const telegram = new Telegram(api.phone, api.id, api.hash);

  telegram.on('auth.required', (function() { console.warn(this.phone, '|', 'auth required') }).bind(telegram));
  telegram.on('auth.success', (function() { console.info(this.phone, '|', 'authorized') }).bind(telegram));

  telegram.on('scrape.error', (function(e) { console.error(this.phone, '|', e) }).bind(telegram));
  telegram.on('scrape.from_group_title', (function(title) { console.info(this.phone, '|', 'scraping from group:', title) }).bind(telegram));
  telegram.on('scrape.add_user', (function(user) { console.log(this.phone, '|', 'added user:', user['username'], '(' + user['firstname'] + (user['lastname'] ? ' '+user['lastname'] : '') + ')') }).bind(telegram));
  telegram.on('scrape.max_users_reached', count => {
    console.info('max users reached:', count);
    process.exit();
  });

  telegram.auth().then((async function() {
    for (let fromGroupId; (fromGroupId = params.fromGroupIds.sort(() => Math.random()-.5)[Math.floor(Math.random() * params.fromGroupIds.length)]);)
      await this.scrape(fromGroupId, params.finalGroupId, params.maxUsers);
  }).bind(telegram));

  bots.push(telegram);
}



process.on('exit', async () =>
  await Promise.all(bots.map(bot => bot.exit())));



if (params.runtime)
  setTimeout(() => {
    console.info('auto runtime exit');
    process.exit();
  }, params.runtime);