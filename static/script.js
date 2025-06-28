// Variáveis globais para o jogo
let randomNumber;
let attempts; // Quantidade de tentativas
let timeLeft; // Tempo restante em segundos
let timerInterval; // Para armazenar o ID do intervalo do cronômetro
let highScores = []; // Array para armazenar os recordes
const localStorageKey = 'bombHighScores'; // Chave para guardar no localStorage

// Definimos a duração do áudio de contagem regressiva em segundos
// Usamos 25 segundos, pois seu arquivo tem aproximadamente 25.075 segundos de duração.
const COUNTDOWN_SOUND_DURATION = 20;
let countdownSoundStarted = false; // Flag para controlar se o som de contagem regressiva já foi iniciado

// Obtemos as referências aos elementos DOM uma única vez
const guessInput = document.getElementById('guessInput');
const checkButton = document.getElementById('checkButton');
const resetButton = document.getElementById('resetButton'); // Botão de reiniciar principal
const messageElement = document.getElementById('message'); // A mensagem de dica
const timerDisplay = document.getElementById('timerDisplay'); // Elemento para exibir o cronômetro
const explosionOverlay = document.getElementById('explosionOverlay'); // Tela de explosão
const secretNumberReveal = document.getElementById('secretNumberReveal'); // Onde mostra o número secreto na explosão
const gameOverResetButton = document.getElementById('gameOverResetButton'); // Botão de reiniciar na tela de explosão
const highScoresList = document.getElementById('highScoresList'); // Referência à lista de recordes

// --- NOVAS REFERÊNCIAS DOM ---
const gameControlsContainer = document.getElementById('gameControlsContainer'); // Contêiner principal do jogo
const winMessageAndNameInput = document.getElementById('winMessageAndNameInput'); // Contêiner de vitória/nome
const winMessageDisplay = document.getElementById('winMessageDisplay'); // Onde a mensagem de vitória aparecerá
const playerNameInput = document.getElementById('playerNameInput'); // Campo para digitar o nome
const saveScoreButton = document.getElementById('saveScoreButton'); // Botão para salvar o recorde

// --- NOVAS REFERÊNCIAS PARA A TELA DE INÍCIO ---
const gameStartScreen = document.getElementById('gameStartScreen'); // A tela de início
const startGameButton = document.getElementById('startGameButton'); // O botão "INICIAR JOGO"
// --- FIM NOVAS REFERÊNCIAS ---

// --- REFERÊNCIAS AOS ELEMENTOS DE ÁUDIO ---
const ticTacSound = document.getElementById('ticTacSound');
const countdownBoomSound = document.getElementById('countdownBoomSound');
// --- FIM REFERÊNCIAS AOS ELEMENTOS DE ÁUDIO ---


// --- GARANTIA EXTRA: ESCONDER ELEMENTOS CRÍTICOS IMEDIATAMENTE NO CARREGAMENTO DO SCRIPT ---
winMessageAndNameInput.classList.add('hidden');
explosionOverlay.classList.add('hidden');
gameControlsContainer.classList.add('hidden'); // Garante que os controles do jogo comecem escondidos
// --- FIM DA GARANTIA EXTRA ---


// --- Funções Auxiliares ---

// Função para formatar o tempo em MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// --- Funções de Placar de Recordes ---

// Carrega os recordes do localStorage
function loadHighScores() {
    const storedScores = localStorage.getItem(localStorageKey);
    if (storedScores) {
        highScores = JSON.parse(storedScores);
    } else {
        highScores = [];
    }
    displayHighScores(); // Exibe os recordes após carregar
}

// Salva um novo recorde
function saveHighScore(playerName, timeLeftScore, attemptsScore) {
    highScores.push({ name: playerName, time: timeLeftScore, attempts: attemptsScore });

    highScores.sort((a, b) => {
        if (b.time !== a.time) {
            return b.time - a.time; // Maior tempo restante primeiro
        }
        return a.attempts - b.attempts; // Menor tentativa primeiro (se o tempo for igual)
    });

    highScores = highScores.slice(0, 5); // Mantém apenas os 5 melhores

    localStorage.setItem(localStorageKey, JSON.stringify(highScores));

    displayHighScores(); // Atualiza o display do placar
}

// Exibe os recordes na interface
function displayHighScores() {
    highScoresList.innerHTML = ''; // Limpa a lista atual no HTML

    if (highScores.length === 0) {
        const noScoreItem = document.createElement('li');
        noScoreItem.textContent = 'Nenhum recorde ainda.';
        highScoresList.appendChild(noScoreItem);
        return;
    }

    highScores.forEach((record, index) => {
        const listItem = document.createElement('li');
        if (index === 0) {
            listItem.innerHTML = `🥇 ${record.name}: ${formatTime(record.time)} (${record.attempts} tent.)`;
            listItem.classList.add('best-score');
        } else {
            listItem.textContent = `${index + 1}. ${record.name}: ${formatTime(record.time)} (${record.attempts} tent.)`;
        }
        highScoresList.appendChild(listItem);
    });
}


// --- Funções Principais do Jogo ---

// Função para iniciar ou reiniciar o jogo
function initializeGame() {
    // Esconde a tela de início e mostra os controles do jogo
    gameStartScreen.classList.add('hidden');
    gameControlsContainer.classList.remove('hidden');

    randomNumber = Math.floor(Math.random() * 100) + 1; // Gera um novo número secreto
    attempts = 0; // Zera as tentativas
    timeLeft = 60; // Define 1 minuto (60 segundos) de tempo inicial

    clearInterval(timerInterval); // Limpa qualquer cronômetro anterior

    // Pausa e reseta todos os sons ao iniciar/reiniciar o jogo
    if (ticTacSound) ticTacSound.pause();
    if (countdownBoomSound) {
        countdownBoomSound.pause();
        countdownBoomSound.currentTime = 0; // Reinicia para a próxima vez
    }
    countdownSoundStarted = false; // Reset the flag para o novo jogo

    // Reseta o estado dos elementos visuais
    guessInput.value = '';
    messageElement.textContent = '';
    messageElement.style.color = ''; // Volta a cor da mensagem ao padrão (definido no CSS)
    messageElement.classList.remove('hidden'); // Garante que a mensagem de dica esteja visível no início

    // Mostra o campo de palpite e o botão de verificar
    guessInput.classList.remove('hidden');
    checkButton.classList.remove('hidden');
    guessInput.disabled = false;
    checkButton.disabled = false;

    // Esconde o botão de Reiniciar e mostra o de Verificar (ajuste para a nova estrutura)
    resetButton.style.display = 'none';
    checkButton.style.display = 'inline-block';

    // Esconde o contêiner de vitória/nome se ele estiver visível
    winMessageAndNameInput.classList.add('hidden'); // Garante que esteja hidden ao iniciar
    playerNameInput.value = ''; // Limpa o campo de nome

    // Esconde a tela de explosão
    explosionOverlay.classList.add('hidden');

    // Atualiza e inicia o cronômetro
    timerDisplay.textContent = formatTime(timeLeft);
    startTimer();

    guessInput.focus(); // Coloca o foco no campo de input

    loadHighScores(); // Carrega e exibe os recordes ao iniciar/reiniciar o jogo
}

// Função para iniciar a contagem regressiva do cronômetro
function startTimer() {
    // Inicia o som de tic-tac apenas se a contagem regressiva ainda não tiver começado
    // e se o tempo restante for maior que a duração do som de contagem regressiva
    if (ticTacSound && !countdownSoundStarted && timeLeft > COUNTDOWN_SOUND_DURATION) {
        ticTacSound.currentTime = 0; // Garante que o som de tique-taque comece do início
        ticTacSound.loop = true; // Faz o som tocar em loop
        ticTacSound.play().catch(e => console.error("Erro ao iniciar ticTacSound:", e));
    }

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = formatTime(timeLeft);

        // Lógica para alternar para o som de contagem regressiva E MANTÊ-LO SINCRONIZADO
        // Verifica se estamos na zona de contagem regressiva (tempo <= duração do som e > 0)
        if (timeLeft <= COUNTDOWN_SOUND_DURATION && timeLeft > 0) {
            if (!countdownSoundStarted) {
                // Se o som ainda não começou na zona de contagem, inicia-o
                if (ticTacSound) {
                    ticTacSound.pause();
                    ticTacSound.currentTime = 0;
                }
                countdownSoundStarted = true; // Define a flag para que não reinicie
            }

            // Ajusta o ponto de reprodução do áudio a cada segundo.
            // Isso garante que o áudio salte e se mantenha sincronizado
            // mesmo com perdas rápidas de tempo devido a erros.
            if (countdownBoomSound) {
                const targetAudioTime = COUNTDOWN_SOUND_DURATION - timeLeft;
                // Garante que o tempo alvo seja válido (não negativo e dentro da duração do áudio)
                if (targetAudioTime >= 0 && targetAudioTime < countdownBoomSound.duration) {
                     // Adiciona uma pequena tolerância (0.5s) para evitar saltos desnecessários
                    if (Math.abs(countdownBoomSound.currentTime - targetAudioTime) > 0.5) {
                        countdownBoomSound.currentTime = targetAudioTime;
                    }
                }
                // Garante que o som esteja tocando
                if (countdownBoomSound.paused) {
                    countdownBoomSound.play().catch(e => console.error("Erro ao iniciar/continuar countdownBoomSound:", e));
                }
            }
        }


        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (ticTacSound) ticTacSound.pause(); // Para o tique-taque
            // O som de contagem regressiva deve ter terminado com a explosão aqui
            gameOver();
        }
    }, 1000);
}

// Função de Game Over (quando o tempo acaba)
function gameOver() {
    clearInterval(timerInterval);
    if (ticTacSound) ticTacSound.pause(); // Para o tique-taque
    // O som de contagem regressiva já deve ter terminado naturalmente com a explosão.
    // Apenas garantimos que ele pare e resete para a próxima rodada, caso algo dê errado.
    if (countdownBoomSound) {
        countdownBoomSound.pause();
        countdownBoomSound.currentTime = 0; // Reseta para o próximo jogo
    }
    countdownSoundStarted = false; // Reset the flag

    guessInput.disabled = true;
    checkButton.disabled = true;

    // Esconde o campo de palpite e o botão de verificar
    guessInput.classList.add('hidden');
    checkButton.classList.add('hidden');
    messageElement.classList.add('hidden'); // Esconde a mensagem de dica também

    // Mostra a tela de explosão
    explosionOverlay.classList.remove('hidden');
    secretNumberReveal.textContent = randomNumber;

    // Garante que o botão de reiniciar do jogo principal esteja escondido
    resetButton.style.display = 'none';

    gameOverResetButton.focus();
}

// Função para lidar com o salvamento do recorde pelo input de nome
function handleSaveScore() {
    let playerName = playerNameInput.value.trim(); // Pega o nome e remove espaços em branco
    if (!playerName) {
        playerName = 'Anônimo'; // Define como anônimo se o campo estiver vazio
    }

    saveHighScore(playerName, timeLeft, attempts); // Salva o recorde
    winMessageAndNameInput.classList.add('hidden'); // Esconde o contêiner de vitória/nome
    initializeGame(); // Reinicia o jogo
}

// Função de Vitória (quando o jogador acerta o número)
function gameWin() {
    clearInterval(timerInterval); // Para o cronômetro
    if (ticTacSound) ticTacSound.pause(); // Para o tique-taque
    if (countdownBoomSound) { // Para o som de contagem regressiva se estiver tocando
        countdownBoomSound.pause();
        countdownBoomSound.currentTime = 0;
    }
    countdownSoundStarted = false; // Reset the flag

    // Esconde o campo de palpite e o botão de verificar
    guessInput.classList.add('hidden');
    checkButton.classList.add('hidden');
    messageElement.classList.add('hidden'); // Esconde a mensagem de dica

    // Preenche a mensagem de vitória no novo elemento
    winMessageDisplay.textContent = `Bomba desarmada! Você adivinhou o número ${randomNumber} em ${attempts} tentativas.`;

    // Mostra o contêiner de vitória/nome
    winMessageAndNameInput.classList.remove('hidden');

    // Habilita o campo de nome e botão de salvar
    playerNameInput.disabled = false;
    saveScoreButton.disabled = false;

    // Coloca o foco no campo de nome para o jogador digitar
    playerNameInput.focus();
}


// --- Lógica de Verificação do Palpite ---
function checkGuess() {
    if (guessInput.disabled || !winMessageAndNameInput.classList.contains('hidden')) {
        return;
    }

    const guess = parseInt(guessInput.value);

    if (isNaN(guess) || guess < 1 || guess > 100) {
        messageElement.textContent = 'Por favor, digite um número válido entre 1 e 100.';
        messageElement.style.color = '#ffc107'; // Cor de alerta
        messageElement.classList.remove('hidden');
        return;
    }

    attempts++;

    if (guess === randomNumber) {
        gameWin();
    } else {
        timeLeft -= 5; // Perde 5 segundos
        if (timeLeft < 0) timeLeft = 0; // Garante que o tempo não fique negativo

        timerDisplay.textContent = formatTime(timeLeft);

        if (timeLeft <= 0) { // Alterado para <= para pegar o 0
            gameOver();
            return;
        }

        if (guess < randomNumber) {
            messageElement.textContent = 'Muito baixo! Tente novamente. (-5s)';
        } else {
            messageElement.textContent = 'Muito alto! Tente novamente. (-5s)';
        }
        messageElement.style.color = '#ffc107';
        messageElement.classList.remove('hidden');
    }

    if (guess !== randomNumber && !guessInput.disabled) {
        guessInput.value = '';
        guessInput.focus();
    }
}


// --- Event Listeners Globais ---
guessInput.addEventListener('keydown', function(event) {
    if ((event.key === 'Enter' || event.keyCode === 13) && !guessInput.disabled) {
        event.preventDefault();
        checkGuess();
    }
});

checkButton.addEventListener('click', checkGuess);

resetButton.addEventListener('click', initializeGame);
resetButton.addEventListener('keydown', function(event) {
    if ((event.key === 'Enter' || event.keyCode === 13) && resetButton.style.display !== 'none') {
        event.preventDefault();
        initializeGame();
    }
});

gameOverResetButton.addEventListener('click', initializeGame);
gameOverResetButton.addEventListener('keydown', function(event) {
    if ((event.key === 'Enter' || event.keyCode === 13) && explosionOverlay.classList.contains('hidden') === false) {
        event.preventDefault();
        initializeGame();
    }
});


// --- NOVOS EVENT LISTENERS PARA O FLUXO DE VITÓRIA ---
saveScoreButton.addEventListener('click', handleSaveScore);

playerNameInput.addEventListener('keydown', function(event) {
    if ((event.key === 'Enter' || event.keyCode === 13) && !playerNameInput.disabled) {
        event.preventDefault();
        handleSaveScore();
    }
});
// --- FIM DOS NOVOS EVENT LISTENERS ---


// --- NOVO EVENT LISTENER PARA O BOTÃO INICIAR JOGO ---
startGameButton.addEventListener('click', initializeGame);
// --- FIM NOVO EVENT LISTENER ---

// Carrega os recordes ao carregar a página (antes mesmo do jogo começar)
loadHighScores();