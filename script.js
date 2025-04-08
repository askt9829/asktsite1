document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const balanceDisplay = document.getElementById('balance');
    const betInput = document.getElementById('bet');
    const minesCountSelect = document.getElementById('mines-count');
    const startGameBtn = document.getElementById('start-game');
    const autoPlayBtn = document.getElementById('auto-play');
    const cashoutBtn = document.getElementById('cashout');
    const cancelBtn = document.getElementById('cancel-game');
    const playAgainBtn = document.getElementById('play-again');
    const potentialWinDisplay = document.getElementById('potential-win');
    const resultDisplay = document.getElementById('result');
    const gameHistory = document.getElementById('game-history');
    const claimBonusBtn = document.getElementById('claim-bonus');
    const bonusAmountDisplay = document.getElementById('bonus-amount');
    const luckyMoveMessage = document.getElementById('lucky-move-message');
    const minesRemainingDisplay = document.getElementById('mines-remaining');
    const minesTotalDisplay = document.getElementById('mines-total');

    let balance = 1000; // Начальный баланс в тенге
    let bet = 0;
    let gameActive = false;
    let autoPlaying = false;
    let revealedCells = 0;
    let minesCount = 3;
    let minesPositions = [];
    let minesFound = 0;
    const totalCells = 25; // 5x5 поле
    let history = [];
    let bonusAvailable = 0;
    let gamesPlayed = 0;
    let luckyMoveTriggered = false;

    // Звуковые эффекты (синтез через Web Audio API)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    function playSound(frequency, type = 'sine', duration = 0.2) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        oscillator.stop(audioContext.currentTime + duration);
    }

    // Обновление баланса на экране
    function updateBalance() {
        balanceDisplay.textContent = balance;
    }

    // Обновление счетчика мин
    function updateMinesCounter() {
        minesRemainingDisplay.textContent = minesCount - minesFound;
        minesTotalDisplay.textContent = minesCount;
    }

    // Обновление видимости кнопок
    function updateButtons() {
        if (gameActive) {
            cancelBtn.style.display = 'block';
            playAgainBtn.style.display = 'none';
            cashoutBtn.style.display = revealedCells > 0 ? 'block' : 'none';
        } else {
            cancelBtn.style.display = 'none';
            cashoutBtn.style.display = 'none';
            playAgainBtn.style.display = 'block';
        }
    }

    // Создание игрового поля
    function createBoard() {
        gameBoard.innerHTML = '';
        minesPositions = [];
        minesFound = 0;
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            cell.addEventListener('click', () => revealCell(cell));
            gameBoard.appendChild(cell);
        }
        updateMinesCounter();
    }

    // Генерация позиций мин
    function generateMines() {
        minesPositions = [];
        while (minesPositions.length < minesCount) {
            const position = Math.floor(Math.random() * totalCells);
            if (!minesPositions.includes(position)) {
                minesPositions.push(position);
            }
        }
    }

    // Показ всех мин после проигрыша или вывода
    function revealMines() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const index = parseInt(cell.dataset.index);
            if (!cell.classList.contains('revealed') && minesPositions.includes(index)) {
                cell.classList.add('mine');
                minesFound++;
                playSound(200); // Звук взрыва
            }
        });
        updateMinesCounter();
    }

    // Обновление истории игр
    function updateHistory(result, amount) {
        history.unshift(`Результат: ${result}, Сумма: ${amount} ₸`);
        if (history.length > 10) history.pop();
        gameHistory.innerHTML = history.map(item => `<li>${item}</li>`).join('');
    }

    // Проверка бонуса
    function checkBonus() {
        gamesPlayed++;
        if (gamesPlayed % 5 === 0) { // Бонус каждые 5 игр
            bonusAvailable = Math.round(bet * 0.5); // 50% от ставки
            bonusAmountDisplay.textContent = bonusAvailable;
            claimBonusBtn.disabled = false;
        }
    }

    // Получение бонуса
    claimBonusBtn.addEventListener('click', () => {
        if (bonusAvailable > 0) {
            balance += bonusAvailable;
            updateBalance();
            resultDisplay.textContent = `Бонус ${bonusAvailable} ₸ получен!`;
            resultDisplay.classList.add('win');
            playSound(800); // Звук бонуса
            bonusAvailable = 0;
            bonusAmountDisplay.textContent = '0';
            claimBonusBtn.disabled = true;
        }
    });

    // Проверка "Счастливого хода"
    function checkLuckyMove() {
        if (luckyMoveTriggered) return null; // "Счастливый ход" может сработать только раз за игру
        if (Math.random() < 0.1) { // 10% шанс на "Счастливый ход"
            luckyMoveTriggered = true;
            const luckyOutcome = Math.random() < 0.5 ? 'double' : 'extra';
            return luckyOutcome;
        }
        return null;
    }

    // Начало новой игры
    startGameBtn.addEventListener('click', () => {
        if (autoPlaying) return;
        startNewGame();
    });

    // Автоигра
    autoPlayBtn.addEventListener('click', () => {
        autoPlaying = !autoPlaying;
        autoPlayBtn.textContent = autoPlaying ? 'Остановить автоигру' : 'Автоигра';
        if (autoPlaying) {
            startNewGame();
        }
    });

    function startNewGame() {
        bet = parseInt(betInput.value);
        minesCount = parseInt(minesCountSelect.value);
        if (bet < 10 || bet > balance) {
            resultDisplay.textContent = 'Недостаточно средств или ставка слишком мала!';
            resultDisplay.classList.remove('win', 'lose', 'lucky');
            autoPlaying = false;
            autoPlayBtn.textContent = 'Автоигра';
            return;
        }

        balance -= bet;
        updateBalance();
        gameActive = true;
        revealedCells = 0;
        luckyMoveTriggered = false;
        resultDisplay.textContent = '';
        resultDisplay.classList.remove('win', 'lose', 'lucky');
        luckyMoveMessage.textContent = 'Сделайте ход, чтобы проверить удачу!';
        cashoutBtn.disabled = true;
        potentialWinDisplay.textContent = '0';
        createBoard();
        generateMines();
        updateButtons();
        updateMinesCounter();

        if (autoPlaying) {
            autoReveal();
        }
    }

    // Автоматическое открытие ячеек
    function autoReveal() {
        if (!autoPlaying || !gameActive) return;

        const cells = document.querySelectorAll('.cell:not(.revealed)');
        if (cells.length === 0) {
            cashoutBtn.click();
            return;
        }

        const randomCell = cells[Math.floor(Math.random() * cells.length)];
        revealCell(randomCell);

        if (gameActive) {
            setTimeout(autoReveal, 500); // Открытие ячейки каждые 0.5 секунды
        }
    }

    // Обработка клика по ячейке
    function revealCell(cell) {
        if (!gameActive || cell.classList.contains('revealed')) return;

        const index = parseInt(cell.dataset.index);

        // Проверка "Счастливого хода"
        const luckyOutcome = checkLuckyMove();

        // Проверка, попал ли игрок на мину
        if (minesPositions.includes(index)) {
            cell.classList.add('revealed', 'mine');
            minesFound++;
            updateMinesCounter();
            if (luckyOutcome === 'extra') {
                // "Счастливый ход" дает дополнительный ход
                luckyMoveMessage.textContent = 'Счастливый ход! Вы избежали мины!';
                resultDisplay.textContent = 'Счастливый ход! Продолжайте играть!';
                resultDisplay.classList.add('lucky');
                playSound(600); // Звук удачи
                cell.classList.remove('mine');
                cell.classList.add('star');
                revealedCells++;
                minesFound--; // Уменьшаем счетчик найденных мин, так как мина "исчезла"
                updateMinesCounter();
            } else {
                // Проигрыш
                gameActive = false;
                autoPlaying = false;
                autoPlayBtn.textContent = 'Автоигра';
                cashoutBtn.disabled = true;
                resultDisplay.textContent = 'Вы проиграли! Попали на мину.';
                resultDisplay.classList.add('lose');
                revealMines();
                updateHistory('Проигрыш', -bet);
                checkBonus();
                luckyMoveMessage.textContent = 'Сделайте ход, чтобы проверить удачу!';
                updateButtons();
                return;
            }
        } else {
            // Если не мина, показываем звезду
            cell.classList.add('revealed', 'star');
            revealedCells++;
            playSound(400); // Звук открытия звезды
        }

        // Обновляем потенциальный выигрыш
        const multiplier = 1 + (minesCount * 0.1) * (revealedCells / (totalCells - minesCount)); // Реалистичный множитель
        let potentialWin = Math.round(bet * multiplier);
        if (luckyOutcome === 'double') {
            // "Счастливый ход" удваивает выигрыш
            potentialWin = Math.round(potentialWin * 2); // Исправлено: теперь выигрыш правильно удваивается
            luckyMoveMessage.textContent = 'Счастливый ход! Ваш выигрыш удвоен!';
            resultDisplay.textContent = 'Счастливый ход! Выигрыш удвоен!';
            resultDisplay.classList.add('lucky');
            playSound(600); // Звук удачи
        }
        potentialWinDisplay.textContent = potentialWin;
        cashoutBtn.disabled = false;
        updateButtons();

        // Проверка, если все безопасные ячейки открыты
        if (revealedCells === totalCells - minesCount) {
            cashoutBtn.click();
        }
    }

    // Вывод выигрыша
    cashoutBtn.addEventListener('click', () => {
        if (!gameActive) return;

        let winAmount = parseInt(potentialWinDisplay.textContent);
        balance += winAmount;
        updateBalance();
        resultDisplay.textContent = `Вы выиграли ${winAmount} ₸!`;
        resultDisplay.classList.add('win');
        playSound(800); // Звук выигрыша
        gameActive = false;
        autoPlaying = false;
        autoPlayBtn.textContent = 'Автоигра';
        cashoutBtn.disabled = true;

        // Показываем мины
        revealMines();
        updateHistory('Выигрыш', winAmount);
        checkBonus();
        luckyMoveMessage.textContent = 'Сделайте ход, чтобы проверить удачу!';
        updateButtons();
    });

    // Отмена игры
    cancelBtn.addEventListener('click', () => {
        if (!gameActive) return;

        balance += bet; // Возвращаем ставку
        updateBalance();
        gameActive = false;
        autoPlaying = false;
        autoPlayBtn.textContent = 'Автоигра';
        resultDisplay.textContent = 'Игра отменена. Ставка возвращена.';
        resultDisplay.classList.remove('win', 'lose', 'lucky');
        luckyMoveMessage.textContent = 'Сделайте ход, чтобы проверить удачу!';
        updateButtons();
    });

    // Играть снова
    playAgainBtn.addEventListener('click', () => {
        startNewGame();
    });

    // Инициализация
    updateBalance();
    createBoard();
    updateButtons();
    updateMinesCounter();
});