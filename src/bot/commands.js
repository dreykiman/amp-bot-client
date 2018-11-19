import bot from '../bot'
import * as trader from '../models/trader'
import client from '../models/amp-client'

let commands = {}

let sendMessage = (channelID, message) => {
  bot.sendMessage({
    to: channelID,
    message: message
  })
}

commands.default = (user, userID, channelID, args) => {
  sendMessage(channelID, 'hello world')
}

commands.links = (user, userID, channelID, args) => {
  sendMessage(channelID, "http://66.154.105.119:3000/orderbook")
  sendMessage(channelID, "http://66.154.105.119:3000/orders")
  sendMessage(channelID, "http://66.154.105.119:3000/trades")
}

commands.pairs = (user, userID, channelID, args) => {
  sendMessage(channelID, JSON.stringify(client.pairs()
    .map(ele=>`ele.pairName = ${ele.baseTokenAddress}/${ele.quoteTokenAddress}`)))
}


const order = (channelID, side, args) => {
  let pair = args.length>=3 && client.pairs().find( ele => ele.pairName === args[0] )

  if (args.length >= 3 && pair
  && Number(args[1]) == args[1]
  && Number(args[2]) == args[2]) {

    let amount = Number(args[1])
    let price = Number(args[2])

    let ord = {side,
      amount,
      price,
      makeFee: 0,
      takeFee: 0,
      baseTokenAddress: pair.baseTokenAddress,
      quoteTokenAddress: pair.quoteTokenAddress,
      exchangeAddress: "0x344F3B8d79C0A516b43651e26cC4785b07fb6aA1",
    }

    client.new_order(ord)
      .then(ord => sendMessage(channelID, JSON.stringify(ord.event.payload.status)))
      .catch(data => {
        sendMessage(channelID, "attempt to resubmit order")
        sendMessage(channelID, JSON.stringify(data))
        return client.new_order(data.order)
          .then(ord => sendMessage(channelID, JSON.stringify(ord.event.payload.status)))
      }).catch(msg => sendMessage(channelID, JSON.stringify(msg)))
  } else {
    sendMessage(channelID, 'Invalid arguments')
  }
}

commands.buy = (user, userID, channelID, args) => {
  order(channelID, 'BUY', args)
}

commands.sell = (user, userID, channelID, args) => {
  order(channelID, 'SELL', args)
}


commands.cancelall = trader.cancel_all

commands.myorders = (user, userID, channelID, args) => {
  if (args.length>0 && client.pairs().some(ele=> args[0]==ele.pairName))
    sendMessage(channelID, JSON.stringify(client.my_orders(args[0]).map(ele=>ele.hash)))
  else
    sendMessage(channelID, "specify valid pair name")
}

commands.populate = trader.populate

commands.reopen = client.ws.reopen

export default commands
