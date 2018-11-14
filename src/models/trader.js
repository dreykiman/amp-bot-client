import { utils } from 'ethers'
import { orderbook } from 'amp-node-api-client'
import client from './amp-client'
import * as binance from './binance'
import { gauss, getPricePoints, myError } from '../utils'


export const add_order = query => {
  let ord = {
    amount: 0.001,
    price: 0.001,
    userAddress: "0xf2934427c36ba897f9be6ed554ed2dbce3da1c68",
    exchangeAddress: "0x344F3B8d79C0A516b43651e26cC4785b07fb6aA1",
    makeFee: 0,
    takeFee: 0,
    side: "BUY",
    baseTokenAddress: "0x194f4ec528eba59c3b73b05af044e97bc11c292a",
    quoteTokenAddress: "0xa3f9eacdb960d33845a4b004974feb805e05c4a9",
  }
  Object.assign(ord, query)

  return client.new_order(ord)
    .catch(myError)
    .then(console.log)
}


export const cancel_all = _ => {
  let cancels = client.my_orders()
    .filter( ele => ele.status!="FILLED" && ele.status!="CANCELLED")
    .map( order => {
      return client.cancel_order(order.hash)
        .catch(myError)
    })

  return Promise.all(cancels)
}



const getPricesForPair = pair => {
  return binance.getPrice(pair.baseTokenSymbol)
    .then( price => {
      return { base: pair.baseTokenAddress, prices: price, quote: pair.quoteTokenAddress}
    })
}


const getCancelOrdersForPair = tok => {
  let myorders = Object.values(orderbook)
    .filter( ord => ord.status!="CANCELLED" && ord.status!="FILLED" )
  let cancels = myorders.filter( ord => ord.baseToken === tok.base)

  return cancels
}


const getNewOrdersForPair = tok => {
  let mid = getPricePoints(tok.prices[0].ave).add(getPricePoints(tok.prices[1].ave)).div(2)
  let orders = []

  tok.prices.forEach( (price, ind) => {
    [-2,-1.5,-1,-0.5,0,0.5,1,1.5,2].filter( ds => {
      let xx = getPricePoints(price.ave + ds*price.dev)
      return ind===0 ? xx.add(2).lt(mid) : xx.sub(2).gt(mid)
    })
    .forEach( ds => {
      let xx = price.ave + ds*price.dev
      let yy = gauss(xx, price.ave, price.dev)

      orders.push({
        amount: 0.01*yy/gauss(price.ave, price.ave, price.dev)/xx,
        price: xx,
        pricepoint: getPricePoints(xx).toString(),
        userAddress: client.wallet.address,
        exchangeAddress: "0x344F3B8d79C0A516b43651e26cC4785b07fb6aA1",
        makeFee: 0,
        takeFee: 0,
        side: ["BUY", "SELL"][ind],
        baseTokenAddress: tok.base,
        quoteTokenAddress: tok.quote
      })
    })
  })

  return orders
}



const submitOrder = ord => {
  ord.time = Date.now()
  if ('hash' in ord) {
    return client.cancel_order(ord.hash)
      .then( cancelled => {
        cancelled.time = Date.now()
        return cancelled
      })
  }

  return client.new_order(ord)
    .then( added => {
      added.time = Date.now()
      return added
    })

}


const prepOrders = pair => {
  return getPricesForPair(pair)
    .then( tok => {
      let oldords = getCancelOrdersForPair(tok)
      let newords = getNewOrdersForPair(tok)

      let highestbuy = [...oldords, ...newords]
        .filter(ele=>ele.side==='BUY')
        .reduce( (high, ord) => {
          let a = utils.bigNumberify(high.pricepoint)
          let b = utils.bigNumberify(ord.pricepoint)
          if (b.gt(a)) high = ord
          return high
        }, {pricepoint: 0} )

      // if highestbuy in new orders
      let seq = ['SELL', 'BUY']
      // if highestbuy in old orders
      if ('hash' in highestbuy) seq.reverse()

      let steps = []
      seq.forEach( side => {
        [newords, oldords].forEach( ords => {
          steps.push( ords.filter(ele=>ele.side === side) )
        })
      })

      return steps.reduce( (prom, ords) => {
        return prom.then( _ => {
          let list = ords.map(ele => submitOrder(ele)
                                       .catch( msg => { throw myError(msg, {list: ordlist, order: ord}) }) )
          return Promise.all(list)} )
      }, Promise.resolve())

    }).catch(myError)
}
 
export const populate = _ => {
  return client.pairs()
    .reduce( (lastpair, pair) => {
      return lastpair.then( _ => {
        return prepOrders(pair)
      })
    }, Promise.resolve())
    .catch(myError)
}

