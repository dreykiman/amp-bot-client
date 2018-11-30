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

  console.log(conf.pairName)
  console.log(Date())

  let openorders = Object.values(orderbook)
    .filter(ele => ele.pairName == conf.pairName && ele.status!="CANCELLED" && ele.status!="FILLED")
    .filter(ele => ele.side != conf.side)

  openorders = openorders.sort(sortOrders)
  if (conf.side==="SELL") openorders.reverse()
  openorders = openorders.slice(0,2)

  openorders.forEach(ele=>{
    let price = amputils.reversePrice(ele.pricepoint, client.decimals[ele.quoteToken])
    let amount = amputils.reverseAmount(ele.amount, client.decimals[ele.baseToken])
    console.log(`you can ${conf.side}: price: ${price} amount: ${amount}`)
  })

  let order = {
    exchangeAddress: client.exchangeAddress,
    baseTokenAddress: pair.baseTokenAddress,
    quoteTokenAddress: pair.quoteTokenAddress,
    price: 0.00004,
    side: conf.side,
    amount: 50000,
    makeFee: client.makeFee[quoteSym],
    takeFee: client.takeFee[quoteSym]
  }

/*

  client.new_order(order)
    .catch( msg => {
      console.log(msg)
    })
*/
}

const getConf = _ => {
  let rawdata = fs.readFileSync('taker_configuration.json')
  return JSON.parse(rawdata)
}

const updatePair = pairName => {
  let conf = getConf().find(ele => ele.pairName === pairName)
  let {interval} = conf

  setTimeout( _ => {
    executeTrade(conf)
    updatePair(pairName)
  }, interval)
}



client.start()
  .then( _ => {
    let subscriptions = client.pairs()
      .map( pair => client.subscribe(pair.baseTokenAddress, pair.quoteTokenAddress)
         .catch( msg => {throw {err: `can not subscribe to ${pair.pairName}`, msg}} ) )
    return Promise.all(subscriptions)
  }).then( _ => getConf()
    .filter(ele => ele.enable)
    .forEach( ele => updatePair(ele.pairName) )
  )
