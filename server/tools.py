import math

class Point(object):
    def __init__(self, x, y):
        self.x = x
        self.y = y

class Line(object):
    def __init__(self, m, b):
        self.m = m
        self.b = b

class Circle(object):
    def __init__(self, p, r):
        self.p = p
        self.r = r

def slope(p1, p2):
    return (p2.y - p1.y) / (p2.x - p1.x)

def lines_intersection(l1, l2):
    x = (l2.b - l1.b) / (l1.m - l2.m)
    y = l1.m * x + l1.b
    return Point(x, y)

def line_circle_intersection(l, c):
    qA = l.m ** 2 + 1
    qB = 2 * (l.m * l.b - l.m * c.p.y - c.p.x)
    qC = c.p.y ** 2 - c.r ** 2 + c.p.x ** 2 - 2 * l.b * c.p.y + l.b ** 2
    xs = quadratic(qA, qB, qC)
    return (Point(xs[0], l.m * xs[0] + l.b), Point(xs[1], l.m * xs[1] + l.b))

def circle_circle_intersection(c1, c2):
    d = distance(c1.p, c2.p)
    a = (c1.r ** 2 - c2.r ** 2 + d ** 2) / (2 * d)
    h = math.sqrt(c1.r ** 2 - a ** 2)
    p2x = c1.p.x + a * (c2.p.x - c1.p.x) / d
    p2y = c1.p.y + a * (c2.p.y - c1.p.y) / d
    p2 = Point(p2x, p2y)
    p3a = Point(p2.x + h * (c2.p.y - c1.p.y) / d, p2.y - h * (c2.p.x - c1.p.x) / d)
    p3b = Point(p2.x - h * (c2.p.y - c1.p.y) / d, p2.y + h * (c2.p.x - c1.p.x) / d)
    return (p3a, p3b)
    
def distance(p1, p2):
    return math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)

def external_homothetic_center(c1, c2):
    x = (-c2.r / (c1.r - c2.r)) * c1.p.x + (c1.r / (c1.r - c2.r)) * c2.p.x
    y = (-c2.r / (c1.r - c2.r)) * c1.p.y + (c1.r / (c1.r - c2.r)) * c2.p.y
    return Point(x, y)

def quadratic(a, b, c):
    q = math.sqrt(b ** 2 - 4 * a * c)
    return ((-b + q) / (2 * a), (-b - q) / (2 * a))

def l2p(p1, p2):
    '''Line through two points'''
    m = slope(p1, p2)
    b = p1.y - (m * p1.x)
    return Line(m, b)

def ltcp(p, c):
    '''Points tangent to circle from point'''
    d = (-1 if c.p.x < p.x else 1) * distance(p, c.p)
    l = (-1 if c.p.x < p.x else 1) * math.sqrt(d ** 2 - c.r ** 2)
    phi = math.asin((c.p.y - p.y) / d)
    tht = math.acos(l / d)

    p1 = Point(l * math.cos(phi - tht) + p.x, l * math.sin(phi - tht) + p.y)
    p2 = Point(l * math.cos(phi + tht) + p.x, l * math.sin(phi + tht) + p.y)
    return (p1, p2)

def lpb2p(p1, p2):
    '''Line of perpendicular bisector of two points'''
    midpoint = Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2)
    m = -1 / slope(p1, p2)
    b = midpoint.y - (m * midpoint.x)
    return Line(m, b)

def approx_equal(v1, v2):
    return math.fabs(v1 - v2) < 1e-6

def midpoint(p1, p2):
    return Point(0.5 * (p2.x - p1.x) + p1.x, 0.5 * (p2.y - p1.y) + p1.y)

def c3p(p1, p2, p3):
    '''Circle through 3 points'''
    a1 = p1
    a2 = p2 if p2.y != p1.y else p3
    b1 = p2 if p2.y != p3.y else p1
    b2 = p3
    l1 = lpb2p(a1, a2)
    l2 = lpb2p(b1, b2)
    p = lines_intersection(l1, l2)
    return Circle(p, distance(p, p1))

def apollonius_pcc(p, c1, c2):
    h = external_homothetic_center(c1, c2)
    l = l2p(p, h)
    tp1s = ltcp(h, c1)
    tp1 = tp1s[0] if distance(p, tp1s[0]) < distance(p, tp1s[1]) else tp1s[1]
    tp2s = ltcp(h, c2)
    tp2 = tp2s[0] if distance(p, tp2s[0]) < distance(p, tp2s[1]) else tp2s[1]
    c0 = c3p(p, tp1, tp2)
    p0s = line_circle_intersection(l, c0)
    return (p0s[0], p0s[1], c1)

def apollonius_ppc(p1, p2, c):
    c0 = c3p(p1, p2, c.p)
    l1 = l2p(p1, p2)
    p0s = circle_circle_intersection(c0, c)
    l2 = l2p(p0s[0], p0s[1])
    h = lines_intersection(l1, l2)
    tp0s = ltcp(h, c)
    tp0 = tp0s[0] if distance(p1, tp0s[0]) < distance(p1, tp0s[1]) else tp0s[1]
    c1 = c3p(p1, p2, tp0s[0])
    c2 = c3p(p1, p2, tp0s[1])
    return (p1, p2, tp0)

def find_target(p, c1, c2):
    try:
        result_a = apollonius_pcc(p, c1, c2)
        result_b = apollonius_ppc(*result_a)
    except ValueError:
        return None

    c = c3p(*result_b)
    return c.p
