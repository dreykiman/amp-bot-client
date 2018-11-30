import { utils } from 'ethers'
import { orderbook, amputils } from 'amp-node-api-client'
import * as binance from './binance'
import { gauss, myError } from '../utils'


export default function(client) {

  const cancel_all = _ => {
    let cancels = client.my_orders()
      .filter( ele => ele.status!="FILLED" && ele.status!="CANCELLED")
      .map( order => client.cancel_order(order.hash).catch(myError) )

    return Promise.all(cancels)
  }


  const getPricesForPair = pair => {
    return binance.getETHPrice()
      .then(ethprice => {
        let scale = ethprice
        if (pair.quoteTokenSymbol=="WETH") scale = 1
        return binance.getPrice(pair.baseTokenSymbol+'ETH')
          .then( price => {
            price = price.map(pr => ({dev: pr.dev*scale, ave: pr.ave*scale}))
            return { base: pair.baseTokenAddress, prices: price, quote: pair.quoteTokenAddress, quoteDec: pair.quoteTokenDecimals, quoteSym: pair.quoteTokenSymbol }
        })
      })
  }


  const getCancelOrdersForPair = tok => {
    let myorders = Object.values(orderbook)
      .filter( ord => ord.status!="CANCELLED" && ord.status!="FILLED" )
    let cancels = myorders.filter( ord => ord.baseToken === tok.base && ord.quoteToken === tok.quote)

    return cancels
  }


  const getNewOrdersForPair = tok => {
    let orders = []

    let midprice = (tok.prices[0].ave + tok.prices[1].ave)/2.0
    let buystart = Math.min(midprice * 0.98, tok.prices[0].ave)
    let sellstart = Math.max(midprice * 1.02, tok.prices[1].ave)
    let dev = Math.max(tok.prices[0].dev, tok.prices[1].dev)

    let starts = [buystart, sellstart]

    starts.forEach( (start, ind) => {
      let dir = ind === 0 ? -1 : 1
      let fee = client.takeFee[tok.quoteSym]

      let steps = [0.1, 0.2, 0.4, 0.6, 0.8, 1]
      steps.forEach( step => {
        step += (Math.random()*2-1) * 0.05

        let xx = start + dir * step * dev

        let minAmount = 5 * client.makeFee[tok.quoteSym]/Math.pow(10, tok.quoteDec)/xx

        orders.push({
          amount: minAmount * ( 1 + step*step ),
          price: xx,
          pricepoint: amputils.getPricePoints(xx, tok.quoteDec).toString(),
          userAddress: client.wallet.address,
          exchangeAddress: client.exchangeAddress,
          makeFee: client.makeFee[tok.quoteSym],
          takeFee: client.takeFee[tok.quoteSym],
          side: ["BUY", "SELL"][ind],
          baseTokenAddress: tok.base,
          quoteTokenAddress: tok.quote
        })
      })
    })

/*
    let mid = amputils.getPricePoints(tok.prices[0].ave, tok.quoteDec).add(amputils.getPricePoints(tok.prices[1].ave, tok.quoteDec)).div(2)
    // tok.prices -> 2 elements array [buy, sell] structures of price {ave, dev} 
    tok.prices.forEach( (price, ind) => {
      [-1.5,-1,0,1,1.5].filter( ds => {
        let xx = amputils.getPricePoints(price.ave + ds*price.dev, tok.quoteDec)
        // ind===0 = BUY
        return ind===0 ? xx.add(2).lt(mid) : xx.sub(2).gt(mid)
      })
      .forEach( ds => {
        let xx = price.ave + ds * price.dev

        let fee = client.makeFee[tok.quoteSym]
        let maxAmount = 20*client.makeFee[tok.quoteSym]/Math.pow(10, tok.quoteDec)/xx

        orders.push({
          amount: maxAmount/(ds*ds+1),
          price: xx,
          pricepoint: amputils.getPricePoints(xx, tok.quoteDec).toString(),
          userAddress: client.wallet.address,
          exchangeAddress: client.exchangeAddress,
          makeFee: client.makeFee[tok.quoteSym],
          takeFee: client.takeFee[tok.quoteSym],
          side: ["BUY", "SELL"][ind],
          baseTokenAddress: tok.base,
          quoteTokenAddress: tok.quote
        })
      })
    })
*/
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
    if (oldords.filter( ele => ele.side==='BUY' ).length>0 && 'hash' in highestbuy) seq.reverse()

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


  const populate = pair => {
    const poplist = {}
    let pairs = client.pairs()
    if (pair!=null) pairs = pairs.filter(ele => ele.pairName == pair)

    return pairs.reduce( (lastpair, pair) => {
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
