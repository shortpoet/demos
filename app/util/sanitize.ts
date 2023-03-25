export { escapeRegExp, escapeRegExpWithReplacer, escapeNestedKeys, safeInit };

const safeInit = (init: any) => ({
  ...init,
  headers: {
    ...init.headers,
    Authorization: init.token
      ? `Bearer ${init.token?.substring(0, 7)}...}`
      : null,
  },
  token: init.token ? init.token?.substring(0, 7) : null,
  user: {
    ...init.user,
    token:
      init.user && init.user.token ? init.user?.token?.substring(0, 7) : null,
  },
  body: init.body ? JSON.stringify(init.body).substring(0, 50) : null,
});

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function escapeRegExpWithReplacer(string: string, replacer: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, replacer); // $& means the whole matched string
}

function escapeNestedKeys(obj: any, targets: string[]) {
  const escapedObj: Record<any, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (
      targets.includes(key) &&
      typeof value === 'string' &&
      value.length > 8
    ) {
      escapedObj[key] = value.substring(0, 8) + '...';
    } else if (typeof value === 'object' && value !== null) {
      escapedObj[key] = escapeNestedKeys(value, targets);
    } else {
      escapedObj[key] = value;
    }
  }
  return escapedObj;
}

function escapeNestedKeysGpt(obj: any, targets: string[]) {
  const escapedObj = obj;
  const processedObjects = new Set();
  function escape(obj: any): any {
    if (typeof obj !== 'object' || obj === null || processedObjects.has(obj)) {
      return obj;
    }
    processedObjects.add(obj);
    if (Array.isArray(obj)) {
      return obj.map(escape);
    }
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] =
        targets.includes(key) && typeof value === 'string' && value.length > 8
          ? value.substring(0, 8) + '...'
          : escape(value);
    }
    return result;
  }
  return escape(escapedObj);
}
