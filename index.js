  const gameState = {
    username: "",
    stage: 1,
    lives: 5,
    timeLeft: 0,
    phase: "welcome",
    hintUsed: false,
    grid: [],
    playerPos: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
    finishPos: { x: 9, y: 0 },
    timer: null,
    gameBoard: null,
  };

  const elements = {
    welcomeScreen: document.getElementById("welcomeScreen"),
    gameScreen: document.getElementById("gameScreen"),
    usernameInput: document.getElementById("usernameInput"),
    playBtn: document.getElementById("playBtn"),
    instructionsBtn: document.getElementById("instructionsBtn"),
    leaderboardBtn: document.getElementById("leaderboardBtn"),
    playerName: document.getElementById("playerName"),
    stageNumber: document.getElementById("stageNumber"),
    livesCount: document.getElementById("livesCount"),
    timeLeft: document.getElementById("timeLeft"),
    phaseIndicator: document.getElementById("phaseIndicator"),
    hintBtn: document.getElementById("hintBtn"),
    gameBoard: document.getElementById("gameBoard"),
    saveScoreBtn: document.getElementById("saveScoreBtn"),
    playAgainBtn: document.getElementById("playAgainBtn"),
    finalScore: document.getElementById("finalScore")
  };

  document.addEventListener("DOMContentLoaded", function () {
    initGame();
    loadLeaderboard();
  });

  function initGame() {
    elements.usernameInput.addEventListener("input", function () {
      const username = this.value.trim();
      gameState.username = username;
      elements.playBtn.disabled = username.length === 0;
    });

    elements.playBtn.addEventListener("click", startGame);
    elements.instructionsBtn.addEventListener("click", () =>
      openModal("instructionsModal")
    );
    elements.leaderboardBtn.addEventListener("click", () =>
      openModal("leaderboardModal")
    );
    elements.hintBtn.addEventListener("click", useHint);
    elements.saveScoreBtn.addEventListener("click", saveScore);
    elements.playAgainBtn.addEventListener("click", restartGame);

    document.addEventListener("keydown", handleKeyPress);

    createGameBoard();
  }

  function createGameBoard() {
    elements.gameBoard.innerHTML = "";
    gameState.grid = [];

    for (let row = 0; row < 10; row++) {
      gameState.grid[row] = [];
      for (let col = 0; col < 10; col++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = row;
        cell.dataset.col = col;
        elements.gameBoard.appendChild(cell);
        gameState.grid[row][col] = { element: cell, isWall: false };
      }
    }
  }

  function startGame() {
    elements.welcomeScreen.style.display = "none";
    elements.gameScreen.style.display = "block";
    elements.playerName.textContent = gameState.username;

    gameState.stage = 1;
    gameState.lives = 5;
    gameState.phase = "game";

    updateDisplay();
    startStage();
  }

  function startStage() {
    gameState.hintUsed = false;
    elements.hintBtn.disabled = false;
    elements.hintBtn.textContent = "💡";

    generateMaze();
    memorizingPhase();
  }

  function generateMaze() {
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        gameState.grid[row][col].isWall = false;
        gameState.grid[row][col].element.className = "cell";
      }
    }

    gameState.startPos.y = Math.floor(Math.random() * 10);
    gameState.finishPos.y = Math.floor(Math.random() * 10);
    gameState.startPos.x = 0;
    gameState.finishPos.x = 9;

    let attempts = 0;
    do {
      generateRandomWalls();
      attempts++;
    } while (!hasValidPath() && attempts < 50);

    gameState.playerPos.x = gameState.startPos.x;
    gameState.playerPos.y = gameState.startPos.y;

    updateBoard();
  }

  function generateRandomWalls() {
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        gameState.grid[row][col].isWall = false;
      }
    }

    const wallDensity = Math.min(0.25 + (gameState.stage - 1) * 0.05, 0.45);
    const totalCells = 100;
    const wallCount = Math.floor(totalCells * wallDensity);

    for (let i = 0; i < wallCount; i++) {
      let row, col;
      do {
        row = Math.floor(Math.random() * 10);
        col = Math.floor(Math.random() * 10);
      } while (
        gameState.grid[row][col].isWall ||
        (row === gameState.startPos.y && col === gameState.startPos.x) ||
        (row === gameState.finishPos.y && col === gameState.finishPos.x)
      );

      gameState.grid[row][col].isWall = true;
    }
  }

  function hasValidPath() {
    const visited = Array(10)
      .fill()
      .map(() => Array(10).fill(false));
    const queue = [{ x: gameState.startPos.x, y: gameState.startPos.y }];
    visited[gameState.startPos.y][gameState.startPos.x] = true;

    const directions = [
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: -1, y: 0 },
    ];

    while (queue.length > 0) {
      const current = queue.shift();

      if (
        current.x === gameState.finishPos.x &&
        current.y === gameState.finishPos.y
      ) {
        return true;
      }

      for (const dir of directions) {
        const newX = current.x + dir.x;
        const newY = current.y + dir.y;

        if (
          newX >= 0 &&
          newX < 10 &&
          newY >= 0 &&
          newY < 10 &&
          !visited[newY][newX] &&
          !gameState.grid[newY][newX].isWall
        ) {
          visited[newY][newX] = true;
          queue.push({ x: newX, y: newY });
        }
      }
    }

    return false;
  }

  function memorizingPhase() {
    gameState.phase = "memorizing";
    gameState.timeLeft = 10;
    elements.phaseIndicator.textContent = "👁️ Memorize the maze!";
    elements.phaseIndicator.className = "phase-indicator memorizing";

    updateBoard(true);
    startTimer(movingPhase);
  }

  function movingPhase() {
    gameState.phase = "moving";
    gameState.timeLeft = 20;
    elements.phaseIndicator.textContent = "🏃 Navigate to the red finish!";
    elements.phaseIndicator.className = "phase-indicator moving";

    updateBoard(false);
    startTimer(timeUp);
  }

  function startTimer(callback) {
    clearInterval(gameState.timer);
    gameState.timer = setInterval(() => {
      gameState.timeLeft--;
      elements.timeLeft.textContent = gameState.timeLeft;

      if (gameState.timeLeft <= 0) {
        clearInterval(gameState.timer);
        callback();
      }
    }, 1000);
  }

  function updateBoard(showWalls = false) {
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const cell = gameState.grid[row][col].element;
        cell.className = "cell";

        if (gameState.grid[row][col].isWall && showWalls) {
          cell.classList.add("wall");
        }

        if (col === gameState.startPos.x && row === gameState.startPos.y) {
          cell.classList.add("start");
        }

        if (col === gameState.finishPos.x && row === gameState.finishPos.y) {
          cell.classList.add("finish");
        }

        if (col === gameState.playerPos.x && row === gameState.playerPos.y) {
          cell.classList.add("player");
        }
      }
    }
  }

  function handleKeyPress(event) {
    if (gameState.phase !== "moving") return;

    let newX = gameState.playerPos.x;
    let newY = gameState.playerPos.y;

    switch (event.key) {
      case "ArrowUp":
        newY--;
        break;
      case "ArrowDown":
        newY++;
        break;
      case "ArrowLeft":
        newX--;
        break;
      case "ArrowRight":
        newX++;
        break;
      default:
        return;
    }

    event.preventDefault();
    movePlayer(newX, newY);
  }

  function movePlayer(newX, newY) {
    if (newX < 0 || newX >= 10 || newY < 0 || newY >= 10) return;

    if (gameState.grid[newY][newX].isWall) {
      loseLife();
      return;
    }

    gameState.playerPos.x = newX;
    gameState.playerPos.y = newY;

    updateBoard();

    if (newX === gameState.finishPos.x && newY === gameState.finishPos.y) {
      stageComplete();
    }
  }

  function useHint() {
    if (gameState.hintUsed || gameState.phase !== "moving") return;

    gameState.hintUsed = true;
    elements.hintBtn.disabled = true;
    elements.hintBtn.textContent = "💡";

    updateBoard(true);

    document.querySelectorAll(".wall").forEach((wall) => {
      wall.classList.add("hint");
    });

    setTimeout(() => {
      updateBoard(false);
      document.querySelectorAll(".cell").forEach((cell) => {
        cell.classList.remove("hint");
      });
    }, 1000);
  }

  function stageComplete() {
    clearInterval(gameState.timer);
    gameState.stage++;
    elements.phaseIndicator.textContent = `🎉 Stage ${
      gameState.stage - 1
    } Complete!`;

    setTimeout(() => {
      updateDisplay();
      startStage();
    }, 1500);
  }

  function timeUp() {
    loseLife();
  }

  function loseLife() {
    gameState.lives--;
    updateDisplay();

    if (gameState.lives <= 0) {
      gameOver();
    } else {
      elements.phaseIndicator.textContent = "💥 Try again!";
      setTimeout(() => {
        startStage();
      }, 1500);
    }
  }

  function gameOver() {
    clearInterval(gameState.timer);
    gameState.phase = "game over";
    elements.finalScore.innerHTML = `You reached stage: <span>${gameState.stage}</span>`;
    openModal("gameOverModal");
  }

  function saveScore() {
    const scores = getLeaderboard();
    const newScore = {
      username: gameState.username,
      stage: gameState.stage,
      timestamp: new Date().toLocaleDateString(),
    };

    scores.push(newScore);
    scores.sort((a, b) => b.stage - a.stage);
    scores.splice(10);

    localStorage.setItem("blindMazeLeaderboard", JSON.stringify(scores));

    window.location.reload();

    closeModal("gameOverModal");
    loadLeaderboard();
    openModal("leaderboardModal");
  }

  function restartGame() {
    closeModal("gameOverModal");
    elements.gameScreen.style.display = "none";
    elements.welcomeScreen.style.display = "block";
    elements.usernameInput.value = gameState.username;
    elements.playBtn.disabled = false;
  }

  function updateDisplay() {
    elements.stageNumber.textContent = gameState.stage;
    elements.timeLeft.textContent = gameState.timeLeft;

    const hearts =
      "❤️".repeat(gameState.lives) + "🖤".repeat(5 - gameState.lives);
    elements.livesCount.textContent = hearts;
  }

  function openModal(modalId) {
    document.getElementById(modalId).style.display = "block";
  }

  function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
  }

  function getLeaderboard() {
    const saved = localStorage.getItem("blindMazeLeaderboard");
    return saved ? JSON.parse(saved) : [];
  }

  function loadLeaderboard() {
    const scores = getLeaderboard();
    const leaderboardList = document.getElementById("leaderboardList");

    if (scores.length === 0) {
      leaderboardList.innerHTML = "<p>No scores yet! Be the first to play!</p>";
      return;
    }

    leaderboardList.innerHTML = scores
      .map(
        (score, index) => `
                  <div class="leaderboard-item">
                      <span>${index + 1}. ${score.username}</span>
                      <span>Stage ${score.stage}</span>
                      <span>${score.timestamp}</span>
                  </div>
              `
      )
      .join("");
  }