const canvas = document.getElementById("sceneCanvas");
const ctx = canvas.getContext("2d");

// Grid configuration for the character-matrix aesthetic
const COLS = 135;
const ROWS = 78;
const CELL_W = 6.5;
const CELL_H = 8.5;

canvas.width = Math.floor(COLS * CELL_W);
canvas.height = Math.floor(ROWS * CELL_H);

const CHARS = ".:-=+*#%@01";
const skyline = [];
const snowFlakes = [];
const treeOrnaments = [];

// Generate procedural city skyline
for (let x = 0; x < COLS; x++) {
  if (x % 4 === 0) {
    skyline[x] = 14 + Math.floor(Math.random() * 18);
  } else {
    skyline[x] = skyline[x - 1];
  }
}

// Generate falling snow particles
for (let i = 0; i < 140; i++) {
  snowFlakes.push({
    x: Math.random() * COLS,
    y: Math.random() * ROWS,
    speed: 0.08 + Math.random() * 0.16,
    drift: (Math.random() - 0.5) * 0.05,
    size: Math.random() > 0.7 ? "*" : "."
  });
}

// Pre-generate ornaments & garland lights inside the tree triangle
const treeTop = 14;
const treeBottom = 64;
const treeCenterX = Math.floor(COLS * 0.45);

for (let y = treeTop + 3; y < treeBottom - 1; y++) {
  const progress = (y - treeTop) / (treeBottom - treeTop);
  const halfWidth = Math.floor(progress * 21);

  for (let x = treeCenterX - halfWidth; x <= treeCenterX + halfWidth; x++) {
    const rand = Math.random();
    if (rand < 0.16) {
      const colors = ["#ff3b3b", "#ffd93d", "#38bdf8", "#ffffff", "#ff7eb3"];
      treeOrnaments.push({
        x,
        y,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2
      });
    }
  }
}

function drawCell(col, row, char, color, glow = 0) {
  const px = col * CELL_W;
  const py = row * CELL_H;

  if (glow > 0) {
    ctx.shadowBlur = glow;
    ctx.shadowColor = color;
  } else {
    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = color;
  ctx.fillText(char, px, py);
}

function drawGiftBox(startX, startY, width, height, boxColor, ribbonColor) {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const x = startX + dx;
      const y = startY + dy;
      const isVerticalRibbon = Math.abs(dx - Math.floor(width / 2)) <= 1;
      const isHorizontalRibbon = dy === Math.floor(height / 2);

      if (isVerticalRibbon || isHorizontalRibbon) {
        drawCell(x, y, "#", ribbonColor, 6);
      } else {
        const shade = dy === 0 ? "#ff8a8a" : boxColor;
        drawCell(x, y, "=", shade, 2);
      }
    }
  }

  // Ribbon bow on top
  const midX = startX + Math.floor(width / 2);
  drawCell(midX - 2, startY - 1, "(", ribbonColor, 6);
  drawCell(midX - 1, startY - 1, "o", ribbonColor, 6);
  drawCell(midX, startY - 1, "*", "#ffffff", 8);
  drawCell(midX + 1, startY - 1, "o", ribbonColor, 6);
  drawCell(midX + 2, startY - 1, ")", ribbonColor, 6);
}

function render(time) {
  const t = time * 0.003;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "bold 9px monospace";
  ctx.textBaseline = "top";

  // 1. Upper-left small moon
  const smallMoonX = 16;
  const smallMoonY = 12;
  for (let y = smallMoonY - 4; y <= smallMoonY + 4; y++) {
    for (let x = smallMoonX - 5; x <= smallMoonX + 5; x++) {
      const dist = Math.hypot((x - smallMoonX) * 0.85, y - smallMoonY);
      if (dist <= 3.6) {
        drawCell(x, y, "@", "#e2f1ff", 10);
      }
    }
  }

  // 2. Large glowing cyan planet/moon on the right
  const bigMoonX = Math.floor(COLS * 0.87);
  const bigMoonY = 25;
  for (let y = bigMoonY - 11; y <= bigMoonY + 11; y++) {
    for (let x = bigMoonX - 13; x <= bigMoonX + 13; x++) {
      const dist = Math.hypot((x - bigMoonX) * 0.82, y - bigMoonY);
      if (dist <= 9.8) {
        const band = Math.sin(y * 0.9) > 0 ? "=" : "#";
        const color = dist > 8.2 ? "#1d6fa5" : "#4cc9f0";
        drawCell(x, y, band, color, 8);
      }
    }
  }

  // 3. Background city skyline silhouette
  const groundY = 65;
  for (let x = 0; x < COLS; x++) {
    const bHeight = skyline[x];
    const topY = groundY - bHeight;
    for (let y = topY; y < groundY; y++) {
      const isEdge = y === topY || x % 4 === 0;
      const char = isEdge ? ":" : ".";
      const color = isEdge ? "#1e3a5f" : "#0b192c";
      drawCell(x, y, char, color, 0);
    }
  }

  // 4. Ground snow reflections
  for (let y = groundY; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const wave = Math.sin(x * 0.25 + y * 0.6);
      const char = wave > 0.3 ? "=" : "-";
      const color = y < groundY + 3 ? "#1b4965" : "#102a43";
      drawCell(x, y, char, color, 0);
    }
  }

  // 5. Christmas Tree foliage
  for (let y = treeTop; y <= treeBottom; y++) {
    const progress = (y - treeTop) / (treeBottom - treeTop);
    const halfWidth = Math.floor(progress * 22);

    for (let x = treeCenterX - halfWidth; x <= treeCenterX + halfWidth; x++) {
      const edgeDist = halfWidth - Math.abs(x - treeCenterX);
      const charIdx = Math.min(
        CHARS.length - 1,
        Math.floor((edgeDist / (halfWidth + 1)) * 6 + (Math.sin(x + y) + 1) * 2)
      );
      const greenTone =
        edgeDist < 2
          ? "#80ed99"
          : (x + y) % 3 === 0
          ? "#38b000"
          : "#007200";
      drawCell(x, y, CHARS[charIdx], greenTone, 3);
    }
  }

  // 6. Twinkling ornaments & lights on tree
  for (const orb of treeOrnaments) {
    const pulse = Math.sin(t * 2 + orb.phase);
    const isBright = pulse > 0.2;
    drawCell(
      orb.x,
      orb.y,
      isBright ? "@" : "o",
      isBright ? orb.color : "#70e000",
      isBright ? 10 : 0
    );
  }

  // 7. Glowing Tree Topper Star
  const starPoints = [
    [0, -3],
    [-1, -2], [0, -2], [1, -2],
    [-3, -1], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [3, -1],
    [-1, 0], [0, 0], [1, 0],
    [-2, 1], [0, 1], [2, 1]
  ];
  for (const [dx, dy] of starPoints) {
    drawCell(treeCenterX + dx, treeTop + dy, "*", "#fff3b0", 14);
  }

  // 8. Wrapped Gift Boxes at the base of the tree
  drawGiftBox(13, 60, 11, 9, "#c1121f", "#fcbf49");
  drawGiftBox(24, 63, 14, 7, "#9b2226", "#eae2b7");
  drawGiftBox(38, 65, 9, 6, "#ae2012", "#ffd166");

  drawGiftBox(68, 64, 13, 7, "#9b2226", "#f8f9fa");
  drawGiftBox(81, 61, 16, 10, "#d62828", "#fcbf49");
  drawGiftBox(97, 64, 11, 7, "#ae2012", "#ffd166");

  // 9. Animated falling snow
  for (const flake of snowFlakes) {
    flake.y += flake.speed;
    flake.x += flake.drift;

    if (flake.y >= ROWS) {
      flake.y = 0;
      flake.x = Math.random() * COLS;
    }
    if (flake.x < 0) flake.x = COLS - 1;
    if (flake.x >= COLS) flake.x = 0;

    drawCell(
      Math.floor(flake.x),
      Math.floor(flake.y),
      flake.size,
      "#ffffff",
      flake.size === "*" ? 6 : 0
    );
  }

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
