/* ==========================================================
   Noah's Kitty Adventure — ui.js
   Screen navigation, level select grid, settings, HUD helpers.
   ========================================================== */

const UI = {
  els: {},

  init(){
    this.els = {
      menu: document.getElementById('screen-menu'),
      levels: document.getElementById('screen-levels'),
      howto: document.getElementById('screen-howto'),
      settings: document.getElementById('screen-settings'),
      credits: document.getElementById('screen-credits'),
      pause: document.getElementById('screen-pause'),
      win: document.getElementById('screen-win'),
      gameover: document.getElementById('screen-gameover'),
      hud: document.getElementById('hud'),
      mobileControls: document.getElementById('mobile-controls'),
      levelGrid: document.getElementById('level-grid'),
      rotateHint: document.getElementById('rotate-hint'),
    };

    this.bindNav();
    this.bindSettings();
    if (Input.isMobile()){
      this.els.mobileControls.classList.remove('hidden');
    }
    this.checkOrientation();
    window.addEventListener('resize', ()=>this.checkOrientation());
  },

  checkOrientation(){
    const isNarrowLandscapeNeeded = window.innerWidth < window.innerHeight && Input.isMobile() && Game && Game.state === 'playing';
    this.els.rotateHint.classList.toggle('needed', !!isNarrowLandscapeNeeded);
  },

  click(fn){
    return ()=>{ AudioEngine.resume(); AudioEngine.playMenuClick(); fn(); };
  },

  bindNav(){
    const $ = id => document.getElementById(id);
    $('btn-play').onclick = this.click(()=> this.showLevelSelect());
    $('btn-howto').onclick = this.click(()=> this.show('howto'));
    $('btn-settings').onclick = this.click(()=> this.show('settings'));
    $('btn-credits').onclick = this.click(()=> this.show('credits'));

    $('btn-levels-back').onclick = this.click(()=> this.show('menu'));
    $('btn-howto-back').onclick = this.click(()=> this.show('menu'));
    $('btn-settings-back').onclick = this.click(()=> this.show('menu'));
    $('btn-credits-back').onclick = this.click(()=> this.show('menu'));

    $('btn-pause').onclick = this.click(()=> Game.togglePause());
    $('btn-resume').onclick = this.click(()=> Game.togglePause());
    $('btn-restart-level').onclick = this.click(()=> Game.restartLevel());
    $('btn-quit-menu').onclick = this.click(()=> Game.quitToMenu());

    $('btn-next-level').onclick = this.click(()=> Game.nextLevel());
    $('btn-replay-level').onclick = this.click(()=> Game.restartLevel());
    $('btn-win-menu').onclick = this.click(()=> Game.quitToMenu());

    $('btn-continue').onclick = this.click(()=> Game.continueAfterGameOver());
    $('btn-gameover-menu').onclick = this.click(()=> Game.quitToMenu());
  },

  bindSettings(){
    const soundBox = document.getElementById('opt-sound');
    const musicBox = document.getElementById('opt-music');
    const largeUiBox = document.getElementById('opt-largeui');
    const reduceMotionBox = document.getElementById('opt-reducemotion');

    soundBox.onchange = ()=> AudioEngine.setSoundOn(soundBox.checked);
    musicBox.onchange = ()=> { AudioEngine.resume(); AudioEngine.setMusicOn(musicBox.checked); };
    largeUiBox.onchange = ()=> document.body.classList.toggle('large-ui', largeUiBox.checked);
    reduceMotionBox.onchange = ()=> document.body.classList.toggle('reduce-motion', reduceMotionBox.checked);
  },

  show(name){
    Object.entries(this.els).forEach(([key, el])=>{
      if (!el || !el.classList.contains('screen')) return;
      el.classList.toggle('active', key === name);
    });
    this.checkOrientation();
  },

  hideAllOverlaysOnly(){
    ['pause','win','gameover'].forEach(k=> this.els[k].classList.remove('active'));
  },

  showLevelSelect(){
    this.buildLevelGrid();
    this.show('levels');
  },

  buildLevelGrid(){
    const grid = this.els.levelGrid;
    grid.innerHTML = '';
    const progress = Progress.load();
    for (let i=1; i<=World.totalLevels(); i++){
      const unlocked = i===1 || progress.unlocked >= i;
      const btn = document.createElement('button');
      btn.className = 'level-btn' + (unlocked ? '' : ' locked');
      const medal = progress.medals[i] || '';
      const medalIcon = medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : medal === 'bronze' ? '🥉' : '';
      btn.innerHTML = unlocked
        ? `<div>${i}</div><div class="medal-row">${medalIcon}</div>`
        : `<div>🔒</div>`;
      if (unlocked){
        btn.onclick = this.click(()=> Game.startLevel(i));
      }
      grid.appendChild(btn);
    }
  },

  showHUD(show){
    this.els.hud.classList.toggle('hidden', !show);
    if (Input.isMobile()) this.els.mobileControls.classList.toggle('hidden', !show);
  },

  updateHUD(player, fishCount, starCount, score, levelName, levelIndex){
    document.getElementById('hud-fish').textContent = fishCount;
    document.getElementById('hud-stars').textContent = starCount;
    document.getElementById('hud-score').textContent = score;
    document.getElementById('hud-level').textContent = `Level ${levelIndex} · ${levelName}`;
    Renderer.drawHeartsHUD(player.hearts, player.maxHearts);
  },

  showPause(show){
    this.els.pause.classList.toggle('active', show);
  },

  showWin(stats){
    document.getElementById('win-fish').textContent = stats.fish;
    document.getElementById('win-stars').textContent = stats.stars;
    document.getElementById('win-medal').textContent = stats.medal;
    document.getElementById('win-score').textContent = stats.score;
    const nextBtn = document.getElementById('btn-next-level');
    nextBtn.style.display = stats.hasNext ? 'block' : 'none';
    this.els.win.classList.add('active');
  },

  hideWin(){ this.els.win.classList.remove('active'); },

  showGameOver(){ this.els.gameover.classList.add('active'); },
  hideGameOver(){ this.els.gameover.classList.remove('active'); }
};

/* ---------- Simple progress persistence (in-memory + localStorage best-effort) ---------- */
const Progress = {
  KEY: 'noahs-kitty-adventure-progress',
  _mem: { unlocked: 1, medals: {} },

  load(){
    try{
      const raw = localStorage.getItem(this.KEY);
      if (raw) return JSON.parse(raw);
    } catch(e){ /* storage unavailable, fall back to memory */ }
    return this._mem;
  },

  save(data){
    this._mem = data;
    try{ localStorage.setItem(this.KEY, JSON.stringify(data)); } catch(e){ /* ignore */ }
  },

  completeLevel(levelIndex, medal){
    const data = this.load();
    data.unlocked = Math.max(data.unlocked || 1, levelIndex+1);
    const order = {bronze:1, silver:2, gold:3};
    if (!data.medals[levelIndex] || order[medal] > order[data.medals[levelIndex]]){
      data.medals[levelIndex] = medal;
    }
    this.save(data);
  }
};
