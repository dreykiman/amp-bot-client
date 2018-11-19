import ClientAPI from 'amp-node-api-client'
import { Wallet, getDefaultProvider } from 'ethers'
import keys from '../../keys.json'

let provider = getDefaultProvider('rinkeby')
let wallet = new Wallet(keys.AMP2, provider)

const client = new ClientAPI(wallet)

export default client

