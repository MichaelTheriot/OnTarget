window.onload = () => {

  function cSvg(e) {
    return document.createElementNS('http://www.w3.org/2000/svg', e);
  }

  var svg = document.querySelector('svg');

  var width = 500;
  var height = 500;

  var g1 = cSvg('g');
  var c1 = cSvg('circle');
  var c2 = cSvg('circle');
  var c3 = cSvg('circle');

  [c1, c2, c3].forEach((c, i) => {
    c.setAttribute('cx', width / 2);
    c.setAttribute('cy', height / 2);
    c.setAttribute('r', (Math.min(width, height) / 6) * (i + 1));
    g1.appendChild(c);
  });

  g1.setAttribute('fill', 'none');
  g1.setAttribute('stroke', '#000');

  //svg.appendChild(g1);

  var g2 = cSvg('g');
  var l1 = cSvg('line');
  var l2 = cSvg('line');

  [l1, l2].forEach((l, i) => {
    l.setAttribute('x1', [0, width / 2][i]);
    l.setAttribute('x2', [width, width / 2][i]);
    l.setAttribute('y1', [height / 2, 0][i]);
    l.setAttribute('y2', [height / 2, height][i]);
    g2.appendChild(l);
  });

  g2.setAttribute('stroke', '#000');

  svg.appendChild(g2);

  // algorithm functions

  var drawTime = (function () {
    var timeout = -5;
    return function () {
      if(++timeout < 0) {
        return 0;
      }
      return timeout * 1;
    };
  })();

  function SvgPoint(x, y, h) {
    if(arguments[0] instanceof Point) {
      return SvgPoint(arguments[0].x, arguments[0].y, arguments[1]);
    }
    var c = cSvg('circle');
    c.setAttribute('cx', x + width / 2);
    c.setAttribute('cy', -y + height / 2);
    c.setAttribute('r', 2);
    c.setAttribute('fill', h || '#000');
    setTimeout(() => svg.appendChild(c), drawTime());
    return new Point(x, y);
  }

  function SvgLine(m, b, h) {
    if(arguments[0] instanceof Line) {
      return SvgLine(arguments[0].m, arguments[0].b, arguments[1]);
    }
    var l = cSvg('line');
    l.setAttribute('x1', 0);
    l.setAttribute('x2', width);
    l.setAttribute('y1', -(-width / 2 * m + b) + height / 2);
    l.setAttribute('y2', -(width / 2 * m + b) + height / 2);
    l.setAttribute('stroke', h || '#f00');
    setTimeout(() => svg.appendChild(l), drawTime());
    return new Line(m, b);
  }

  function SvgCircle(p, r, h) {
    if(arguments[0] instanceof Circle) {
      return SvgCircle(arguments[0].p, arguments[0].r, arguments[1]);
    }
    var c = cSvg('circle');
    c.setAttribute('cx', p.x + width / 2);
    c.setAttribute('cy', -p.y + height / 2);
    c.setAttribute('r', r);
    c.setAttribute('fill', 'none');
    c.setAttribute('stroke', h || '#000');
    setTimeout(() => svg.appendChild(c), drawTime());
    return new Circle(p, r);
  }

  // algorithm...

  function ran(min, max) {
    return Math.random() * (max - min) + min;
  }

  (function () {
    var p = [SvgPoint(-3, -1, '#00f'), SvgPoint(0, -4, '#00f'), SvgPoint(2, -2, '#00f')];

    var i = SvgPoint(ran(-2, 2), ran(0, 4), '#0f0');
    //var i = SvgPoint(0, 0, '#0f0');
    //var i = SvgPoint(-29.092, -29.863258, '#0f0');
    //var i = SvgPoint(40.17, 45, '#0f0');
    // case FOR < check
    //var i = {x: -24.74460476078093, y: -93.2647452224046};
    // failed coordinate
    //var i = SvgPoint(500, 250, '#0f0');
    // couples with the following coordinate
    //var i = SvgPoint(51.48815396556745, 12.840492800100836, '#0f0');

    var dis = p.map(p => distance(p, i));
    var mdx = dis.reduce((best, value, idx) => value < dis[best] ? idx : best, 0);

    SvgCircle(i, dis[mdx], '#0f0');
    var far = p.filter((v, idx) => idx !== mdx);
    var c = (() => {
      var arr = [];
      dis.forEach((d, idx) => idx !== mdx && arr.push(SvgCircle(p[idx], d - dis[mdx])));
      return arr;
    })();
    var h = SvgPoint(externalHomotheticCenter(c[0], c[1]), '#f00');
    var l = SvgLine(l2p(p[mdx], h));
    var tp1s = ltcp(h, c[0]).map(SvgPoint);
    tp1s.forEach(p => SvgLine(l2p(p, h)));
    var tp2s = ltcp(h, c[1]).map(SvgPoint);
    // this is a potentially dangerous assumption that should be investigated
    var tp1 = SvgPoint(distance(p[mdx], tp1s[0]) < distance(p[mdx], tp1s[1]) ? tp1s[0] : tp1s[1], '#f0f');
    tp2s.forEach(p => SvgLine(l2p(p, h), '#f00'));
    // this is a potentially dangerous assumption that should be investigated
    var tp2 = SvgPoint(distance(p[mdx], tp2s[0]) < distance(p[mdx], tp2s[1]) ? tp2s[0] : tp2s[1], '#f0f');
    var c0 = SvgCircle(c3p(p[mdx], tp1, tp2));
    var p0s = lineCircleIntersection(l, c0).map(p => SvgPoint(p, '#f0f'));
    c0 = SvgCircle(c3p(p0s[0], p0s[1], c[0].p));
    var l1 = SvgLine(l2p(p0s[0], p0s[1]));
    var p1s = circleCircleIntersection(c0, c[0]).map(SvgPoint);
    l2 = SvgLine(l2p(p1s[0], p1s[1]));
    h = SvgPoint(linesIntersection(l1, l2));
    var tp0s = ltcp(h, c[0]).map(SvgPoint);
    tp0s.forEach(p => SvgLine(l2p(p, h)));
    // the following assumption fails on certain coordinates outside of the triangle's area
    //var tp0 = SvgPoint(distance(p0s[1], tp0s[0]) < distance(p0s[1], tp0s[1]) ? tp0s[0] : tp0s[1], '#f0f');
    /*var c = (function (p, pA, pB) {
      var t = c3p(p0s[0], p0s[1], distance(p0s[1], tp0s[0]) < distance(p0s[1], tp0s[1]) ? tp0s[0] : tp0s[1]);
      // two potential circles
      var c1 = SvgCircle(c3p(p0s[0], p0s[1], pA), '#f0f');
      var c2 = SvgCircle(c3p(p0s[0], p0s[1], pB), '#f0f');
      // impact circle CANNOT encompass other two circles
      var c1Outside = distance(c1.p, c[0].p) >= c1.r && distance(c1.p, c[1].p) >= c1.r;
      var c2Outside = distance(c2.p, c[0].p) >= c2.r && distance(c2.p, c[1].p) >= c2.r;
      // impact circle radius + mic circle radius = distance mic -> impact
      var c1Distanced = approxEqual(c[0].r + c1.r, distance(c1.p, c[0].p)) && approxEqual(c[1].r + c1.r, distance(c1.p, c[1].p));
      var c2Distanced = approxEqual(c[0].r + c2.r, distance(c2.p, c[0].p)) && approxEqual(c[1].r + c2.r, distance(c2.p, c[1].p));
      console.log(c1Outside, c1Distanced, t.p.x === c1.p.x && t.p.y === c1.p.y);
      console.log(c2Outside, c2Distanced, t.p.x === c2.p.x && t.p.y === c2.p.y);
      window.point = i;
      return c1Outside && c1Distanced && t.p.x === c1.p.x && t.p.y === c1.p.y ? c1 : c2;
    })(p[mdx], tp0s[0], tp0s[1]);*/
    var c1 = SvgCircle(c3p(p0s[0], p0s[1], tp0s[0]), '#f0f');
    var c2 = SvgCircle(c3p(p0s[0], p0s[1], tp0s[1]), '#f0f');
    if(distance(c1.p, c[0].p) >= c1.r && distance(c1.p, c[1].p) >= c1.r
    && approxEqual(c[0].r + c1.r, distance(c1.p, c[0].p)) && approxEqual(c[1].r + c1.r, distance(c1.p, c[1].p))
    && distance(c2.p, c[0].p) >= c2.r && distance(c2.p, c[1].p) >= c2.r
    && approxEqual(c[0].r + c2.r, distance(c2.p, c[0].p)) && approxEqual(c[1].r + c2.r, distance(c2.p, c[1].p))) {
      window.p = i;
      console.log(i, c1, c2);
      throw new Error();
    }
    var fc = SvgCircle(c3p(p0s[0], p0s[1], distance(p0s[1], tp0s[0]) < distance(p0s[1], tp0s[1]) ? tp0s[0] : tp0s[1]));
    p = SvgPoint(fc.p);

    var g3 = cSvg('g');
    g3.setAttribute('style', 'font-family: monospace; font-size: 9px;');

    var text = cSvg('text');
    text.textContent = 'calc: ' + fc.p.x + ',' + fc.p.y;
    text.setAttribute('x', 4);
    text.setAttribute('y', 24);
    g3.appendChild(text);

    var text2 = cSvg('text');
    text2.textContent = 'real: ' + i.x + ',' + i.y;
    text2.setAttribute('style', 'font-size: 9px');
    text2.setAttribute('x', 4);
    text2.setAttribute('y', 12);
    g3.appendChild(text2);

    svg.appendChild(g3);
    setTimeout(() => window.location.reload(), drawTime());
  })();

};

/*

math errors
---
radii equal
200, 150

logic errors
500,250
250,150
200,50
120,50
105,50

x: -14.882656233385205, y: -82.2604083456099
x: 16.31594388745725, y: -99.75331919267774
x: 69.32838945649564, y: 17.638676101341844
x: -61.48464358411729, y: 8.86787106283009
x: 27.99535379745066, y: -91.72165431082249
x: -24.74460476078093, y: -93.2647452224046

*/
