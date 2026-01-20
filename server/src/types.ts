// =====================================================
// SHARED TYPES - Server & Client
// =====================================================

// Room status enum
export type RoomStatus =
    | 'lobby'
    | 'countdown'
    | 'question'
    | 'results'
    | 'leaderboard'
    | 'finished';

// Question model
export interface Question {
    id: string;
    text: string;
    options: string[];
    correctIndex: number;
    timeLimit: number;
    points: number;
    imageUrl?: string;
}

// Question sent to players (without correct answer)
export interface QuestionView {
    id: string;
    text: string;
    options: string[];
    timeLimit: number;
    points: number;
    imageUrl?: string;
}

// Player answer
export interface Answer {
    questionIndex: number;
    selectedOption: number | null;
    submittedAt: number;
    isCorrect: boolean;
    pointsEarned: number;
}

// Player model
export interface Player {
    id: string;
    username: string;
    score: number;
    lastQuestionScore: number;
    isConnected: boolean;
    joinedAt: number;
    answers: Answer[];
    hasAnswered: boolean;
}

// Game settings
export interface GameSettings {
    timeDecay: 'linear' | 'exponential';
    questionTimeLimit: number;
    maxPlayers: number;
    allowLateJoin: boolean;
    showCorrectAnswer: boolean;
}

// Room model
export interface Room {
    id: string;
    hostId: string;
    status: RoomStatus;
    players: Map<string, Player>;
    questions: Question[];
    currentQuestionIndex: number;
    settings: GameSettings;
    createdAt: number;
    questionStartTime: number | null;
}

// Leaderboard entry
export interface LeaderboardEntry {
    rank: number;
    playerId: string;
    username: string;
    score: number;
    lastQuestionScore: number;
    previousRank?: number;
}

// Question results
export interface QuestionResults {
    correctIndex: number;
    playerAnswers: {
        playerId: string;
        selectedOption: number | null;
        isCorrect: boolean;
        pointsEarned: number;
    }[];
    optionCounts: number[];
}

// =====================================================
// SOCKET EVENTS
// =====================================================

// Client -> Server events
export interface ClientToServerEvents {
    'host:create-room': () => void;
    'player:join-room': (data: { roomId: string; username: string }) => void;
    'host:start-game': (data: { roomId: string }) => void;
    'player:submit-answer': (data: { roomId: string; optionIndex: number }) => void;
    'host:next-question': (data: { roomId: string }) => void;
    'host:skip-question': (data: { roomId: string }) => void;
    'host:end-game': (data: { roomId: string }) => void;
    'player:reconnect': (data: { roomId: string; playerId: string }) => void;
}

// Server -> Client events
export interface ServerToClientEvents {
    'room:created': (data: { roomId: string }) => void;
    'room:joined': (data: { player: Player; roomId: string }) => void;
    'room:player-joined': (data: { player: Player; playerCount: number }) => void;
    'room:player-left': (data: { playerId: string; playerCount: number }) => void;
    'game:countdown': (data: { seconds: number }) => void;
    'game:question': (data: { question: QuestionView; index: number; total: number }) => void;
    'game:timer-tick': (data: { remaining: number }) => void;
    'game:answer-received': (data: { playerId: string }) => void;
    'game:question-results': (data: QuestionResults) => void;
    'game:leaderboard': (data: { leaderboard: LeaderboardEntry[] }) => void;
    'game:finished': (data: { finalLeaderboard: LeaderboardEntry[] }) => void;
    'game:state-sync': (data: GameState) => void;
    'error': (data: { code: string; message: string }) => void;
}

// Full game state for sync
export interface GameState {
    roomId: string;
    status: RoomStatus;
    players: Player[];
    currentQuestionIndex: number;
    totalQuestions: number;
    currentQuestion?: QuestionView;
    timeRemaining?: number;
    leaderboard?: LeaderboardEntry[];
}
