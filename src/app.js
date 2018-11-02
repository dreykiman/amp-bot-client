import express from 'express'
import { router } from './routes'

let app = express()
app.use(express.static('public'))

app.use('/api', router);

app.listen(3000, () => {
  console.log('App listening on port 3000');
});

