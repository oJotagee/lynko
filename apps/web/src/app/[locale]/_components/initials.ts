export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .filter((_, index, words) => index === 0 || index === words.length - 1)
    .join('')
    .toUpperCase()
}
