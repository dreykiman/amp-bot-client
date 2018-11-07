import ClientAPI from 'amp-node-api-client'
import fs from 'fs'
import { Wallet, getDefaultProvider } from 'ethers'

let keys = JSON.parse(fs.readFileSync("keys", "utf8"))
let provider = getDefaultProvider('rinkeby')
let wallet = new Wallet(keys.AMP2, provider)

const client = new ClientAPI(wallet)

export default client

