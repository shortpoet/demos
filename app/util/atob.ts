export { atob };
function atob(data: string) {
  return JSON.parse(Buffer.from(data, 'base64').toString());
}
