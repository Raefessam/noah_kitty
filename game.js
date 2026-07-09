/* ==========================================================
   Noah's Kitty Adventure — game.js
   Main loop & state machine: menu -> playing -> win/gameover.
   ========================================================== */

const Game = {
  state: 'menu', // menu | playing | paused | win | gameover
  level: null,
  levelIndex: 1,
  player: null,
  particles: null,
  score: 0,
  fishCollected: 0,
  starsCollected: 0,
  totalFishInLevel: 0,
  totalStarsInLevel: 0,
  wasOnGround: false,
  reachedFlag: false,
  lastTime: 0,
  continuesUsed: 0,

  init(){
    Renderer.init(document.getElementById('game-canvas'));
    Input.init();
    UI.init();
    this.particles = new ParticleSystem(240);
    UI.show('menu');
    requestAnimationFrame((t)=>this.loop(t));

    // Unlock audio context on first user gesture (mobile requirement)
    const unlock = ()=>{ AudioEngine.init(); AudioEngine.resume(); window.removeEventListener('touchstart', unlock); window.removeEventListener('mousedown', unlock); window.removeEventListener('keydown', unlock); };
    window.addEventListener('touchstart', unlock, {once:true});
    window.addEventListener('mousedown', unlock, {once:true});
    window.addEventListener('keydown', unlock, {once:true});
  },

  startLevel(index){
    this.levelIndex = index;
    this.level = World.loadLevel(index);
    this.player = new Player(this.level.spawn.x, this.level.spawn.y);
    this.player.checkpoint = {x:this.level.spawn.x, y:this.level.spawn.y};
    this.score = 0;
    this.fishCollected = 0;
    this.starsCollected = 0;
    this.totalFishInLevel = this.level.fish.length;
    this.totalStarsInLevel = this.level.stars.length;
    this.reachedFlag = false;
    this.continuesUsed = 0;
    Renderer.camX = 0;

    this.state = 'playing';
    UI.show('none');
    document.getElementById('screen-menu').classList.remove('active');
    UI.hideAllOverlaysOnly();
    UI.showHUD(true);
    UI.checkOrientation();
    AudioEngine.startMusic();
  },

  restartLevel(){
    this.startLevel(this.levelIndex);
  },

  nextLevel(){
    UI.hideWin();
    if (this.levelIndex < World.totalLevels()){
      this.startLevel(this.levelIndex+1);
    } else {
      this.quitToMenu();
    }
  },

  quitToMenu(){
    this.state = 'menu';
    AudioEngine.stopMusic();
    UI.hideAllOverlaysOnly();
    UI.showHUD(false);
    UI.show('menu');
  },

  togglePause(){
    if (this.state === 'playing'){
      this.state = 'paused';
      UI.showPause(true);
    } else if (this.state === 'paused'){
      this.state = 'playing';
      UI.showPause(false);
    }
  },

  continueAfterGameOver(){
    this.continuesUsed++;
    this.player.hearts = this.player.maxHearts;
    this.player.dead = false;
    this.player.respawnAtCheckpoint();
    this.state = 'playing';
    UI.hideGameOver();
  },

  triggerWin(){
    this.state = 'win';
    AudioEngine.playVictory();
    this.player.celebrate();
    this.particles.spawnBurst(this.player.cx, this.player.cy, {count:26, color:'#ffe083', shape:'star', speed:220, life:1.1, upBias:180});

    const fishPct = this.totalFishInLevel ? this.fishCollected/this.totalFishInLevel : 1;
    const starPct = this.totalStarsInLevel ? this.starsCollected/this.totalStarsInLevel : 1;
    const combined = (fishPct + starPct) / 2;
    let medal = 'bronze';
    if (combined >= 0.95) medal = 'gold';
    else if (combined >= 0.6) medal = 'silver';

    Progress.completeLevel(this.levelIndex, medal);

    setTimeout(()=>{
      UI.showWin({
        fish: this.fishCollected,
        stars: this.starsCollected,
        medal: medal.charAt(0).toUpperCase()+medal.slice(1),
        score: this.score,
        hasNext: this.levelIndex < World.totalLevels()
      });
    }, 900);
  },

  triggerGameOver(){
    this.state = 'gameover';
    AudioEngine.playGameOver();
    UI.showGameOver();
  },

  update(dt){
    if (this.state !== 'playing') return;

    const level = this.level;
    const player = this.player;
    const wasOnGround = player.onGround;

    player.update(dt, level.platforms.concat(this.groundAsPlatforms(level)), wasOnGround);

    if (player.spawnJumpSparkle){
      this.particles.spawnBurst(player.cx, player.y+player.h, {count:6, color:'#fff', shape:'circle', speed:80, life:0.4, upBias:20});
      player.spawnJumpSparkle = false;
    }

    // fell into a gap -> lose a heart & respawn
    if (player.y > WORLD.GRAVITY_FLOOR){
      const hurt = player.takeDamage();
      if (player.dead){
        this.triggerGameOver();
      } else {
        player.respawnAtCheckpoint();
      }
    }

    if (player.dead && this.state === 'playing'){
      this.triggerGameOver();
    }

    // checkpoints
    for (const cx of level.checkpoints){
      if (player.x >= cx && player.checkpoint.x < cx){
        player.checkpoint = {x: cx, y: level.groundY - 80};
        AudioEngine.playCheckpoint();
        this.particles.spawnBurst(player.cx, player.cy, {count:10, color:'#b8f2d0', shape:'circle', speed:100, life:0.5});
      }
    }

    // collectibles
    const pRect = player;
    for (const f of level.fish){
      if (f.collected) continue;
      if (this.circleHit(pRect, f, 20)){
        f.collected = true;
        this.fishCollected++;
        this.score += 10;
        AudioEngine.playCollectFish();
        this.particles.spawnBurst(f.x, f.y, {count:8, color:'#6fc7ff', shape:'circle', speed:100, life:0.5});
      }
    }
    for (const s of level.stars){
      if (s.collected) continue;
      if (this.circleHit(pRect, s, 22)){
        s.collected = true;
        this.starsCollected++;
        this.score += 50;
        AudioEngine.playCollectStar();
        this.particles.spawnBurst(s.x, s.y, {count:14, color:'#ffe083', shape:'star', speed:140, life:0.7, upBias:60});
      }
    }
    for (const h of level.hearts){
      if (h.collected) continue;
      if (this.circleHit(pRect, h, 22)){
        h.collected = true;
        player.heal(1);
        this.score += 20;
        AudioEngine.playCollectHeart();
        this.particles.spawnBurst(h.x, h.y, {count:10, color:'#ff6b8b', shape:'circle', speed:110, life:0.6, upBias:40});
      }
    }

    // flag
    if (!this.reachedFlag && player.x + player.w > level.flag.x && player.y+player.h > level.flag.y-10){
      this.reachedFlag = true;
      this.triggerWin();
    }

    // world bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > level.width) player.x = level.width - player.w;

    this.particles.update(dt);
    Renderer.updateCamera(player, level);

    if (Input.isMobile()) UI.checkOrientation();

    UI.updateHUD(player, this.fishCollected, this.starsCollected, this.score, level.name, this.levelIndex);
  },

  groundAsPlatforms(level){
    if (this._groundCache === level) return this._groundPlatforms;
    this._groundCache = level;
    this._groundPlatforms = level.groundSegments.map(seg => ({
      x: seg.x1, y: level.groundY, w: seg.x2-seg.x1, h: 300, oneWay:false
    }));
    return this._groundPlatforms;
  },

  circleHit(player, obj, radius){
    const dx = (player.x+player.w/2) - obj.x;
    const dy = (player.y+player.h/2) - obj.y;
    return Math.sqrt(dx*dx+dy*dy) < radius + 14;
  },

  render(){
    Renderer.clear();
    Renderer.drawSky();

    if (this.state === 'menu') return;

    const level = this.level;
    if (!level) return;

    // decorations behind ground (rivers first, then ground, then bridges/foliage)
    level.decor.rivers.forEach(r=>Renderer.drawRiver(r));
    Renderer.drawGround(level);
    level.decor.bridges.forEach(b=>Renderer.drawBridge(b, level));
    level.platforms.forEach(p=>Renderer.drawPlatform(p));
    level.decor.mushrooms.forEach(m=>Renderer.drawMushroom(m));
    level.decor.flowers.forEach(f=>Renderer.drawFlower(f));
    level.decor.trees.forEach(t=>Renderer.drawTree(t));
    level.decor.butterflies.forEach(b=>Renderer.drawButterfly(b));
    level.decor.birds.forEach(b=>Renderer.drawBird(b));

    level.fish.forEach(f=>Renderer.drawFish(f));
    level.stars.forEach(s=>Renderer.drawStar(s));
    level.hearts.forEach(h=>Renderer.drawHeart(h));

    Renderer.drawFlag(level, this.reachedFlag);
    Renderer.drawPlayer(this.player);
    this.particles.draw(Renderer.ctx, Renderer.camX, Renderer.camY);
  },

  loop(t){
    const dt = Math.min(0.033, (t - this.lastTime) / 1000 || 0);
    this.lastTime = t;
    Renderer.time += dt;

    this.update(dt);
    this.render();

    requestAnimationFrame((nt)=>this.loop(nt));
  }
};

window.addEventListener('load', ()=> Game.init());
