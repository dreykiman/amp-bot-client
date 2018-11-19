import express from 'express'
import rp from 'request-promise-native'

let app = express()
app.use(express.static('public'))

app.get('/api/pairs', (req, res) =>  {
  return rp('http://ampapi:8081/pairs', {json: true})
    .then( data => data.data.filter(ele => ele.quoteTokenSymbol === 'WETH' ) )
    .then( data => {
      data.forEach( ele => {
        ele.pairName = `${ele.baseTokenSymbol}/${ele.quoteTokenSymbol}`
      })
      res.send(data)
    })
})

app.listen(3000, () => console.log('App listening on port 3000') )

