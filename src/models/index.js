import ClientAPI from 'amp-node-api-client'
import { Wallet, getDefaultProvider } from 'ethers'
import keys from '../../keys.json'
import Trader from './trader'

let provider = getDefaultProvider('rinkeby')
let wallet = new Wallet(keys.AMPmaker, provider)

const client = new ClientAPI(wallet)
const trader = Trader(client)

export { client, trader }
