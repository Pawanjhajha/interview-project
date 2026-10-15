const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' })

export const formatPrice = (value) => formatter.format(value)
