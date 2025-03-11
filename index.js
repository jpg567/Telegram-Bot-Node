const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs')
// bot token
const token = '';
const reciverID = 12345;
const bot = new TelegramBot(token, {polling: true});
bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  bot.sendMessage(chatId, resp);
});

bot.onText(/\/info/, (msg)=>{
  const userId = msg.chat.id
  // only admin can access
  if(userId == reciverID){
    const inlineKeyboard = [
      [
          {
              text: 'all users count',
              callback_data: 'button1'
          },
          {
              text: 'Your messages count (today)',
              callback_data: 'button2'
          }
      ]
  ];
  bot.sendMessage(userId, 'Choose an option:', {
    reply_markup: {
        inline_keyboard: inlineKeyboard
    }
  });
  }
})
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === 'button1') {
      fs.readFile('./users.txt', 'utf-8', (err, data)=>{
        if (err) {
          console.error('Error reading file:', err);
          return;
        }
        const users = data.split(',')
        let userCount = users.length - 1
        bot.sendMessage(chatId, `your users count is : ${userCount}`)
      })
  } else if (data === 'button2') {
    bot.sendMessage(reciverID, `sended message (today): ${messageCount}`)
  }
  bot.answerCallbackQuery(query.id);
});
bot.onText(/\/start/, (msg) => {
  const userId = msg.chat.id;

  fs.readFile('./users.txt', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    // If the user is not already in the file, append it
    if (!data.includes(userId.toString())) {
      fs.appendFile('./users.txt', `${userId},`, (err) => {
        if (err) {
          console.error('Error writing to file:', err);
        } else {
          console.log(`User with ID ${userId} submitted`);
          bot.sendMessage(msg.chat.id,'WELCOME :)')
        }
      });
    } else {
      console.log(`User with ID ${userId} is already in the file`);
      bot.sendMessage(msg.chat.id,'you have started bot  :|\nsend your question')
    }
  });
});

let messageCount = 0
const now = new Date();
const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
const timeUntilMidnight = midnight - now;
setInterval(()=>{
  messageCount = 0
}, timeUntilMidnight)
 
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  console.log(msg)
  // admin message
  if (chatId == reciverID){
    if(!(msg.text.toString().startsWith('/info'))){
      const input = msg.text
      const partOne = input.toString().split('\n')[0]
      const text = input.toString().split('\n')[1]
      // send all
      if (partOne === 'send-all' && text) {
        fs.readFile('./users.txt', 'utf-8', (err, data) => {
          if (err) {
            console.error('Error reading users file:', err);
            return;
          }
          try{
            const ids = data.split(',').filter(id => id.trim() !== '');
            for (const id of ids) {
              bot.sendMessage(id, text)
                .then(() => {
                  console.log(`Message sent to ${id}`);
                })
                .catch((error) => {
                  console.error(`Error sending message to ${id}:`, error);
                });
            }
            bot.sendMessage(chatId, 'send message to all users successfully !')
          } catch(err){
            bot.sendMessage(chatId, 'error with sending message to all users')
          }
        });
      } else{
        // normal message
        bot.sendMessage(partOne, text)
        bot.sendMessage(chatId, `your message resived to <code>${partOne}</code>`,{parse_mode: 'HTML'});
        messageCount ++
      }
    }
  }
  else{
    // for normal user
    if(msg.sticker){
      bot.sendMessage(reciverID,`from <code>${msg.chat.id}</code>|@${msg.chat.username}`,{parse_mode:'HTML'})
      bot.sendSticker(reciverID, msg.sticker.file_id)
    }
    if(msg.photo){
      bot.sendPhoto(reciverID, msg.photo[1].file_id, {caption: `<blockquote>${msg.chat.id} | @${msg.chat.username}</blockquote> ${msg.caption}`, parse_mode:"HTML"})
    }
    if(msg.text){
      if(!(msg.text.toString().startsWith('/start'))){
        bot.sendMessage(chatId, 'your message resived');
        if(msg.text){
        bot.sendMessage(reciverID, `<blockquote><code>${msg.chat.id}</code> | @${msg.chat.username}</blockquote> ${msg.text}`,{ parse_mode: 'HTML' });
        }
      }
    }
  }

});
// Log any errors that occur
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});
console.log('start!')
