import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import './index.css';

// ============================================
// SOCKET
// ============================================
// Production: Use environment variable, Development: localhost
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const socket: Socket = io(SERVER_URL, { autoConnect: false });

// ============================================
// TYPES
// ============================================
type RoomStatus = 'lobby' | 'countdown' | 'question' | 'results' | 'leaderboard' | 'finished';

interface Player {
  id: string;
  username: string;
  score: number;
  lastQuestionScore: number;
  isConnected: boolean;
  joinedAt: number;
  hasAnswered: boolean;
}

interface QuestionView {
  id: string;
  text: string;
  options: string[];
  timeLimit: number;
  points: number;
}

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  score: number;
  lastQuestionScore: number;
}

interface QuestionResults {
  correctIndex: number;
  playerAnswers: {
    playerId: string;
    selectedOption: number | null;
    isCorrect: boolean;
    pointsEarned: number;
  }[];
  optionCounts: number[];
}

// ============================================
// CONTEXT
// ============================================
interface GameContextType {
  isConnected: boolean;
  roomId: string | null;
  isHost: boolean;
  status: RoomStatus;
  player: Player | null;
  players: Player[];
  currentQuestion: QuestionView | null;
  questionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  selectedOption: number | null;
  hasAnswered: boolean;
  questionResults: QuestionResults | null;
  leaderboard: LeaderboardEntry[];
  myResult: { isCorrect: boolean; pointsEarned: number } | null;
  countdown: number;
  error: string | null;
  createRoom: () => void;
  joinRoom: (roomId: string, username: string) => void;
  startGame: () => void;
  submitAnswer: (optionIndex: number) => void;
  nextQuestion: () => void;
  skipQuestion: () => void;
  endGame: () => void;
  clearError: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};

const GameProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [status, setStatus] = useState<RoomStatus>('lobby');
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionView | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [questionResults, setQuestionResults] = useState<QuestionResults | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myResult, setMyResult] = useState<{ isCorrect: boolean; pointsEarned: number } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('room:created', ({ roomId }: { roomId: string }) => {
      setRoomId(roomId);
      setIsHost(true);
      setStatus('lobby');
    });

    socket.on('room:joined', ({ player, roomId }: { player: Player; roomId: string }) => {
      setRoomId(roomId);
      setPlayer(player);
      setStatus('lobby');
    });

    socket.on('room:player-joined', ({ player }: { player: Player }) => {
      setPlayers(prev => prev.find(p => p.id === player.id) ? prev : [...prev, player]);
    });

    socket.on('room:player-left', ({ playerId }: { playerId: string }) => {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    });

    socket.on('game:countdown', ({ seconds }: { seconds: number }) => {
      setStatus('countdown');
      setCountdown(seconds);
    });

    socket.on('game:question', ({ question, index, total }: { question: QuestionView; index: number; total: number }) => {
      setStatus('question');
      setCurrentQuestion(question);
      setQuestionIndex(index);
      setTotalQuestions(total);
      setTimeRemaining(question.timeLimit);
      setSelectedOption(null);
      setHasAnswered(false);
      setQuestionResults(null);
      setMyResult(null);
    });

    socket.on('game:timer-tick', ({ remaining }: { remaining: number }) => {
      setTimeRemaining(remaining);
    });

    socket.on('game:question-results', (results: QuestionResults) => {
      setStatus('results');
      setQuestionResults(results);
      const myAnswer = results.playerAnswers.find(a => a.playerId === socket.id);
      if (myAnswer) {
        setMyResult({ isCorrect: myAnswer.isCorrect, pointsEarned: myAnswer.pointsEarned });
      }
    });

    socket.on('game:leaderboard', ({ leaderboard }: { leaderboard: LeaderboardEntry[] }) => {
      setStatus('leaderboard');
      setLeaderboard(leaderboard);
    });

    socket.on('game:finished', ({ finalLeaderboard }: { finalLeaderboard: LeaderboardEntry[] }) => {
      setStatus('finished');
      setLeaderboard(finalLeaderboard);
    });

    socket.on('error', ({ message }: { message: string }) => {
      setError(message);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:player-joined');
      socket.off('room:player-left');
      socket.off('game:countdown');
      socket.off('game:question');
      socket.off('game:timer-tick');
      socket.off('game:question-results');
      socket.off('game:leaderboard');
      socket.off('game:finished');
      socket.off('error');
    };
  }, []);

  const createRoom = () => socket.emit('host:create-room');
  const joinRoom = (rid: string, username: string) => socket.emit('player:join-room', { roomId: rid, username });
  const startGame = () => roomId && socket.emit('host:start-game', { roomId });
  const submitAnswer = (optionIndex: number) => {
    if (roomId && !hasAnswered) {
      setSelectedOption(optionIndex);
      setHasAnswered(true);
      socket.emit('player:submit-answer', { roomId, optionIndex });
    }
  };
  const nextQuestion = () => roomId && socket.emit('host:next-question', { roomId });
  const skipQuestion = () => roomId && socket.emit('host:skip-question', { roomId });
  const endGame = () => roomId && socket.emit('host:end-game', { roomId });
  const clearError = () => setError(null);
  const resetGame = () => {
    setRoomId(null);
    setIsHost(false);
    setStatus('lobby');
    setPlayer(null);
    setPlayers([]);
    setCurrentQuestion(null);
    setQuestionIndex(0);
    setTotalQuestions(0);
    setTimeRemaining(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setQuestionResults(null);
    setLeaderboard([]);
    setMyResult(null);
    setCountdown(0);
    setError(null);
  };

  return (
    <GameContext.Provider value={{
      isConnected, roomId, isHost, status, player, players, currentQuestion,
      questionIndex, totalQuestions, timeRemaining, selectedOption, hasAnswered,
      questionResults, leaderboard, myResult, countdown, error,
      createRoom, joinRoom, startGame, submitAnswer, nextQuestion, skipQuestion, endGame, clearError, resetGame
    }}>
      {children}
    </GameContext.Provider>
  );
};

// ============================================
// SCREENS
// ============================================

// HOME
function HomeScreen() {
  const { createRoom, joinRoom, error, clearError, isConnected } = useGame();
  const [mode, setMode] = useState<'select' | 'join'>('select');
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 6 && username.trim()) {
      joinRoom(pin, username.trim());
    }
  };

  if (!isConnected) {
    return (
      <div className="container" style={{ marginTop: '100px' }}>
        <div className="logo">
          <span className="logo-emoji">🎂</span>
          Beni Tanıyor musun?
        </div>
        <p className="waiting">Sunucuya bağlanılıyor<span className="waiting-dots"></span></p>
      </div>
    );
  }

  if (mode === 'select') {
    return (
      <div className="container" style={{ marginTop: '60px' }}>
        <div className="logo">
          <span className="logo-emoji">🎂</span>
          Beni Tanıyor musun?
        </div>
        <p className="subtitle">Doğum günü quiz oyunu</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button className="btn btn-primary btn-large" onClick={createRoom}>🎮 Oyun Oluştur</button>
          <button className="btn btn-secondary btn-large" onClick={() => setMode('join')}>🎯 Oyuna Katıl</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '60px' }}>
      <div className="logo">
        <span className="logo-emoji">🎂</span>
        Beni Tanıyor musun?
      </div>
      <form onSubmit={handleJoin}>
        <div style={{ marginBottom: '16px' }}>
          <input type="text" className="input pin-input" placeholder="ODA PIN" value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <input type="text" className="input" placeholder="Takma Adın" value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, 20))} maxLength={20} />
        </div>
        {error && (
          <div style={{ background: 'rgba(226, 27, 60, 0.3)', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }} onClick={clearError}>
            {error}
          </div>
        )}
        <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%' }} disabled={pin.length !== 6 || !username.trim()}>Katıl! 🚀</button>
        <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '12px' }} onClick={() => setMode('select')}>← Geri</button>
      </form>
    </div>
  );
}

// LOBBY
function LobbyScreen() {
  const { roomId, isHost, players, startGame, error, clearError } = useGame();

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      <div className="card" style={{ textAlign: 'center', marginBottom: '24px' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>{isHost ? 'ODA PIN - Paylaş!' : 'ODA PIN'}</p>
        <div className="room-pin">{roomId}</div>
      </div>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '16px', fontSize: '20px' }}>Oyuncular ({players.length})</h2>
        <div className="player-list">
          {players.map((p) => <div key={p.id} className="player-chip">{p.username}</div>)}
          {players.length === 0 && <p className="waiting" style={{ padding: '20px' }}>Oyuncu bekleniyor<span className="waiting-dots"></span></p>}
        </div>
      </div>
      {error && <div style={{ background: 'rgba(226, 27, 60, 0.3)', padding: '12px', borderRadius: '8px', marginTop: '16px', textAlign: 'center' }} onClick={clearError}>{error}</div>}
      {isHost && (
        <div className="admin-panel">
          <p className="admin-title">Admin Panel</p>
          <button className="btn btn-primary btn-large" style={{ width: '100%' }} onClick={startGame} disabled={players.length === 0}>🎮 Oyunu Başlat</button>
        </div>
      )}
      {!isHost && <div style={{ textAlign: 'center', marginTop: '32px' }}><p className="waiting">Oyunun başlaması bekleniyor<span className="waiting-dots"></span></p></div>}
    </div>
  );
}

// COUNTDOWN
function CountdownScreen() {
  const { countdown } = useGame();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="countdown">{countdown > 0 ? countdown : 'BAŞLA!'}</div>
    </div>
  );
}

// QUESTION
function QuestionScreen() {
  const { currentQuestion, questionIndex, totalQuestions, timeRemaining, selectedOption, hasAnswered, submitAnswer, isHost, skipQuestion } = useGame();

  if (!currentQuestion) return <div className="waiting">Soru yükleniyor...</div>;

  const timerPercentage = (timeRemaining / currentQuestion.timeLimit) * 100;
  const isLowTime = timeRemaining <= 5;

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <div className="timer-container">
        <svg className="timer-progress" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle cx="60" cy="60" r="54" fill="none" stroke={isLowTime ? 'var(--color-red)' : 'var(--color-cyan)'} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={339.292} strokeDashoffset={339.292 * (1 - timerPercentage / 100)} style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }} />
        </svg>
        <div className="timer-circle">
          <span className="timer-text" style={{ color: isLowTime ? 'var(--color-red)' : 'white' }}>{timeRemaining}</span>
        </div>
      </div>
      <p className="question-counter">Soru {questionIndex + 1} / {totalQuestions}</p>
      <div className="question-text">{currentQuestion.text}</div>
      {!isHost && (
        <div className="options-grid">
          {currentQuestion.options.map((option, index) => (
            <button key={index} className={`option-btn ${selectedOption === index ? 'selected' : ''}`} onClick={() => submitAnswer(index)} disabled={hasAnswered}>
              {option}
            </button>
          ))}
        </div>
      )}
      {hasAnswered && !isHost && (
        <div style={{ textAlign: 'center', marginTop: '32px', padding: '20px', background: 'var(--bg-card)', borderRadius: '16px' }}>
          <span style={{ fontSize: '32px' }}>✓</span>
          <p style={{ marginTop: '8px' }}>Cevabın gönderildi!</p>
        </div>
      )}
      {isHost && (
        <div className="admin-panel">
          <p className="admin-title">Admin Panel</p>
          <button className="btn btn-danger" onClick={skipQuestion}>⏭️ Soruyu Atla</button>
        </div>
      )}
    </div>
  );
}

// RESULTS
function ResultsScreen() {
  const { questionResults, currentQuestion, selectedOption, myResult, isHost } = useGame();

  if (!questionResults || !currentQuestion) return <div className="waiting">Sonuçlar yükleniyor...</div>;

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <h1 className="title">{isHost ? 'Doğru Cevap' : myResult?.isCorrect ? '🎉 Doğru!' : '😔 Yanlış!'}</h1>
      {!isHost && myResult && (
        <div style={{ fontSize: '48px', fontWeight: 900, textAlign: 'center', color: myResult.isCorrect ? 'var(--color-green)' : 'var(--color-red)', marginBottom: '32px' }}>
          +{myResult.pointsEarned}
        </div>
      )}
      <div className="question-text">{currentQuestion.text}</div>
      <div className="options-grid">
        {currentQuestion.options.map((option, index) => {
          const isCorrect = index === questionResults.correctIndex;
          const wasSelected = selectedOption === index;
          return (
            <div key={index} className={`option-btn ${isCorrect ? 'correct' : wasSelected ? 'incorrect' : ''}`} style={{ opacity: isCorrect ? 1 : 0.4, cursor: 'default' }}>
              {option}
              {isCorrect && <span style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'white', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>}
            </div>
          );
        })}
      </div>
      <p className="waiting" style={{ marginTop: '32px' }}>Liderlik tablosu geliyor<span className="waiting-dots"></span></p>
    </div>
  );
}

// LEADERBOARD
function LeaderboardScreen() {
  const { leaderboard, isHost, nextQuestion, questionIndex, totalQuestions } = useGame();
  const isLastQuestion = questionIndex >= totalQuestions - 1;

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <h1 className="title">🏆 Liderlik Tablosu</h1>
      <div className="leaderboard">
        {leaderboard.map((entry, index) => (
          <div key={entry.playerId} className={`leaderboard-item ${index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : ''}`}>
            <span className="leaderboard-rank">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : entry.rank}</span>
            <span className="leaderboard-name">{entry.username}</span>
            <span className="leaderboard-score">{entry.score}</span>
            {entry.lastQuestionScore > 0 && <span className="leaderboard-delta">+{entry.lastQuestionScore}</span>}
          </div>
        ))}
      </div>
      {isHost && (
        <div className="admin-panel">
          <p className="admin-title">Admin Panel</p>
          <button className="btn btn-primary btn-large" style={{ width: '100%' }} onClick={nextQuestion}>
            {isLastQuestion ? '🏁 Sonuçları Göster' : '➡️ Sonraki Soru'}
          </button>
        </div>
      )}
      {!isHost && <p className="waiting" style={{ marginTop: '32px' }}>{isLastQuestion ? 'Final sonuçları bekleniyor' : 'Sonraki soru bekleniyor'}<span className="waiting-dots"></span></p>}
    </div>
  );
}

// PODIUM
function PodiumScreen() {
  const { leaderboard, resetGame, isHost } = useGame();
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <h1 className="title">🎉 Oyun Bitti! 🎉</h1>
      <div className="podium-container">
        {podiumOrder.map((entry, displayIndex) => {
          if (!entry) return null;
          const actualRank = displayIndex === 0 ? 2 : displayIndex === 1 ? 1 : 3;
          const blockClass = actualRank === 1 ? 'gold' : actualRank === 2 ? 'silver' : 'bronze';
          return (
            <div key={entry.playerId} className="podium-place">
              <div className="podium-avatar">{entry.username.charAt(0).toUpperCase()}</div>
              <div className="podium-name">{entry.username}</div>
              <div className="podium-score">{entry.score}</div>
              <div className={`podium-block ${blockClass}`}>{actualRank === 1 ? '🥇' : actualRank === 2 ? '🥈' : '🥉'}</div>
            </div>
          );
        })}
      </div>
      {rest.length > 0 && (
        <div className="leaderboard" style={{ marginTop: '32px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--text-secondary)' }}>Diğer Oyuncular</h3>
          {rest.map((entry) => (
            <div key={entry.playerId} className="leaderboard-item">
              <span className="leaderboard-rank">{entry.rank}</span>
              <span className="leaderboard-name">{entry.username}</span>
              <span className="leaderboard-score">{entry.score}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: '40px' }}>
        <button className="btn btn-primary btn-large" style={{ width: '100%' }} onClick={resetGame}>
          🔄 {isHost ? 'Yeni Oyun Oluştur' : 'Ana Menü'}
        </button>
      </div>
    </div>
  );
}

// ============================================
// ROUTER
// ============================================
function GameRouter() {
  const { roomId, status } = useGame();

  if (!roomId) return <HomeScreen />;

  switch (status) {
    case 'lobby': return <LobbyScreen />;
    case 'countdown': return <CountdownScreen />;
    case 'question': return <QuestionScreen />;
    case 'results': return <ResultsScreen />;
    case 'leaderboard': return <LeaderboardScreen />;
    case 'finished': return <PodiumScreen />;
    default: return <HomeScreen />;
  }
}

// ============================================
// APP
// ============================================
function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}

export default App;
