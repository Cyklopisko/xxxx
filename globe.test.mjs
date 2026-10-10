import test from 'node:test';
import assert from 'node:assert/strict';
import {insideRing,project,canAnimate,orbitPoint,behindGlobe} from './public/globe-math.js';
import points from './public/globe-points.js';
test('precomputed globe loads complete finite points on the unit sphere',()=>{
 assert.ok(points.length>10000);
 for(const p of points) {assert.equal(p.length,3);assert.ok(p.every(Number.isFinite));assert.ok(Math.abs(Math.hypot(...p)-1)<.00002);}
});
test('land classification distinguishes inside and outside a polygon',()=>{
 const ring=[[0,0],[10,0],[10,10],[0,10],[0,0]];
 assert.equal(insideRing(5,5,ring),true);assert.equal(insideRing(15,5,ring),false);
});
test('rotation preserves sphere radius and rotates front point to edge',()=>{
 const p=project(0,0,1,Math.PI/2,100,200,200);
 assert.equal(p.x,300);assert.equal(p.y,200);assert.ok(Math.abs(p.z)<1e-10);
});
test('each suspension condition stops the loop',()=>{
 assert.equal(canAnimate(false,false,true,false),true);
 for(const args of [[true,false,true,false],[false,true,true,false],[false,false,false,false],[false,false,true,true]]) assert.equal(canAnimate(...args),false);
});
test('orbital paths hide behind the sphere but remain visible in front and outside',()=>{
 assert.equal(behindGlobe({x:0,y:0,z:-1.4}),true);
 assert.equal(behindGlobe({x:0,y:0,z:1.4}),false);
 assert.equal(behindGlobe({x:1.42,y:0,z:-1}),false);
 for(let i=0;i<3;i++) {
   assert.equal(behindGlobe(orbitPoint(Math.PI*1.5,i)),true);
   assert.equal(behindGlobe(orbitPoint(Math.PI*.5,i)),false);
 }
});
