import {
    Room,
    Player,
    Question,
    LeaderboardEntry,
    QuestionResults,
    QuestionView,
    GameSettings,
} from './types.js';

// =====================================================
// GAME ENGINE
// =====================================================

const DEFAULT_SETTINGS: GameSettings = {
    timeDecay: 'linear',
    questionTimeLimit: 20,
    maxPlayers: 50,
    allowLateJoin: false,
    showCorrectAnswer: true,
};

// Active rooms storage
const rooms = new Map<string, Room>();

// Generate 6-digit room code
function generateRoomCode(): string {
    let code: string;
    do {
        code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (rooms.has(code));
    return code;
}

// Create new room
export function createRoom(hostId: string, questions: Question[]): Room {
    const room: Room = {
        id: generateRoomCode(),
        hostId,
        status: 'lobby',
        players: new Map(),
        questions,
        currentQuestionIndex: -1,
        settings: { ...DEFAULT_SETTINGS },
        createdAt: Date.now(),
        questionStartTime: null,
    };
    rooms.set(room.id, room);
    return room;
}

// Get room by ID
export function getRoom(roomId: string): Room | undefined {
    return rooms.get(roomId);
}

// Delete room
export function deleteRoom(roomId: string): void {
    rooms.delete(roomId);
}

// Validate and normalize username
export function validateUsername(room: Room, username: string): string {
    const trimmed = username.trim().substring(0, 20);
    if (!trimmed) return 'Oyuncu';

    const normalized = trimmed.toLowerCase();
    const existingNames = [...room.players.values()].map((p) =>
        p.username.toLowerCase()
    );

    if (!existingNames.includes(normalized)) {
        return trimmed;
    }

    // Append number for duplicates
    let suffix = 2;
    while (existingNames.includes(`${normalized}${suffix}`)) {
        suffix++;
    }
    return `${trimmed}${suffix}`;
}

// Add player to room
export function addPlayer(
    room: Room,
    socketId: string,
    username: string
): Player | null {
    if (room.players.size >= room.settings.maxPlayers) {
        return null;
    }

    if (room.status !== 'lobby' && !room.settings.allowLateJoin) {
        return null;
    }

    const validatedUsername = validateUsername(room, username);

    const player: Player = {
        id: socketId,
        username: validatedUsername,
        score: 0,
        lastQuestionScore: 0,
        isConnected: true,
        joinedAt: Date.now(),
        answers: [],
        hasAnswered: false,
    };

    room.players.set(socketId, player);
    return player;
}

// Remove player from room
export function removePlayer(room: Room, playerId: string): void {
    room.players.delete(playerId);
}

// Get player by ID
export function getPlayer(room: Room, playerId: string): Player | undefined {
    return room.players.get(playerId);
}

// Calculate score based on time
export function calculateScore(
    isCorrect: boolean,
    timeElapsed: number,
    timeLimit: number,
    maxPoints: number,
    decayType: 'linear' | 'exponential'
): number {
    if (!isCorrect) return 0;

    const clampedTime = Math.min(Math.max(timeElapsed, 0), timeLimit);
    const timeRatio = clampedTime / timeLimit;

    let multiplier: number;

    if (decayType === 'linear') {
        // 100% at t=0, 50% at t=timeLimit
        multiplier = 1 - timeRatio * 0.5;
    } else {
        // Exponential decay
        multiplier = Math.exp(-timeRatio * 0.7);
    }

    return Math.round(maxPoints * multiplier);
}

// Submit player answer
export function submitAnswer(
    room: Room,
    playerId: string,
    optionIndex: number
): { success: boolean; pointsEarned: number } {
    const player = room.players.get(playerId);
    if (!player) return { success: false, pointsEarned: 0 };

    // Check if already answered
    if (player.hasAnswered) {
        return { success: false, pointsEarned: 0 };
    }

    const question = room.questions[room.currentQuestionIndex];
    if (!question || !room.questionStartTime) {
        return { success: false, pointsEarned: 0 };
    }

    const timeElapsed = (Date.now() - room.questionStartTime) / 1000;
    const isCorrect = optionIndex === question.correctIndex;
    const pointsEarned = calculateScore(
        isCorrect,
        timeElapsed,
        question.timeLimit,
        question.points,
        room.settings.timeDecay
    );

    player.answers.push({
        questionIndex: room.currentQuestionIndex,
        selectedOption: optionIndex,
        submittedAt: Date.now(),
        isCorrect,
        pointsEarned,
    });

    player.score += pointsEarned;
    player.lastQuestionScore = pointsEarned;
    player.hasAnswered = true;

    return { success: true, pointsEarned };
}

// Get current question (without answer)
export function getCurrentQuestionView(room: Room): QuestionView | null {
    const question = room.questions[room.currentQuestionIndex];
    if (!question) return null;

    return {
        id: question.id,
        text: question.text,
        options: question.options,
        timeLimit: question.timeLimit,
        points: question.points,
        imageUrl: question.imageUrl,
    };
}

// Generate leaderboard
export function getLeaderboard(room: Room): LeaderboardEntry[] {
    const players = [...room.players.values()];

    // Sort by score descending
    players.sort((a, b) => b.score - a.score);

    return players.map((player, index) => ({
        rank: index + 1,
        playerId: player.id,
        username: player.username,
        score: player.score,
        lastQuestionScore: player.lastQuestionScore,
    }));
}

// Get question results
export function getQuestionResults(room: Room): QuestionResults {
    const question = room.questions[room.currentQuestionIndex];
    const optionCounts = new Array(question.options.length).fill(0);

    const playerAnswers = [...room.players.values()].map((player) => {
        const answer = player.answers.find(
            (a) => a.questionIndex === room.currentQuestionIndex
        );

        if (answer && answer.selectedOption !== null) {
            optionCounts[answer.selectedOption]++;
        }

        return {
            playerId: player.id,
            selectedOption: answer?.selectedOption ?? null,
            isCorrect: answer?.isCorrect ?? false,
            pointsEarned: answer?.pointsEarned ?? 0,
        };
    });

    return {
        correctIndex: question.correctIndex,
        playerAnswers,
        optionCounts,
    };
}

// Move to next question
export function nextQuestion(room: Room): boolean {
    room.currentQuestionIndex++;

    if (room.currentQuestionIndex >= room.questions.length) {
        room.status = 'finished';
        return false;
    }

    // Reset player answer states
    room.players.forEach((player) => {
        player.hasAnswered = false;
        player.lastQuestionScore = 0;
    });

    room.status = 'question';
    room.questionStartTime = Date.now();
    return true;
}

// Check if all players answered
export function allPlayersAnswered(room: Room): boolean {
    return [...room.players.values()].every((p) => p.hasAnswered);
}

// Get connected player count
export function getPlayerCount(room: Room): number {
    return room.players.size;
}

// Update player connection status
export function setPlayerConnected(
    room: Room,
    playerId: string,
    connected: boolean
): void {
    const player = room.players.get(playerId);
    if (player) {
        player.isConnected = connected;
    }
}

// Reconnect player with new socket ID
export function reconnectPlayer(
    room: Room,
    oldPlayerId: string,
    newSocketId: string
): Player | null {
    const player = room.players.get(oldPlayerId);
    if (!player) return null;

    // Update socket ID
    room.players.delete(oldPlayerId);
    player.id = newSocketId;
    player.isConnected = true;
    room.players.set(newSocketId, player);

    return player;
}
