import rp from 'request-promise-native'
import ampMessages from 'amp-node-api-client'
import { myOrders, getMyOrders, newOrder, cancelOrders } from './orders'


const calculateAveragePrice = (acc, val) => {
  if(acc.total<10){
    acc.total += parseFloat(val[0])*parseFloat(val[1])
    acc.amount += parseFloat(val[1])
  }
  return acc
}


const cancel = async () => {
  let pairs = await rp("http://13.125.100.61:8081/pairs", { json: true })
  await getMyOrders()
//  console.log("cancel ##########################")
//  console.log(myOrders)

  for (const pair of pairs.data.slice(0,20)) {
    cancelOrders(pair.baseTokenAddress)
  }
}



const add = async () => {
  let pairs = await rp("http://13.125.100.61:8081/pairs", { json: true })
  await getMyOrders()

  for (const pair of pairs.data.slice(0,20)) {
    rp('https://api.binance.com/api/v1/depth?symbol='+pair.baseTokenSymbol+'ETH', { json: true })
      .then( data => {
        if (data.bids.length > 0) {
          let prices = ['bids', 'asks'].map( name => {
            let res = data[name].reduce( calculateAveragePrice, {total: 0, amount: 0} )
            return res.total/res.amount
          })

            let sides = ["BUY", "SELL"]
            sides.forEach( (side, ind) => {
              let opts = { baseTokenAddress: pair.baseTokenAddress,
                           quoteTokenAddress: "0xe9b5da78abb9fda785f828836f5c7e7f20273779",
                           side: side,
                           amount: 0.05/prices[ind],
                           price: prices[ind] }
              newOrder(opts).catch((err) =>{
                          console.log(err)
                          console.log("#######################################################")
              })
            })
        }
      })
      .catch( () => {} )
  }
}

//run()
//cancel()

export {add, cancel}
