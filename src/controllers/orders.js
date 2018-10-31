import { utils, Wallet, getDefaultProvider } from 'ethers';
import rp from 'request-promise-native'
import ampMessages from 'amp-node-api-client';
import ws from './server'

var myResolves = {}
let myOrders = {}


let privateKey = 
let provider = getDefaultProvider('rinkeby');
let wallet = new Wallet(privateKey, provider)


const cancelPromise = (hash) => {
  return new Promise( (res, rej) => {
    myResolves[hash] = res
  })
}



ws.onmessage = (ev) => {
  let data = JSON.parse(ev.data)
  if (data.event && myResolves[data.event.hash] && data.event.type=="ORDER_CANCELLED") {
//    console.log("order cancelled: "+data.event.hash)
    myResolves[data.event.hash]()
    delete myResolves[data.event.hash]
  }
}


export const cancelOrders = (token) => {
    let orders = new ampMessages.Orders(wallet);
    return myOrders[token] ? myOrders[token]
         .map( hash => orders.cancel_order(hash)
                       .then( ord => {
                          ws.send(JSON.stringify(ord))
                          return ord.event.payload.orderHash
                       }).then( hash => {
                          cancelPromise(hash) 
                       }).catch( err=> {
                          console.log(err)
                       }) ) : []


  }




export  const newOrder = async (opts) => {
    let orders = new ampMessages.Orders(wallet);
    Object.keys(opts).forEach( kk => orders[kk] = opts[kk] )
  
    orders.exchangeAddress = "0x2e3fd05f73ed36c9f90999e9ecd3b120ce4900f8"
    orders.userAddress = wallet.address
  
    orders.amount = "1"
    orders.makeFee = "0"
    orders.takeFee = "0"
  
    let cancels = cancelOrders(orders.baseTokenAddress)
  
    Promise.all(cancels).then( () => {
      orders.new_order().then( (ord) => {
//        console.log("sending new order request for "+orders.baseTokenAddress+" "+orders.price+" "+orders.amount)
        ws.send(JSON.stringify(ord))
      })
    })
    .catch (err => console.log(err))
  }
  
  
export const getMyOrders = async () => rp("http://13.125.100.61:8081/orders?address=" + wallet.address, {json: true})
                              .then( data => data.data.filter( ele => ele.status!="CANCELLED" && ele.status!="FILLED" ))
                              .then( data => data.reduce( (acc, ele) => {
                                  if (!(ele.baseToken in acc))
  						      acc[ele.baseToken] = []
       						   acc[ele.baseToken].push(ele.hash)
                                  return acc
                                }, {}))
                              .then(acc => {
//                                console.log("ACELL###############")
//                                console.log(acc)
                                myOrders = acc
                              }).catch( err => {console.log("ERROR")})

export { myOrders }
