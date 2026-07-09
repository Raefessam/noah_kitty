/* ==========================================================
   Noah's Kitty Adventure — player.js
   Luna the Kitten: movement, double-jump, and animation states.
   ========================================================== */

class Player {
  constructor(x, y){
    this.x = x; this.y = y;
    this.w = 42; this.h = 40;
    this.vx = 0; this.vy = 0;

    this.speed = 230;
    this.runSpeed = 340;
    this.jumpForce = -620;
    this.doubleJumpForce = -560;

    this.facing = 1; // 1 = right, -1 = left
    this.onGround = false;
    this.jumpsUsed = 0;
    this.maxJumps = 2;

    this.hearts = 3;
    this.maxHearts = 3;
    this.invulnerable = 0;

    this.state = 'idle'; // idle, walk, run, jump, fall, land, hurt, celebrate
    this.animTime = 0;
    this.blinkTimer = randRange(2,5);
    this.tailPhase = 0;
    this.earPhase = 0;
    this.landTimer = 0;
    this.footstepTimer = 0;
    this.celebrateTimer = 0;
    this.squash = 1; // vertical squash/stretch factor
    this.moveHoldTime = 0;
    this.lastMoveDir = 0;

    this.checkpoint = {x, y};
    this.dead = false;
  }

  respawnAtCheckpoint(){
    this.x = this.checkpoint.x;
    this.y = this.checkpoint.y;
    this.vx = 0; this.vy = 0;
    this.invulnerable = 1.5;
    this.dead = false;
  }

  takeDamage(){
    if (this.invulnerable > 0) return false;
    this.hearts -= 1;
    this.invulnerable = 1.6;
    this.state = 'hurt';
    this.vy = -300;
    this.vx = -this.facing * 150;
    AudioEngine.playHurt();
    if (this.hearts <= 0){
      this.hearts = 0;
      this.dead = true;
    }
    return true;
  }

  heal(amount){
    this.hearts = Math.min(this.maxHearts, this.hearts + amount);
  }

  update(dt, platforms, wasOnGroundLast){
    // --- horizontal input (holding a direction builds up into a happy little sprint) ---
    let moveDir = 0;
    if (Input.left) moveDir -= 1;
    if (Input.right) moveDir += 1;

    if (moveDir !== 0 && moveDir === this.lastMoveDir){
      this.moveHoldTime += dt;
    } else {
      this.moveHoldTime = 0;
    }
    this.lastMoveDir = moveDir;

    const isRunning = this.moveHoldTime > 0.45;
    const targetSpeed = moveDir * (isRunning ? this.runSpeed : this.speed);
    this.vx = Physics.lerp(this.vx, targetSpeed, Math.min(1, dt*10));

    if (moveDir !== 0) this.facing = moveDir;

    // --- jump (with double jump) ---
    const jumpPressed = Input.consumeJumpPress();
    if (jumpPressed && this.jumpsUsed < this.maxJumps){
      this.vy = this.jumpsUsed === 0 ? this.jumpForce : this.doubleJumpForce;
      this.jumpsUsed++;
      this.squash = 1.3;
      if (this.jumpsUsed === 1){ AudioEngine.playJump(); }
      else { AudioEngine.playDoubleJump(); this.spawnJumpSparkle = true; }
    }

    // --- gravity ---
    this.vy = Physics.applyGravity(this.vy, dt);

    // --- collide ---
    const res = Physics.moveAndCollide(this, platforms, dt);
    this.onGround = res.onGround;
    if (res.hitCeiling && this.vy < 0) this.vy = 0;

    if (this.onGround){
      if (!wasOnGroundLast && this.vy === 0){
        this.landTimer = 0.18;
        AudioEngine.playLand();
        this.squash = 0.7;
      }
      this.jumpsUsed = 0;
    }

    // clamp world bounds handled by caller (world edges)

    // --- squash/stretch relax ---
    this.squash = Physics.lerp(this.squash, 1, Math.min(1, dt*8));

    // --- timers ---
    if (this.invulnerable > 0) this.invulnerable -= dt;
    if (this.landTimer > 0) this.landTimer -= dt;

    // --- animation state machine ---
    const speedAbs = Math.abs(this.vx);
    if (this.celebrateTimer > 0){
      this.state = 'celebrate';
      this.celebrateTimer -= dt;
    } else if (!this.onGround){
      this.state = this.vy < 0 ? 'jump' : 'fall';
    } else if (this.landTimer > 0){
      this.state = 'land';
    } else if (this.invulnerable > 0.9){
      this.state = 'hurt';
    } else if (speedAbs > 260){
      this.state = 'run';
    } else if (speedAbs > 15){
      this.state = 'walk';
    } else {
      this.state = 'idle';
    }

    this.animTime += dt;
    this.tailPhase += dt * (this.state==='run' ? 10 : this.state==='walk' ? 6 : 2.4);
    this.earPhase += dt * 3;

    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0){ this.blinkTimer = randRange(2.5, 5.5); this._blinking = 0.14; }
    if (this._blinking > 0) this._blinking -= dt;

    // footsteps
    if (this.onGround && (this.state === 'walk' || this.state === 'run')){
      this.footstepTimer -= dt;
      if (this.footstepTimer <= 0){
        AudioEngine.playFootstep();
        this.spawnDustPuff = true;
        this.footstepTimer = this.state === 'run' ? 0.22 : 0.34;
      }
    }
  }

  celebrate(){
    this.celebrateTimer = 999;
    this.vx = 0;
  }

  get cx(){ return this.x + this.w/2; }
  get cy(){ return this.y + this.h/2; }
}

function randRange(min, max){ return min + Math.random()*(max-min); }
