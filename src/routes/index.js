import { Router } from 'express'
import * as ampSDK from '../controllers'

export const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Connected!' });
});

router.get('/cancel', (req, res) => {
  ampSDK.cancel()
  res.json({msg: "cancelling all orders"})
});
router.get('/add', (req, res) => {
  ampSDK.add();
  res.json({msg: "adding new orders"})
});

