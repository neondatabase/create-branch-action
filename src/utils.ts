const haikuRegex = /^[a-z]+-[a-z]+-[a-z0-9]+$/

export function isBranchId(branchId: string): boolean {
  return branchId.startsWith('br-') && haikuRegex.test(branchId.substring(3))
}

const SSL_MODES = ['require', 'verify-ca', 'verify-full', 'omit']

export function isSSLMode(sslMode: string): boolean {
  return SSL_MODES.includes(sslMode)
}
