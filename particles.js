/* ==========================================================
   Noah's Kitty Adventure — particles.js
   Lightweight pooled particle system for sparkles, leaves,
   collection bursts and celebration confetti.
   ========================================================== */

class ParticleSystem {
  constructor(maxParticles = 220){
    this.max = maxParticles;
    this.pool = [];
    for (let i=0;i<this.max;i++){
      this.pool.push({active:false});
    }
  }

  _get(){
    for (const p of this.pool){ if (!p.active) return p; }
    return this.pool[0]; // reuse oldest if pool exhausted
  }

  spawnBurst(x, y, opts = {}){
    const count = opts.count || 10;
    for (let i=0;i<count;i++){
      const p = this._get();
      const angle = Math.random() * Math.PI * 2;
      const speed = (opts.speed || 120) * (0.4 + Math.random()*0.8);
      p.active = true;
      p.x = x; p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - (opts.upBias || 60);
      p.life = 0;
      p.maxLife = (opts.life || 0.7) * (0.7 + Math.random()*0.6);
      p.size = (opts.size || 5) * (0.7 + Math.random()*0.7);
      p.color = opts.color || '#ffe083';
      p.gravity = opts.gravity ?? 400;
      p.shape = opts.shape || 'circle';
      p.rot = Math.random()*Math.PI*2;
      p.rotSpeed = (Math.random()-0.5) * 6;
    }
  }

  spawnLeaf(x, y){
    const p = this._get();
    p.active = true;
    p.x = x; p.y = y;
    p.vx = -20 - Math.random()*30;
    p.vy = 20 + Math.random()*20;
    p.life = 0;
    p.maxLife = 4 + Math.random()*3;
    p.size = 6 + Math.random()*4;
    p.color = Math.random() > 0.5 ? '#a8d98a' : '#ffd08a';
    p.gravity = 6;
    p.shape = 'leaf';
    p.rot = Math.random()*Math.PI*2;
    p.rotSpeed = (Math.random()-0.5)*2;
    p.sway = Math.random()*Math.PI*2;
  }

  update(dt){
    for (const p of this.pool){
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife){ p.active = false; continue; }
      if (p.shape === 'leaf'){
        p.sway += dt*2;
        p.x += (p.vx + Math.sin(p.sway)*20) * dt;
        p.y += p.vy * dt;
      } else {
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      p.rot += p.rotSpeed * dt;
    }
  }

  draw(ctx, camX, camY){
    for (const p of this.pool){
      if (!p.active) continue;
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x - camX, p.y - camY);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 'circle'){
        ctx.beginPath();
        ctx.arc(0,0,p.size,0,Math.PI*2);
        ctx.fill();
      } else if (p.shape === 'star'){
        drawStarPath(ctx, 0,0, p.size, p.size*0.45, 5);
        ctx.fill();
      } else if (p.shape === 'leaf'){
        ctx.beginPath();
        ctx.ellipse(0,0,p.size, p.size*0.55, 0, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

function drawStarPath(ctx, cx, cy, outerR, innerR, points){
  ctx.beginPath();
  for (let i=0;i<points*2;i++){
    const r = (i % 2 === 0) ? outerR : innerR;
    const a = (Math.PI / points) * i - Math.PI/2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath();
}
