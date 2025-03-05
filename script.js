
// DOM Elements
const menuContainer = document.getElementById('menuContainer');
const highScoresContainer = document.getElementById('highScoresContainer');
const gameOverContainer = document.getElementById('gameOverContainer');
const playerNameInput = document.getElementById('playerName');
const singlePlayerBtn = document.getElementById('singlePlayerBtn');
const twoPlayerBtn = document.getElementById('twoPlayerBtn');
const easyBtn = document.getElementById('easyBtn');
const mediumBtn = document.getElementById('mediumBtn');
const hardBtn = document.getElementById('hardBtn');
const startGameBtn = document.getElementById('startGameBtn');
const highScoreBtn = document.getElementById('highScoreBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const returnToMenuBtn = document.getElementById('returnToMenuBtn');
const winnerText = document.getElementById('winnerText');
const finalScore = document.getElementById('finalScore');
const scoresTable = document.getElementById('scoresTable');

// Game Audio
const paddleHitSound = document.getElementById('paddleHitSound');
const wallHitSound = document.getElementById('wallHitSound');
const scoreSound = document.getElementById('scoreSound');

// Canvas Setup
const { body } = document;
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const width = 500;
const height = 700;
const screenWidth = window.screen.width;
const canvasPosition = screenWidth / 2 - width / 2;
const isMobile = window.matchMedia('(max-width: 600px)');

// Game State
let isGameOver = true;
let isNewGame = true;
let gameMode = 'computer'; // 'computer' or 'twoPlayer'
let difficulty = 'easy'; // 'easy', 'medium', or 'hard'
let playerName = 'Player';
let player2Name = 'Player 2';
let highScores = JSON.parse(localStorage.getItem('pongHighScores')) || [];

// Paddle Properties
const paddleHeight = 10;
const paddleWidth = 50;
const paddleDiff = 25;
let paddleBottomX = 225;
let paddleTopX = 225;
let playerMoved = false;
let paddleContact = false;

// Ball Properties
let ballX = 250;
let ballY = 350;
const ballRadius = 5;

// Speed and Score
let speedY;
let speedX;
let trajectoryX;
let computerSpeed;
let playerScore = 0;
let computerScore = 0;
let winningScore = 7;

// Initialize Game Based on Difficulty
function setDifficulty() {
  switch(difficulty) {
    case 'easy':
      computerSpeed = isMobile.matches ? 3 : 2;
      speedY = isMobile.matches ? -2 : -1;
      winningScore = 5;
      break;
    case 'medium':
      computerSpeed = isMobile.matches ? 4 : 3;
      speedY = isMobile.matches ? -3 : -2;
      winningScore = 7;
      break;
    case 'hard':
      computerSpeed = isMobile.matches ? 5 : 4;
      speedY = isMobile.matches ? -4 : -3;
      winningScore = 10;
      break;
  }
  speedX = speedY;
}

// Menu Button Toggle
function toggleButton(button, buttons) {
  buttons.forEach(btn => btn.classList.remove('selected'));
  button.classList.add('selected');
}

// Event Listeners for Menu Buttons
singlePlayerBtn.addEventListener('click', () => {
  toggleButton(singlePlayerBtn, [singlePlayerBtn, twoPlayerBtn]);
  gameMode = 'computer';
});

twoPlayerBtn.addEventListener('click', () => {
  toggleButton(twoPlayerBtn, [singlePlayerBtn, twoPlayerBtn]);
  gameMode = 'twoPlayer';
});

easyBtn.addEventListener('click', () => {
  toggleButton(easyBtn, [easyBtn, mediumBtn, hardBtn]);
  difficulty = 'easy';
});

mediumBtn.addEventListener('click', () => {
  toggleButton(mediumBtn, [easyBtn, mediumBtn, hardBtn]);
  difficulty = 'medium';
});

hardBtn.addEventListener('click', () => {
  toggleButton(hardBtn, [easyBtn, mediumBtn, hardBtn]);
  difficulty = 'hard';
});

highScoreBtn.addEventListener('click', showHighScores);
backToMenuBtn.addEventListener('click', showMenu);
playAgainBtn.addEventListener('click', startGame);
returnToMenuBtn.addEventListener('click', showMenu);

// Start Game from Menu
startGameBtn.addEventListener('click', () => {
  playerName = playerNameInput.value || 'Player';
  menuContainer.style.display = 'none';
  canvas.style.display = 'block';
  startGame();
});

// Show High Scores
function showHighScores() {
  menuContainer.style.display = 'none';
  highScoresContainer.style.display = 'flex';
  
  // Render high scores
  scoresTable.innerHTML = '';
  highScores.sort((a, b) => b.score - a.score).slice(0, 10).forEach(score => {
    const row = document.createElement('div');
    row.innerHTML = `
      <span>${score.name}</span>
      <span>${score.score} wins</span>
    `;
    scoresTable.appendChild(row);
  });
}

// Show Menu
function showMenu() {
  menuContainer.style.display = 'flex';
  highScoresContainer.style.display = 'none';
  gameOverContainer.style.display = 'none';
  canvas.style.display = 'none';
}

// Reset Ball to Center
function ballReset() {
  ballX = width / 2;
  ballY = height / 2;
  speedY = difficulty === 'easy' ? -2 : difficulty === 'medium' ? -3 : -4;
  if (isMobile.matches) speedY *= 1.5;
  
  // Randomize initial direction
  speedX = (Math.random() > 0.5 ? 1 : -1) * Math.abs(speedY) * 0.3;
  paddleContact = false;
}

// Adjust Ball Movement
function ballMove() {
  // Vertical Speed
  ballY += -speedY;
  // Horizontal Speed
  if (playerMoved && paddleContact) {
    ballX += speedX;
  } else {
    ballX += speedX * 0.3;
  }
}

// Determine What Ball Bounces Off, Score Points, Reset Ball
function ballBoundaries() {
  // Bounce off Left Wall
  if (ballX < 0 && speedX < 0) {
    speedX = -speedX;
    wallHitSound.currentTime = 0;
    wallHitSound.play();
  }
  // Bounce off Right Wall
  if (ballX > width && speedX > 0) {
    speedX = -speedX;
    wallHitSound.currentTime = 0;
    wallHitSound.play();
  }
  // Bounce off player paddle (bottom)
  if (ballY > height - paddleDiff) {
    if (ballX > paddleBottomX && ballX < paddleBottomX + paddleWidth) {
      paddleContact = true;
      // Add Speed on Hit
      if (playerMoved) {
        speedY -= 0.5;
        // Max Speed
        if (speedY < -10) {
          speedY = -10;
        }
      }
      speedY = -speedY;
      trajectoryX = ballX - (paddleBottomX + paddleDiff);
      speedX = trajectoryX * 0.3;
      
      // Play paddle hit sound
      paddleHitSound.currentTime = 0;
      paddleHitSound.play();
    } else if (ballY > height) {
      // Reset Ball, add to Computer Score
      ballReset();
      computerScore++;
      scoreSound.currentTime = 0;
      scoreSound.play();
    }
  }
  // Bounce off computer paddle (top)
  if (ballY < paddleDiff) {
    if (ballX > paddleTopX && ballX < paddleTopX + paddleWidth) {
      // Add Speed on Hit
      if (playerMoved) {
        speedY += 0.5;
        // Max Speed
        if (speedY > 10) {
          speedY = 10;
        }
      }
      speedY = -speedY;
      paddleHitSound.currentTime = 0;
      paddleHitSound.play();
    } else if (ballY < 0) {
      // Reset Ball, add to Player Score
      ballReset();
      playerScore++;
      scoreSound.currentTime = 0;
      scoreSound.play();
    }
  }
}

// Computer Movement
function computerAI() {
  if (gameMode === 'computer') {
    // AI difficulty adjustments
    const aiReactionSpeed = difficulty === 'easy' ? 0.1 : difficulty === 'medium' ? 0.3 : 0.7;
    const idealPosition = ballX - paddleWidth / 2;
    const currentDiff = paddleTopX - idealPosition;
    
    // Move computer paddle based on ball position, with difficulty-based reaction
    if (Math.abs(currentDiff) > 2) {
      paddleTopX -= currentDiff * aiReactionSpeed;
    }
    
    // Constrain paddle within play area
    if (paddleTopX < 0) {
      paddleTopX = 0;
    } else if (paddleTopX > width - paddleWidth) {
      paddleTopX = width - paddleWidth;
    }
  }
}

// Player 2 Controls (for 2-player mode)
function handlePlayer2Movement(e) {
  if (gameMode === 'twoPlayer') {
    const key = e.key;
    const paddleSpeed = 20;
    
    if (key === 'ArrowLeft' && paddleTopX > 0) {
      paddleTopX -= paddleSpeed;
    } else if (key === 'ArrowRight' && paddleTopX < width - paddleWidth) {
      paddleTopX += paddleSpeed;
    }
  }
}

// Check If One Player Has Winning Score, If They Do, End Game
function gameOver() {
  if (playerScore === winningScore || computerScore === winningScore) {
    isGameOver = true;
    
    // Determine winner
    const winner = playerScore === winningScore ? playerName : (gameMode === 'computer' ? 'Computer' : player2Name);
    
    // Update high scores for human players
    if (winner === playerName) {
      const existingScore = highScores.find(score => score.name === playerName);
      if (existingScore) {
        existingScore.score += 1;
      } else {
        highScores.push({ name: playerName, score: 1 });
      }
      localStorage.setItem('pongHighScores', JSON.stringify(highScores));
    }
    
    // Show game over screen
    canvas.style.display = 'none';
    gameOverContainer.style.display = 'flex';
    winnerText.textContent = `${winner} Wins!`;
    finalScore.textContent = `Score: ${playerScore} - ${computerScore}`;
  }
}

// Render Everything on Canvas
function renderCanvas() {
  // Canvas Background
  context.fillStyle = 'black';
  context.fillRect(0, 0, width, height);

  // Paddle Color
  context.fillStyle = 'white';

  // Player Paddle (Bottom)
  context.fillRect(paddleBottomX, height - 20, paddleWidth, paddleHeight);

  // Computer Paddle (Top)
  context.fillRect(paddleTopX, 10, paddleWidth, paddleHeight);

  // Dashed Center Line
  context.beginPath();
  context.setLineDash([4]);
  context.moveTo(0, 350);
  context.lineTo(500, 350);
  context.strokeStyle = 'grey';
  context.stroke();

  // Ball
  context.beginPath();
  context.arc(ballX, ballY, ballRadius, 2 * Math.PI, false);
  context.fillStyle = 'white';
  context.fill();
  
  // Score
  context.font = '32px Courier New';
  context.fillText(playerScore, 20, canvas.height / 2 + 50);
  context.fillText(computerScore, 20, canvas.height / 2 - 30);
  
  // Display player names
  context.font = '16px Courier New';
  context.fillText(playerName, width - 100, canvas.height / 2 + 50);
  context.fillText(gameMode === 'computer' ? 'Computer' : player2Name, width - 100, canvas.height / 2 - 30);
}

// Create Canvas Element
function createCanvas() {
  canvas.width = width;
  canvas.height = height;
  
  if (!document.contains(canvas)) {
    body.appendChild(canvas);
  }
  
  renderCanvas();
}

// Called Every Frame
function animate() {
  if (!isGameOver) {
    requestAnimationFrame(animate);
    renderCanvas();
    ballMove();
    ballBoundaries();
    computerAI();
    gameOver();
  }
}

// Start Game, Reset Everything
function startGame() {
  if (isGameOver) {
    playerScore = 0;
    computerScore = 0;
    isGameOver = false;
    isNewGame = false;
    
    // Apply difficulty settings
    setDifficulty();
    
    // Reset paddles and ball
    paddleBottomX = 225;
    paddleTopX = 225;
    
    // Hide game over screen if visible
    gameOverContainer.style.display = 'none';
    
    // Show canvas
    canvas.style.display = 'block';
    
    // Reset ball position
    ballReset();
    
    // Create canvas if needed
    createCanvas();
    
    // Start animation
    animate();
    
    // Set up event listeners
    canvas.addEventListener('mousemove', (e) => {
      playerMoved = true;
      // Compensate for canvas being centered
      paddleBottomX = e.clientX - canvasPosition - paddleDiff;
      if (paddleBottomX < 0) {
        paddleBottomX = 0;
      }
      if (paddleBottomX > width - paddleWidth) {
        paddleBottomX = width - paddleWidth;
      }
      // Hide Cursor
      canvas.style.cursor = 'none';
    });
    
    // Add keyboard controls for 2-player mode
    document.addEventListener('keydown', handlePlayer2Movement);
  }
}

// Initialize the game - show menu first
showMenu();
