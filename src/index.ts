import init, { Universe, Cell } from "wasm_game_of_life";
class FPS {
  fps: HTMLDivElement;
  frames: number[];
  lastFrameTimeStamp: number;

  constructor() {
    this.fps = document.getElementById("fps") as HTMLDivElement;
    this.frames = [];
    this.lastFrameTimeStamp = performance.now();
  }

  render() {
    // Convert the delta time since the last frame render into a measure
    // of frames per second.
    const now = performance.now();
    const delta = now - this.lastFrameTimeStamp;
    this.lastFrameTimeStamp = now;
    const fps = (1 / delta) * 1000;

    // Save only the latest 100 timings.
    this.frames.push(fps);
    if (this.frames.length > 100) {
      this.frames.shift();
    }

    // Find the max, min, and mean of our 100 latest timings.
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    for (let i = 0; i < this.frames.length; i++) {
      sum += this.frames[i];
      min = Math.min(this.frames[i], min);
      max = Math.max(this.frames[i], max);
    }
    let mean = sum / this.frames.length;

    // Render the statistics.
    this.fps.textContent = `
         Frames per Second: latest = ${Math.round(fps)}
        avg of last 100 = ${Math.round(mean)}
        min of last 100 = ${Math.round(min)}
        max of last 100 = ${Math.round(max)}
`.trim();
  }
}

//---

init().then((raw) => {
  console.log("init wasm-pack", raw.memory);

  const fps = new FPS();

  const CELL_SIZE = 5;
  const GRID_COLOR = "#CCCCCC";
  const DEAD_COLOR = "#FFFFFF";
  const ALIVE_COLOR = "#000000";

  const universe = Universe.new();
  const width = universe.width();
  const height = universe.height();

  console.log("init wasm-pack", raw.memory);
  //   const pre = document.getElementById("game-of-life-canvas");
  const canvas = document.getElementById(
    "game-of-life-canvas"
  ) as HTMLCanvasElement;

  canvas.height = (CELL_SIZE + 1) * height + 1;
  canvas.width = (CELL_SIZE + 1) * width + 1;

  const ctx = canvas.getContext("2d");

  canvas.addEventListener("click", (event) => {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * 1;
    const canvasTop = (event.clientY - boundingRect.top) * 1;
    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

    universe.toggle_cell(row, col);
    drawGrid();
    drawCells();
  });

  const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // 垂直线
    for (let i = 0; i <= width; i++) {
      ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
      ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }

    // Horizontal lines.
    for (let j = 0; j <= height; j++) {
      ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
      ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }
    ctx.stroke();
  };

  const getIndex = (row, column) => {
    return row * width + column;
  };

  const drawCells = () => {
    const cellsPtr = universe.cells(); // byteOffset
    const cells = new Uint8Array(raw.memory.buffer, cellsPtr, width * height);

    ctx.beginPath();

    ctx.fillStyle = ALIVE_COLOR;
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const idx = getIndex(row, col);

        ctx.fillStyle = cells[idx] === Cell.Dead ? DEAD_COLOR : ALIVE_COLOR;

        ctx.fillRect(
          col * (CELL_SIZE + 1) + 1,
          row * (CELL_SIZE + 1) + 1,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }

    ctx.stroke();
  };

  const isPaused = () => {
    return animationId === null;
  };

  let animationId: number | null = null;
  //   pre.textContent = universe.render();
  const renderLoop = () => {
    // pre.textContent = universe.render();
    fps.render();

    drawGrid();
    drawCells();
    // for (let i = 0; i < 90; i++) {
    universe.tick();
    // }
    // universe.tick();
    animationId = requestAnimationFrame(renderLoop);
  };

  const playPauseButton = document.getElementById("play-pause");

  const play = () => {
    playPauseButton.textContent = "⏸";
    renderLoop();
  };

  const pause = () => {
    playPauseButton.textContent = "▶";
    cancelAnimationFrame(animationId);
    animationId = null;
  };

  playPauseButton.addEventListener("click", (event) => {
    if (isPaused()) {
      play();
    } else {
      pause();
    }
  });

  play();
});
