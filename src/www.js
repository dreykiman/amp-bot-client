import express from 'express'
import rp from 'request-promise-native'

let app = express()
app.use(express.static('public'))

app.get('/api/pairs', (req, res) =>  {
  return rp('http://ampapi:8081/pairs', {json: true})
    .then( data => {
      data.data.forEach( ele => {
        ele.pairName = `${ele.baseTokenSymbol}/${ele.quoteTokenSymbol}`
      })
      res.send(data.data)
    })
})


app.get('/api/trades/poloniex', (req, res) =>  {
  rp('https://poloniex.com/public?command=returnTradeHistory&currencyPair='+pair, { json: true })
    .then(res.status(200).json(data.data))
})


app.get('/api/trades/binance', (req, res) =>  {
  return rp('https://api.binance.com/api/v1/trades?symbol='+pair, { json: true })
    .then(res.status(200).json(data.data))
})


app.listen(3000, () => console.log('App listening on port 3000') )

