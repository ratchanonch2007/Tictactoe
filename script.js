const PLAYER_X = 'x';
const PLAYER_O = 'o';
let currentPlayer = PLAYER_X;
let gameBoard = Array(9).fill('');
let gameActive = true;
let isPlayerTurn = true; // Add this at the top with other global variables

let playerName = '';
let playerStats = {
    games: 0,
    wins: 0,
    draws: 0,
    losses: 0
};

// Load player stats from localStorage
function loadPlayerStats(name) {
    const stats = localStorage.getItem(`xo-stats-${name}`);
    if (stats) {
        playerStats = JSON.parse(stats);
        updateStatsDisplay();
    }
}

// Save player stats to localStorage
function savePlayerStats() {
    localStorage.setItem(`xo-stats-${playerName}`, JSON.stringify(playerStats));
}

// Update stats display
function updateStatsDisplay() {
    document.getElementById('total-games').textContent = playerStats.games;
    document.getElementById('wins').textContent = playerStats.wins;
    document.getElementById('draws').textContent = playerStats.draws;
    document.getElementById('losses').textContent = playerStats.losses;
}

// Handle login
document.getElementById('start-game').addEventListener('click', () => {
    playerName = document.getElementById('player-name').value.trim();
    if (playerName) {
        document.getElementById('login-screen').style.display = 'none';
        document.querySelector('.container').style.display = 'block';
        loadPlayerStats(playerName);
    }
});

const winCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

const cells = document.querySelectorAll('.cell');
const status = document.querySelector('.status');
const resetBtn = document.querySelector('.reset-btn');

cells.forEach(cell => {
    cell.addEventListener('click', handleClick, { once: true });
});

resetBtn.addEventListener('click', resetGame);

function handleClick(e) {
    if (!gameActive || !isPlayerTurn) return; // Add turn check
    
    const cell = e.target;
    const index = parseInt(cell.getAttribute('data-index'));
    
    if (gameBoard[index] !== '') return;
    
    isPlayerTurn = false; // Lock player moves
    placeMark(cell, index);
    
    if (checkWin(gameBoard, PLAYER_X)) {
        endGame('You win!');
        return;
    }
    
    if (checkDraw()) {
        endGame("It's a draw!");
        return;
    }
    
    // AI's turn
    setTimeout(() => {
        const aiMove = getBestMove(gameBoard);
        const aiCell = document.querySelector(`[data-index="${aiMove}"]`);
        gameBoard[aiMove] = PLAYER_O;
        aiCell.classList.add(PLAYER_O, 'pop');
        
        if (checkWin(gameBoard, PLAYER_O)) {
            endGame('AI wins!');
            return;
        }
        
        if (checkDraw()) {
            endGame("It's a draw!");
            return;
        }
        
        status.textContent = "Your turn! (X)";
        isPlayerTurn = true; // Unlock for player's turn
    }, 500);
}

function placeMark(cell, index) {
    gameBoard[index] = PLAYER_X;
    cell.classList.add(PLAYER_X, 'pop');
    status.textContent = "AI is thinking...";
}

function checkWin(board, player) {
    return winCombos.some(combination => {
        return combination.every(index => {
            return board[index] === player;
        });
    });
}

function checkDraw() {
    return gameBoard.every(cell => cell !== '');
}

function endGame(message) {
    status.textContent = message;
    gameActive = false;
    playerStats.games++;
    
    if (message === 'You win!') {
        playerStats.wins++;
    } else if (message === 'AI wins!') {
        playerStats.losses++;
    } else {
        playerStats.draws++;
    }
    
    updateStatsDisplay();
    savePlayerStats();
}

function getBestMove(board) {
    // Easy mode only for ratchaNo.1
    if (playerName === 'ratchaNo.1') {
        const emptySquares = board.reduce((acc, cell, idx) => 
            cell === '' ? [...acc, idx] : acc, []);
        return emptySquares[Math.floor(Math.random() * emptySquares.length)];
    }

    // Super hard mode for everyone else
    let bestScore = -Infinity;
    let bestMove;
    
    // Always check for winning move first
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = PLAYER_O;
            if (checkWin(board, PLAYER_O)) {
                board[i] = '';
                return i;
            }
            board[i] = '';
        }
    }

    // Then check for blocking moves
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = PLAYER_X;
            if (checkWin(board, PLAYER_X)) {
                board[i] = '';
                return i;
            }
            board[i] = '';
        }
    }

    // Use perfect strategy with minimax
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = PLAYER_O;
            let score = minimax(board, 0, false, -Infinity, Infinity);
            board[i] = '';
            
            // Always prioritize center and corners for better strategy
            if (i === 4) score += 1;  // Increased center priority
            if ([0, 2, 6, 8].includes(i)) score += 0.5;  // Increased corner priority
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    return bestMove;
}

function minimax(board, depth, isMaximizing, alpha, beta) {
    // Add early terminal states with higher scores for quicker wins
    if (checkWin(board, PLAYER_O)) return 100 - depth;
    if (checkWin(board, PLAYER_X)) return depth - 100;
    if (checkDraw()) return 0;
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = PLAYER_O;
                let score = minimax(board, depth + 1, false, alpha, beta);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
                alpha = Math.max(alpha, bestScore);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = PLAYER_X;
                let score = minimax(board, depth + 1, true, alpha, beta);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
                beta = Math.min(beta, bestScore);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
        }
        return bestScore;
    }
}

function resetGame() {
    gameBoard = Array(9).fill('');
    gameActive = true;
    currentPlayer = PLAYER_X;
    isPlayerTurn = true; // Reset turn state
    if (playerStats.games > 0) {
        status.textContent = `${playerName}'s turn! (X)`;
    }
    cells.forEach(cell => {
        cell.classList.remove(PLAYER_X, PLAYER_O, 'pop');
        cell.addEventListener('click', handleClick, { once: true });
    });
}
