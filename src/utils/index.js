import { utils } from 'ethers'

export const gauss = (xx, mu, sig) => {
  if (sig==0) return 1
  return Math.exp(-Math.pow(xx-mu,2)/2/sig/sig)/Math.sqrt(2*Math.PI*sig*sig)
}

const round = (n, decimals = '2') => Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals)

export const myError = (msg, supplemental={}) => Object.assign({err: msg.toString(), msg}, supplemental)

export const sortOrders = (a, b) => {
  let anum = utils.bigNumberify(a.pricepoint)
  let bnum = utils.bigNumberify(b.pricepoint)
  if (anum.gt(bnum)) return 1
  else if (anum.eq(bnum)) return 0
  return -1
}
