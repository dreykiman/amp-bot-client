import client from '../models'
import * as trader from '../models'

export const cancelall = (req, res) => {
  trader.cancel_all()
    .then( data => res.status(200).json(data) )
}

export const cancel = (req, res) => {
  client.cancel_order(req.query.hash)
    .then( data => res.status(200).json(data) )
}


export const addorder = (req, res) => {
  trader.add_order(req.query)
    .then( data => res.status(200).json(data) )
}


export const take = (req, res) => {
  trader.takeAll()
    .then( data => res.status(200).json(data) )
}


export const populate = (req, res) => {
  trader.populate()
    .then( data => res.status(200).json(data) )
}


export const myorders = (req, res) => {
  res.status(200).json(client.my_orders())
}


export const pairs = (req, res) => {
  res.json(client.pairs())
}
