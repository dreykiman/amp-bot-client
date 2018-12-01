import fs from 'fs'
import ClientAPI from 'amp-node-api-client'
import { orderbook, amputils } from 'amp-node-api-client'
import { Wallet, getDefaultProvider } from 'ethers'
import keys from '../keys.json'
import {sortOrders} from './utils'

let provider = getDefaultProvider('rinkeby')
let wallet = new Wallet(keys.AMPtaker, provider)

const client = new ClientAPI(wallet)

const executeTrade = conf => {
  let [baseSym, quoteSym] = conf.pairName.split('/')
  let pair = client.pairs().find(ele => ele.baseTokenSymbol === baseSym && ele.quoteTokenSymbol === quoteSym)

  let side = Math.random()>0.5 ? 'SELL' : 'BUY'
  let openorders = Object.values(orderbook)
    .filter(ele => ele.pairName == conf.pairName && ele.status!="CANCELLED" && ele.status!="FILLED")
    .filter(ele => ele.side != side)

  openorders = openorders.sort(sortOrders)
  if (side==="SELL") openorders.reverse()
  openorders = openorders.slice(0,1)

  let out = [conf.pairName, Date()]
  openorders.forEach(ele=>{
    let price = amputils.reversePrice(ele.pricepoint, client.decimals[ele.quoteToken])
    let amount = amputils.reverseAmount(ele.amount, client.decimals[ele.baseToken])
    out.push(`you can ${side}: price: ${price} amount: ${amount}`)
  })

  if (out.length>2) console.log(out.join('\n'))

  if (openorders.length>0) {
    let ord = openorders[0]
    let price = amputils.reversePrice(ord.pricepoint, client.decimals[ord.quoteToken])
    let amount = amputils.reverseAmount(ord.amount, client.decimals[ord.baseToken])

    let order = {
      exchangeAddress: client.exchangeAddress,
      baseTokenAddress: pair.baseTokenAddress,
      quoteTokenAddress: pair.quoteTokenAddress,
      price: price,
      side: side,
      amount: amount,
      makeFee: client.makeFee[quoteSym],
      takeFee: client.takeFee[quoteSym]
   }

    return client.new_order(order)
      .catch( msg => console.log(msg) )
  }
}

const getConf = _ => {
  let rawdata = fs.readFileSync('taker_configuration.json')
  return JSON.parse(rawdata)
}

const updatePairConfiguration = pairName => {
  let conf = getConf().find(ele => ele.pairName === pairName)
  let {interval} = conf

//  executeTrade(conf)

  setTimeout( _ => {
    executeTrade(conf)
    updatePairConfiguration(pairName)
  }, interval)
}



const init = _ => client.start()
  .then( _ => {
    let subscriptions = client.pairs()
      .map( pair => client.subscribe(pair.baseTokenAddress, pair.quoteTokenAddress)
         .catch( msg => {throw {err: `can not subscribe to ${pair.pairName}`, msg}} ) )
    return Promise.all(subscriptions)
  })


init().then( _ => getConf()
    .filter( ele => ele.enable )
    .forEach( ele => updatePairConfiguration( ele.pairName ) )
  ).catch( msg => console.log(msg) )


/*
const promiseOnClose = _ => {
  return new Promise( (res, rej) => {
    client.ws.once('close', res)
  })
}

const reconnectAttempt = _ => {
  console.log('attempt to reconnect')
  console.log(client.ws.time)
  client.ws.reopen()
  console.log(client.ws.time)
  setTimeout(_=>console.log(client.ws.time), 2000)
  promiseOnClose().then(reconnectAttempt)
}

promiseOnClose().then(reconnectAttempt)

*/
