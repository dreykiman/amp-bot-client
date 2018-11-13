import { utils } from 'ethers'

export const gauss = (xx, mu, sig) => {
  if (sig==0) return 1
  return Math.exp(-Math.pow(xx-mu,2)/2/sig/sig)/Math.sqrt(2*Math.PI*sig*sig)
}

const round = (n, decimals = '2') => Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals)


export const getPricePoints = price => {
  let pricePrecisionMultiplier = 1e9
  let priceMultiplier = utils.bigNumberify('1000000000') //1e6
  price = round(price * pricePrecisionMultiplier, 0)

  return utils
    .bigNumberify(price)
    .mul(priceMultiplier)
    .div(utils.bigNumberify(pricePrecisionMultiplier))
 }

export const myError = (msg, supplemental={}) => Object.assign({err: msg.toString(), msg: msg}, supplemental)
