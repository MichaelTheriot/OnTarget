// fix size, adding impacts while zoomed in

function TargetArea(radius, numMics, layers) {
  // "private" property support for old browsers
  this._radius = radius;
  this._numMics = numMics;
  this._layers = layers;
  this._padding = this._radius / 84;
  this._impacts = [];
  this._zoom = 0;

  // create actual DOM element
  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 ' + (radius * 2 + this._padding * 2) + ' ' + (radius * 2 + this._padding * 2));

  // create group element to hold layers
  var lg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  lg.setAttribute('data-group', 'layers');
  lg.setAttribute('stroke', '#000');
  //lg.setAttribute('stroke-width', this._radius / 512 * (1 - this._zoom));
  lg.setAttribute('fill', 'none');

  // add circles to layer group
  for(var i = 1; i <= layers; i++) {
    var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', radius + this._padding);
    c.setAttribute('cy', radius + this._padding);
    c.setAttribute('r', radius * i / layers);
    lg.appendChild(c);
  }

  // create group element to hold crosshair
  var cg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  cg.setAttribute('data-group', 'crosshair');
  cg.setAttribute('stroke', '#000');
  //cg.setAttribute('stroke-width', this._radius / 512 * (1 - this._zoom));
  //cg.setAttribute('stroke-dasharray', 0.5);

  // add crosshairs to crosshair group
  var hrz = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  hrz.setAttribute('x1', this._padding);
  hrz.setAttribute('y1', this._padding + radius);
  hrz.setAttribute('x2', this._padding + radius * 2);
  hrz.setAttribute('y2', this._padding + radius);
  cg.appendChild(hrz);
  var vrt = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  vrt.setAttribute('x1', this._padding + radius);
  vrt.setAttribute('y1', this._padding);
  vrt.setAttribute('x2', this._padding + radius);
  vrt.setAttribute('y2', this._padding + radius * 2);
  cg.appendChild(vrt);

  // create group element to hold nodes
  var mg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  mg.setAttribute('data-group', 'nodes');

  // add mics to node group
  for(var i = 0; i < numMics; i++) {
    var m = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    var theta = 2 * Math.PI * i / numMics - Math.PI / 2;
    m.setAttribute('cx', Math.cos(theta) * radius + radius + this._padding);
    m.setAttribute('cy', Math.sin(theta) * radius + radius + this._padding);
    //m.setAttribute('r', this._padding * (1 - this._zoom));
    mg.appendChild(m);
  }

  // create group element to hold impacts
  var ig = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  ig.setAttribute('data-group', 'impacts');

  // add groups to container
  svg.appendChild(lg);
  svg.appendChild(cg);
  svg.appendChild(mg);
  svg.appendChild(ig);

  this._svg = svg;
  this._lg = lg;
  this._cg = cg;
  this._mg = mg;
  this._ig = ig;

  // add panning
  this._offX = 0;
  this._offY = 0;

  var cx = 0;
  var cy = 0;

  var panningHandler = (function (event) {
    this._offX = cx - event.x;
    this._offY = cy - event.y;
    this.redraw();
  }).bind(this);

  svg.addEventListener('mousedown', (function (event) {
    event.preventDefault();
    cx = event.x;
    cy = event.y;
    this.redraw(); // remove
    window.addEventListener('mousemove', panningHandler);
  }).bind(this));

  svg.addEventListener('mouseup', function (event) {
    event.preventDefault();
    window.removeEventListener('mousemove', panningHandler);
  });

  svg.addEventListener('wheel', (function (event) {
    event.preventDefault();
    this.scroll(event.deltaY);
  }).bind(this));
  window.test = this;
  this.scroll(0);
}

Object.defineProperties(TargetArea.prototype, {
  dom: {
    get: function () {
      return this._svg;
    }
  },
  padding: {
    get: function () {
      return this._padding;
    }
  },
  radius: {
    get: function () {
      return this._radius;
    }
  }
});

TargetArea.prototype.clear = function () {
  this._impacts.forEach((i) => {
    i.dom.g.parentNode.removeChild(i.dom.g);
    i.dom.c.parentNode.removeChild(i.dom.c);
    i.dom.n.parentNode.removeChild(i.dom.n);
  });
  this._impacts = [];
};

TargetArea.prototype.addImpact = function (x, y, time) {
  var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('data-id', this._impacts.length + 1);
  var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('cx', x + this.padding + this.radius);
  c.setAttribute('cy', -y + this.padding + this.radius);
  c.setAttribute('r', calcR(this));
  var n = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  n.setAttribute('x', calcX(this, x));
  n.setAttribute('y', calcY(this, y));
  n.setAttribute('font-size', calcFS(this));
  n.setAttribute('fill', '#000');
  n.textContent = this._impacts.length + 1;
  g.appendChild(n);
  g.appendChild(c);
  this._impacts.push({
    x: x,
    y: y,
    time: time,
    dom: {
      g: g,
      c: c,
      n: n
    }
  });
  this._ig.appendChild(g);
  return c;
};

TargetArea.prototype.scroll = function (delta) {
  this._zoom = Math.max(-1, Math.min(92/100, this._zoom - delta / 1000));
  this.redraw();
};

TargetArea.prototype.redraw = function () {
  var x = this._zoom * (this.radius + this._padding) + this._offX;
  var y = this._zoom * (this.radius + this._padding) + this._offY;
  var b = (this.radius * 2 + this.padding * 2) * (1 - 1 * this._zoom);
  this._lg.setAttribute('stroke-width', this._radius / 512 * (1 - this._zoom));
  this._cg.setAttribute('stroke-width', this._radius / 512 * (1 - this._zoom));
  for(var impact of this._impacts) {
    impact.dom.c.setAttribute('r', calcR(this));
    impact.dom.n.setAttribute('font-size', calcFS(this));
    impact.dom.n.setAttribute('x', calcX(this, impact.x));
    impact.dom.n.setAttribute('y', calcY(this, impact.y));
  }
  for(var e = this._mg.firstChild; e; e = e.nextSibling) {
    e.setAttribute('r', this._padding * (1 - this._zoom));
  }
  this.dom.setAttribute('viewBox', x + ' ' + y + ' ' + b + ' ' + b);
};

TargetArea.prototype.pan = function (x, y) {
  
};

var calcR = (svg) => svg._radius / 112 * (1 - svg._zoom);
var calcFS = (svg) => (1 / svg._radius) * (1 - svg._zoom);
var calcX = (svg, x) => x + svg.padding + svg.radius + (0.25 / svg._radius) * (1 - svg._zoom);
var calcY = (svg, y) => -y + svg.padding + svg.radius - (0.25 / svg._radius) * (1 - svg._zoom);
