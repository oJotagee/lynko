const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

export function formatPrice(amount: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount / 100)
}

export function formatDate(value: string) {
  return dateFormat.format(new Date(value))
}
