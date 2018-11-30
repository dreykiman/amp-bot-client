import rp from 'request-promise-native'

const calcAveragePrice = (tot, val) => {
  if(tot.total<10){
    tot.total += parseFloat(val[0])*parseFloat(val[1])
    tot.amount += parseFloat(val[1])
  }
  return tot
}


const calcStandardDeviation = (tot, val) => {
  if(tot.total<100){
    tot.total += parseFloat(val[0])*parseFloat(val[1])
    tot.dev += Math.pow( parseFloat(val[0]) - tot.ave, 2 ) * parseFloat(val[1])
    tot.amount += parseFloat(val[1])
  }
  return tot
}


const getPriceRange = data => {
  let liq = data.reduce( calcAveragePrice, {total: 0, amount: 0} )

  let ave = liq.total/liq.amount
  let dev = data.reduce( calcStandardDeviation, {total: 0, dev: 0, ave, amount: 0} )
  dev = Math.sqrt( dev.dev/(dev.amount-1) )

  return {dev, ave}
}


export const getPrice = token => {
  return rp('https://api.binance.com/api/v1/depth?symbol='+token, { json: true })
    .then( data => {
      if (data.bids.length > 0) {
        return ['bids', 'asks'].map( name => getPriceRange( data[name] ))
      }
      throw { err: `no data available for specified token: https://api.binance.com/api/v1/depth?symbol=${token}ETH ` }
    })
}

export const getETHPrice = _ => {
  return rp('https://api.binance.com/api/v1/depth?symbol=ETHUSDT', { json: true })
    .then( data => (Number(data.bids[0][0]) + Number(data.asks[0][0]))/2 )
}
