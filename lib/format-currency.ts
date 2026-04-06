export function formatCurrency(value: number) {
  const formatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return `$${formatter.format(value)}`
}
