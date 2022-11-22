import isValid from 'date-fns/isValid';
import format from 'date-fns/format';

export function trimAddress(address) {
  if (!address) return address;
  return `${address.slice(0, 10)}...${address.slice(-10)}`;
}

export function formatEther(etherValue) {
  if (!etherValue || Number.isNaN(etherValue)) return etherValue;
  return `Ξ ${etherValue}`;
}

export function formateDateTime(dateString) {
  const date = new Date(dateString);
  if (!isValid(date)) return dateString;
  return format(date, 'MMM dd, yyyy HH:mm');
}
