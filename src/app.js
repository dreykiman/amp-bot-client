import express from 'express'
import router from './routes'

import { client } from './models'

let app = express()
app.use(express.static('public'))
app.use('/api', router)

const init = _ => client.start()
  .then( _ => {
    let subscriptions = client.pairs()
      .map( pair => client.subscribe(pair.baseTokenAddress, pair.quoteTokenAddress)
         .catch( msg => {throw {err: `can not subscribe to ${pair.pairName}`, msg}} ) )
    return Promise.all(subscriptions)
  })

init().then( _ => {
    app.listen(5000, () => {
      console.log('App listening on port 5000')
    })
  }).catch( msg => {
    console.log(msg)
    process.exit()
  })


/*
const reconnect = _ => {
  client.ws.once('close', _ => {
    console.log('attempt to reconnect')
    client.ws.reopen()
    client.ws.once('open', _ => {
      init().then(reconnect)
    })
  })
}

reconnect()
*/
