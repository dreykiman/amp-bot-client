import { orderbook } from 'amp-node-api-client'
import client from './amp-client'
import * as binance from './binance'
import { gauss, getPricePoints } from '../utils'



export const add_order = _ => {
  let ord = {
    amount: 0.1,
    userAddress: "0xf2934427c36ba897f9be6ed554ed2dbce3da1c68",
    exchangeAddress: "0x2e3fd05f73ed36c9f90999e9ecd3b120ce4900f8",
    makeFee: 0,
    takeFee: 0,
    side: "BUY",
    baseTokenAddress: "0x9ff229bcc9e64e36a9b396b90fb1660888136ca6",
    quoteTokenAddress: "0xe9b5da78abb9fda785f828836f5c7e7f20273779",
  }
  return client.new_order(ord)
}


export const cancel_all = _ => {
  return client.my_orders()
    .then( data => {
      return data.data.filter( ele => ele.status!="FILLED" && ele.status!="CANCELLED")
    })
    .then( orders => {
      orders.forEach( ele => {
        client.cancel_order(ele.hash)
      })
    })
}




const updateOrderbook = data => {
  data.data.forEach( ele => {
    Object.assign(orderbook[ele.hash], ele)
  })
  return client.pairs()
}


const getPrices = pairs => {
  console.log(pairs)
  let prices = pairs
    .map( pair => {
      return binance.getPrice(pair.baseTokenSymbol)
        .then( price => {
          return { address: pair.baseTokenAddress, prices: price }
        })
        .catch( _ => null)
      })
  return Promise.all(prices)
}


const makeOrder = (tok) => {

  let mid = getPricePoints(tok.prices[0].ave).add(getPricePoints(tok.prices[1].ave)).div(2)

  let orders = []
  tok.prices.forEach( (price, ind) => {
    [-2, -1, 0, 1, 2].filter( ds => {
      let xx = getPricePoints(price.ave + ds*price.dev)
      return ind===0 ? xx.add(2).lt(mid) : xx.sub(2).gt(mid)
    })
    .forEach( ds => {
      let xx = price.ave - ds*price.dev
console.log(tok.address+" "+xx+" "+getPricePoints(xx).toString()+" "+ind)
      let yy = gauss(xx, price.ave, price.dev)
      orders.push({
        amount: 0.01*yy/gauss(price.ave, price.ave, price.dev)/xx,
        price: xx,
        userAddress: "0xf2934427c36ba897f9be6ed554ed2dbce3da1c68",
        exchangeAddress: "0x2e3fd05f73ed36c9f90999e9ecd3b120ce4900f8",
        makeFee: 0,
        takeFee: 0,
        side: ["BUY", "SELL"][ind],
        baseTokenAddress: tok.address,
        quoteTokenAddress: "0xe9b5da78abb9fda785f828836f5c7e7f20273779"
      })
    })
  })

  return orders
}



const updatePrices = prices => {
  let myorders = Object.values(orderbook)
    .filter( ord => ord.status!="CANCELLED" && ord.status!="FILLED" )

  let neworders = prices.filter(ele => ele)
    .map( tok => {
      let cancels = myorders.filter( ord => ord.baseToken === tok.address )
        .map( ord => {
          return client.cancel_order(ord.hash)
        })

      return Promise.all(cancels)
        .then( _ => {
          console.log("all cancelled for "+tok.address)
        })
        .then( _ => { return makeOrder(tok) })
        .then( ords => {
          let news = ords.map( ord => {
            return client.new_order(ord)
          })
          return Promise.all(news)
        })
        .catch( msg => { return msg.toString() } )
    })

  return Promise.all( neworders )
}


export const populate = _ => {
  return client.my_orders()
    .then( updateOrderbook )
    .then( getPrices )
    .then( updatePrices )
    .catch( msg => { return msg.toString() } )
}

