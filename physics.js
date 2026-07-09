/* ==========================================================
   Noah's Kitty Adventure — physics.js
   Simple, friendly platformer physics (AABB collision).
   ========================================================== */

const Physics = {
  GRAVITY: 1800,        // px/s^2
  MAX_FALL_SPEED: 1100,
  FRICTION: 0.82,        // ground friction multiplier per frame-ish (applied with dt scaling)

  /** Basic axis-aligned bounding box overlap test */
  aabbOverlap(a, b){
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
  },

  /** Apply gravity to a velocity, clamped to max fall speed */
  applyGravity(vy, dt){
    let out = vy + Physics.GRAVITY * dt;
    if (out > Physics.MAX_FALL_SPEED) out = Physics.MAX_FALL_SPEED;
    return out;
  },

  /**
   * Resolve movement of an entity (x,y,w,h,vx,vy) against a list of solid
   * platform rectangles, one axis at a time to avoid tunneling weirdness.
   * Returns { onGround, hitCeiling, hitWallLeft, hitWallRight }
   */
  moveAndCollide(entity, platforms, dt){
    const result = { onGround:false, hitCeiling:false, hitWallLeft:false, hitWallRight:false };

    // --- horizontal ---
    entity.x += entity.vx * dt;
    for (const p of platforms){
      if (!Physics.aabbOverlap(entity, p)) continue;
      if (p.oneWay) continue; // one-way platforms only block from above
      if (entity.vx > 0){
        entity.x = p.x - entity.w;
        entity.vx = 0;
        result.hitWallRight = true;
      } else if (entity.vx < 0){
        entity.x = p.x + p.w;
        entity.vx = 0;
        result.hitWallLeft = true;
      }
    }

    // --- vertical ---
    const prevBottom = entity.y + entity.h;
    entity.y += entity.vy * dt;
    for (const p of platforms){
      if (!Physics.aabbOverlap(entity, p)) continue;

      if (p.oneWay){
        // Only collide when falling and was above the platform previously
        if (entity.vy >= 0 && prevBottom <= p.y + 2){
          entity.y = p.y - entity.h;
          entity.vy = 0;
          result.onGround = true;
        }
        continue;
      }

      if (entity.vy > 0){
        entity.y = p.y - entity.h;
        entity.vy = 0;
        result.onGround = true;
      } else if (entity.vy < 0){
        entity.y = p.y + p.h;
        entity.vy = 0;
        result.hitCeiling = true;
      }
    }

    return result;
  },

  clamp(v, min, max){
    return Math.max(min, Math.min(max, v));
  },

  lerp(a, b, t){
    return a + (b - a) * t;
  }
};
