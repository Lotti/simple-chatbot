export function clone(value) {
  if (Array.isArray(value)) {
    return value.slice(0);
  } else if (typeof value === 'object') {
    return JSON.parse(JSON.stringify(value));
  } else {
    return value;
  }
}

export function avg(...args) {
  let sum = 0;
  for (const a of args) {
    sum += a;
  }
  return sum / args.length;
}
