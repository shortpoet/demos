export { msToTime };

function msToTime(duration: number) {
  const milliseconds = Math.floor((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  let _hours, _minutes, _seconds;
  _hours = hours < 10 ? "0" + hours : hours;
  _minutes = minutes < 10 ? "0" + minutes : minutes;
  _seconds = seconds < 10 ? "0" + seconds : seconds;

  return _hours + "h:" + _minutes + "m:" + _seconds + "." + milliseconds;
}
