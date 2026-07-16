import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { speak, playSound, vibrate } from '../utils/sounds';
import confetti from 'canvas-confetti';

const FALLBACK_WORDS = [
  { word: 'coffee', vietnamese: 'cà phê', example: 'I drink coffee every morning.' },
  { word: 'interview', vietnamese: 'cuộc phỏng vấn', example: 'He had a job interview yesterday.' },
  { word: 'croissant', vietnamese: 'bánh sừng bò', example: 'She ordered a warm croissant.' },
  { word: 'employer', vietnamese: 'nhà tuyển dụng', example: 'The employer interviewed candidates.' },
  { word: 'company', vietnamese: 'công ty', example: 'She works for a tech company.' },
  { word: 'culture', vietnamese: 'văn hóa', example: 'Seattle has a rich coffee culture.' },
  { word: 'professional', vietnamese: 'chuyên nghiệp', example: 'Showcase your professional skills.' },
  { word: 'motivate', vietnamese: 'thúc đẩy, có động lực', example: 'They want motivated candidates.' },
  { word: 'experience', vietnamese: 'kinh nghiệm', example: 'Previous work experience is helpful.' }
];

export default function MiniGames({ onNavigateBack, showToast }) {
  const [activeGame, setActiveGame] = useState(null); // null, hangman, time_attack
  const [vocabList, setVocabList] = useState([]);
  
  useEffect(() => {
    const list = storage.getSavedVocab();
    setVocabList(list.length >= 5 ? list : FALLBACK_WORDS);
  }, []);

  // --- HANGMAN GAME STATE ---
  const [hangmanWord, setHangmanWord] = useState('');
  const [hangmanHint, setHangmanHint] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [remainingGuesses, setRemainingGuesses] = useState(6);
  const [hangmanStatus, setHangmanStatus] = useState('playing'); // playing, won, lost

  const startHangman = () => {
    const randomItem = vocabList[Math.floor(Math.random() * vocabList.length)];
    setHangmanWord(randomItem.word.toLowerCase().replace(/[^a-z]/g, ''));
    setHangmanHint(randomItem.vietnamese);
    setGuessedLetters([]);
    setRemainingGuesses(6);
    setHangmanStatus('playing');
  };

  const handleGuess = (letter) => {
    if (guessedLetters.includes(letter) || hangmanStatus !== 'playing') return;
    
    const updatedGuessed = [...guessedLetters, letter];
    setGuessedLetters(updatedGuessed);

    const isCorrect = hangmanWord.includes(letter);
    if (isCorrect) {
      playSound('correct');
      // Check if all letters guessed
      const isWordGuessed = [...hangmanWord].every(char => updatedGuessed.includes(char));
      if (isWordGuessed) {
        setHangmanStatus('won');
        playSound('complete');
        confetti({ particleCount: 50, spread: 60 });
        // Award points
        storage.updateUserStats({ points: storage.getUserStats().points + 15 });
        storage.incrementActivity(1);
      }
    } else {
      playSound('incorrect');
      vibrate(100);
      const guessesLeft = remainingGuesses - 1;
      setRemainingGuesses(guessesLeft);
      if (guessesLeft === 0) {
        setHangmanStatus('lost');
      }
    }
  };

  // --- TIME ATTACK QUIZ STATE ---
  const [quizScore, setQuizScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [taStatus, setTaStatus] = useState('lobby'); // lobby, playing, finished
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [taOptions, setTaOptions] = useState([]);
  const timerRef = useRef(null);

  const startTImeAttack = () => {
    setQuizScore(0);
    setTimeLeft(60);
    setTaStatus('playing');
    generateTAQuestion();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTaStatus('finished');
          playSound('complete');
          confetti({ particleCount: 60, spread: 70 });
          // Award XP based on score
          const pointsEarned = quizScore * 2;
          storage.updateUserStats({ points: storage.getUserStats().points + pointsEarned });
          storage.incrementActivity(3);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const generateTAQuestion = () => {
    if (vocabList.length < 4) return;
    
    const correctIndex = Math.floor(Math.random() * vocabList.length);
    const correct = vocabList[correctIndex];
    
    // Choose 3 random wrong options
    const wrong = vocabList
      .filter(item => item.word.toLowerCase() !== correct.word.toLowerCase())
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
      
    const allOptions = [...wrong, correct].sort(() => 0.5 - Math.random());
    
    setCurrentQuestion(correct);
    setTaOptions(allOptions);
  };

  const handleTAAnswer = (option) => {
    if (taStatus !== 'playing') return;
    
    const isCorrect = option.word.toLowerCase() === currentQuestion.word.toLowerCase();
    
    if (isCorrect) {
      playSound('correct');
      setQuizScore((prev) => prev + 1);
    } else {
      playSound('incorrect');
      vibrate(100);
    }
    
    generateTAQuestion();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleBackToMenu = () => {
    setActiveGame(null);
    if (timerRef.current) clearInterval(timerRef.current);
    setTaStatus('lobby');
  };

  return (
    <div className="mini-games-screen animate-slideup p-6 glass">
      <div className="flex justify-between items-center mb-6">
        <button 
          className="btn-secondary" 
          onClick={activeGame ? handleBackToMenu : onNavigateBack}
        >
          {activeGame ? '← Thoát game' : '← Quay về Dashboard'}
        </button>
        <h2 className="glow-text text-gradient">V-English Playzone - Trò chơi học từ</h2>
      </div>

      {/* GAME MENU SELECTION */}
      {!activeGame && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto py-12">
          {/* Card Game 1: Hangman */}
          <div className="glass p-8 rounded-lg flex flex-col gap-5 border border-light hover:border-primary transition duration-300">
            <div className="text-4xl text-center">🪓</div>
            <h3 className="text-xl font-bold text-center color-text-dark">Game 1: Hangman (Treo Cổ)</h3>
            <p className="text-sm color-text-muted text-center leading-relaxed">
              Thử thách đoán các từ vựng bạn đã lưu bằng cách ghép từng chữ cái. Đoán sai quá 6 lần, bạn sẽ thua cuộc!
            </p>
            <button 
              className="btn-primary mt-auto py-3 justify-center"
              onClick={() => {
                setActiveGame('hangman');
                startHangman();
              }}
            >
              Chơi Hangman 🎮
            </button>
          </div>

          {/* Card Game 2: Time Attack */}
          <div className="glass p-8 rounded-lg flex flex-col gap-5 border border-light hover:border-secondary transition duration-300">
            <div className="text-4xl text-center">⚡</div>
            <h3 className="text-xl font-bold text-center color-text-dark">Game 2: Time Attack 60s</h3>
            <p className="text-sm color-text-muted text-center leading-relaxed">
              Bạn có 60 giây để trả lời đúng càng nhiều câu trắc nghiệm từ vựng càng tốt. Trả lời cực nhanh để nhân đôi số XP nhận được!
            </p>
            <button 
              className="btn-primary mt-auto py-3 justify-center"
              style={{ background: 'linear-gradient(135deg, var(--color-secondary) 0%, #f97316 100%)', boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)' }}
              onClick={() => {
                setActiveGame('time_attack');
                setTaStatus('lobby');
              }}
            >
              Chơi Time Attack ⚡
            </button>
          </div>
        </div>
      )}

      {/* GAME 1: HANGMAN INTERFACE */}
      {activeGame === 'hangman' && (
        <div className="hangman-game flex flex-col items-center gap-6 max-w-2xl mx-auto py-6 animate-slideup">
          <div className="flex justify-between w-full border-b border-light pb-3">
            <span className="text-sm color-text-muted">Mẹo dịch nghĩa: <strong className="color-primary">{hangmanHint}</strong></span>
            <span className="text-sm font-bold" style={{ color: remainingGuesses <= 2 ? 'var(--color-error)' : 'var(--color-success)' }}>
              Lượt thử còn lại: {remainingGuesses} / 6 ❤️
            </span>
          </div>

          {/* Graphical Representation of guesses remaining */}
          <div className="flex gap-1 py-4 justify-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="text-2xl" style={{ opacity: i < remainingGuesses ? 1 : 0.2 }}>
                ❤️
              </span>
            ))}
          </div>

          {/* Word Spaces display */}
          <div className="flex gap-3 justify-center py-6 text-3xl font-extrabold tracking-widest border-y border-light w-full">
            {[...hangmanWord].map((char, index) => {
              const guessed = guessedLetters.includes(char);
              return (
                <span 
                  key={index}
                  className="border-b-4 border-slate-500 min-w-[28px] text-center"
                  style={{
                    borderColor: guessed ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    color: guessed ? 'var(--color-text-dark)' : 'transparent'
                  }}
                >
                  {guessed ? char.toUpperCase() : '_'}
                </span>
              );
            })}
          </div>

          {/* Alphabets keyboard */}
          {hangmanStatus === 'playing' ? (
            <div className="flex flex-wrap justify-center gap-2 max-w-md mt-4">
              {['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'].map((char) => {
                const used = guessedLetters.includes(char);
                const correct = used && hangmanWord.includes(char);
                
                return (
                  <button
                    key={char}
                    disabled={used}
                    onClick={() => handleGuess(char)}
                    className={`w-10 h-10 flex items-center justify-center font-bold rounded cursor-pointer transition ${used ? correct ? 'bg-emerald-600 text-white' : 'bg-rose-950 text-slate-500 opacity-40' : 'bg-slate-800 hover:bg-slate-700 color-text-dark border border-light'}`}
                    style={{
                      fontSize: '16px'
                    }}
                  >
                    {char.toUpperCase()}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="game-over-box glass p-6 text-center w-full max-w-sm rounded animate-slideup border border-light mt-4">
              <h3 className="text-2xl font-bold mb-2">
                {hangmanStatus === 'won' ? '🎉 Bạn đã thắng!' : '😢 Game Over!'}
              </h3>
              <p className="text-sm color-text-muted mb-4">
                {hangmanStatus === 'won' ? 'Tuyệt vời! Bạn nhận được +15 XP.' : `Từ đúng là: "${hangmanWord.toUpperCase()}"`}
              </p>
              
              <div className="flex gap-3 justify-center">
                <button className="btn-secondary" onClick={() => speak(hangmanWord)}>
                  🔊 Nghe từ
                </button>
                <button className="btn-primary" onClick={startHangman}>
                  Chơi tiếp 🔁
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GAME 2: TIME ATTACK INTERFACE */}
      {activeGame === 'time_attack' && (
        <div className="time-attack-game flex flex-col items-center gap-6 max-w-xl mx-auto py-6 animate-slideup">
          
          {taStatus === 'lobby' && (
            <div className="text-center py-12 flex flex-col items-center gap-6">
              <span className="text-6xl">⏱️</span>
              <h3 className="text-2xl font-bold color-text-dark">Sẵn sàng đua thời gian?</h3>
              <p className="text-sm color-text-muted max-w-sm">
                Đồng hồ sẽ đếm ngược 60 giây. Hãy chọn nhanh nghĩa đúng của từ được hiển thị. Trả lời đúng nhiều từ để đạt kỷ lục điểm cao nhất!
              </p>
              <button className="btn-primary py-3 px-8 text-base font-bold" onClick={startTImeAttack}>
                Bắt đầu Đua! ⏱️
              </button>
            </div>
          )}

          {taStatus === 'playing' && currentQuestion && (
            <div className="w-full flex flex-col gap-6">
              {/* Header stats */}
              <div className="flex justify-between items-center border-b border-light pb-3">
                <div className="text-sm color-text-muted font-semibold">
                  Điểm: <strong className="color-primary text-lg">{quizScore}</strong>
                </div>
                <div className="text-sm font-bold flex items-center gap-2" style={{ color: timeLeft <= 10 ? 'var(--color-error)' : 'var(--color-secondary)' }}>
                  ⏱️ Thời gian: <span className="text-lg font-extrabold">{timeLeft}s</span>
                </div>
              </div>

              {/* Progress visual bar */}
              <div className="w-full h-2 rounded bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                  style={{ width: `${(timeLeft / 60) * 100}%`, background: timeLeft <= 10 ? 'var(--color-error)' : 'var(--color-secondary)' }}
                ></div>
              </div>

              {/* Question display */}
              <div className="glass p-6 text-center rounded border border-light flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wider color-text-muted">Chọn từ có nghĩa sau:</span>
                <span className="text-2xl font-extrabold color-text-dark">"{currentQuestion.vietnamese}"</span>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3">
                {taOptions.map((opt, index) => (
                  <button
                    key={index}
                    onClick={() => handleTAAnswer(opt)}
                    className="btn-secondary w-full py-4 text-base font-bold justify-center rounded-md border border-light hover:border-primary transition"
                  >
                    {opt.word}
                  </button>
                ))}
              </div>
            </div>
          )}

          {taStatus === 'finished' && (
            <div className="glass p-8 text-center rounded border border-light w-full flex flex-col gap-5 animate-slideup">
              <span className="text-5xl">🏆</span>
              <h3 className="text-2xl font-extrabold text-gradient">Hết giờ! Kết quả</h3>
              
              <div className="py-4 border-y border-light flex justify-around">
                <div>
                  <span className="text-xs color-text-muted block font-semibold uppercase">Số câu đúng</span>
                  <span className="text-3xl font-extrabold color-primary">{quizScore}</span>
                </div>
                <div>
                  <span className="text-xs color-text-muted block font-semibold uppercase">XP Nhận được</span>
                  <span className="text-3xl font-extrabold" style={{ color: 'var(--color-success)' }}>+{quizScore * 2} XP</span>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button className="btn-secondary" onClick={handleBackToMenu}>
                  Menu chính
                </button>
                <button className="btn-primary" onClick={startTImeAttack}>
                  Chơi lại 🔁
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
