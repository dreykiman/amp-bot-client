import { Router } from 'express'
import * as ampSDK from '../controllers'

export const router = Router();

router.get('/orders', (req, res) => {
  let trader = new ampSDK.Trader()
  trader.my_orders()
    .then( data => {
       res.status(200).json(data)
    })
});

