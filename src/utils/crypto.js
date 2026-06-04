// Implements base64(SHA-256(plaintext)) over the raw 32-byte digest — confirmed server format
export async function hashPassword(plaintext) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(plaintext)
  )
  let bin = ''
  new Uint8Array(buf).forEach(b => (bin += String.fromCharCode(b)))
  return btoa(bin)
}
