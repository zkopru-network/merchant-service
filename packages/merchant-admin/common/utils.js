export function trimAddress(address) {
  return `${address.slice(0, 10)}...${address.slice(-10)}`;
}
