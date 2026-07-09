/* ==========================================================
   Noah's Kitty Adventure — renderer.js
   Draws sky, parallax forest, ground, decorations, collectibles,
   the flag, and Luna the kitten — all with canvas primitives
   (no external image assets required).
   ========================================================== */

const Renderer = {
  canvas: null,
  ctx: null,
  camX: 0,
  camY: 0,
  dpr: 1,
  viewW: 960,
  viewH: 540,
  time: 0,

  init(canvas){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = canvas.parentElement || document.body;
    this.resize();

    // Plain resize still matters (e.g. desktop window drag).
    window.addEventListener('resize', ()=>this.resize());

    // ResizeObserver reacts to the *actual* container box changing size,
    // which is more reliable than the 'resize' event alone on iOS Safari
    // (the event can fire before Safari finishes settling the new
    // viewport height/width after a rotation).
    if (window.ResizeObserver){
      this._ro = new ResizeObserver(()=> this.resize());
      this._ro.observe(this.container);
    }

    // iOS Safari continues to adjust its chrome (address/tab bars) for a
    // few hundred ms after 'orientationchange' fires, so a single
    // immediate resize can capture a stale/incorrect height. Re-measure
    // a few times as things settle.
    window.addEventListener('orientationchange', ()=>{
      [50, 150, 300, 500, 800].forEach(delay=>{
        setTimeout(()=>this.resize(), delay);
      });
    });

    // visualViewport reports the true usable area on iOS (excludes the
    // browser UI overlay) and fires its own resize/scroll events as the
    // address bar shows/hides — the most accurate signal available.
    if (window.visualViewport){
      window.visualViewport.addEventListener('resize', ()=>this.resize());
    }
  },

  resize(){
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const vv = window.visualViewport;
    const w = Math.round(vv ? vv.width : window.innerWidth);
    const h = Math.round(vv ? vv.height : window.innerHeight);
    if (w === 0 || h === 0) return; // ignore transient zero-size measurements mid-rotation
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.viewW = w; this.viewH = h;
  },

  updateCamera(player, level){
    const targetX = Physics.clamp(player.cx - this.viewW/2, 0, Math.max(0, level.width - this.viewW));
    this.camX = Physics.lerp(this.camX, targetX, 0.12);
    this.camY = 0;
  },

  clear(){
    const ctx = this.ctx;
    ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    ctx.clearRect(0,0,this.viewW,this.viewH);
  },

  drawSky(){
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0,0,0,this.viewH);
    g.addColorStop(0,'#bfe6ff');
    g.addColorStop(1,'#eefaff');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,this.viewW,this.viewH);

    // sun
    const sunX = this.viewW*0.82 - this.camX*0.05;
    ctx.save();
    const sg = ctx.createRadialGradient(sunX,90,10, sunX,90,90);
    sg.addColorStop(0,'#fff7d6'); sg.addColorStop(1,'rgba(255,224,131,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(sunX,90,90,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffe083';
    ctx.beginPath(); ctx.arc(sunX,90,42,0,Math.PI*2); ctx.fill();
    ctx.restore();

    // parallax clouds
    for (let i=0;i<6;i++){
      const speed = 0.08 + (i%3)*0.04;
      const baseX = i*260 + 80;
      const x = ((baseX - this.camX*speed) % (this.viewW+600) + this.viewW+600) % (this.viewW+600) - 300;
      const y = 60 + (i%4)*55;
      this.drawCloud(x,y, 0.7+(i%3)*0.25);
    }

    // distant hills (parallax)
    ctx.fillStyle = '#cdeecb';
    this.hillPath(0.15, this.viewH-140, 70);
    ctx.fillStyle = '#b7e6b8';
    this.hillPath(0.28, this.viewH-100, 60);
  },

  hillPath(parallax, baseY, amp){
    const ctx = this.ctx;
    const offset = -this.camX*parallax;
    ctx.beginPath();
    ctx.moveTo(0, this.viewH);
    const step = 90;
    for (let x=-step; x<=this.viewW+step; x+=step){
      const wx = x - offset;
      const y = baseY - Math.sin(wx*0.008)*amp - Math.cos(wx*0.003)*amp*0.4;
      ctx.lineTo(x,y);
    }
    ctx.lineTo(this.viewW, this.viewH);
    ctx.closePath();
    ctx.fill();
  },

  drawCloud(x,y,scale){
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x,y); ctx.scale(scale,scale);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.ellipse(0,0,42,20,0,0,Math.PI*2);
    ctx.ellipse(-28,6,26,16,0,0,Math.PI*2);
    ctx.ellipse(30,8,28,15,0,0,Math.PI*2);
    ctx.ellipse(8,-14,26,18,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  },

  worldToScreenX(x){ return x - this.camX; },

  drawGround(level){
    const ctx = this.ctx;
    for (const seg of level.groundSegments){
      const x1 = this.worldToScreenX(seg.x1);
      const w = seg.x2 - seg.x1;
      if (x1+w < -50 || x1 > this.viewW+50) continue;
      // dirt body
      const grd = ctx.createLinearGradient(0, level.groundY, 0, level.groundY+200);
      grd.addColorStop(0,'#a9754a'); grd.addColorStop(1,'#8a5c38');
      ctx.fillStyle = grd;
      ctx.fillRect(x1, level.groundY+18, w, 260);
      // grass top
      ctx.fillStyle = '#7fce6a';
      ctx.beginPath();
      ctx.moveTo(x1, level.groundY+22);
      ctx.lineTo(x1, level.groundY);
      for (let gx=0; gx<=w; gx+=18){
        const bump = Math.sin((seg.x1+gx)*0.05)*3;
        ctx.lineTo(x1+gx, level.groundY-6+bump);
      }
      ctx.lineTo(x1+w, level.groundY);
      ctx.lineTo(x1+w, level.groundY+22);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#8fe07d';
      ctx.fillRect(x1, level.groundY+14, w, 8);
    }
  },

  drawPlatform(p){
    const ctx = this.ctx;
    const x = this.worldToScreenX(p.x);
    if (x+p.w < -50 || x > this.viewW+50) return;
    ctx.save();
    ctx.shadowColor = 'rgba(74,63,82,0.15)';
    ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#c98a52';
    roundRect(ctx, x, p.y, p.w, p.h, 8); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#7fce6a';
    roundRect(ctx, x, p.y-6, p.w, 10, 6); ctx.fill();
    ctx.restore();
  },

  drawBridge(b, level){
    const ctx = this.ctx;
    const x = this.worldToScreenX(b.x);
    if (x+b.w < -50 || x > this.viewW+50) return;
    ctx.save();
    ctx.strokeStyle = '#8a5c38'; ctx.lineWidth = 4;
    for (let i=0;i<=b.w; i+=16){
      ctx.beginPath();
      ctx.moveTo(x+i, b.y-6); ctx.lineTo(x+i, b.y+10);
      ctx.stroke();
    }
    ctx.fillStyle = '#c98a52';
    ctx.fillRect(x, b.y-4, b.w, 8);
    ctx.restore();
  },

  drawRiver(r){
    const ctx = this.ctx;
    const x = this.worldToScreenX(r.x);
    if (x+r.w < -50 || x > this.viewW+50) return;
    ctx.save();
    const g = ctx.createLinearGradient(0,r.y,0,r.y+120);
    g.addColorStop(0,'#8fd6ec'); g.addColorStop(1,'#5fb7d8');
    ctx.fillStyle = g;
    ctx.fillRect(x, r.y, r.w, 130);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
    for (let i=0;i<3;i++){
      const wy = r.y + 20 + i*30 + Math.sin(this.time*2+i)*3;
      ctx.beginPath();
      for (let wx=0; wx<=r.w; wx+=14){
        const yy = wy + Math.sin((wx*0.1)+this.time*3+i)*3;
        if (wx===0) ctx.moveTo(x+wx,yy); else ctx.lineTo(x+wx,yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  },

  drawTree(t){
    const ctx = this.ctx;
    const x = this.worldToScreenX(t.x);
    if (x < -80 || x > this.viewW+80) return;
    const s = t.scale;
    ctx.save();
    ctx.translate(x, t.y);
    ctx.scale(s,s);
    // trunk
    ctx.fillStyle = '#8a5c38';
    roundRect(ctx, -9, -70, 18, 74, 6); ctx.fill();
    // foliage clusters
    ctx.fillStyle = '#6fbf5c';
    [[-22,-92,32],[22,-96,34],[0,-118,38],[-6,-80,26]].forEach(([dx,dy,r])=>{
      ctx.beginPath(); ctx.arc(dx,dy,r,0,Math.PI*2); ctx.fill();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(-10,-108,14,0,Math.PI*2); ctx.fill();
    ctx.restore();
  },

  drawFlower(f){
    const ctx = this.ctx;
    const x = this.worldToScreenX(f.x);
    if (x < -20 || x > this.viewW+20) return;
    ctx.save();
    ctx.translate(x, f.y);
    ctx.fillStyle = '#4c9e42';
    ctx.fillRect(-2,-20,4,20);
    const colors = ['#ff9ec4','#ffd166','#c39bff'];
    ctx.fillStyle = colors[Math.floor(f.x)%colors.length];
    for (let i=0;i<5;i++){
      const a = i/5*Math.PI*2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a)*8, -24+Math.sin(a)*8, 6,4, a, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff6b0';
    ctx.beginPath(); ctx.arc(0,-24,5,0,Math.PI*2); ctx.fill();
    ctx.restore();
  },

  drawMushroom(m){
    const ctx = this.ctx;
    const x = this.worldToScreenX(m.x);
    if (x < -30 || x > this.viewW+30) return;
    ctx.save();
    ctx.translate(x, m.y);
    ctx.fillStyle = '#fff3e2';
    roundRect(ctx, -6, -18, 12, 18, 4); ctx.fill();
    ctx.fillStyle = '#ff7a7a';
    ctx.beginPath(); ctx.ellipse(0,-20,16,12,0,Math.PI,0); ctx.fill();
    ctx.fillStyle = '#fff';
    [[-7,-24],[6,-26],[0,-18]].forEach(([dx,dy])=>{
      ctx.beginPath(); ctx.arc(dx,dy,2.6,0,Math.PI*2); ctx.fill();
    });
    ctx.restore();
  },

  drawButterfly(b){
    const ctx = this.ctx;
    const flap = Math.sin(this.time*8 + b.phase);
    const x = this.worldToScreenX(b.x + Math.sin(this.time+b.phase)*20);
    const y = b.y + Math.cos(this.time*1.3+b.phase)*14;
    if (x < -20 || x > this.viewW+20) return;
    ctx.save();
    ctx.translate(x,y);
    ctx.fillStyle = '#ffb6de';
    ctx.beginPath(); ctx.ellipse(-6*Math.abs(flap)-2,-2,7,5,0.3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6*Math.abs(flap)+2,-2,7,5,-0.3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#5a4a63';
    ctx.fillRect(-1,-5,2,9);
    ctx.restore();
  },

  drawBird(b){
    const ctx = this.ctx;
    const flap = Math.sin(this.time*6 + b.phase);
    const x = this.worldToScreenX(b.x + this.time*10 % 400);
    const y = b.y + Math.sin(this.time*1.5+b.phase)*10;
    if (x < -20 || x > this.viewW+20) return;
    ctx.save();
    ctx.translate(x,y);
    ctx.strokeStyle = '#5a4a63'; ctx.lineWidth = 2.4; ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(-10, 0); ctx.quadraticCurveTo(-4, -8*flap, 0,0);
    ctx.moveTo(10, 0); ctx.quadraticCurveTo(4, -8*flap, 0,0);
    ctx.stroke();
    ctx.restore();
  },

  drawFish(f){
    if (f.collected) return;
    const ctx = this.ctx;
    const x = this.worldToScreenX(f.x);
    const y = f.y + Math.sin(this.time*3 + f.x*0.05)*5;
    if (x < -20 || x > this.viewW+20) return;
    ctx.save();
    ctx.translate(x,y);
    ctx.fillStyle = '#6fc7ff';
    ctx.beginPath();
    ctx.ellipse(0,0,11,7,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-10,0); ctx.lineTo(-18,-6); ctx.lineTo(-18,6); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(6,-2,2,0,Math.PI*2); ctx.fill();
    ctx.restore();
  },

  drawStar(s){
    if (s.collected) return;
    const ctx = this.ctx;
    const x = this.worldToScreenX(s.x);
    const y = s.y + Math.sin(this.time*2.4 + s.x*0.05)*6;
    if (x < -20 || x > this.viewW+20) return;
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(Math.sin(this.time*1.6)*0.25);
    ctx.fillStyle = '#ffe083';
    ctx.shadowColor = 'rgba(255,224,131,0.8)'; ctx.shadowBlur = 12;
    drawStarPath(ctx,0,0,13,6,5); ctx.fill();
    ctx.restore();
  },

  drawHeart(h){
    if (h.collected) return;
    const ctx = this.ctx;
    const x = this.worldToScreenX(h.x);
    const y = h.y + Math.sin(this.time*2.8 + h.x*0.05)*5;
    if (x < -20 || x > this.viewW+20) return;
    ctx.save();
    ctx.translate(x,y);
    ctx.fillStyle = '#ff6b8b';
    ctx.beginPath();
    ctx.moveTo(0,5);
    ctx.bezierCurveTo(-14,-8,-8,-16,0,-6);
    ctx.bezierCurveTo(8,-16,14,-8,0,5);
    ctx.fill();
    ctx.restore();
  },

  drawFlag(level, reached){
    const ctx = this.ctx;
    const x = this.worldToScreenX(level.flag.x);
    if (x < -60 || x > this.viewW+60) return;
    ctx.save();
    ctx.translate(x, level.flag.y);
    ctx.fillStyle = '#8a5c38';
    ctx.fillRect(-3, 0, 6, 90);
    const wave = Math.sin(this.time*4)*6;
    ctx.fillStyle = reached ? '#8fe07d' : '#ff9e7d';
    ctx.beginPath();
    ctx.moveTo(3,0);
    ctx.lineTo(3+46+wave, 10);
    ctx.lineTo(3, 26);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  /** Luna the kitten — fully hand-drawn with canvas primitives */
  drawPlayer(p){
    const ctx = this.ctx;
    const x = this.worldToScreenX(p.x) + p.w/2;
    const y = p.y + p.h;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(p.facing, 1);

    const bob = (p.state==='walk' || p.state==='run') ? Math.abs(Math.sin(this.time*(p.state==='run'?16:10))) * (p.state==='run'?4:2) : 0;
    const breathe = (p.state==='idle') ? Math.sin(this.time*1.6)*0.02 : 0;
    const stretchY = p.squash + breathe;
    const stretchX = 1/Math.max(0.6,p.squash) * 0.5 + 0.5;

    // a light forward lean while sprinting sells the "run" feeling
    const lean = p.state==='run' ? -0.12 : p.state==='walk' ? -0.04 : 0;

    ctx.translate(0, -bob);
    ctx.rotate(lean);
    ctx.scale(stretchX, stretchY);

    const flash = (p.invulnerable>0 && Math.floor(this.time*14)%2===0);
    ctx.globalAlpha = flash ? 0.5 : 1;

    // ---- gait cycle (diagonal-pair quadruped walk, like a real cat) ----
    const gaitSpeed = p.state==='run' ? 16 : p.state==='walk' ? 9 : 0;
    const gaitPhase = this.time * gaitSpeed;
    const liftAmt = p.state==='run' ? 7 : p.state==='walk' ? 3.5 : 0;
    const grounded = (p.state==='walk' || p.state==='run' || p.state==='idle' || p.state==='land');

    const backLift1 = grounded ? Math.max(0, Math.sin(gaitPhase)) * liftAmt : 0;
    const backLift2 = grounded ? Math.max(0, Math.sin(gaitPhase+Math.PI)) * liftAmt : 0;
    const frontLift1 = grounded ? Math.max(0, Math.sin(gaitPhase+Math.PI*0.5)) * liftAmt : 0;
    const frontLift2 = grounded ? Math.max(0, Math.sin(gaitPhase+Math.PI*1.5)) * liftAmt : 0;

    // ---- tail: smooth curved swish, streams out behind while running ----
    const tailWag = Math.sin(p.tailPhase)*0.45;
    const tailBase = p.state==='run' ? -0.25 : p.state==='celebrate' ? -0.9 : 0.55;
    ctx.save();
    ctx.translate(-15,-22);
    ctx.rotate(tailBase + tailWag*0.5);
    ctx.strokeStyle = '#f5a856';
    ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.quadraticCurveTo(-6, -18, tailWag*10-2, -32);
    ctx.stroke();
    ctx.fillStyle = '#fff3e2';
    ctx.beginPath(); ctx.arc(tailWag*10-2,-32,3.6,0,Math.PI*2); ctx.fill();
    ctx.restore();

    // ---- back legs ----
    ctx.fillStyle = '#f2984a';
    if (p.state==='jump'){
      // tucked up under the body for a springy takeoff pose
      ctx.save(); ctx.translate(-12,-14); ctx.rotate(-0.6); roundRect(ctx,-4,-4,8,12,4); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(4,-14); ctx.rotate(0.6); roundRect(ctx,-4,-4,8,12,4); ctx.fill(); ctx.restore();
    } else if (p.state==='fall'){
      ctx.save(); ctx.translate(-12,-16); ctx.rotate(-0.2); roundRect(ctx,-4,0,8,15,4); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(4,-16); ctx.rotate(0.2); roundRect(ctx,-4,0,8,15,4); ctx.fill(); ctx.restore();
    } else {
      drawPaw(ctx, -12, -16-backLift1, 8, 16);
      drawPaw(ctx, 4, -16-backLift2, 8, 16);
    }

    // body
    ctx.fillStyle = '#f5a856';
    ctx.beginPath();
    ctx.ellipse(0,-30,20,18,0,0,Math.PI*2);
    ctx.fill();

    // belly
    ctx.fillStyle = '#fff3e2';
    ctx.beginPath();
    ctx.ellipse(0,-24,12,10,0,0,Math.PI*2);
    ctx.fill();

    // stripes
    ctx.strokeStyle = '#e08838'; ctx.lineWidth = 3; ctx.lineCap='round';
    [[-10,-42,-6,-36],[8,-44,10,-38],[-2,-46,0,-40]].forEach(([x1,y1,x2,y2])=>{
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    });

    // ---- front legs ----
    ctx.fillStyle = '#f2984a';
    if (p.state==='jump'){
      ctx.save(); ctx.translate(-14,-20); ctx.rotate(-0.75); roundRect(ctx,-4,0,8,16,4); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(12,-20); ctx.rotate(-0.35); roundRect(ctx,-4,0,8,16,4); ctx.fill(); ctx.restore();
    } else if (p.state==='fall'){
      ctx.save(); ctx.translate(-14,-20); ctx.rotate(0.35); roundRect(ctx,-4,0,8,18,4); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(12,-20); ctx.rotate(0.35); roundRect(ctx,-4,0,8,18,4); ctx.fill(); ctx.restore();
    } else if (p.state==='celebrate'){
      // little paws-up cheer, alternating like a happy wave
      const wave = Math.sin(this.time*9);
      ctx.save(); ctx.translate(-14,-24); ctx.rotate(-1.6 - wave*0.3); roundRect(ctx,-4,0,8,16,4); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(12,-24); ctx.rotate(1.6 + wave*0.3); roundRect(ctx,-4,0,8,16,4); ctx.fill(); ctx.restore();
    } else {
      drawPaw(ctx, -14, -20-frontLift1, 8, 18);
      drawPaw(ctx, 12, -20-frontLift2, 8, 18);
    }

    // head
    const headBob = p.state==='celebrate' ? Math.sin(this.time*10)*4 : 0;
    const headTilt = p.state==='celebrate' ? Math.sin(this.time*6)*0.15 : p.state==='run' ? 0.06 : 0;
    ctx.save();
    ctx.translate(6, -46+headBob);
    ctx.rotate(headTilt);

    // ears — perk up when jumping/celebrating, gentle idle flick otherwise
    const earFlick = (p.state==='walk'||p.state==='idle') ? Math.sin(p.earPhase)*0.08 : 0;
    const earPerk = (p.state==='jump' || p.state==='celebrate') ? -0.15 : 0;
    ctx.fillStyle = '#f5a856';
    ctx.save(); ctx.rotate(-0.5+earFlick+earPerk); roundRect(ctx,-14,-20,10,14,3); ctx.fill(); ctx.restore();
    ctx.save(); ctx.rotate(0.5+earFlick-earPerk); roundRect(ctx,4,-20,10,14,3); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#ffc9d6';
    ctx.save(); ctx.rotate(-0.5+earFlick+earPerk); roundRect(ctx,-11.5,-17,5,8,2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.rotate(0.5+earFlick-earPerk); roundRect(ctx,6.5,-17,5,8,2); ctx.fill(); ctx.restore();

    // head shape
    ctx.fillStyle = '#f5a856';
    ctx.beginPath(); ctx.arc(0,0,17,0,Math.PI*2); ctx.fill();

    // cheeks / muzzle
    ctx.fillStyle = '#fff3e2';
    ctx.beginPath(); ctx.ellipse(2,6,11,8,0,0,Math.PI*2); ctx.fill();

    // eyes
    const blinking = p._blinking > 0;
    ctx.fillStyle = '#3a2f42';
    if (p.state === 'hurt'){
      // X eyes for a friendly "ouch"
      ctx.lineWidth=2; ctx.strokeStyle='#3a2f42';
      [-6,8].forEach(ex=>{
        ctx.beginPath(); ctx.moveTo(ex-3,-2); ctx.lineTo(ex+3,4); ctx.moveTo(ex+3,-2); ctx.lineTo(ex-3,4); ctx.stroke();
      });
    } else if (blinking && p.state!=='celebrate'){
      ctx.strokeStyle='#3a2f42'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(-3,0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5,0); ctx.lineTo(11,0); ctx.stroke();
    } else if (p.state === 'celebrate'){
      // happy closed "^ ^" eyes
      ctx.strokeStyle='#3a2f42'; ctx.lineWidth=2.2; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(-9,1); ctx.quadraticCurveTo(-6,-3,-3,1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5,1); ctx.quadraticCurveTo(8,-3,11,1); ctx.stroke();
    } else {
      const eyeWide = (p.state==='jump' || p.state==='fall') ? 1.15 : 1;
      ctx.beginPath(); ctx.ellipse(-6,0,3.2*eyeWide,3.6*eyeWide,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(8,0,3.2*eyeWide,3.6*eyeWide,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(-5,-1,1,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(9,-1,1,0,Math.PI*2); ctx.fill();
    }

    // nose + mouth
    ctx.fillStyle = '#ff8fa8';
    ctx.beginPath(); ctx.moveTo(-1,5); ctx.lineTo(3,5); ctx.lineTo(1,8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3a2f42'; ctx.lineWidth = 1.4; ctx.lineCap='round';
    if (p.state === 'celebrate'){
      // big joyful open smile
      ctx.beginPath();
      ctx.moveTo(-7,8); ctx.quadraticCurveTo(1,15,9,8);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(1,8); ctx.quadraticCurveTo(-2,11,-6,9);
      ctx.moveTo(1,8); ctx.quadraticCurveTo(4,11,8,9);
      ctx.stroke();
    }

    // whiskers
    ctx.strokeStyle='rgba(58,47,66,0.5)'; ctx.lineWidth=1;
    for (let i=0;i<3;i++){
      const wiggle = Math.sin(this.time*2 + i)*0.6;
      ctx.beginPath(); ctx.moveTo(-8, 4+i*2); ctx.lineTo(-20, 2+i*3+wiggle); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(14, 4+i*2); ctx.lineTo(26, 2+i*3+wiggle); ctx.stroke();
    }

    ctx.restore(); // head

    ctx.restore(); // squash/lean/bob
    ctx.restore(); // facing flip
  },

  drawHeartsHUD(hearts, maxHearts){
    const el = document.getElementById('hud-hearts');
    if (!el) return;
    let html = '';
    for (let i=0;i<maxHearts;i++){
      html += i < hearts ? '❤️' : '🤍';
    }
    el.innerHTML = html;
  }
};

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

/** A little leg with a rounded paw pad at the bottom — used for Luna's gait. */
function drawPaw(ctx, x, y, w, h){
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.save();
  ctx.fillStyle = '#ffd9b3';
  ctx.beginPath();
  ctx.ellipse(x+w/2, y+h-2, w/2-0.5, 3.5, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}
