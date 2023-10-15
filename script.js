import Grid from "./Grid.js";
import Tile from "./Tile.js";

const gameBoard = document.getElementById("game-board");

const grid = new Grid(gameBoard);
let score = 0;
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best");

bestScoreElement.textContent =
  "Best: " + localStorage.getItem("bestScore") || 0;

grid.randomEmptyCell().tile = new Tile(gameBoard);
grid.randomEmptyCell().tile = new Tile(gameBoard);

window.addEventListener(
  "keydown",
  function (e) {
    if (
      ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(
        e.code
      ) > -1
    ) {
      e.preventDefault();
    }
  },
  false
);
function setupInput() {
  window.addEventListener("keyup", handleInput, { once: true });
  gameBoard.addEventListener("touchstart", handleTouchStart, { once: true });
}

setupInput();
async function handleInput(e) {
  e.preventDefault();
  switch (e.key) {
    case "ArrowUp":
      if (!canMoveUp()) {
        setupInput();
        return;
      }
      await moveUp();
      break;
    case "ArrowDown":
      if (!canMoveDown()) {
        setupInput();
        return;
      }
      await moveDown();
      break;
    case "ArrowLeft":
      if (!canMoveLeft()) {
        setupInput();
        return;
      }
      await moveLeft();
      break;
    case "ArrowRight":
      if (!canMoveRight()) {
        setupInput();
        return;
      }
      await moveRight();
      break;
    default:
      setupInput();
      return;
  }

  grid.cells.forEach((cell) => cell.mergeTiles());

  const newTile = new Tile(gameBoard);
  grid.randomEmptyCell().tile = newTile;

  if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
    newTile.waitForTransition(true).then(() => {
      document.getElementById("game-board").style.filter = "blur(5px)";
      document.querySelector(".game-over-alert").style.display = "block";
      const alertBox = document.getElementById("game-over-alert");
      alertBox.classList.add("active");
    });
    return;
  }

  setupInput();
}

let touchStartX, touchStartY;

function handleTouchStart(e) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  gameBoard.addEventListener("touchend", handleTouchEnd, { once: true });
}

function handleTouchEnd(e) {
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;

  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 0) {
      if (!canMoveRight()) {
        setupInput();
        return;
      }
      moveRight();
    } else {
      if (!canMoveLeft()) {
        setupInput();
        return;
      }
      moveLeft();
    }
  } else {
    if (deltaY > 0) {
      if (!canMoveDown()) {
        setupInput();
        return;
      }
      moveDown();
    } else {
      if (!canMoveUp()) {
        setupInput();
        return;
      }
      moveUp();
    }
  }

  grid.cells.forEach((cell) => cell.mergeTiles());

  const newTile = new Tile(gameBoard);
  grid.randomEmptyCell().tile = newTile;

  if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
    newTile.waitForTransition(true).then(() => {
      document.getElementById("game-board").style.filter = "blur(5px)";
      document.querySelector(".game-over-alert").style.display = "block";
      const alertBox = document.getElementById("game-over-alert");
      alertBox.classList.add("active");
    });
    return;
  }

  setupInput();
}

function moveUp() {
  return slideTiles(grid.cellsByColumn);
}
function moveDown() {
  return slideTiles(grid.cellsByColumn.map((column) => [...column].reverse()));
}
function moveLeft() {
  return slideTiles(grid.cellsByRow);
}
function moveRight() {
  return slideTiles(grid.cellsByRow.map((row) => [...row].reverse()));
}
function slideTiles(cells) {
  return Promise.all(
    cells.flatMap((group) => {
      let promises = [];
      for (let i = 0; i < group.length; i++) {
        const cell = group[i];
        if (cell.tile == null) continue;
        let lastValidCell;
        for (let j = i - 1; j >= 0; j--) {
          const moveToCell = group[j];
          if (!moveToCell.canAccept(cell.tile)) break;
          lastValidCell = moveToCell;
        }
        if (lastValidCell != null) {
          promises.push(cell.tile.waitForTransition());
          if (lastValidCell.tile != null) {
            lastValidCell.mergeTile = cell.tile;
          } else {
            lastValidCell.tile = cell.tile;
          }
          cell.tile = null;
        }
      }
      const additionalScore = grid.cells.reduce((sum, cell) => {
        if (cell.mergeTile == null || cell.tile == null) return sum;
        return sum + cell.mergeTile.value + cell.tile.value;
      }, 0);
      score += additionalScore;
      scoreElement.textContent = "Score: " + score;
      const currentBestScore = parseInt(localStorage.getItem("bestScore")) || 0;
      if (score > currentBestScore) {
        localStorage.setItem("bestScore", score);
        bestScoreElement.textContent = "Best: " + score;
      }
      return promises;
    })
  );
}

function canMoveUp() {
  return canMove(grid.cellsByColumn);
}

function canMoveDown() {
  return canMove(grid.cellsByColumn.map((column) => [...column].reverse()));
}

function canMoveLeft() {
  return canMove(grid.cellsByRow);
}

function canMoveRight() {
  return canMove(grid.cellsByRow.map((row) => [...row].reverse()));
}

function canMove(cells) {
  return cells.some((group) => {
    return group.some((cell, index) => {
      if (index === 0) return false;
      if (cell.tile == null) return false;
      const moveToCell = group[index - 1];
      return moveToCell.canAccept(cell.tile);
    });
  });
}

document.querySelector(".retry-button").onclick = tryAgain;

function tryAgain() {
  // Reset the game state
  grid.cells.forEach((cell) => {
    if (cell.tile !== null) {
      cell.tile.remove();
      cell.tile = null;
    }
  });

  if (
    score > parseInt(localStorage.getItem("bestScore")) ||
    localStorage.getItem("bestScore") === null
  ) {
    localStorage.setItem("bestScore", score);
    bestScoreElement.textContent = "Best: " + score;
  }

  score = 0;
  scoreElement.textContent = "Score: " + score;

  document.querySelector(".game-over-alert").style.display = "none";

  document.getElementById("game-board").style.filter = "none";

  grid.randomEmptyCell().tile = new Tile(gameBoard);
  grid.randomEmptyCell().tile = new Tile(gameBoard);
  setupInput();
}
