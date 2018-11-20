import { utils } from 'ethers'
import { orderbook } from 'amp-node-api-client'
import * as binance from './binance'
import { gauss, getPricePoints, myError } from '../utils'


export default function(client) {

  const cancel_all = _ => {
    let cancels = client.my_orders()
      .filter( ele => ele.status!="FILLED" && ele.status!="CANCELLED")
      .map( order => client.cancel_order(order.hash).catch(myError) )

    return Promise.all(cancels)
  }


  const getPricesForPair = pair => {
    return binance.getPrice(pair.baseTokenSymbol)
      .then( price => ({ base: pair.baseTokenAddress, prices: price, quote: pair.quoteTokenAddress}) )
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


  const processOrders = tok => {
    let oldords = getCancelOrdersForPair(tok)
    let newords = getNewOrdersForPair(tok)

    let highestbuy = [...oldords, ...newords]
      .filter( ele => ele.side==='BUY' )
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
        steps.push( ords.filter( ele => ele.side === side ) )
      })
    })

    return steps.reduce( (prom, ords) => {
      return prom.then( list => {
        list.push( ...ords.map( ele => submitOrder(ele) ) )
        return Promise.all(list)
      })
    }, Promise.resolve([]))
  }


  const populate = _ => {
    const poplist = {}
    return client.pairs()
      .reduce( (lastpair, pair) => {
        return lastpair
          .then( _ => getPricesForPair(pair))
          .then(processOrders)
          .catch(myError)
          .then( data => poplist[pair.pairName] = data )
      }, Promise.resolve())
      .then(_=>poplist)
  }

  return { cancel_all, populate }
}
