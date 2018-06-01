module.exports = {
  products: {
    write: 'ownerOnly'
  },
  attributes: {
    write: 'ownerOnly'
  },
  reviews: {
    write: 'ownerOnly'
  },
  carts: {
    read: 'ownerOnly',
    write: 'ownerOnly'
  },
  subscribes: {}
}