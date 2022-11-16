export function trimAddress(address) {
  return `${address.slice(0, 10)}...${address.slice(-10)}`;
}

export function formatEther(etherValue) {
  return `Ξ ${etherValue}`;
}
