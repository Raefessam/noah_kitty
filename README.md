# 🐱 Noah's Kitty Adventure v1.0

A cozy, colorful 2D platform-adventure game built for **Noah**, starring his cute orange kitten, **Luna**.

Play through 10 hand-crafted levels of the Sunny Forest — collect fish 🐟, stars ⭐ and hearts ❤️, cross wooden bridges over babbling rivers, hop across mushroom steps, and reach the flag at the end of every level!

There are **no enemies** in this version — it's all about exploring, jumping, and having fun. 🌈

---

## ▶️ How to Play

Just open **`index.html`** in any modern web browser. That's it — no installation, no internet connection required!

**Desktop controls**
| Action | Keys |
|---|---|
| Move | Arrow Keys or `A` / `D` |
| Jump | `↑`, `W`, or `Space` (press again in the air to **double jump**!) |
| Pause | `Esc` or `P` |

**Mobile / tablet controls**

Big friendly on-screen buttons appear automatically on touch devices: `◀` `▶` to move and a big jump button.

---

## 🗂 Project Structure

```
Noahs-Kitty-Adventure-v1.0/
├── index.html              Main HTML file — all screens & the canvas
├── style.css                All visual styling (menus, HUD, buttons)
├── game.js                  Main game loop & state machine
├── ui.js                    Screen navigation, HUD, level-select, settings
├── player.js                 Luna the kitten: movement & animation
├── world.js                  All 10 level layouts (Sunny Forest)
├── physics.js                Gravity & collision detection
├── input.js                  Keyboard + touch controls
├── audio.js                  All sound effects & music (Web Audio API — no sound files!)
├── renderer.js                Draws everything to the canvas, including Luna herself
├── particles.js               Sparkles, leaves & celebration effects
├── assets/                    (kept for future artwork — currently empty; everything is drawn with code!)
├── README.md                  This file
├── LEARN_WITH_NOAH.md          A kid-friendly explanation of how the game works
└── LICENSE
```

### How it fits together

1. **`index.html`** loads all the scripts in order and lays out every screen (menu, level select, HUD, pause, win, game over) as simple `<div>`s that get shown/hidden.
2. **`game.js`** is the conductor. Its `loop()` function runs 60 times per second, calling `update()` then `render()`.
3. **`player.js`** owns Luna's physics and her little animation state machine (idle → walk → run → jump → fall → land → hurt → celebrate).
4. **`world.js`** describes each of the 10 levels using a tiny readable "builder" language (`ground()`, `gap()`, `platform()`, `fishAt()`, etc.) so new levels are easy to add.
5. **`renderer.js`** draws the sky, parallax hills, ground, decorations, collectibles, and Luna herself — entirely with canvas shapes (circles, curves, rounded rectangles). No image files needed!
6. **`audio.js`** generates every sound effect live using the Web Audio API's oscillators and noise bursts — footsteps, jumps, collecting fish/stars/hearts, victory fanfares, and a gentle looping background melody.
7. **`ui.js`** wires up all the buttons and manages progress (which levels are unlocked, medals earned) using `localStorage` when available.

---

## 🌐 How to Publish on GitHub Pages

1. Create a new GitHub repository (or use an existing one).
2. Upload **all the files in this folder** to the repository (keeping the same file names/structure).
3. Go to your repository's **Settings → Pages**.
4. Under "Build and deployment", choose **Deploy from a branch**, pick your main branch and the `/ (root)` folder, then click **Save**.
5. Wait a minute or two, then visit the URL GitHub gives you (something like `https://yourusername.github.io/your-repo-name/`).

You can also drag-and-drop the whole folder onto **Netlify Drop** (netlify.com/drop) for instant hosting — no account required.

---

## 🛠 How Noah Can Modify the Game Later

Everything is plain, commented JavaScript — no build tools, no npm, nothing to install. Just edit a file and refresh the browser!

Some fun starting points:

- **Change Luna's colors** → look for `#f5a856` (her fur color) in `renderer.js`, inside `drawPlayer()`.
- **Make Luna jump higher** → change `jumpForce` in `player.js` (a bigger negative number = a higher jump).
- **Add a new level** → copy one of the level blocks in `world.js`, give it a new `id`, and add new platforms/collectibles with the builder methods.
- **Add more hearts (lives)** → change `maxHearts` in `player.js`.
- **Write new sounds** → `audio.js` has simple examples using `_osc()` (a musical tone) and `_noiseBurst()` (a whoosh/thud sound).

Have fun building, Noah! 🐾

---

## ✅ Tested

- Runs at a smooth 60 FPS with object-pooled particles (no memory leaks).
- No external dependencies, no build step — works fully offline once downloaded.
- Verified across desktop, and responsive/touch layouts for phones & tablets in both portrait and landscape.
