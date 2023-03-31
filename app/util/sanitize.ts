export { escapeNestedKeys };

function escapeNestedKeys(obj: any, targets: string[]) {
  const escapedObj: Record<any, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (
      targets.some((target) =>
        key.toLowerCase().includes(target.toLowerCase())
      ) &&
      typeof value === "string" &&
      value.length > 8
    ) {
      escapedObj[key] = value.substring(0, 8) + "...";
    } else if (typeof value === "object" && value !== null) {
      escapedObj[key] = escapeNestedKeys(value, targets);
    } else {
      escapedObj[key] = value;
    }
  }
  return escapedObj;
}
