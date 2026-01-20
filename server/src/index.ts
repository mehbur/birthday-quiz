import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
    ClientToServerEvents,
    ServerToClientEvents,
    Room,
} from './types.js';
import {
    createRoom,
    getRoom,
    addPlayer,
    removePlayer,
    submitAnswer,
    getCurrentQuestionView,
    getLeaderboard,
    getQuestionResults,
    nextQuestion,
    allPlayersAnswered,
    getPlayerCount,
    setPlayerConnected,
} from './game.js';
import { questions } from './questions.js';

const app = express();

// CORS configuration for production
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    },
});

// Health check endpoint for Render
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: '🎂 Birthday Quiz Server Running!' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Active timers for question countdown
const questionTimers = new Map<string, NodeJS.Timeout>();
const tickIntervals = new Map<string, NodeJS.Timeout>();

// Clear timers for a room
function clearRoomTimers(roomId: string) {
    const timer = questionTimers.get(roomId);
    const tick = tickIntervals.get(roomId);
    if (timer) clearTimeout(timer);
    if (tick) clearInterval(tick);
    questionTimers.delete(roomId);
    tickIntervals.delete(roomId);
}

// Start question timer
function startQuestionTimer(room: Room) {
    const question = room.questions[room.currentQuestionIndex];
    if (!question) return;

    let remaining = question.timeLimit;

    // Tick every second
    const tickInterval = setInterval(() => {
        remaining--;
        io.to(room.id).emit('game:timer-tick', { remaining });

        if (remaining <= 0) {
            clearRoomTimers(room.id);
            endQuestion(room);
        }
    }, 1000);

    tickIntervals.set(room.id, tickInterval);
}

// End current question
function endQuestion(room: Room) {
    room.status = 'results';
    const results = getQuestionResults(room);
    io.to(room.id).emit('game:question-results', results);

    // Show leaderboard after 3 seconds
    setTimeout(() => {
        room.status = 'leaderboard';
        const leaderboard = getLeaderboard(room);
        io.to(room.id).emit('game:leaderboard', { leaderboard });
    }, 3000);
}

// Advance to next question
function advanceToNextQuestion(room: Room) {
    const hasMore = nextQuestion(room);

    if (!hasMore) {
        // Game finished
        const finalLeaderboard = getLeaderboard(room);
        io.to(room.id).emit('game:finished', { finalLeaderboard });
        return;
    }

    // Send question to all players
    const questionView = getCurrentQuestionView(room);
    if (questionView) {
        io.to(room.id).emit('game:question', {
            question: questionView,
            index: room.currentQuestionIndex,
            total: room.questions.length,
        });
    }

    // Start timer
    startQuestionTimer(room);
}

// Socket connection handler
io.on('connection', (socket) => {
    console.log(`[Connect] ${socket.id}`);

    // HOST: Create room
    socket.on('host:create-room', () => {
        const room = createRoom(socket.id, questions);
        socket.join(room.id);
        socket.emit('room:created', { roomId: room.id });
        console.log(`[Room Created] ${room.id} by ${socket.id}`);
    });

    // PLAYER: Join room
    socket.on('player:join-room', ({ roomId, username }) => {
        const room = getRoom(roomId);

        if (!room) {
            socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Oda bulunamadı!' });
            return;
        }

        if (room.status !== 'lobby') {
            socket.emit('error', { code: 'GAME_IN_PROGRESS', message: 'Oyun zaten başladı!' });
            return;
        }

        const player = addPlayer(room, socket.id, username);
        if (!player) {
            socket.emit('error', { code: 'ROOM_FULL', message: 'Oda dolu!' });
            return;
        }

        socket.join(roomId);
        socket.emit('room:joined', { player, roomId });
        io.to(roomId).emit('room:player-joined', {
            player,
            playerCount: getPlayerCount(room),
        });

        console.log(`[Player Joined] ${player.username} -> ${roomId}`);
    });

    // HOST: Start game
    socket.on('host:start-game', ({ roomId }) => {
        const room = getRoom(roomId);
        if (!room || room.hostId !== socket.id) return;

        if (room.players.size === 0) {
            socket.emit('error', { code: 'NO_PLAYERS', message: 'Hiç oyuncu yok!' });
            return;
        }

        // Countdown
        room.status = 'countdown';
        let countdown = 3;

        const countdownInterval = setInterval(() => {
            io.to(roomId).emit('game:countdown', { seconds: countdown });
            countdown--;

            if (countdown < 0) {
                clearInterval(countdownInterval);
                advanceToNextQuestion(room);
            }
        }, 1000);

        console.log(`[Game Started] ${roomId}`);
    });

    // PLAYER: Submit answer
    socket.on('player:submit-answer', ({ roomId, optionIndex }) => {
        const room = getRoom(roomId);
        if (!room || room.status !== 'question') return;

        const result = submitAnswer(room, socket.id, optionIndex);
        if (result.success) {
            io.to(roomId).emit('game:answer-received', { playerId: socket.id });

            // Check if all players answered
            if (allPlayersAnswered(room)) {
                clearRoomTimers(roomId);
                endQuestion(room);
            }
        }
    });

    // HOST: Next question
    socket.on('host:next-question', ({ roomId }) => {
        const room = getRoom(roomId);
        if (!room || room.hostId !== socket.id) return;
        if (room.status !== 'leaderboard') return;

        advanceToNextQuestion(room);
    });

    // HOST: Skip question
    socket.on('host:skip-question', ({ roomId }) => {
        const room = getRoom(roomId);
        if (!room || room.hostId !== socket.id) return;
        if (room.status !== 'question') return;

        clearRoomTimers(roomId);
        endQuestion(room);
    });

    // HOST: End game
    socket.on('host:end-game', ({ roomId }) => {
        const room = getRoom(roomId);
        if (!room || room.hostId !== socket.id) return;

        clearRoomTimers(roomId);
        room.status = 'finished';
        const finalLeaderboard = getLeaderboard(room);
        io.to(roomId).emit('game:finished', { finalLeaderboard });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
        console.log(`[Disconnect] ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
    console.log(`🎂 Doğum Günü Quiz Sunucusu çalışıyor: http://localhost:${PORT}`);
});
