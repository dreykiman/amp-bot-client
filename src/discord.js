import bot from './bot'
import client from './models/amp-client'

client.start()
  .then( _ => {
    let subscriptions = client.pairs()
      .map( pair => client.subscribe(pair.baseTokenAddress, pair.quoteTokenAddress)
         .catch(msg=>{throw {err: `can not subscribe to ${pair.pairName}`, msg}}) )
    return Promise.all(subscriptions)
  }).then( _ => {
    console.log(client.my_orders().length)
  }).catch( msg => {
    console.log({err: msg.toString(), msg: msg})
    process.exit()
  })

