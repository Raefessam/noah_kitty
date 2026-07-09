# 🐱 Learn With Noah: How Luna's Game Was Made

Hi Noah! 👋

You just played a whole video game that YOU can look inside and understand. This little guide explains, in simple words, how it all works. Ready? Let's go! 🚀

---

## 🌐 What is HTML?

HTML is like the **skeleton** of a website or game. It says what things exist: "here's a button," "here's a picture," "here's the game screen." It doesn't decide what color things are or where exactly they go — just what's there.

Think of HTML like the blueprint of a house: "there's a kitchen, there's a bedroom" — but no paint colors yet!

## 🎨 What is CSS?

CSS is the **paint and decoration**. It makes things pretty — colors, rounded corners, how big the buttons are, where they sit on the screen. Our menu buttons are orange and round because of CSS!

If HTML is the blueprint, CSS is choosing the wallpaper, the paint, and where the furniture goes.

## ⚙️ What is JavaScript?

JavaScript is what makes things **move and think**. It's the brain of the game! It decides: "Did Noah press jump? Then make Luna go up!" Every time Luna moves, every time you collect a fish, that's JavaScript working.

## 📦 What is a Variable?

A variable is like a **labeled box** where we keep a piece of information. For example, we have a box called `hearts` that holds the number of lives Luna has left. When Luna gets hurt, we open the box, take one heart out, and close it again.

```js
let hearts = 3;   // Luna starts with 3 hearts
hearts = hearts - 1;  // Ouch! Now she has 2
```

## 🔧 What is a Function?

A function is a **recipe** — a list of steps you can use again and again just by saying its name. We have a function called `playJump()` that always makes the jump sound. Instead of writing "make this sound" every single time Luna jumps, we just say `playJump()` and the recipe runs!

## 🧩 What is an Object?

An object is a way of **grouping related things together**, like a backpack that holds everything about one thing. Luna herself is an object — she holds her position, her speed, how many hearts she has, all packed into one thing called `player`.

```js
player.hearts = 3;
player.x = 100;   // how far right Luna is
```

## 🌎 What is Gravity?

In real life, gravity pulls everything down towards the ground — that's why when you jump, you always come back down! In the game, we add a little bit of "downward push" to Luna every single moment, so she naturally falls back to the ground after jumping, just like you do!

## 💥 What is Collision?

Collision is how the game knows when two things **touch each other**. When Luna's body touches a fish, that's a collision — and that's when we say "yay, collected!" and make the fish disappear. When Luna's feet touch the ground, that's also a collision — it's what stops her from falling forever!

## 🦘 How Jumping Works

1. You press the jump button.
2. The game gives Luna a big push **upward** (a burst of upward speed).
3. Gravity immediately starts pulling her back down, a little more each moment.
4. She goes up, slows down, stops for a tiny moment at the top, then comes back down faster and faster.
5. When her feet touch a platform (a collision!), she stops falling.

That's exactly how a real jump feels, just written in numbers!

## 🪵 How Platforms Work

A platform is just a rectangle floating in the game world. Every moment, the game checks: "Is Luna's rectangle touching the platform's rectangle?" If yes, and she was falling, we stop her from falling through it — like solid ground.

## 🏆 How Score Works

Every time you collect something, we add points to another labeled box called `score`:

```js
score = score + 10;   // collecting a fish adds 10 points
```

Stars are worth more (50 points) because they're a little trickier to reach — a reward for being brave and exploring!

---

## 💛 One day, Noah, you'll build games even bigger than this.

Love, Dad.
