/* ==========================================================
   Noah's Kitty Adventure — input.js
   Keyboard (Arrows / WASD / Space) + large touch buttons.
   ========================================================== */

const Input = {
  left:false, right:false, jumpPressed:false, jumpHeld:false,
  _jumpConsumed:false,

  init(){
    window.addEventListener('keydown', (e)=>{
      switch(e.code){
        case 'ArrowLeft': case 'KeyA': this.left = true; break;
        case 'ArrowRight': case 'KeyD': this.right = true; break;
        case 'ArrowUp': case 'KeyW': case 'Space':
          if (!this.jumpHeld) this.jumpPressed = true;
          this.jumpHeld = true;
          e.preventDefault();
          break;
        case 'Escape': case 'KeyP':
          if (window.Game) Game.togglePause();
          break;
      }
    });
    window.addEventListener('keyup', (e)=>{
      switch(e.code){
        case 'ArrowLeft': case 'KeyA': this.left = false; break;
        case 'ArrowRight': case 'KeyD': this.right = false; break;
        case 'ArrowUp': case 'KeyW': case 'Space':
          this.jumpHeld = false; break;
      }
    });

    // Touch controls
    const bindHold = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      const down = (e)=>{ e.preventDefault(); onDown(); };
      const up = (e)=>{ e.preventDefault(); onUp(); };
      el.addEventListener('touchstart', down, {passive:false});
      el.addEventListener('touchend', up, {passive:false});
      el.addEventListener('touchcancel', up, {passive:false});
      el.addEventListener('mousedown', down);
      el.addEventListener('mouseup', up);
      el.addEventListener('mouseleave', up);
    };

    bindHold('btn-left', ()=>this.left=true, ()=>this.left=false);
    bindHold('btn-right', ()=>this.right=true, ()=>this.right=false);
    bindHold('btn-jump',
      ()=>{ if(!this.jumpHeld) this.jumpPressed = true; this.jumpHeld = true; },
      ()=>{ this.jumpHeld = false; }
    );
  },

  /** Call once per frame after using jumpPressed to reset the "just pressed" edge */
  consumeJumpPress(){
    const val = this.jumpPressed;
    this.jumpPressed = false;
    return val;
  },

  isMobile(){
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  }
};
