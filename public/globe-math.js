export function insideRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x, y] = ring[i], [px, py] = ring[j];
    if ((y > lat) !== (py > lat) && lon < (px - x) * (lat - y) / (py - y) + x) inside = !inside;
  }
  return inside;
}
export function project(x, y, z, angle, radius, cx, cy) {
  const rx = x * Math.cos(angle) + z * Math.sin(angle);
  const rz = z * Math.cos(angle) - x * Math.sin(angle);
  return { x: cx + rx * radius, y: cy + y * radius, z: rz };
}
export function canAnimate(reduced, hidden, visible, paused) {
  return !reduced && !hidden && visible && !paused;
}
export function orbitPoint(t, index) {
  const tilt = [-.48,.52,-.08][index];
  const x = Math.cos(t)*1.42, y = Math.sin(t)*.46, z = Math.sin(t)*1.34;
  return {x:x*Math.cos(tilt)-y*Math.sin(tilt),y:x*Math.sin(tilt)+y*Math.cos(tilt),z};
}
export function behindGlobe(p) {
  const r2 = p.x*p.x+p.y*p.y;
  return r2 < 1 && p.z < Math.sqrt(1-r2);
}
