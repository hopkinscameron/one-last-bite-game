(function () {
  var cornerSize = 64;
  var cornerTapsToToggle = 5;
  var cornerWindowMilliseconds = 2500;
  var refreshMilliseconds = 250;
  var fpsHistorySeconds = 10;

  var canvas = document.getElementById("unity-canvas");
  var safeArea = document.getElementById("safe-area-probe");
  var active = false;
  var cornerTaps = [];
  var overlay = null;
  var readout = null;
  var browserDot = null;
  var gameDot = null;
  var browserPoint = null;
  var gamePoint = null;
  var gameScreen = null;
  var frames = 0;
  var secondStarted = 0;
  var fpsHistory = [];
  var refreshTimer = 0;

  function element(tag, style) {
    var node = document.createElement(tag);
    node.style.cssText = style;
    return node;
  }

  function dot(color, filled) {
    return element("div", "position:absolute;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50%;box-sizing:border-box;border:3px solid " + color + ";background:" + (filled ? color : "transparent") + ";opacity:0.85;display:none;");
  }

  function build() {
    overlay = element("div", "position:fixed;inset:0;z-index:50;pointer-events:none;");
    readout = element("pre", "position:absolute;left:8px;right:8px;top:38%;margin:0;padding:8px;border-radius:6px;background:rgba(0,0,0,0.78);color:#fff;font:11px/1.35 ui-monospace,Menlo,monospace;white-space:pre-wrap;");
    browserDot = dot("#ff4d4d", false);
    gameDot = dot("#3de0ff", true);
    overlay.appendChild(readout);
    overlay.appendChild(browserDot);
    overlay.appendChild(gameDot);
    document.body.appendChild(overlay);
  }

  function place(node, point) {
    if (!point) {
      node.style.display = "none";
      return;
    }

    node.style.display = "block";
    node.style.left = point.x + "px";
    node.style.top = point.y + "px";
  }

  function round(value) {
    return Math.round(value * 10) / 10;
  }

  function safeInsets() {
    var style = getComputedStyle(safeArea);
    return [style.paddingTop, style.paddingBottom, style.paddingLeft, style.paddingRight].map(function (value) { return round(parseFloat(value) || 0); }).join(" / ");
  }

  function viewportLine() {
    var visual = window.visualViewport;
    if (!visual) {
      return "visual    n/a";
    }

    return "visual    " + round(visual.width) + " x " + round(visual.height) + "  offsetTop " + round(visual.offsetTop) + "  pageTop " + round(visual.pageTop);
  }

  function lowestFps() {
    return fpsHistory.length === 0 ? 0 : Math.min.apply(null, fpsHistory);
  }

  function describe() {
    var rect = canvas.getBoundingClientRect();
    var lines = [
      "touch probe (tap top-left corner 5x to close)",
      "fps       " + (fpsHistory.length ? fpsHistory[fpsHistory.length - 1] : 0) + "  lowest " + fpsHistorySeconds + "s " + lowestFps(),
      "screen    " + screen.width + " x " + screen.height + "  dpr " + window.devicePixelRatio,
      "inner     " + window.innerWidth + " x " + window.innerHeight + "  client " + document.documentElement.clientWidth + " x " + document.documentElement.clientHeight,
      viewportLine(),
      "canvas    top " + round(rect.top) + " left " + round(rect.left) + "  css " + round(rect.width) + " x " + round(rect.height) + "  backing " + canvas.width + " x " + canvas.height,
      "game      " + (gameScreen ? gameScreen.width + " x " + gameScreen.height : "waiting for a press"),
      "safe      T/B/L/R " + safeInsets(),
      "page      scrollY " + round(window.scrollY) + "  standalone " + (navigator.standalone === true),
      "finger    " + (browserPoint ? round(browserPoint.x) + ", " + round(browserPoint.y) : "-") + "  (red ring)",
      "game sees " + (gamePoint ? round(gamePoint.x) + ", " + round(gamePoint.y) : "-") + "  (blue dot)"
    ];
    if (browserPoint && gamePoint) {
      lines.push("offset    x " + round(gamePoint.x - browserPoint.x) + "  y " + round(gamePoint.y - browserPoint.y));
    }

    return lines.join("\n");
  }

  function refresh() {
    if (!active) {
      return;
    }

    readout.textContent = describe();
    place(browserDot, browserPoint);
    place(gameDot, gamePoint);
  }

  function countFrame(time) {
    if (!active) {
      return;
    }

    if (secondStarted === 0) {
      secondStarted = time;
    }

    frames++;
    if (time - secondStarted >= 1000) {
      fpsHistory.push(Math.round(frames * 1000 / (time - secondStarted)));
      if (fpsHistory.length > fpsHistorySeconds) {
        fpsHistory.shift();
      }

      frames = 0;
      secondStarted = time;
    }

    requestAnimationFrame(countFrame);
  }

  function setActive(on) {
    active = on;
    if (!overlay) {
      build();
    }

    overlay.style.display = on ? "block" : "none";
    clearInterval(refreshTimer);
    if (on) {
      frames = 0;
      secondStarted = 0;
      fpsHistory = [];
      refreshTimer = setInterval(refresh, refreshMilliseconds);
      requestAnimationFrame(countFrame);
      refresh();
    }
  }

  function countCornerTap(x, y) {
    if (x > cornerSize || y > cornerSize) {
      cornerTaps = [];
      return;
    }

    var now = Date.now();
    cornerTaps = cornerTaps.filter(function (time) { return now - time < cornerWindowMilliseconds; });
    cornerTaps.push(now);
    if (cornerTaps.length >= cornerTapsToToggle) {
      cornerTaps = [];
      setActive(!active);
    }
  }

  function onPointerDown(event) {
    countCornerTap(event.clientX, event.clientY);
    browserPoint = { x: event.clientX, y: event.clientY };
  }

  function onPointerMove(event) {
    if (event.buttons !== 0 || event.pointerType === "touch") {
      browserPoint = { x: event.clientX, y: event.clientY };
    }
  }

  window.oneLastBiteProbeActive = function () {
    return active;
  };

  window.oneLastBiteProbeGamePoint = function (x, y, width, height) {
    var rect = canvas.getBoundingClientRect();
    gameScreen = { width: width, height: height };
    gamePoint = { x: rect.left + x / width * rect.width, y: rect.top + (1 - y / height) * rect.height };
  };

  window.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });
  window.addEventListener("pointermove", onPointerMove, { capture: true, passive: true });
})();
