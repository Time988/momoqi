/*
 * Flower drawing and garden atmosphere adapted from Infinite Garden.
 * Copyright © 2026 Christian Maranan / KREI-LABS.
 * Personal, non-commercial adaptation. Original license is retained at
 * ../licenses/garden-LICENSE.md
 * https://github.com/krei-labs/infinite-garden
 *
 * Integration changes confine the original renderer to an in-page canvas,
 * use canvas-local pointer positions and stop drawing outside the viewport.
 */
(() => {
"use strict";
const canvas = document.getElementById("garden-canvas");
let ctx = canvas.getContext("2d");
const mainCtx = ctx;
let background, stems, stemsDirty = true;
let ratio = 1;
let lastDraw = 0;
const stage = document.getElementById("garden-stage");
const status = document.getElementById("garden-status");
const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
let reduceMotion = motionQuery.matches;
let W = 1;
let H = 1;
let CX = 0;
let BASE = 0;
let SC = 1;
const flowers = [];
const fireflies = [];
const START = Date.now();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const easeOut = value => 1 - Math.pow(1 - value, 3);
function getThemeColors() {
  return { c1: "#ef9bb3", c2: "#ffc2cf", c3: "#ffe0cf" };
}
function bezPt(x0,y0, cx1,cy1, cx2,cy2, x1,y1, t) {
  const m = 1-t;
  return [
    m*m*m*x0 + 3*m*m*t*cx1 + 3*m*t*t*cx2 + t*t*t*x1,
    m*m*m*y0 + 3*m*m*t*cy1 + 3*m*t*t*cy2 + t*t*t*y1
  ];
}

function bezAngle(x0,y0, cx1,cy1, cx2,cy2, x1,y1, t) {
  const m = 1-t;
  const dx = 3*m*m*(cx1-x0) + 6*m*t*(cx2-cx1) + 3*t*t*(x1-cx2);
  const dy = 3*m*m*(cy1-y0) + 6*m*t*(cy2-cy1) + 3*t*t*(y1-cy2);
  return Math.atan2(dy, dx);
}

function initFireflies() {
  for (let i = 0; i < 14; i++) {
    fireflies.push({
      x: Math.random() * W,
      y: Math.random() * H,
      angle: Math.random() * Math.PI * 2,
      radius: 50 + Math.random() * 180,
      speed: 0.005 + Math.random() * 0.02,
      size: 2 + Math.random() * 3.5,
      phase: Math.random() * Math.PI * 2,
      targetX: Math.random() * W,
      targetY: Math.random() * H,
      lerpSpeed: 0.001 + Math.random() * 0.003
    });
  }
}


/* ── STARS ────────────────────────────────── */
const STARS = Array.from({length: 90}, () => ({
  x: Math.random(), y: Math.random() * 0.80, r: Math.random() * 1.1 + 0.15,
  phase: Math.random() * Math.PI * 2, speed: 0.022 + Math.random() * 0.038,
  gold: Math.random() < 0.18
}));

const SPARKS = Array.from({length: 16}, () => { const s={}; resetSp(s); s.life=Math.random()*s.max; return s; });
function resetSp(s) {
  s.x = Math.random() * W;
  s.y = BASE - Math.random() * (H * 0.8);
  s.vy = -0.2 - Math.random()*0.5;
  s.life = 0; s.max = 0.6 + Math.random()*0.5; s.sz = 1.2 + Math.random()*2.0;
  s.hue = Math.random()*360;
}

/* ── ENVIRONMENT ─────────────────────────── */
function drawEnvironment() {
  ctx.drawImage(background, 0, 0, W, H);

  STARS.forEach(s => {
    s.phase += s.speed;
    const a = 0.15 + 0.48 * Math.abs(Math.sin(s.phase));
    ctx.beginPath();
    ctx.arc(s.x*W, s.y*H, s.r, 0, Math.PI*2);
    ctx.fillStyle = s.gold ? `rgba(255,215,120,${a})` : `rgba(255,230,230,${a})`;
    ctx.fill();
  });

  SPARKS.forEach(s => {
    s.life += 0.005;
    if (s.life > s.max) resetSp(s);
    const a = Math.sin((s.life/s.max)*Math.PI) * 0.8;
    ctx.beginPath();
    ctx.arc(s.x + Math.sin(s.life*4)*5, s.y + s.vy*s.life*55, s.sz, 0, Math.PI*2);
    ctx.fillStyle = `hsla(${s.hue},100%,82%,${a})`;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  });
  
  // Draw fireflies
  fireflies.forEach(f => {
    // Smooth movement
    f.x += (f.targetX - f.x) * f.lerpSpeed;
    f.y += (f.targetY - f.y) * f.lerpSpeed;
    
    if (Math.random() < 0.001) {
      f.targetX = Math.random() * W;
      f.targetY = Math.random() * H;
    }
    
    f.phase += 0.03;
    const glow = 0.3 + 0.7 * Math.abs(Math.sin(f.phase));
    const colors = getThemeColors();
    
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 200, ${glow * 0.5})`;
    ctx.shadowColor = colors.c1;
    ctx.shadowBlur = 30 * glow;
    ctx.fill();
    
    // Inner glow
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${glow * 0.3})`;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function drawStem(x0,y0, cx1,cy1, cx2,cy2, x1,y1, prog, thick, col) {
  if (prog <= 0) return;
  ctx.beginPath();
  const steps = 48;
  for (let i = 0; i <= steps*prog; i++) {
    const [px,py] = bezPt(x0,y0,cx1,cy1,cx2,cy2,x1,y1, i/steps);
    i === 0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
  }
  ctx.strokeStyle = col; ctx.lineWidth = thick; ctx.lineCap = 'round';
  ctx.shadowColor = col; ctx.shadowBlur = 2; ctx.stroke(); ctx.shadowBlur = 0;
}

// LILY
function drawLilyLeaf(x, y, rot, size, prog) {
  if (prog <= 0) return;
  const s = size * prog;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * 0.15, s * 0.15, s, 0);
  ctx.quadraticCurveTo(s * 0.15, -s * 0.15, 0, 0);
  const lg = ctx.createLinearGradient(0, 0, s, 0);
  lg.addColorStop(0, '#2d5e20'); lg.addColorStop(1, '#509c3c');
  ctx.fillStyle = lg; ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 0.5, 0, s * 0.9, 0);
  ctx.strokeStyle = 'rgba(0, 40, 0, 0.4)'; ctx.lineWidth = s * 0.02; ctx.stroke();
  ctx.restore();
}

function drawLilyFlower(x, y, size, prog, wob, stemAngle) {
  const s = size * prog * 1.6;
  const rot = (stemAngle + Math.PI/2) * 0.3 + wob;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.7);
  pg.addColorStop(0, '#b8e69c'); pg.addColorStop(0.25, '#f5fceb');
  pg.addColorStop(0.8, '#ffffff'); pg.addColorStop(1, '#f2f2f2');

  const drawPetal = (rad, w) => {
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-rad*0.3*w, -rad*0.3, -rad*0.2*w, -rad*0.8, 0, -rad);
    ctx.bezierCurveTo(rad*0.2*w, -rad*0.8, rad*0.3*w, -rad*0.3, 0, 0);
    ctx.fillStyle = pg; ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'; ctx.shadowBlur = 10 * prog; ctx.fill();
    ctx.strokeStyle = 'rgba(100, 150, 80, 0.15)'; ctx.lineWidth = rad*0.015;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(rad*0.02, -rad*0.5, 0, -rad*0.9); ctx.stroke();
  }
  for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate((i * Math.PI*2/3)); drawPetal(s * 0.9, 0.85); ctx.restore(); }
  for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate((i * Math.PI*2/3) + Math.PI/3); ctx.shadowColor='rgba(0,0,0,0.2)'; ctx.shadowBlur=8; drawPetal(s, 1.0); ctx.restore(); }
  ctx.shadowBlur = 0;
  for (let i = 0; i < 6; i++) {
    ctx.save(); ctx.rotate((i * Math.PI*2/6) + Math.PI/6);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s*0.11, -s*0.33, 0, -s*0.55);
    ctx.strokeStyle = '#cce3b6'; ctx.lineWidth = s*0.02; ctx.stroke();
    ctx.translate(0, -s*0.55); ctx.rotate(Math.PI/2 + 0.2);
    ctx.beginPath(); ctx.ellipse(0, 0, s*0.04, s*0.12, 0, 0, Math.PI*2); ctx.fillStyle='#9c3d03'; ctx.fill();
    ctx.restore();
  }
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s*0.65); ctx.strokeStyle='#9dc779'; ctx.lineWidth=s*0.035; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -s*0.65, s*0.04, 0, Math.PI*2); ctx.fillStyle='#7aab4d'; ctx.fill();
  ctx.restore();
}

// ROSE
function drawRoseFlower(x, y, size, prog, wob, stemAngle) {
  const s = size * prog * 1.3;
  const rot = (stemAngle + Math.PI/2) + wob;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = '#ff0033'; ctx.shadowBlur = 18 * prog;
  
  ctx.fillStyle = '#4a000c'; ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-s*0.5, -s*0.1, -s*0.6, -s*0.8, -s*0.35, -s*1.1);
  ctx.quadraticCurveTo(0, -s*1.05, s*0.35, -s*1.1);
  ctx.bezierCurveTo(s*0.6, -s*0.8, s*0.5, -s*0.1, 0, 0); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#730017'; ctx.beginPath(); ctx.moveTo(-s*0.25, -s*0.3); ctx.lineTo(-s*0.25, -s*0.95);
  ctx.quadraticCurveTo(0, -s*1.1, s*0.25, -s*0.95); ctx.lineTo(s*0.25, -s*0.3); ctx.fill();
  ctx.strokeStyle = '#260006'; ctx.lineWidth = s * 0.025; ctx.beginPath();
  ctx.moveTo(-s*0.1, -s*0.95); ctx.quadraticCurveTo(s*0.1, -s*0.8, -s*0.05, -s*0.5); ctx.stroke();
  ctx.fillStyle = '#a60022'; ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-s*0.5, 0, -s*0.6, -s*0.7, -s*0.3, -s*1.0);
  ctx.bezierCurveTo(-s*0.1, -s*0.8, 0, -s*0.5, 0, -s*0.2); ctx.fill();
  ctx.fillStyle = '#d9002d'; ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.bezierCurveTo(s*0.5, 0, s*0.6, -s*0.7, s*0.3, -s*1.0);
  ctx.bezierCurveTo(s*0.1, -s*0.8, 0, -s*0.5, 0, -s*0.2); ctx.fill();
  ctx.fillStyle = '#ff0d3d'; ctx.beginPath(); ctx.moveTo(-s*0.35, -s*0.4);
  ctx.quadraticCurveTo(0, -s*0.15, s*0.35, -s*0.4); ctx.quadraticCurveTo(0, s*0.05, -s*0.35, -s*0.4); ctx.fill();
  ctx.fillStyle = '#ff4d6d'; ctx.beginPath(); ctx.moveTo(-s*0.25, -s*0.35);
  ctx.quadraticCurveTo(0, -s*0.15, s*0.25, -s*0.35); ctx.quadraticCurveTo(0, -s*0.05, -s*0.25, -s*0.35); ctx.fill();
  
  ctx.fillStyle = '#1b6522'; ctx.beginPath(); ctx.moveTo(0, s*0.05);
  ctx.lineTo(-s*0.3, -s*0.1); ctx.lineTo(-s*0.1, -s*0.02); ctx.lineTo(-s*0.4, -s*0.25);
  ctx.lineTo(-s*0.15, -s*0.05); ctx.lineTo(0, -s*0.15); ctx.lineTo(s*0.15, -s*0.05);
  ctx.lineTo(s*0.4, -s*0.25); ctx.lineTo(s*0.1, -s*0.02); ctx.lineTo(s*0.3, -s*0.1); ctx.fill();
  ctx.restore();
}

// SUNFLOWER
function drawSunflowerLeaf(x, y, rot, size, prog) {
  if (prog <= 0) return; const s = size * prog;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s*0.4, s*0.3, s, 0); ctx.quadraticCurveTo(s*0.4, -s*0.3, 0, 0);
  const lg = ctx.createLinearGradient(0, 0, s, 0); lg.addColorStop(0, '#1b6522'); lg.addColorStop(1, '#348f32');
  ctx.fillStyle = lg; ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s*0.5, 0, s*0.9, 0);
  ctx.strokeStyle='rgba(0, 50, 0, 0.4)'; ctx.lineWidth=s*0.03; ctx.stroke();
  ctx.restore();
}

function drawSunflowerFlower(x, y, size, prog, wob, stemAngle) {
  const s = size * prog * 1.5;
  const rot = (stemAngle + Math.PI/2) * 0.4 + wob;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);

  const drawRing = (rad, c, col, off, gl) => {
    ctx.fillStyle = col;
    if(gl){ ctx.shadowColor='#ff8c00'; ctx.shadowBlur=18*prog; } else { ctx.shadowBlur=4; ctx.shadowColor='rgba(0,0,0,0.5)';}
    for(let i=0; i<c; i++){
      ctx.save(); ctx.rotate((i/c)*Math.PI*2 + off);
      ctx.beginPath(); ctx.moveTo(0, -rad*0.1); ctx.quadraticCurveTo(rad*0.2, -rad*0.5, 0, -rad);
      ctx.quadraticCurveTo(-rad*0.2, -rad*0.5, 0, -rad*0.1); ctx.fill();
      ctx.strokeStyle='rgba(210, 100, 0, 0.3)'; ctx.lineWidth=rad*0.015;
      ctx.beginPath(); ctx.moveTo(0, -rad*0.2); ctx.lineTo(0, -rad*0.85); ctx.stroke(); ctx.restore();
    } ctx.shadowBlur=0;
  };
  ctx.fillStyle = '#1b6522';
  for (let i=0; i<16; i++) {
    ctx.save(); ctx.rotate((i/16)*Math.PI*2); ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-s*0.08, -s*0.4); ctx.lineTo(0, -s*0.55); ctx.lineTo(s*0.08, -s*0.4); ctx.fill(); ctx.restore();
  }
  drawRing(s*0.95, 26, '#ffaa00', 0, true);
  drawRing(s*0.85, 26, '#ffd700', Math.PI/26, false);

  ctx.fillStyle='#4a2511'; ctx.beginPath(); ctx.arc(0,0,s*0.42,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#3a3b10'; ctx.beginPath(); ctx.arc(0,0,s*0.33,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#1a1805'; ctx.beginPath(); ctx.arc(0,0,s*0.20,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#6b4412';
  for (let i=0; i<200; i++) {
    const r = Math.sqrt(i)*(s*0.027); if(r > s*0.38) break;
    const a = i*2.39996; ctx.beginPath(); ctx.arc(Math.cos(a)*r, Math.sin(a)*r, s*0.012, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

// TULIP
function drawTulipLeaf(x, y, rot, size, prog) {
  if (prog <= 0) return; const s = size * prog;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(s*0.3, s*0.25, s*0.8, s*0.1, s, 0);
  ctx.bezierCurveTo(s*0.8, -s*0.15, s*0.3, -s*0.25, 0, 0);
  const lg = ctx.createLinearGradient(0, 0, s, 0);
  lg.addColorStop(0, '#2e5441'); lg.addColorStop(0.5, '#4b7a62'); lg.addColorStop(1, '#335e47');
  ctx.fillStyle = lg; ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s*0.5, 0, s*0.9, 0);
  ctx.strokeStyle='rgba(255, 255, 255, 0.08)'; ctx.lineWidth=s*0.03; ctx.stroke();
  ctx.restore();
}

function drawTulipFlower(x, y, size, prog, wob, stemAngle) {
  const s = size * prog * 1.5;
  const rot = (stemAngle + Math.PI/2) * 0.2 + wob;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const pg = ctx.createLinearGradient(0, -s, 0, 0);
  pg.addColorStop(0, '#fce4ec'); pg.addColorStop(0.3, '#f48fb1');
  pg.addColorStop(0.7, '#d81b60'); pg.addColorStop(1, '#7a9650');
  ctx.fillStyle = pg; ctx.shadowColor = 'rgba(255, 105, 180, 0.5)'; ctx.shadowBlur = 15*prog;

  ctx.beginPath(); ctx.moveTo(-s*0.1, 0); ctx.bezierCurveTo(-s*0.35, -s*0.4, -s*0.25, -s*0.95, 0, -s*1.05); ctx.bezierCurveTo(s*0.25, -s*0.95, s*0.35, -s*0.4, s*0.1, 0); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-s*0.4, -s*0.1, -s*0.55, -s*0.7, -s*0.3, -s*0.95); ctx.bezierCurveTo(-s*0.1, -s*0.8, 0, -s*0.4, 0, 0); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(s*0.4, -s*0.1, s*0.55, -s*0.7, s*0.3, -s*0.95); ctx.bezierCurveTo(s*0.1, -s*0.8, 0, -s*0.4, 0, 0); ctx.fill();

  ctx.shadowBlur=5; ctx.shadowColor='rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-s*0.45, -s*0.3, -s*0.45, -s*0.85, -s*0.1, -s*1.0); ctx.bezierCurveTo(0, -s*0.8, s*0.1, -s*0.3, 0, 0); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(s*0.45, -s*0.3, s*0.45, -s*0.85, s*0.1, -s*1.0); ctx.bezierCurveTo(0, -s*0.8, -s*0.1, -s*0.3, 0, 0); ctx.fill();

  const fg = ctx.createLinearGradient(0, -s, 0, 0);
  fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.2, '#ff80ab'); fg.addColorStop(0.7, '#c2185b'); fg.addColorStop(1, '#556b2f');
  ctx.fillStyle = fg;
  ctx.beginPath(); ctx.moveTo(-s*0.15, 0); ctx.bezierCurveTo(-s*0.35, -s*0.4, -s*0.25, -s*0.9, 0, -s*0.95); ctx.bezierCurveTo(s*0.25, -s*0.9, s*0.35, -s*0.4, s*0.15, 0); ctx.fill();
  ctx.strokeStyle='rgba(255, 255, 255, 0.4)'; ctx.lineWidth=s*0.015; ctx.stroke();
  ctx.restore();
}

// GENERIC AESTHETIC
function drawGenericFlower(x, y, size, prog, wob) {
  const s = size * prog;
  const rot = wob;
  const colors = getThemeColors();
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  for (let i = 0; i < 5; i++) {
    ctx.save(); ctx.rotate((i/5)*Math.PI*2 - Math.PI/2);
    ctx.beginPath(); ctx.ellipse(0, -s*0.58, s*0.295, s*0.46, 0, 0, Math.PI*2);
    ctx.fillStyle = i % 2 === 0 ? colors.c1 : colors.c2;
    ctx.shadowColor = colors.c1;
    ctx.shadowBlur = 22*prog; ctx.fill(); ctx.restore();
  }
  const cg = ctx.createRadialGradient(0,0,0, 0,0,s*0.31);
  cg.addColorStop(0, '#fff8d0'); cg.addColorStop(0.42, '#ffcc44'); cg.addColorStop(1, '#ff9922');
  ctx.beginPath(); ctx.arc(0, 0, s*0.29, 0, Math.PI*2); ctx.fillStyle=cg; ctx.shadowColor='#ffcc44'; ctx.shadowBlur=24*prog; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, s*0.10, 0, Math.PI*2); ctx.fillStyle='rgba(255,252,200,0.92)'; ctx.shadowBlur=12*prog; ctx.fill(); ctx.restore();
}

/* ── FLOWER DEFINITIONS ──────────────────── */
const FLOWER_DEFS = {
  lily: { sd: '#234a1c', sl: '#468f3b', leaves: [0.2, 0.5, 0.8] },
  rose: { sd: '#1b6522', sl: '#2caa38', leaves: [] },
  sunflower: { sd: '#164a1a', sl: '#2caa38', leaves: [0.3, 0.6] },
  tulip: { sd: '#365e47', sl: '#518567', leaves: [0.2, 0.4] },
  generic: { sd: '#1b6522', sl: '#2caa38', leaves: [] }
};


// Static paint is cached at the canvas resolution; original drawing paths are unchanged.
function makeLayer(width = W, height = H) {
  const layer = document.createElement("canvas");
  layer.width = Math.ceil(width * ratio);
  layer.height = Math.ceil(height * ratio);
  const paint = layer.getContext("2d");
  paint.setTransform(ratio, 0, 0, ratio, 0, 0);
  return layer;
}
function cacheBackground() {
  background = makeLayer();
  ctx = background.getContext("2d");
  try {
  const bg = ctx.createRadialGradient(CX, H*0.5, 10, CX, H*0.35, H*0.85);
  bg.addColorStop(0, '#221118');
  bg.addColorStop(0.4, '#0e0508');
  bg.addColorStop(0.8, '#040103');
  bg.addColorStop(1, '#000000');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  
  const pool = ctx.createRadialGradient(CX, BASE, 10, CX, BASE-20, W);
  pool.addColorStop(0, 'rgba(40, 20, 10, 0.4)');
  pool.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = pool;
  ctx.fillRect(0, 0, W, H);


  } finally { ctx = mainCtx; }
  stems = makeLayer();
  stemsDirty = true;
}
function drawFoliage(flower, stemProgress) {
    drawStem(flower.bx, flower.by, flower.cp1x, flower.cp1y, flower.cp2x, flower.cp2y,
      flower.tx, flower.ty, stemProgress, flower.thick, flower.sd);
    drawStem(flower.bx, flower.by, flower.cp1x, flower.cp1y, flower.cp2x, flower.cp2y,
      flower.tx, flower.ty, stemProgress, flower.thick * .5, flower.sl);

    flower.leaves.forEach((position, index) => {
      if (stemProgress <= position) return;
      const [x, y] = bezPt(flower.bx, flower.by, flower.cp1x, flower.cp1y,
        flower.cp2x, flower.cp2y, flower.tx, flower.ty, position);
      const angle = bezAngle(flower.bx, flower.by, flower.cp1x, flower.cp1y,
        flower.cp2x, flower.cp2y, flower.tx, flower.ty, position);
      const direction = index % 2 === 0 ? flower.dir : -flower.dir;
      const leafProgress = clamp((stemProgress - position) * 4, 0, 1);
      if (flower.type === "lily") {
        drawLilyLeaf(x, y, angle + (Math.PI / 2.8) * direction, flower.size * 1.5, leafProgress);
      } else if (flower.type === "sunflower") {
        drawSunflowerLeaf(x, y, angle + (Math.PI / 2.5) * direction, flower.size * 1.6, leafProgress);
      } else if (flower.type === "tulip") {
        drawTulipLeaf(x, y, angle + (Math.PI / 8) * direction, flower.size * 2.2, leafProgress);
      }
    });


}
function bloomSprite(flower, progress) {
  // Quantize only the cached bloom growth, retaining the source's shape and colors.
  const step = Math.ceil(progress * 30);
  if (flower.spriteStep === step && flower.sprite) return flower.sprite;
  const side = Math.ceil(flower.size * 6 + 80);
  const sprite = flower.sprite || makeLayer(side, side);
  ctx = sprite.getContext("2d");
  try {
    ctx.clearRect(0, 0, side, side);
    const draw = {lily: drawLilyFlower, rose: drawRoseFlower,
      sunflower: drawSunflowerFlower, tulip: drawTulipFlower, generic: drawGenericFlower}[flower.type];
    draw(side / 2, side / 2, flower.size, step / 30, 0, -Math.PI / 2);
  } finally { ctx = mainCtx; }
  flower.sprite = sprite;
  flower.spriteStep = step;
  flower.spriteSide = side;
  return sprite;
}

let active = false;
let seeded = false;
let frame = 0;

function positionStem(flower) {
  const xSpread = ((flower.tx / W) - 0.5) * Math.min(W * .2, 210);
  flower.bx = CX + xSpread;
  flower.by = BASE;
  flower.cp1x = flower.bx;
  flower.cp1y = BASE - Math.abs(BASE - flower.ty) * .4;
  flower.cp2x = flower.tx - (flower.tx - flower.bx) * .2;
  flower.cp2y = flower.ty + Math.abs(BASE - flower.ty) * .4;
}

function plantAt(x, y, type, delay = 0) {
  const types = Object.keys(FLOWER_DEFS);
  const flowerType = type || types[Math.floor(Math.random() * types.length)];
  const definition = FLOWER_DEFS[flowerType];
  const size = (25 + Math.random() * 17) * SC;
  const flower = {
    type: flowerType,
    tx: clamp(x, size * 1.8, W - size * 1.8),
    ty: clamp(y, 90, BASE - 85),
    size,
    thick: (2.8 + Math.random()) * SC,
    startTime: Date.now() + delay,
    duration: 2400 + Math.random() * 1100,
    wobble: Math.random() * Math.PI * 2,
    sd: definition.sd,
    sl: definition.sl,
    leaves: definition.leaves,
    dir: Math.random() < .5 ? 1 : -1
  };
  positionStem(flower);
  flowers.push(flower);
  if (flowers.length > 32) { flowers.shift(); stemsDirty = true; }
  if (reduceMotion) render();
}

function render(timestamp = 0) {
  if (timestamp && timestamp - lastDraw < 1000 / 30 - .8) {
    frame = requestAnimationFrame(render);
    return;
  }
  lastDraw = timestamp;
  const now = Date.now();
  const time = now - START;
  const growth = flowers.map(f => reduceMotion ? 1 : clamp((now - f.startTime) / f.duration, 0, 1));
  flowers.forEach((flower, index) => {
    if (growth[index] === 1 && !flower.settled) { flower.settled = true; stemsDirty = true; }
  });
  if (stemsDirty) {
    ctx = stems.getContext("2d");
    try {
      ctx.clearRect(0, 0, W, H);
      flowers.forEach(f => { if (f.settled) drawFoliage(f, 1); });
    } finally { ctx = mainCtx; }
    stemsDirty = false;
  }
  ctx.clearRect(0, 0, W, H);
  drawEnvironment();
  ctx.drawImage(stems, 0, 0, W, H);
  flowers.forEach((flower, index) => {
    const progress = growth[index];
    const stemProgress = easeOut(progress);
    const bloomProgress = easeOut(clamp((progress - .5) / .5, 0, 1));
    if (!flower.settled) drawFoliage(flower, stemProgress);
    if (bloomProgress <= 0) return;
    const [x, y] = bezPt(flower.bx, flower.by, flower.cp1x, flower.cp1y,
      flower.cp2x, flower.cp2y, flower.tx, flower.ty, stemProgress);
    const angle = bezAngle(flower.bx, flower.by, flower.cp1x, flower.cp1y,
      flower.cp2x, flower.cp2y, flower.tx, flower.ty, stemProgress);
    const wobble = reduceMotion ? 0 : Math.sin(time * .0013 + flower.wobble) * .05;
    const rotation = (angle + Math.PI / 2) * ({lily:.3, rose:1, sunflower:.4, tulip:.2, generic:0}[flower.type]) + wobble;
    const sprite = bloomSprite(flower, bloomProgress);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
    const side = flower.spriteSide;
    ctx.drawImage(sprite, -side / 2, -side / 2, side, side);
    ctx.restore();
  });
  canvas.dataset.cachedFlowers = flowers.filter(f => f.settled).length;
  if (active && !document.hidden && !reduceMotion) frame = requestAnimationFrame(render);
  else frame = 0;
}

function stop() {
  cancelAnimationFrame(frame);
  frame = 0;
}

function start() {
  if (!active || document.hidden || frame) return;
  render();
}

function resize() {
  const previousWidth = W;
  const previousHeight = H;
  const bounds = stage.getBoundingClientRect();
  W = bounds.width;
  H = bounds.height;
  CX = W / 2;
  BASE = H * .95;
  SC = clamp(Math.min(W / 1050, H / 580), .55, 1);
  ratio = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(W * ratio);
  canvas.height = Math.round(H * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  flowers.forEach((flower) => {
    flower.tx = flower.tx / previousWidth * W;
    flower.ty = flower.ty / previousHeight * H;
    positionStem(flower);
    flower.sprite = null; flower.spriteStep = -1;
  });
  cacheBackground();
  fireflies.length = 0;
  initFireflies();
  stop();
  if (active) start();
}

canvas.addEventListener("click", (event) => {
  const bounds = canvas.getBoundingClientRect();
  plantAt((event.clientX - bounds.left) * W / bounds.width, (event.clientY - bounds.top) * H / bounds.height);
  status.textContent = "一朵花，在你点到的地方开了";
});

document.getElementById("plant-flower").addEventListener("click", () => {
  plantAt(W * (.24 + Math.random() * .52), H * (.25 + Math.random() * .36));
  status.textContent = "又为你种下了一朵花";
});

resize();
new ResizeObserver(resize).observe(stage);
const visibility = new IntersectionObserver(([entry]) => {
  active = entry.isIntersecting;
  if (active && !seeded) {
    seeded = true;
    plantAt(W * .38, H * .48, "lily");
    plantAt(W * .51, H * .3, "generic", 280);
    plantAt(W * .64, H * .45, "tulip", 550);
  }
  if (active) start();
  else stop();
}, { threshold: .1 });
visibility.observe(stage);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
  else start();
});
motionQuery.addEventListener("change", (event) => {
  reduceMotion = event.matches;
  stop();
  start();
});
})();
