function Point(x, y) {
  this.x = x;
  this.y = y;
}

function Line(m, b) {
  this.m = m;
  this.b = b;
}

function Circle(p, r) {
  this.p = p;
  this.r = r;
}

function slope(p1, p2) {
  return (p2.y - p1.y) / (p2.x - p1.x);
}

function linesIntersection(l1, l2) {
  var x = (l2.b - l1.b) / (l1.m - l2.m);
  var y = l1.m * x + l1.b;
  return new Point(x, y);
}

function lineCircleIntersection(l, c) {
  var qA = Math.pow(l.m, 2) + 1;
  var qB = 2 * (l.m * l.b - l.m * c.p.y - c.p.x);
  var qC = Math.pow(c.p.y, 2) - Math.pow(c.r, 2) + Math.pow(c.p.x, 2) - 2 * l.b * c.p.y + Math.pow(l.b, 2);
  var xs = quadratic(qA, qB, qC);
  return [new Point(xs[0], l.m * xs[0] + l.b), new Point(xs[1], l.m * xs[1] + l.b)];
}

// http://paulbourke.net/geometry/circlesphere/
function circleCircleIntersection(c1, c2) {
  var d = distance(c1.p, c2.p);
  var a = (Math.pow(c1.r, 2) - Math.pow(c2.r, 2) + Math.pow(d, 2)) / (2 * d);
  var h = Math.sqrt(Math.pow(c1.r, 2) - Math.pow(a, 2));
  var p2x = c1.p.x + a * (c2.p.x - c1.p.x) / d;
  var p2y = c1.p.y + a * (c2.p.y - c1.p.y) / d;
  var p2 = new Point(p2x, p2y);
  var p3a = new Point(p2.x + h * (c2.p.y - c1.p.y) / d, p2.y - h * (c2.p.x - c1.p.x) / d);
  var p3b = new Point(p2.x - h * (c2.p.y - c1.p.y) / d, p2.y + h * (c2.p.x - c1.p.x) / d);
  return [p3a, p3b];
}

function distance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// handle edge case where radii is same...
function externalHomotheticCenter(c1, c2) {
  var x = (-c2.r / (c1.r - c2.r)) * c1.p.x + (c1.r / (c1.r - c2.r)) * c2.p.x;
  var y = (-c2.r / (c1.r - c2.r)) * c1.p.y + (c1.r / (c1.r - c2.r)) * c2.p.y;
  return new Point(x, y);
}

function quadratic(a, b, c) {
  var q = Math.sqrt(Math.pow(b, 2) - 4 * a * c);
  return [(-b + q) / (2 * a), (-b - q) / (2 * a)];
}

// line through two points
function l2p(p1, p2) {
  var m = slope(p1, p2);
  var b = p1.y - (m * p1.x);
  return new Line(m, b);
}

// points tangent to circle from point
function ltcp(p, c) {
  // get vector d from point to center of circle
  var d = (c.p.x < p.x ? -1 : 1) * distance(p, c.p);
  // get vector l from point to tangent points
  var l = (c.p.x < p.x ? -1 : 1) * Math.sqrt(Math.pow(d, 2) - Math.pow(c.r, 2));
  var phi = Math.asin((c.p.y - p.y) / d);
  var tht = Math.acos(l / d);
  // case 1
  var p1 = new Point(l * Math.cos(phi - tht) + p.x, l * Math.sin(phi - tht) + p.y);
  // case 2
  var p2 = new Point(l * Math.cos(phi + tht) + p.x, l * Math.sin(phi + tht) + p.y);
  return [p1, p2];
}

// line of perpendicular bisector of two points
function lpb2p(p1, p2) {
  var midpoint = new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
  var m = -1 / slope(p1, p2);
  var b = midpoint.y - (m * midpoint.x);
  return new Line(m, b);
}

function approxEqual(v1, v2) {
  return Math.abs(v1 - v2) < 1e-6;
}

function midpoint(p1, p2) {
  return new Point(0.5 * (p2.x - p1.x) + p1.x, 0.5 * (p2.y - p1.y) + p1.y);
}

// circle that goes through 3 points
function c3p(p1, p2, p3) {
  // avoid undefined perpendicular bisector line
  var a1 = p1;
  var a2 = p2.y !== p1.y ? p2 : p3;
  var b1 = p2.y !== p3.y ? p2 : p1;
  var b2 = p3;
  var l1 = lpb2p(a1, a2);
  var l2 = lpb2p(b1, b2);
  var p = linesIntersection(l1, l2);
  return new Circle(p, distance(p, p1));
}


function apolloniusPCC(p, c1, c2) {
  // find intersection of external tangents
  var h = externalHomotheticCenter(c1, c2);
  // draw a line from intersection to known point
  var l = l2p(p, h);

  // find tangent points on circle
  var tp1s = ltcp(h, c1);
  // select point closest to known point
  var tp1 = distance(p, tp1s[0]) < distance(p, tp1s[1]) ? tp1s[0] : tp1s[1];

  // find tangent points on circle
  var tp2s = ltcp(h, c2);
  // select point closest to known point
  var tp2 = distance(p, tp2s[0]) < distance(p, tp2s[1]) ? tp2s[0] : tp2s[1];

  // construct new circle from three points
  var c0 = c3p(p, tp1, tp2);
  // find intersecting points from line crossing through intersection of tangents
  var p0s = lineCircleIntersection(l, c0);
  // reduce to two points and one circle
  return [p0s[0], p0s[1], c1];
}

function apolloniusPPC(p1, p2, c) {
  // construct circle that intersects both points and circle twice
  var c0 = c3p(p1, p2, c.p);
  // draw a line through known points
  var l1 = l2p(p1, p2);
  // find intersecting points on circle-circle intersection
  var p0s = circleCircleIntersection(c0, c);
  // draw a line through circle intersections
  var l2 = l2p(p0s[0], p0s[1]);
  // find intersection of both lines
  var h = linesIntersection(l1, l2);
  // find tangent points from intersection on known circle
  var tp0s = ltcp(h, c);
  // select point closest to a known point
  // *** WARNING *** this assumption fails on certain impacts outside of the triangle area
  var tp0 = distance(p1, tp0s[0]) < distance(p1, tp0s[1]) ? tp0s[0] : tp0s[1];
  return [p1, p2, tp0];
}

function findTarget(p, c1, c2) {
  var resultA = apolloniusPCC(p, c1, c2);
  var resultB = apolloniusPPC(resultA[0], resultA[1], resultA[2]);
  var c = c3p(resultB[0], resultB[1], resultB[2]);
  return c.p;
}

/*

potential issue with circles of same radii as a homothetic center can't be calculated for these
this case suggests the impact landed perfectly between two mics that are being tested

another potential issue is drawing a vertical line on the coordinate system

another edge case when the apollonius PCC intersection with homothetic center is tangent to circle, but this is unlikely

*/
