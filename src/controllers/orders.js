import { utils, Wallet, getDefaultProvider } from 'ethers';
import rp from 'request-promise-native'
import ampMessages from 'amp-node-api-client';
import ws from './server'

var myResolves = {}
let myOrders = {}

let privateKey = "0x4f1320c9d2c4b8f5afbadb96adf3122af67814e8a79d7753281eca5d45d8abae" // AMP1
privateKey = "0x207dadbadd624708a257b593710ba103184c76b843d975969d4193d57954b5cd" // AMP2
let provider = getDefaultProvider('rinkeby');
let wallet = new Wallet(privateKey, provider)


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
                                myOrders = acc
                              }).catch( err => {console.log("ERROR")})

