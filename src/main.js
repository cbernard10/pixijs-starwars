import { Application, Graphics } from "pixi.js";

const CELL_PIXEL_WIDTH = 2;
const CELL_PIXEL_HEIGHT = CELL_PIXEL_WIDTH;
const CELL_WIDTH = Math.floor(window.innerWidth / CELL_PIXEL_WIDTH);
const CELL_HEIGHT = Math.floor(window.innerHeight / CELL_PIXEL_HEIGHT);

const CELL_ALIVE = 1;
const CELL_DEAD = 0;

const BOARD_WIDTH = CELL_WIDTH + 2;
const BOARD_HEIGHT = CELL_HEIGHT + 2;
const LIVE_RATIO = 0.02;
const BACKGROUND_COLOR = "#000000";
const FPS = 144; // 10..60 (https://pixijs.download/dev/docs/PIXI.Ticker.html#maxFPS)

let board;
let neighbors;
let app;
let graphics;
let output;
let liveColor = "#ffffff"; // default is green
const B = [2];
const S = [3,4,5];
const N = 4;

// make a gradient from red to yellow

const predefinedColors = [
  { name: "red", value: 0xff0000 },
  { name: "green", value: 0x00ff00 },
  { name: "blue", value: 0x0000ff },
  { name: "yellow", value: 0xffff00 },
  { name: "cyan", value: 0x00ffff },
  { name: "magenta", value: 0xff00ff },
];

function hexToRgb(hex) {
  return {
    r: (hex >> 16) & 0xff,
    g: (hex >> 8) & 0xff,
    b: hex & 0xff,
  };
}

function rgbToHex(r, g, b) {
  return (r << 16) + (g << 8) + b;
}

function generateGradient(startColor, endColor, steps) {
  const startRGB = hexToRgb(startColor);
  const endRGB = hexToRgb(endColor);
  const stepFactor = 1 / (steps - 1);
  const gradient = [];

  for (let i = 0; i < steps; i++) {
    const r = Math.round(startRGB.r + stepFactor * i * (endRGB.r - startRGB.r));
    const g = Math.round(startRGB.g + stepFactor * i * (endRGB.g - startRGB.g));
    const b = Math.round(startRGB.b + stepFactor * i * (endRGB.b - startRGB.b));
    gradient.push(rgbToHex(r, g, b));
  }

  return gradient;
}

// Example usage: generate gradient from red to yellow
const startColor = predefinedColors.find((c) => c.name === "red").value;
const endColor = predefinedColors.find((c) => c.name === "magenta").value;
const colors = generateGradient(startColor, endColor, N);

// function shuffle() {
//   for (let i = board.length - 2; i >= 1; i -= 1) {
//     for (let j = board[i].length - 2; j >= 1; j -= 1) {
//       const rand = Math.floor(Math.random() * (j + 1) + 1);
//       const tmp = board[i][j];
//       board[i][j] = board[i][rand];
//       board[i][rand] = tmp;
//     }
//   }
// }

function shuffle() {
  // initialize the board with random values with bernoulli distribution
  for (let i = 1; i < BOARD_WIDTH - 1; i += 1) {
    for (let j = 1; j < BOARD_HEIGHT - 1; j += 1) {
      board[i][j] = Math.random() < LIVE_RATIO ? CELL_ALIVE : CELL_DEAD;
    }
  }
}

function draw() {
  for (let k = 1; k < N; k += 1) {
    for (let i = 1; i < BOARD_WIDTH - 1; i += 1) {
      for (let j = 1; j < BOARD_HEIGHT - 1; j += 1) {
        if (board[i][j] > 0 && board[i][j] === k) {
          graphics.rect(
            (i - 1) * CELL_PIXEL_WIDTH,
            (j - 1) * CELL_PIXEL_HEIGHT,
            CELL_PIXEL_WIDTH,
            CELL_PIXEL_HEIGHT
          );
        }
        // graphics.endFill();
      }
      // if (board[i][j] === CELL_ALIVE) {
      //   graphics.rect(
      //     (i - 1) * CELL_PIXEL_WIDTH,
      //     (j - 1) * CELL_PIXEL_HEIGHT,
      //     CELL_PIXEL_WIDTH,
      //     CELL_PIXEL_HEIGHT,
      //   );
      //   graphics.fill(colors[board[i][j]]);
      // }
    }

    graphics.fill(colors[k]);
  }
}

function countNeighbors(i, j) {
  // top-left
  return (
    (board[i - 1][j - 1] === CELL_ALIVE) +
    // top-middle
    (board[i - 1][j] === CELL_ALIVE) +
    // top - right
    (board[i - 1][j + 1] === CELL_ALIVE) +
    // middle - left
    (board[i][j - 1] === CELL_ALIVE) +
    // middle - right
    (board[i][j + 1] === CELL_ALIVE) +
    // bottom - left
    (board[i + 1][j - 1] === CELL_ALIVE) +
    // bottom - middle
    (board[i + 1][j] === CELL_ALIVE) +
    // bottom - right
    (board[i + 1][j + 1] === CELL_ALIVE)
  );
}

function nextGeneration() {
  for (let i = 1; i < BOARD_WIDTH - 1; i += 1) {
    for (let j = 1; j < BOARD_HEIGHT - 1; j += 1) {
      neighbors[i][j] = countNeighbors(i, j);
    }
  }

  for (let i = 1; i < BOARD_WIDTH - 1; i += 1) {
    for (let j = 1; j < BOARD_HEIGHT - 1; j += 1) {
      if (board[i][j] === CELL_ALIVE) {
        if (!S.includes(neighbors[i][j])) {
          board[i][j] += 1;
        }
      } else if (board[i][j] === CELL_DEAD) {
        if (B.includes(neighbors[i][j])) {
          board[i][j] = CELL_ALIVE;
        }
      } else {
        board[i][j] = (board[i][j] + 1) % N;
      }
    }
  }
}

function initBoard() {
  for (let i = 1; i < BOARD_WIDTH - 1; i += 1) {
    for (let j = 1; j < Math.round(CELL_HEIGHT * LIVE_RATIO); j += 1) {
      board[i][j] = CELL_ALIVE;
    }
  }
}

function regenerate() {
  // restart the game
  liveColor = document.getElementById("color").value;

  if (app.ticker.started) {
    document.getElementById("start").textContent = "Start";
    app.ticker.remove(gameloop);
  }

  for (let i = 1; i < BOARD_WIDTH - 1; i += 1) {
    for (let j = 1; j < BOARD_HEIGHT - 1; j += 1) {
      board[i][j] = CELL_DEAD;
    }
  }
  initBoard();
  shuffle();
  graphics.clear();
  draw();
}

(async () => {
  const app = new Application();

  await app.init({
    resizeTo: window,
    antialias: true,
    backgroundColor: 0x000000,
  });
  app.canvas.style.position = "absolute";
  graphics = new Graphics();
  app.stage.addChild(graphics);

  output = document.querySelector("#fps");
  app.ticker.maxFPS = FPS;

  // board init
  board = Array(BOARD_WIDTH);
  for (let i = 0; i < BOARD_WIDTH; i += 1) {
    board[i] = Array(BOARD_HEIGHT).fill(0);
  }

  initBoard();

  // neighbors init
  neighbors = Array(BOARD_WIDTH);
  for (let i = 0; i < BOARD_WIDTH; i += 1) {
    neighbors[i] = Array(BOARD_HEIGHT).fill(0);
  }

  shuffle();

  // app.ticker.add(() => {
  //   draw();
  // });

  function gameloop() {
    graphics.clear();
    nextGeneration();
    draw();
  }
  app.ticker.add(gameloop);

  document.body.appendChild(app.canvas);
})();
