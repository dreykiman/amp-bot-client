import Discord from 'discord.io'
import auth from '../../auth.json'
import commands from './commands'

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
})

bot.on('ready', evt  => {
  console.log("connected")
})

bot.on('message', (user, userID, channelID, message, evt) => {
  if (message.substring(0, 1) == '!') {
    var args = message.substring(1).split(' ');
    var cmd = args[0];
    args = args.splice(1)

    if (cmd in commands) commands[cmd](user, userID, channelID, args)
    else commands.default(user, userID, channelID, args)
  }
})

export default bot
