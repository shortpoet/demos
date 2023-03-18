import $ from "jquery";

export { ConsoleOptions, AuthConsole, HTMLConsole };

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
  options: ConsoleOptions
) {
  this.ele = $(options.selector);
  this.data = [];
  var _this = this;
  var data;
  if ((data = localStorage.getItem("consoleData"))) {
    data = JSON.parse(data);
    data.forEach(function (d: any) {
      _this.dumpCallback(d.error ? d : null, d.error ? null : d);
    });
  }
} as any as { new (options: ConsoleOptions): AuthConsole };

HTMLConsole.prototype.clear = function () {
  this.data = [];
  this.ele.html("");
  localStorage.removeItem("consoleData");
};

HTMLConsole.prototype.dumpCallback = function (err: any, data: any) {
  if (err) {
    return this.dump(err, "error");
  }
  if (data && data.error) {
    return this.dump(data, "error");
  }
  if (data) {
    return this.dump(data);
  }
};

HTMLConsole.prototype.dump = function (o: any, className: string) {
  className = className || "";

  this.data.push(o);
  localStorage.setItem("consoleData", JSON.stringify(this.data));

  function replacer(key: any, value: any) {
    if (typeof value === "object") {
      return value;
    }
    return "<span>" + value + "</span>";
  }

  var plainStr = JSON.stringify(o).substr(0, 50);
  var str = JSON.stringify(o, replacer, 4);
  var html =
    '<details class="' +
    className +
    '">' +
    "<summary>" +
    plainStr +
    "</summary>" +
    "<p>" +
    str +
    "</p>" +
    "</details>";

  this.ele.append(html);

  this.ele.find("details").removeAttr("open");
  this.ele.find("details").last().attr("open", true);
};
