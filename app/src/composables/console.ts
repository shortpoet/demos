import $ from 'jquery';
import { writeUserData } from '~/pages/auth0/index.page.vue';

export { ConsoleOptions, AuthConsole, HTMLConsole, useConsole };

interface ConsoleOptions {
  selector: string;
}

interface AuthConsole extends Console {
  ele: JQuery;
  data: any[];
  dumpCallback: (err: any, data: any) => void;
  dump: (o: any, className?: string) => void;
}

//
// [typing this](https://stackoverflow.com/a/43624326/12658653)
const HTMLConsole = function HTMLConsole(
  this: AuthConsole,
  options: ConsoleOptions,
) {
  this.ele = $(options.selector);
  this.data = [];
  var _this = this;
  var data;
  console.log('HTMLConsole');
  if ((data = localStorage.getItem('consoleData'))) {
    data = JSON.parse(data);
    data.forEach(function (d: any) {
      _this.dumpCallback(d.error ? d : null, d.error ? null : d);
    });
  }
} as any as { new (options: ConsoleOptions): AuthConsole };

HTMLConsole.prototype.clear = function () {
  this.data = [];
  this.ele.html('');
  localStorage.removeItem('consoleData');
};

HTMLConsole.prototype.dumpCallback = function (err: any, data: any) {
  if (err) {
    // console.log('dumpCallback.err', err);
    return this.dump(err, 'error');
  }
  if (data && data.error) {
    // console.log('dumpCallback.data.error', data.error);
    return this.dump(data, 'error');
  }
  if (data) {
    // console.log('dumpCallback.data', data);
    return this.dump(data, 'user-profile');
  }
};

function mask(obj: any, key: string) {
  if (Object.keys(obj).includes(key)) {
    if (!!obj[key]) obj[key] = obj[key].substring(0, 7) + '...';
  }
}

HTMLConsole.prototype.dump = function (o: any, className: string) {
  // console.log('dump', o, className);
  className = className || '';
  this.data.push(o);

  localStorage.setItem('consoleData', JSON.stringify(this.data));

  function replacer(key: any, value: any) {
    if (typeof value === 'object') {
      return value;
    }
    return '<span>' + value + '</span>';
  }

  const logObj = JSON.parse(JSON.stringify(o));
  mask(logObj, 'accessToken');
  mask(logObj, 'access_token');
  mask(logObj, 'idToken');
  mask(logObj, 'id_token');
  mask(logObj, 'refreshToken');
  mask(logObj, 'token');
  mask(logObj, 'state');

  if (Object.keys(logObj).includes('idTokenPayload')) {
    if (!!o.idTokenPayload) {
      o.idTokenPayload.sid = o.idTokenPayload.sid.substring(0, 7) + '...';
      o.idTokenPayload.nonce = o.idTokenPayload.nonce.substring(0, 7) + '...';
      o.idTokenPayload.at_hash =
        o.idTokenPayload.at_hash.substring(0, 7) + '...';
      o.idTokenPayload.aud = o.idTokenPayload.aud.substring(0, 7) + '...';
    }
  }

  var plainStr = JSON.stringify(logObj).substr(0, 50);
  var str = JSON.stringify(logObj, replacer, 4);
  var html =
    '<details class="' +
    className +
    '">' +
    '<summary>' +
    plainStr +
    '</summary>' +
    '<p>' +
    str +
    '</p>' +
    '</details>';

  this.ele.append(html);

  this.ele.find('details').removeAttr('open');
  this.ele.find('details').last().attr('open', true);
  if (o.nickname) {
    writeUserData(o);
  }
  return this.data;
};

const useConsole = (selector: string) => {
  const htmlConsole = new HTMLConsole({ selector });
  return { htmlConsole };
};
