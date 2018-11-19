import express from 'express'
import router from './routes'

import client from './models/amp-client'

let app = express()
app.use('/api', router)

client.start()
  .then( _ => {
    let subscriptions = client.pairs()
      .map( pair => client.subscribe(pair.baseTokenAddress, pair.quoteTokenAddress)
         .catch( msg => {throw {err: `can not subscribe to ${pair.pairName}`, msg}} ) )
    return Promise.all(subscriptions)
  }).then( _ => {
    app.listen(5000, () => {
      console.log('App listening on port 5000')
    })
  }).catch( msg => {
    console.log(msg)
    process.exit()
  })

