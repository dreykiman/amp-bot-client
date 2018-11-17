function reversePrice(pricepoint) {
  let pricePrecisionMultiplier = 1e9
  let priceMultiplier = ethers.utils.bigNumberify('1000000000') //1e9

  let price = ethers.utils.bigNumberify(pricepoint)
    .mul(ethers.utils.bigNumberify(pricePrecisionMultiplier))
    .div(priceMultiplier)
  return price.toString()/pricePrecisionMultiplier
}

function reverseAmount(amount) {
  let amountPrecisionMultiplier = 1e6
  let amountMultiplier = ethers.utils.bigNumberify('1000000000000000000') //1e18

  amount = ethers.utils.bigNumberify(amount)
    .mul(ethers.utils.bigNumberify(amountPrecisionMultiplier))
    .div(amountMultiplier)
  return amount.toString()/amountPrecisionMultiplier
}

