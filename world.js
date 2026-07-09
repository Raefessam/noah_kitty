/* ==========================================================
   Noah's Kitty Adventure — world.js
   World 1: Sunny Forest. Ten hand-tuned levels of increasing
   (but always friendly) difficulty. Logical/world coordinates
   are independent of screen pixels; the renderer + camera
   handle scaling to whatever device is used.
   ========================================================== */

const WORLD = {
  GROUND_Y: 560,          // top surface of the main ground
  WORLD_HEIGHT: 720,      // logical vertical space
  GRAVITY_FLOOR: 900      // y below which the player respawns (fell in a gap)
};

/**
 * Tiny builder DSL to keep 10 levels readable & maintainable.
 * Every level starts at x=0 with solid ground unless a gap()
 * is inserted. Platforms/collectibles are placed with explicit
 * world coordinates for full control over difficulty curve.
 */
class LevelBuilder {
  constructor(id, name){
    this.id = id;
    this.name = name;
    this.groundSegments = []; // {x1,x2}
    this.platforms = [];      // {x,y,w,h,oneWay}
    this.fish = [];
    this.stars = [];
    this.hearts = [];
    this.checkpoints = [];    // x positions
    this.decor = { trees:[], flowers:[], mushrooms:[], bridges:[], rivers:[], butterflies:[], birds:[] };
    this.cursor = 0;
    this.groundStart = 0;
  }

  ground(len){
    const x1 = this.cursor;
    const x2 = this.cursor + len;
    this.groundSegments.push({x1, x2});
    this.cursor = x2;
    return this;
  }

  gap(len){
    this.cursor += len;
    return this;
  }

  platform(dx, y, w, oneWay=true){
    this.platforms.push({x:this.cursor + dx, y, w, h:20, oneWay});
    return this;
  }

  fishAt(dx, y, count=1, spacing=34){
    for (let i=0;i<count;i++) this.fish.push({x:this.cursor+dx+i*spacing, y, collected:false});
    return this;
  }
  starAt(dx, y){ this.stars.push({x:this.cursor+dx, y, collected:false}); return this; }
  heartAt(dx, y){ this.hearts.push({x:this.cursor+dx, y, collected:false}); return this; }

  checkpoint(){ this.checkpoints.push(this.cursor); return this; }

  tree(dx){ this.decor.trees.push({x:this.cursor+dx, y:WORLD.GROUND_Y, scale:0.8+Math.random()*0.6}); return this; }
  flower(dx){ this.decor.flowers.push({x:this.cursor+dx, y:WORLD.GROUND_Y}); return this; }
  mushroom(dx){ this.decor.mushrooms.push({x:this.cursor+dx, y:WORLD.GROUND_Y}); return this; }
  bridge(dx, w){ this.decor.bridges.push({x:this.cursor+dx, y:WORLD.GROUND_Y-6, w}); return this; }
  river(dx, w){ this.decor.rivers.push({x:this.cursor+dx, y:WORLD.GROUND_Y+30, w}); return this; }
  butterfly(dx, y){ this.decor.butterflies.push({x:this.cursor+dx, y, phase:Math.random()*10}); return this; }
  bird(dx, y){ this.decor.birds.push({x:this.cursor+dx, y, phase:Math.random()*10}); return this; }

  finish(){
    const flagX = this.cursor - 60;
    return {
      id: this.id,
      name: this.name,
      width: this.cursor + 200,
      groundY: WORLD.GROUND_Y,
      groundSegments: this.groundSegments,
      platforms: this.platforms,
      fish: this.fish,
      stars: this.stars,
      hearts: this.hearts,
      checkpoints: this.checkpoints,
      decor: this.decor,
      flag: {x: flagX, y: WORLD.GROUND_Y - 90},
      spawn: {x: 80, y: WORLD.GROUND_Y - 60}
    };
  }
}

const LEVELS = [];

// ---------- Level 1: A gentle stroll ----------
{
  const b = new LevelBuilder(1, 'Sunny Meadow');
  b.ground(500);
  b.tree(60).flower(150).flower(220).mushroom(300).tree(420);
  b.fishAt(180, 500, 3);
  b.butterfly(260, 420);
  b.checkpoint();
  b.platform(0, 460, 120);
  b.fishAt(30, 420, 2);
  b.ground(400);
  b.tree(80).flower(200).mushroom(340);
  b.starAt(250, 470);
  b.heartAt(350, 500);
  b.bird(150, 300);
  LEVELS.push(b.finish());
}

// ---------- Level 2: First little hop ----------
{
  const b = new LevelBuilder(2, 'Hop Along Hill');
  b.ground(400);
  b.tree(50).flower(150).mushroom(280);
  b.fishAt(150, 500, 3);
  b.checkpoint();
  b.gap(90);
  b.ground(300);
  b.flower(60).tree(200);
  b.platform(0, 470, 110);
  b.fishAt(20, 430, 2);
  b.starAt(220, 500);
  b.butterfly(180, 380);
  b.checkpoint();
  b.ground(420);
  b.tree(100).mushroom(260).flower(340);
  b.platform(80, 480, 120);
  b.heartAt(120, 440);
  b.bird(300, 280);
  LEVELS.push(b.finish());
}

// ---------- Level 3: Wooden bridges ----------
{
  const b = new LevelBuilder(3, 'Bridge Over Babbling Brook');
  b.ground(350);
  b.tree(40).flower(140);
  b.fishAt(120, 500, 3);
  b.checkpoint();
  b.river(0, 130); b.bridge(0, 130);
  b.ground(130);
  b.starAt(40, 500);
  b.gap(80);
  b.ground(260);
  b.mushroom(60).tree(180);
  b.platform(0, 460, 100);
  b.fishAt(20, 420, 3, 30);
  b.checkpoint();
  b.river(0,150); b.bridge(0,150);
  b.ground(150);
  b.butterfly(60, 400);
  b.gap(70);
  b.ground(360);
  b.tree(60).flower(180).mushroom(300);
  b.platform(120, 480, 130);
  b.heartAt(160, 440);
  b.starAt(300, 500);
  b.bird(200, 260);
  LEVELS.push(b.finish());
}

// ---------- Level 4: Mushroom steps ----------
{
  const b = new LevelBuilder(4, 'Mushroom Steps');
  b.ground(320);
  b.tree(40).mushroom(180);
  b.fishAt(100, 500, 3);
  b.checkpoint();
  b.gap(90);
  b.ground(120);
  b.starAt(40, 500);
  b.gap(90);
  b.ground(200);
  b.platform(0, 470, 100);
  b.platform(120, 400, 100);
  b.fishAt(10, 430, 2);
  b.fishAt(130, 360, 2);
  b.checkpoint();
  b.ground(60);
  b.gap(70);
  b.ground(350);
  b.tree(60).flower(180).mushroom(280);
  b.platform(60, 470, 110);
  b.platform(220, 420, 110);
  b.heartAt(90, 430);
  b.starAt(250, 380);
  b.butterfly(150, 320);
  b.bird(280, 260);
  LEVELS.push(b.finish());
}

// ---------- Level 5: Double jump valley ----------
{
  const b = new LevelBuilder(5, 'Double-Jump Valley');
  b.ground(280);
  b.tree(50);
  b.fishAt(90, 500, 3);
  b.checkpoint();
  b.gap(150); // requires confident jump / early double-jump practice
  b.platform(30, 440, 100);
  b.ground(200);
  b.starAt(40, 500);
  b.gap(140);
  b.platform(20, 430, 90);
  b.ground(180);
  b.fishAt(30, 500, 2);
  b.checkpoint();
  b.gap(160);
  b.platform(20, 400, 90);
  b.platform(150, 460, 90);
  b.ground(300);
  b.tree(60).flower(180).mushroom(260);
  b.heartAt(100, 500);
  b.starAt(220, 500);
  b.bird(180, 260);
  b.butterfly(240, 400);
  LEVELS.push(b.finish());
}

// ---------- Level 6: Sky garden ----------
{
  const b = new LevelBuilder(6, 'Sky Garden');
  b.ground(260);
  b.tree(40);
  b.fishAt(90, 500, 2);
  b.checkpoint();
  b.platform(0, 480, 90);
  b.platform(120, 410, 90);
  b.platform(240, 340, 90);
  b.fishAt(140, 370, 2);
  b.starAt(260, 300);
  b.gap(360);
  b.ground(60);
  b.checkpoint();
  b.platform(-40, 460, 90);
  b.platform(80, 380, 90);
  b.platform(200, 440, 90);
  b.fishAt(90, 340, 2);
  b.heartAt(210, 400);
  b.gap(340);
  b.ground(380);
  b.tree(70).flower(200).mushroom(320);
  b.platform(60, 460, 110);
  b.starAt(90, 420);
  b.butterfly(200, 320);
  b.bird(300, 250);
  LEVELS.push(b.finish());
}

// ---------- Level 7: Twin rivers ----------
{
  const b = new LevelBuilder(7, 'Twin Rivers');
  b.ground(220);
  b.tree(30);
  b.fishAt(70, 500, 2);
  b.checkpoint();
  b.river(0,140); b.bridge(0,60); // partial bridge, gap remains at end requiring jump
  b.ground(60);
  b.gap(90);
  b.ground(160);
  b.starAt(40, 500);
  b.platform(0, 450, 90);
  b.checkpoint();
  b.gap(100);
  b.platform(10, 400, 90);
  b.ground(150);
  b.fishAt(20, 500, 2);
  b.river(0,150); b.bridge(0,90);
  b.ground(90);
  b.gap(80);
  b.ground(300);
  b.tree(50).mushroom(180).flower(260);
  b.platform(60, 470, 100);
  b.platform(190, 400, 100);
  b.heartAt(90, 430);
  b.starAt(210, 360);
  b.bird(150, 260);
  b.butterfly(230, 320);
  LEVELS.push(b.finish());
}

// ---------- Level 8: High branches ----------
{
  const b = new LevelBuilder(8, 'High Branches');
  b.ground(220);
  b.tree(40);
  b.fishAt(80, 500, 2);
  b.checkpoint();
  b.platform(0, 470, 90);
  b.platform(110, 390, 90);
  b.platform(220, 310, 90);
  b.fishAt(120, 350, 2);
  b.starAt(230, 270);
  b.gap(380);
  b.ground(60);
  b.checkpoint();
  b.platform(-30, 460, 80);
  b.platform(70, 380, 80);
  b.platform(170, 300, 80);
  b.platform(270, 380, 80);
  b.fishAt(80, 340, 2);
  b.heartAt(180, 260);
  b.gap(390);
  b.ground(70);
  b.checkpoint();
  b.platform(-20, 480, 90);
  b.platform(90, 420, 90);
  b.gap(120);
  b.ground(360);
  b.tree(60).flower(200).mushroom(300);
  b.starAt(120, 500);
  b.bird(200, 250);
  b.butterfly(260, 340);
  LEVELS.push(b.finish());
}

// ---------- Level 9: Forest maze of platforms ----------
{
  const b = new LevelBuilder(9, 'Tangled Treetops');
  b.ground(200);
  b.fishAt(60, 500, 2);
  b.checkpoint();
  b.platform(0, 460, 80);
  b.platform(100, 390, 80);
  b.platform(0, 320, 80);
  b.platform(120, 260, 80);
  b.fishAt(20, 280, 2);
  b.starAt(140, 220);
  b.gap(360);
  b.ground(60);
  b.checkpoint();
  b.platform(-20, 470, 80);
  b.platform(80, 400, 80);
  b.platform(190, 460, 80);
  b.platform(300, 380, 80);
  b.fishAt(90, 360, 2);
  b.heartAt(310, 340);
  b.gap(400);
  b.ground(60);
  b.checkpoint();
  b.platform(-10, 450, 80);
  b.platform(90, 380, 80);
  b.platform(190, 320, 80);
  b.platform(290, 260, 80);
  b.starAt(300, 220);
  b.gap(360);
  b.ground(340);
  b.tree(50).flower(160).mushroom(260);
  b.platform(60, 460, 100);
  b.heartAt(90, 420);
  b.bird(200, 240);
  b.butterfly(150, 300);
  LEVELS.push(b.finish());
}

// ---------- Level 10: Rainbow finish line ----------
{
  const b = new LevelBuilder(10, 'Rainbow Finish Line');
  b.ground(220);
  b.tree(30);
  b.fishAt(70, 500, 2);
  b.checkpoint();
  b.platform(0, 460, 80);
  b.platform(100, 390, 80);
  b.gap(230);
  b.ground(60);
  b.starAt(20, 500);
  b.checkpoint();
  b.platform(-10, 460, 80);
  b.platform(90, 390, 80);
  b.platform(190, 320, 80);
  b.fishAt(100, 350, 2);
  b.gap(300);
  b.ground(60);
  b.heartAt(10, 500);
  b.checkpoint();
  b.river(0, 150); b.bridge(0, 90);
  b.ground(90);
  b.gap(90);
  b.platform(10, 400, 90);
  b.ground(140);
  b.starAt(30, 500);
  b.checkpoint();
  b.platform(-20, 450, 80);
  b.platform(80, 380, 80);
  b.platform(180, 320, 80);
  b.platform(280, 260, 80);
  b.fishAt(90, 340, 2);
  b.fishAt(190, 280, 2);
  b.heartAt(290, 220);
  b.gap(340);
  b.ground(420);
  b.tree(60).tree(340).flower(160).flower(260).mushroom(220);
  b.platform(120, 460, 140);
  b.starAt(150, 420);
  b.bird(200, 220).bird(260, 260);
  b.butterfly(180, 320).butterfly(240, 360);
  LEVELS.push(b.finish());
}

const World = {
  loadLevel(index){
    const data = LEVELS[index-1];
    if (!data) return null;
    // deep-ish clone so replays reset collected flags
    return JSON.parse(JSON.stringify(data));
  },
  totalLevels(){ return LEVELS.length; }
};
