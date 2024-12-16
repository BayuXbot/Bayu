const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const config = require('./config.json');
const successFile = './success.json';
const cancelFile = './cancel.json';

const bot = new TelegramBot(config.bot_token, { polling: true });

const ownerId = config.owner_id;
let isMaintenance = false;
let appList = {
  netflix: {
    menu: "➡️ Netflix\n〰️ Netflix 1B 1p1u = 30.000 IDR"
  },
  spotify: {
    menu: "➡️ Spotify\n〰️ Spotify 1B = 7.000 IDR"
  },
  youtube: {
    menu: "➡️ Youtube Premium\n〰️ Netflix 1B = 5.000 IDR"
  }
};

const saveData = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));
const loadData = (file) => JSON.parse(fs.readFileSync(file, 'utf-8'));

bot.onText(/\/start/, (msg) => {
  if (msg.chat.id == ownerId) {
    bot.sendMessage(ownerId, "👋 Welcome To Simple App Premium Store Bot Type /help To Show Menu");
  }
});

bot.onText(/\/help/, (msg) => {
  if (msg.chat.id == ownerId) {
    bot.sendMessage(ownerId, `
⚓ Simple Bot App Premium Store ⚓
〰️ /addapp < For Add App To List >
〰️ /delapp < For Delete App To List >
〰️ /mute < To Mute User >
〰️ /broadcast < For Broadcast >
〰️ /mt < For Maintance Bot >
〰️ /nmt < For Stop Maintance Bot >
`);
  }
});

bot.onText(/\/addapp (.+)/, (msg, match) => {
  if (msg.chat.id != ownerId) return;

  const [name, menu] = match[1].split('|').map((v) => v.trim());
  if (!name || !menu) {
    bot.sendMessage(ownerId, `❌ Please Usage: /addapp <name app>|<menu app>\n✅ Example: /addapp bstation | ➡️ Bstation\n〰️ Bstation 1B = 25.000 IDR`);
    return;
  }

  appList[name.toLowerCase()] = { menu };
  bot.sendMessage(ownerId, `✅ ${name} successfully added!`);
});

bot.onText(/\/delapp (.+)/, (msg, match) => {
  if (msg.chat.id != ownerId) return;

  const name = match[1].toLowerCase();
  if (!appList[name]) {
    bot.sendMessage(ownerId, `❌ App ${name} not found.`);
    return;
  }

  delete appList[name];
  bot.sendMessage(ownerId, `✅ ${name} successfully deleted!`);
});

bot.onText(/\/mt/, (msg) => {
  if (msg.chat.id != ownerId) return;

  isMaintenance = true;
  bot.sendMessage(ownerId, "✅ Bot is now in maintenance mode.");
});

bot.onText(/\/nmt/, (msg) => {
  if (msg.chat.id != ownerId) return;

  isMaintenance = false;
  bot.sendMessage(ownerId, "✅ Bot is back to normal operation.");
});

bot.onText(/\/broadcast (.+)/, (msg, match) => {
  if (msg.chat.id != ownerId) return;

  const message = match[1];
  bot.sendMessage(ownerId, `🌐 Broadcast Message 🌐\n📝 Pesan : ${message}`);
});

bot.onText(/\/mute (@.+) (\d+)/, (msg, match) => {
  if (msg.chat.id != ownerId) return;

  const username = match[1];
  const time = parseInt(match[2]);
  bot.sendMessage(ownerId, `✅ User ${username} muted for ${time} seconds.`);
});

bot.onText(/exe (.+)/, (msg, match) => {
  if (msg.chat.id != ownerId) return;

  const command = match[1];
  require('child_process').exec(command, (err, stdout, stderr) => {
    if (err) bot.sendMessage(ownerId, `Error: ${err.message}`);
    else bot.sendMessage(ownerId, `\`${stdout || stderr}\``, { parse_mode: 'Markdown' });
  });
});

bot.on('message', (msg) => {
  if (isMaintenance && msg.chat.id != ownerId) {
    bot.sendMessage(msg.chat.id, "🚧 Bot is under maintenance.");
    return;
  }

  const text = msg.text?.toLowerCase();
  if (text in appList) {
    bot.sendMessage(msg.chat.id, appList[text].menu);
  } else if (text === 'list') {
    const list = Object.keys(appList).map((app) => `➡️ ${app.charAt(0).toUpperCase() + app.slice(1)}`).join('\n');
    bot.sendMessage(msg.chat.id, `💎 Apps Premium Listed 💎\n${list}`);
  } else if (text === 'payment') {
    bot.sendPhoto(msg.chat.id, './img/qris.png', {
      caption: `
📍 Dana : 0812xxxx
📍 Ovo : 0812xxxx
📍 Gopay : 0812xxxx
📝 Noted : Tolong Setelah Tf Kirim foto bukti nya di group dengan caption apa yang dimau misal netflix gitu
`
    });
  }
});

bot.on('message', (msg) => {
  if (msg.chat.id != ownerId || msg.text?.toLowerCase() !== 'p') return;

  if (!msg.reply_to_message) {
    bot.sendMessage(ownerId, "❌ Please reply to a user's message to use this command.");
    return;
  }

  const username = msg.reply_to_message.from.username || 'Unknown';
  const content = msg.reply_to_message.text || 'No Content';
  const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  const response = `
🚨 Pending Buying 🚨
🛒 Item : ${content}
🧒 Username : @${username}
💵 Price : Not Found
🕐 Time : ${time}
💽 Status : Pending 🔴
📝 Note : If Done Please Say d :)
`;

  bot.sendMessage(ownerId, response);
});

bot.on('message', (msg) => {
  if (msg.chat.id != ownerId || msg.text?.toLowerCase() !== 'd') return;

  if (!msg.reply_to_message) {
    bot.sendMessage(ownerId, "❌ Please reply to a user's message to use this command.");
    return;
  }

  const username = msg.reply_to_message.from.username || 'Unknown';
  const content = msg.reply_to_message.text || 'No Content';
  const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  const response = `
✅ Successfully Buying ✅
🛒 Item : ${content}
🧒 Username : @${username}
💵 Price : Not Found
🕐 Time : ${time}
💽 Status : Success ✅
📝 Note : None
`;
  const successData = loadData(successFile);
  successData.push({ username, content, time, status: 'Success' });
  saveData(successFile, successData);

  bot.sendMessage(ownerId, response);
});

bot.on('message', (msg) => {
  if (msg.chat.id != ownerId || msg.text?.toLowerCase() !== 'c') return;

  if (!msg.reply_to_message) {
    bot.sendMessage(ownerId, "❌ Please reply to a user's message to use this command.");
    return;
  }

  const username = msg.reply_to_message.from.username || 'Unknown';
  const content = msg.reply_to_message.text || 'No Content';

  const response = `
❌ Canceled Order
🛒 Item : ${content}
🧒 Username : @${username}
`;
  const cancelData = loadData(cancelFile);
  cancelData.push({ username, content, status: 'Canceled' });
  saveData(cancelFile, cancelData);

  bot.sendMessage(ownerId, response);
});