// Random id for one checkout attempt. getRandomValues also works on plain-http pages, unlike randomUUID.
export const createId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')
