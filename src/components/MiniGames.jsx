import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { speak, playSound, vibrate } from '../utils/sounds';
import confetti from 'canvas-confetti';
import { fetchMoreVocabFromAI } from '../utils/geminiVocab';

const LEVEL_VOCAB = {
  A1: [
    { word: 'family', vietnamese: 'gia đình', example: 'I love my family.' },
    { word: 'kitchen', vietnamese: 'nhà bếp', example: 'She is cooking in the kitchen.' },
    { word: 'morning', vietnamese: 'buổi sáng', example: 'I wake up early in the morning.' },
    { word: 'doctor', vietnamese: 'bác sĩ', example: 'The doctor helped the sick child.' },
    { word: 'school', vietnamese: 'trường học', example: 'Children go to school to learn.' },
    { word: 'friend', vietnamese: 'bạn bè', example: 'He is playing with his friend.' },
    { word: 'animal', vietnamese: 'động vật', example: 'The elephant is a big animal.' },
    { word: 'street', vietnamese: 'đường phố', example: 'The street is quiet tonight.' },
    { word: 'weather', vietnamese: 'thời tiết', example: 'The weather is hot today.' },
    { word: 'journey', vietnamese: 'hành trình, chuyến đi', example: 'They started their journey early.' },
    { word: 'banana', vietnamese: 'quả chuối', example: 'Monkeys like to eat bananas.' },
    { word: 'computer', vietnamese: 'máy tính', example: 'She is working on her computer.' },
    { word: 'garden', vietnamese: 'khu vườn', example: 'Beautiful flowers grow in the garden.' },
    { word: 'window', vietnamese: 'cửa sổ', example: 'Please close the window.' },
    { word: 'ticket', vietnamese: 'vé', example: 'I bought a train ticket.' },
    { word: 'teacher', vietnamese: 'giáo viên', example: 'The teacher explains the lesson.' },
    { word: 'picture', vietnamese: 'bức tranh, bức ảnh', example: 'She drew a picture of a house.' },
    { word: 'airport', vietnamese: 'sân bay', example: 'We arrived at the airport on time.' },
    { word: 'library', vietnamese: 'thư viện', example: 'I borrow books from the library.' },
    { word: 'market', vietnamese: 'chợ', example: 'My mom buys fresh food at the market.' }
  ],
  A2: [
    { word: 'coffee', vietnamese: 'cà phê', example: 'I drink coffee every morning.' },
    { word: 'croissant', vietnamese: 'bánh sừng bò', example: 'She ordered a warm croissant.' },
    { word: 'culture', vietnamese: 'văn hóa', example: 'Seattle has a rich coffee culture.' },
    { word: 'neighbor', vietnamese: 'hàng xóm', example: 'The neighbors are friendly.' },
    { word: 'client', vietnamese: 'khách hàng', example: 'He talks with a client.' },
    { word: 'motivate', vietnamese: 'thúc đẩy, tạo động lực', example: 'They want motivated candidates.' },
    { word: 'company', vietnamese: 'công ty', example: 'She works for a tech company.' },
    { word: 'barista', vietnamese: 'nhân viên pha chế', example: 'The barista made a nice coffee.' },
    { word: 'passenger', vietnamese: 'hành khách', example: 'The passenger waited for the bus.' },
    { word: 'luggage', vietnamese: 'hành lý', example: 'He packed his luggage for the trip.' },
    { word: 'explain', vietnamese: 'giải thích', example: 'Can you explain this rule?' },
    { word: 'prepare', vietnamese: 'chuẩn bị', example: 'We prepare for the examination.' },
    { word: 'decision', vietnamese: 'quyết định', example: 'It was a difficult decision.' },
    { word: 'habit', vietnamese: 'thói quen', example: 'Reading is a good habit.' },
    { word: 'local', vietnamese: 'địa phương', example: 'Support your local business.' },
    { word: 'muffin', vietnamese: 'bánh muffin', example: 'I bought a blueberry muffin.' },
    { word: 'relax', vietnamese: 'thư giãn', example: 'Take a weekend trip to relax.' },
    { word: 'schedule', vietnamese: 'lịch trình, thời gian biểu', example: 'Check the flight schedule.' },
    { word: 'special', vietnamese: 'đặc biệt', example: 'Today is a special day.' }
  ],
  B1: [
    { word: 'experience', vietnamese: 'kinh nghiệm', example: 'Previous work experience is helpful.' },
    { word: 'professional', vietnamese: 'chuyên nghiệp', example: 'Showcase your professional skills.' },
    { word: 'employer', vietnamese: 'nhà tuyển dụng', example: 'The employer interviewed candidates.' },
    { word: 'interview', vietnamese: 'cuộc phỏng vấn', example: 'He had a job interview yesterday.' },
    { word: 'temporary', vietnamese: 'tạm thời', example: 'This is a temporary position.' },
    { word: 'permanent', vietnamese: 'lâu dài, vĩnh viễn', example: 'I am looking for a permanent job.' },
    { word: 'qualification', vietnamese: 'bằng cấp, trình độ chuyên môn', example: 'She has the right qualifications.' },
    { word: 'candidate', vietnamese: 'ứng viên', example: 'He is the best candidate for the job.' },
    { word: 'benefit', vietnamese: 'lợi ích, phúc lợi', example: 'The job offers medical benefits.' },
    { word: 'challenge', vietnamese: 'thách thức, thử thách', example: 'Learning English is a challenge.' },
    { word: 'solution', vietnamese: 'giải pháp', example: 'We found a solution to the problem.' },
    { word: 'environment', vietnamese: 'môi trường', example: 'We should protect the environment.' },
    { word: 'opportunity', vietnamese: 'cơ hội', example: 'This job is a great opportunity.' },
    { word: 'develop', vietnamese: 'phát triển', example: 'The company wants to develop new apps.' },
    { word: 'progress', vietnamese: 'tiến bộ, tiến trình', example: 'You are making good progress.' },
    { word: 'confidence', vietnamese: 'sự tự tin', example: 'Practice speaking to build confidence.' },
    { word: 'effective', vietnamese: 'hiệu quả', example: 'This is an effective learning method.' },
    { word: 'creative', vietnamese: 'sáng tạo', example: 'Children have creative ideas.' },
    { word: 'recommend', vietnamese: 'khuyến nghị, giới thiệu', example: 'I recommend this restaurant.' },
    { word: 'advertise', vietnamese: 'quảng cáo', example: 'They advertise products on television.' }
  ],
  B2: [
    { word: 'dynamic', vietnamese: 'năng động, sôi nổi', example: 'She has a dynamic personality.' },
    { word: 'artificial', vietnamese: 'nhân tạo', example: 'Artificial intelligence is growing fast.' },
    { word: 'intelligence', vietnamese: 'trí tuệ, sự thông minh', example: 'He is a man of high intelligence.' },
    { word: 'interactive', vietnamese: 'tương tác', example: 'This is an interactive platform.' },
    { word: 'dictionary', vietnamese: 'từ điển', example: 'Check the word in the dictionary.' },
    { word: 'algorithm', vietnamese: 'thuật toán', example: 'The search algorithm is complex.' },
    { word: 'repetition', vietnamese: 'sự lặp lại', example: 'Spaced repetition helps you remember.' },
    { word: 'pronunciation', vietnamese: 'sự phát âm', example: 'Her English pronunciation is perfect.' },
    { word: 'vocabulary', vietnamese: 'từ vựng', example: 'He has a wide vocabulary.' },
    { word: 'simulation', vietnamese: 'sự mô phỏng', example: 'They used a flight simulation.' },
    { word: 'evaluation', vietnamese: 'sự đánh giá', example: 'The teacher gave a positive evaluation.' },
    { word: 'achievement', vietnamese: 'thành tựu, thành tích', example: 'Passing the exam is a great achievement.' },
    { word: 'consequence', vietnamese: 'hậu quả, hệ quả', example: 'Actions have consequences.' },
    { word: 'collaborate', vietnamese: 'hợp tác, cộng tác', example: 'Teams need to collaborate effectively.' },
    { word: 'alternative', vietnamese: 'thay thế', example: 'Is there an alternative solution?' },
    { word: 'significant', vietnamese: 'quan trọng, đáng kể', example: 'There is a significant difference.' },
    { word: 'hypothesis', vietnamese: 'giả thuyết', example: 'They proposed a new hypothesis.' },
    { word: 'innovative', vietnamese: 'sáng tạo, đổi mới', example: 'He came up with an innovative design.' },
    { word: 'implement', vietnamese: 'thực thi, thực hiện', example: 'We will implement the plan tomorrow.' },
    { word: 'negotiate', vietnamese: 'đàm phán, thương lượng', example: 'They are trying to negotiate a deal.' }
  ]
};

export default function MiniGames({ onNavigateBack, showToast }) {
  const [activeGame, setActiveGame] = useState(null); // null, hangman, time_attack, space_typer
  const [vocabList, setVocabList] = useState([]);
  const [selectedSource, setSelectedSource] = useState('notebook');
  const [savedCount, setSavedCount] = useState(0);

  // Initialize and check notebook vocab count (Extremely robust to prevent empty/corrupt local storage crashes)
  useEffect(() => {
    try {
      const rawList = storage.getSavedVocab() || [];
      const list = rawList.filter(item => item && typeof item.word === 'string');
      setSavedCount(list.length);
      
      // Default load notebook
      if (list.length < 5) {
        const a2List = (LEVEL_VOCAB.A2 || []).filter(w => w && typeof w.word === 'string');
        const merged = [...list];
        a2List.forEach(w => {
          if (!merged.some(item => item.word.toLowerCase() === w.word.toLowerCase())) {
            merged.push(w);
          }
        });
        setVocabList(merged.slice(0, 15));
      } else {
        setVocabList(list);
      }
    } catch (e) {
      console.error("Error loading vocab list on mount:", e);
      setVocabList(LEVEL_VOCAB.A2 || []);
    }
  }, []);

  // Handle switching vocab level/source (With fallback to prevent runtime crashes)
  const handleSourceChange = (source) => {
    setSelectedSource(source);
    setDynamicPool([]);
    setUsedWordsSet(new Set());
    isFetchingRef.current = false;
    if (source === 'notebook') {
      try {
        const rawList = storage.getSavedVocab() || [];
        const list = rawList.filter(item => item && typeof item.word === 'string');
        setSavedCount(list.length);
        if (list.length < 5) {
          showToast("Sổ tay của bạn có dưới 5 từ. Hệ thống đã trộn thêm từ vựng mẫu A2.", "info");
          const a2List = (LEVEL_VOCAB.A2 || []).filter(w => w && typeof w.word === 'string');
          const merged = [...list];
          a2List.forEach(w => {
            if (!merged.some(item => item.word.toLowerCase() === w.word.toLowerCase())) {
              merged.push(w);
            }
          });
          setVocabList(merged.slice(0, 15));
        } else {
          setVocabList(list);
        }
      } catch (e) {
        console.error("Error loading notebook vocab:", e);
        setVocabList(LEVEL_VOCAB.A2 || []);
      }
    } else {
      setVocabList(LEVEL_VOCAB[source] || []);
      showToast(`Đã chuyển nguồn từ vựng sang cấp độ ${source}`, "success");
    }
  };

  // --- HANGMAN GAME STATE ---
  const [hangmanWord, setHangmanWord] = useState('');
  const [hangmanHint, setHangmanHint] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [remainingGuesses, setRemainingGuesses] = useState(6);
  const [hangmanStatus, setHangmanStatus] = useState('playing'); // playing, won, lost

  const startHangman = () => {
    if (vocabList.length === 0) return;
    const randomItem = vocabList[Math.floor(Math.random() * vocabList.length)];
    if (!randomItem) return;
    setHangmanWord((randomItem.word || '').toLowerCase().replace(/[^a-z]/g, ''));
    setHangmanHint(randomItem.vietnamese || '');
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
    const pool = effectivePoolRef.current;
    if (pool.length < 4) return;
    
    const correctIndex = Math.floor(Math.random() * pool.length);
    const correct = pool[correctIndex];
    if (!correct) return;

    // Replenish check for Time Attack
    setUsedWordsSet(prevSet => {
      const nextSet = new Set(prevSet);
      nextSet.add(correct.word.toLowerCase());
      return nextSet;
    });
    ensureEnoughVocab(pool, selectedSource);
    
    // Choose 3 random wrong options
    const wrong = pool
      .filter(item => item && item.word && correct.word && item.word.toLowerCase() !== correct.word.toLowerCase())
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
      
    const allOptions = [...wrong, correct].sort(() => 0.5 - Math.random());
    
    setCurrentQuestion(correct);
    setTaOptions(allOptions);
  };

  const handleTAAnswer = (option) => {
    if (taStatus !== 'playing' || !currentQuestion) return;
    
    const isCorrect = option && option.word && currentQuestion.word && option.word.toLowerCase() === currentQuestion.word.toLowerCase();
    
    if (isCorrect) {
      playSound('correct');
      setQuizScore((prev) => prev + 1);
    } else {
      playSound('incorrect');
      vibrate(100);
    }
    
    generateTAQuestion();
  };

  // --- SPACE TYPER STATE & LOGIC ---
  const [stStatus, setStStatus] = useState('lobby'); // lobby, playing, finished
  const [stScore, setStScore] = useState(0);
  const [stLives, setStLives] = useState(3);
  const [stWords, setStWords] = useState([]);
  const [stInput, setStInput] = useState('');
  const [stars, setStars] = useState([]);

  // Energy projectile & explosion particle states
  const [projectiles, setProjectiles] = useState([]); // { id, x, y, tx, ty, progress, wordId }
  const [particles, setParticles] = useState([]); // { id, x, y, vx, vy, life, color }
  const [cannonAngle, setCannonAngle] = useState(0); // rotation in degrees

  // Refs for stable, glitch-free game loops (stops intervals resetting constantly on state changes)
  const stScoreRef = useRef(stScore);
  const vocabListRef = useRef(vocabList);

  // States & Refs for AI dynamic vocabulary replenishment
  const [dynamicPool, setDynamicPool] = useState([]);
  const [usedWordsSet, setUsedWordsSet] = useState(new Set());
  const isFetchingRef = useRef(false);
  const effectivePoolRef = useRef([]);

  useEffect(() => {
    stScoreRef.current = stScore;
  }, [stScore]);

  useEffect(() => {
    vocabListRef.current = vocabList;
  }, [vocabList]);

  // Keep effectivePoolRef in sync with current state vocabulary pools
  useEffect(() => {
    effectivePoolRef.current = [...vocabList, ...dynamicPool];
  }, [vocabList, dynamicPool]);

  // Sync refs for dynamic checking to prevent interval resets
  const selectedSourceRef = useRef(selectedSource);
  const ensureEnoughVocabRef = useRef(ensureEnoughVocab);

  useEffect(() => {
    selectedSourceRef.current = selectedSource;
  }, [selectedSource]);

  useEffect(() => {
    ensureEnoughVocabRef.current = ensureEnoughVocab;
  });

  // Check and replenish vocabulary pool automatically
  function ensureEnoughVocab(currentPool, level) {
    if (level === 'notebook' || isFetchingRef.current) return;
    
    // Count words that haven't been used yet
    const unusedCount = currentPool.filter(w => w && w.word && !usedWordsSet.has(w.word.toLowerCase())).length;

    if (unusedCount <= 5) {
      isFetchingRef.current = true;
      const excludeList = currentPool.map(w => w.word).filter(Boolean);

      fetchMoreVocabFromAI(level, excludeList, 10).then(newWords => {
        if (newWords && newWords.length > 0) {
          setDynamicPool(prev => {
            const merged = [...prev];
            newWords.forEach(w => {
              if (w && w.word && !merged.some(m => m.word.toLowerCase() === w.word.toLowerCase())) {
                merged.push(w);
              }
            });
            return merged;
          });
        }
        isFetchingRef.current = false;
      }).catch(e => {
        console.error("Error replenishing vocab:", e);
        isFetchingRef.current = false;
      });
    }
  };

  // Generate background stars
  useEffect(() => {
    const starList = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 3
    }));
    setStars(starList);
  }, []);

  const startSpaceTyper = () => {
    setStScore(0);
    setStLives(3);
    setStWords([]);
    setStInput('');
    setProjectiles([]);
    setParticles([]);
    setCannonAngle(0);
    setStStatus('playing');
  };

  // Game loop for Space Typer (Optimized for ultra-smooth 60fps drift, like meteors)
  useEffect(() => {
    if (activeGame !== 'space_typer' || stStatus !== 'playing') {
      return;
    }

    // High performance game tick updating movement, projectiles and sparks (running at 24ms for ~40fps smooth motion)
    const gameTick = setInterval(() => {
      // 1. Move falling words down (Float slowly like meteorites)
      setStWords((prevWords) => {
        let hitBottom = false;
        const updated = prevWords.map(w => {
          if (w.dying) return w; // Freeze/fade out matched words while laser travels
          
          // Balanced speed multiplier to ensure visible, smooth, and majestic falling
          const nextY = w.y + (w.speed * 0.16); 
          if (nextY >= 88 && !w.hit) {
            hitBottom = true;
            return { ...w, y: nextY, hit: true };
          }
          return { ...w, y: nextY };
        });

        if (hitBottom) {
          playSound('incorrect');
          vibrate(100);
          setStLives(lives => {
            const nextLives = lives - 1;
            if (nextLives <= 0) {
              // Defer state update to next microtask to prevent React render-cycle warnings/crashes
              setTimeout(() => setStStatus('finished'), 0);
            }
            return nextLives;
          });
        }
        return updated.filter(w => w.y < 88);
      });

      // 2. Move projectiles and trigger impact explosions
      setProjectiles((prevProj) => {
        const nextProj = prevProj.map(p => ({
          ...p,
          progress: p.progress + 0.15 // speed of projectile flight
        }));

        // Detect hit projectiles (progress reaches 1.0)
        const hits = nextProj.filter(p => p.progress >= 1.0);
        if (hits.length > 0) {
          // Trigger spark particles at target coordinates
          setParticles(prevPart => {
            let newParts = [...prevPart];
            hits.forEach(h => {
              for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2 + (Math.random() * 0.5);
                const speed = 1.8 + Math.random() * 2.8;
                newParts.push({
                  id: Math.random().toString(),
                  x: h.tx,
                  y: h.ty,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  life: 1.0,
                  color: '#22d3ee'
                });
              }
            });
            return newParts;
          });

          // Actually remove the hit words from active list
          setStWords(prevWords => {
            const hitWordIds = hits.map(h => h.wordId);
            return prevWords.filter(w => !hitWordIds.includes(w.id));
          });
        }

        return nextProj.filter(p => p.progress < 1.0);
      });

      // 3. Move explosion particles and reduce their life
      setParticles((prevPart) => {
        return prevPart
          .map(p => ({
            ...p,
            x: p.x + p.vx * 0.45,
            y: p.y + p.vy * 0.45,
            life: p.life - 0.05
          }))
          .filter(p => p.life > 0);
      });

    }, 24); // 24ms loop tick for fast, fluid rendering updates without css delay

    // Spawn new word logic (Paced dynamically but checked smoothly using a 100ms polling loop)
    let lastSpawnTime = Date.now();
    const spawnChecker = setInterval(() => {
      const currentScore = stScoreRef.current;
      
      const currentSpawnRate = Math.max(2000, 4500 - currentScore * 100);
      const now = Date.now();
      
      if (now - lastSpawnTime >= currentSpawnRate) {
        setStWords((prev) => {
          // Limit active words on screen to 5
          if (prev.filter(w => !w.dying).length >= 5) return prev;

          let activeVocab = effectivePoolRef.current;
          if (!activeVocab || activeVocab.length === 0) {
            activeVocab = LEVEL_VOCAB.A2; // Safe fallback
          }
          const randomItem = activeVocab[Math.floor(Math.random() * activeVocab.length)];
          if (!randomItem || !randomItem.word) return prev;
          
          if (prev.some(w => w.word && w.word.toLowerCase() === randomItem.word.toLowerCase())) return prev;

          // Safely trigger state updates and side effects on next tick
          setTimeout(() => {
            setUsedWordsSet(prevSet => {
              const nextSet = new Set(prevSet);
              nextSet.add(randomItem.word.toLowerCase());
              return nextSet;
            });
            ensureEnoughVocabRef.current(activeVocab, selectedSourceRef.current);
          }, 0);

          const newWord = {
            id: Math.random().toString(36).substr(2, 9),
            word: randomItem.word,
            vietnamese: randomItem.vietnamese || '',
            x: 18 + Math.random() * 64, // Narrower range for mobile screens to prevent overflow card clipping
            y: 2, // Starts visible at top edge to prevent overflow:hidden clipping
            speed: 0.75 + Math.random() * 0.5 + (currentScore * 0.01), // Perfect balanced speed coefficients
            dying: false
          };
          
          // Update spawn timestamp
          lastSpawnTime = Date.now();
          
          return [...prev, newWord];
        });
      }
    }, 100);

    // Instant spawn of first word right at game start to guarantee visual response immediately!
    setStWords((prev) => {
      let activeVocab = effectivePoolRef.current;
      if (!activeVocab || activeVocab.length === 0) {
        activeVocab = LEVEL_VOCAB.A2; // Safe fallback
      }
      const randomItem = activeVocab[Math.floor(Math.random() * activeVocab.length)];
      if (randomItem && randomItem.word) {
        setTimeout(() => {
          setUsedWordsSet(prevSet => {
            const nextSet = new Set(prevSet);
            nextSet.add(randomItem.word.toLowerCase());
            return nextSet;
          });
          ensureEnoughVocabRef.current(activeVocab, selectedSourceRef.current);
        }, 0);

        return [{
          id: Math.random().toString(36).substr(2, 9),
          word: randomItem.word,
          vietnamese: randomItem.vietnamese || '',
          x: 18 + Math.random() * 64, // Safely centered horizontally for mobile viewport
          y: 2, // Starts visible
          speed: 0.75 + Math.random() * 0.5,
          dying: false
        }];
      }
      return prev;
    });

    return () => {
      clearInterval(gameTick);
      clearInterval(spawnChecker);
    };
  }, [activeGame, stStatus]);

  // Award XP upon game over
  useEffect(() => {
    if (activeGame === 'space_typer' && stStatus === 'finished') {
      playSound('complete');
      confetti({ particleCount: 50, spread: 60 });
      const pointsEarned = Math.floor(stScore * 1.5);
      if (pointsEarned > 0) {
        storage.updateUserStats({ points: storage.getUserStats().points + pointsEarned });
        storage.incrementActivity(2);
      }
    }
  }, [stStatus, activeGame, stScore]);

  // Trigger bullet/laser shoot on correct input match
  const handleStInputChange = (e) => {
    const value = e.target.value;
    setStInput(value);

    const typedWord = value.trim().toLowerCase();
    
    setStWords((prevWords) => {
      // Find matching word that is active (not dying yet)
      const matchedIndex = prevWords.findIndex(w => !w.dying && w.word && w.word.toLowerCase() === typedWord);
      
      if (matchedIndex !== -1) {
        const matchedWord = prevWords[matchedIndex];
        
        // Mark word as dying so it locks input and fades out
        matchedWord.dying = true;

        // Calculate laser barrel rotation angle (centered on the turret base at 50%, 92%)
        const dx = matchedWord.x - 50; // delta x from center
        const dy = 92 - matchedWord.y; // delta y (pivots from 92% vertical)
        const angle = (Math.atan2(dx, dy) * 180) / Math.PI;
        setCannonAngle(angle);

        // Spawn a laser bullet projectile heading towards target starting from the barrel tip (approx y: 88%)
        setProjectiles(prevProj => [
          ...prevProj,
          {
            id: Math.random().toString(),
            x: 50,
            y: 88, 
            tx: matchedWord.x,
            ty: matchedWord.y,
            progress: 0,
            wordId: matchedWord.id
          }
        ]);
        
        playSound('correct');
        speak(matchedWord.word);
        
        setStScore(prev => prev + 10);
        setStInput(''); // Reset typing field
        
        return [...prevWords];
      }
      return prevWords;
    });
  };

  // Highlight prefix typed correctly
  // Highlight prefix typed correctly (Using hex inline styles to prevent missing Tailwind blank text color)
  const highlightWord = (word, input) => {
    if (!word) return null;
    if (!input) return <span style={{ color: '#f59e0b', fontFamily: 'monospace', fontWeight: 'bold' }}>{word}</span>;
    
    const trimmedInput = input.trim().toLowerCase();
    if (word.toLowerCase().startsWith(trimmedInput)) {
      const matchLen = trimmedInput.length;
      return (
        <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
          <span style={{ color: '#22d3ee', fontWeight: '800', textShadow: '0 0 8px rgba(34, 211, 238, 0.8)' }}>
            {word.slice(0, matchLen)}
          </span>
          <span style={{ color: '#f59e0b' }}>{word.slice(matchLen)}</span>
        </span>
      );
    }
    return <span style={{ color: '#f59e0b', fontFamily: 'monospace', fontWeight: 'bold' }}>{word}</span>;
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
    setStStatus('lobby');
    setProjectiles([]);
    setParticles([]);
    setCannonAngle(0);
    setDynamicPool([]);
    setUsedWordsSet(new Set());
    isFetchingRef.current = false;
  };

  return (
    <div className="mini-games-screen animate-slideup glass">


      <div className="mg-header flex justify-between items-center mb-6">
        <button className="btn-secondary" onClick={activeGame ? handleBackToMenu : onNavigateBack}>
          {activeGame ? '← Thoát game' : '← Quay về Dashboard'}
        </button>
        <h2 className="glow-text text-gradient">V-English Playzone - Trò chơi học từ</h2>
      </div>

      {/* VOCAB SOURCE SELECTOR (ONLY SHOW ON LOBBY / OUT OF GAME) */}
      {!activeGame && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6 bg-slate-900/40 p-3 rounded-xl border border-light max-w-4xl mx-auto">
          <span className="text-[11px] uppercase font-bold tracking-wider color-text-muted mr-2">Nguồn từ vựng:</span>
          {[
            { id: 'notebook', label: `Sổ tay cá nhân (${savedCount})` },
            { id: 'A1', label: 'Cấp độ A1 (Cơ bản)' },
            { id: 'A2', label: 'Cấp độ A2 (Sơ cấp)' },
            { id: 'B1', label: 'Cấp độ B1 (Trung cấp)' },
            { id: 'B2', label: 'Cấp độ B2 (Khá/Giỏi)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleSourceChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${selectedSource === tab.id ? 'bg-primary text-white shadow-md' : 'bg-slate-800 hover:bg-slate-700 color-text-muted border border-light'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* GAME MENU SELECTION */}
      {!activeGame && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto py-4">
          {/* Card Game 1: Hangman */}
          <div className="glass p-6 rounded-lg flex flex-col gap-4 border border-light hover:border-primary transition duration-300">
            <div className="text-4xl text-center">🪓</div>
            <h3 className="text-lg font-bold text-center color-text-dark">Game 1: Hangman</h3>
            <p className="text-xs color-text-muted text-center leading-relaxed flex-grow">
              Đoán các từ vựng thuộc cấp độ đã chọn bằng cách ghép từng chữ cái. Đoán sai quá 6 lần sẽ thua cuộc!
            </p>
            <button 
              className="btn-primary py-2.5 justify-center w-full"
              onClick={() => {
                setActiveGame('hangman');
                startHangman();
              }}
            >
              Chơi Hangman 🎮
            </button>
          </div>

          {/* Card Game 2: Time Attack */}
          <div className="glass p-6 rounded-lg flex flex-col gap-4 border border-light hover:border-secondary transition duration-300">
            <div className="text-4xl text-center">⏱️</div>
            <h3 className="text-lg font-bold text-center color-text-dark">Game 2: Time Attack 60s</h3>
            <p className="text-xs color-text-muted text-center leading-relaxed flex-grow">
              Có 60 giây để trả lời đúng nhiều câu hỏi trắc nghiệm ghép nghĩa của từ thuộc cấp độ đã chọn nhất.
            </p>
            <button 
              className="btn-primary py-2.5 justify-center w-full"
              style={{ background: 'linear-gradient(135deg, var(--color-secondary) 0%, #f97316 100%)', boxShadow: '0 0 15px rgba(245, 158, 11, 0.2)' }}
              onClick={() => {
                setActiveGame('time_attack');
                setTaStatus('lobby');
              }}
            >
              Chơi Time Attack ⚡
            </button>
          </div>

          {/* Card Game 3: Space Typer */}
          <div className="glass p-6 rounded-lg flex flex-col gap-4 border border-light hover:border-cyan-500 transition duration-300">
            <div className="text-4xl text-center">🚀</div>
            <h3 className="text-lg font-bold text-center color-text-dark">Game 3: Space Typer</h3>
            <p className="text-xs color-text-muted text-center leading-relaxed flex-grow">
              Gõ nhanh và chính xác từ tiếng Anh đang rơi xuống để bắn hạ bằng Laser trước khi chạm ranh giới. Từ thuộc cấp độ đã chọn!
            </p>
            <button 
              className="btn-primary py-2.5 justify-center w-full"
              style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)' }}
              onClick={() => {
                setActiveGame('space_typer');
                setStStatus('lobby');
              }}
            >
              Chơi Space Typer 🚀
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

          <div className="flex gap-1 py-4 justify-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="text-2xl" style={{ opacity: i < remainingGuesses ? 1 : 0.2 }}>
                ❤️
              </span>
            ))}
          </div>

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
                    style={{ fontSize: '16px' }}
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
                Đồng hồ sẽ đếm ngược 60 giây. Hãy chọn nhanh nghĩa đúng của các từ thuộc cấp độ <strong>{selectedSource === 'notebook' ? 'Sổ tay' : selectedSource}</strong>.
              </p>
              <button className="btn-primary py-3 px-8 text-base font-bold" onClick={startTImeAttack}>
                Bắt đầu Đua! ⏱️
              </button>
            </div>
          )}

          {taStatus === 'playing' && currentQuestion && (
            <div className="w-full flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-light pb-3">
                <div className="text-sm color-text-muted font-semibold">
                  Điểm: <strong className="color-primary text-lg">{quizScore}</strong>
                </div>
                <div className="text-sm font-bold flex items-center gap-2" style={{ color: timeLeft <= 10 ? 'var(--color-error)' : 'var(--color-secondary)' }}>
                  ⏱️ Thời gian: <span className="text-lg font-extrabold">{timeLeft}s</span>
                </div>
              </div>

              <div className="w-full h-2 rounded bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                  style={{ width: `${(timeLeft / 60) * 100}%`, background: timeLeft <= 10 ? 'var(--color-error)' : 'var(--color-secondary)' }}
                ></div>
              </div>

              <div className="glass p-6 text-center rounded border border-light flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wider color-text-muted">Chọn từ có nghĩa sau:</span>
                <span className="text-2xl font-extrabold color-text-dark">"{currentQuestion.vietnamese}"</span>
              </div>

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

      {/* GAME 3: SPACE TYPER INTERFACE */}
      {activeGame === 'space_typer' && (
        <div className="space-typer-game flex flex-col items-center gap-4 max-w-xl mx-auto py-2 animate-slideup">
          
          {stStatus === 'lobby' && (
            <div className="mg-lobby text-center py-8 flex flex-col items-center gap-5 max-w-md">
              <span className="mg-lobby-icon text-6xl animate-bounce">🚀</span>
              <h3 className="mg-lobby-title text-2xl font-extrabold color-text-dark">Space Typer (Gõ từ tốc độ)</h3>
              <p className="mg-lobby-desc text-xs color-text-muted leading-relaxed">
                Đang sử dụng bộ từ thuộc cấp độ: <strong>{selectedSource === 'notebook' ? 'Sổ tay cá nhân' : `Cấp độ ${selectedSource}`}</strong>.
              </p>

              <div className="mg-lobby-tips flex flex-col gap-2.5 text-left bg-slate-950/40 p-4 rounded-lg border border-light w-full text-[13px] color-text-muted leading-snug">
                <div className="mg-tip-row flex gap-2"><span>🎯</span> <span>Mỗi từ bị bắn hạ sẽ ghi được <strong>+10 Điểm</strong>.</span></div>
                <div className="mg-tip-row flex gap-2"><span>❤️</span> <span>Bạn có <strong>3 Mạng</strong>. Bỏ lỡ từ để chạm vạch đỏ sẽ mất 1 Mạng.</span></div>
                <div className="mg-tip-row flex gap-2"><span>⚡</span> <span>Tốc độ rơi của các từ sẽ tăng dần theo số điểm bạn đạt được!</span></div>
              </div>

              <button
                className="mg-lobby-btn btn-primary py-3 px-8 text-base font-bold w-full justify-center"
                style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}
                onClick={startSpaceTyper}
              >
                Bắt đầu Trận đấu! 🚀
              </button>
            </div>
          )}

          {stStatus === 'playing' && (
            <div className="w-full flex flex-col gap-3">
              {/* Stats Bar */}
              <div className="flex justify-between items-center border-b border-light pb-2">
                <div className="text-sm color-text-muted font-semibold">
                  Cấp độ: <span className="text-cyan-400 font-bold mr-3">{selectedSource === 'notebook' ? 'Sổ tay' : selectedSource}</span> 
                  Điểm số: <strong className="text-cyan-400 text-lg">{stScore}</strong>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span key={i} className="text-lg transition" style={{ opacity: i < stLives ? 1 : 0.15 }}>
                      ❤️
                    </span>
                  ))}
                </div>
              </div>

              {/* Space Arena Container */}
              <div className="space-typer-container">
                {/* Starry background */}
                {stars.map(s => (
                  <div 
                    key={s.id} 
                    className="star" 
                    style={{
                      left: `${s.x}%`,
                      top: `${s.y}%`,
                      width: `${s.size}px`,
                      height: `${s.size}px`,
                      animationDelay: `${s.delay}s`
                    }}
                  />
                ))}

                {/* Red Defense Line */}
                <div className="defense-barrier" />

                {/* SVG Overlay for Laser Shoot & Explosion Sparks */}
                <svg className="space-typer-svg">
                  {/* Laser Beam Trails */}
                  {projectiles.map(p => {
                    const currX = p.x + (p.tx - p.x) * p.progress;
                    const currY = p.y + (p.ty - p.y) * p.progress;
                    return (
                      <g key={`laser-grp-${p.id}`}>
                        {/* Faint laser beam trail */}
                        <line
                          x1="50%"
                          y1="92%"
                          x2={`${currX}%`}
                          y2={`${currY}%`}
                          stroke="rgba(34, 211, 238, 0.25)"
                          strokeWidth="2"
                        />
                        {/* Laser projectile head bullet */}
                        <circle
                          cx={`${currX}%`}
                          cy={`${currY}%`}
                          r="5"
                          fill="#22d3ee"
                          filter="drop-shadow(0 0 6px #22d3ee)"
                        />
                      </g>
                    );
                  })}

                  {/* Explosion Spark Particles */}
                  {particles.map(p => (
                    <circle
                      key={p.id}
                      cx={`${p.x}%`}
                      cy={`${p.y}%`}
                      r={2 + p.life * 1.5}
                      fill={p.color}
                      opacity={p.life}
                      filter="drop-shadow(0 0 4px #22d3ee)"
                    />
                  ))}
                </svg>

                {/* Falling Words list */}
                {stWords.map(w => {
                  const isMatching = stInput.trim() !== '' && w.word && w.word.toLowerCase().startsWith(stInput.trim().toLowerCase());
                  const cardClass = `falling-word-card ${w.dying ? 'dying' : ''} ${isMatching ? 'active-match' : ''}`;
                  
                  return (
                    <div
                      key={w.id}
                      className="falling-word-wrapper"
                      style={{
                        left: `${w.x}%`,
                        top: `${w.y}%`,
                      }}
                    >
                      <div className={cardClass}>
                        <span style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'monospace', letterSpacing: '0.05em', display: 'block' }}>
                          {highlightWord(w.word, stInput)}
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', fontFamily: 'sans-serif', display: 'block', whiteSpace: 'nowrap' }}>
                          {w.vietnamese}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Laser Cannon Cockpit Turret with Integrated Input Box */}
                <div className="laser-cannon-turret-wrap">
                  {/* Barrel */}
                  <div 
                    className="laser-cannon-barrel" 
                    style={{ transform: `rotate(${cannonAngle}deg)` }}
                  />
                  {/* Cockpit / Base (Input) */}
                  <div className="laser-cannon-input-base">
                    <input
                      type="text"
                      value={stInput}
                      onChange={handleStInputChange}
                      placeholder="Gõ từ tại đây..."
                      className="turret-input"
                      autoFocus
                    />
                  </div>
                </div>

              </div>

              {/* Instructions below the board */}
              <div className="text-center mt-2.5 color-text-muted text-[11px] leading-relaxed max-w-lg mx-auto">
                💡 Nhập ký tự tiếng Anh trực tiếp vào <strong>bệ pháo cockpit</strong>. Hệ thống sẽ tự xoay nòng pháo, phóng đạn laser và kích nổ từ vựng ngay khi gõ chính xác chữ cái cuối cùng!
              </div>
            </div>
          )}

          {stStatus === 'finished' && (
            <div className="glass p-8 text-center rounded border border-light w-full max-w-md mx-auto flex flex-col gap-5 animate-slideup">
              <span className="text-5xl">🏆</span>
              <h3 className="text-2xl font-extrabold text-gradient">Kết thúc trận chiến!</h3>
              <p className="text-xs color-text-muted">
                Tàu địch đã xâm nhập ranh giới phòng thủ ở mặt đất. Căn cứ bị phá hủy nhưng thành tích của bạn rất đáng tự hào!
              </p>
              
              <div className="py-4 border-y border-light flex justify-around">
                <div>
                  <span className="text-xs color-text-muted block font-semibold uppercase">Điểm số đạt</span>
                  <span className="text-3xl font-extrabold text-cyan-400">{stScore}</span>
                </div>
                <div>
                  <span className="text-xs color-text-muted block font-semibold uppercase">XP Nhận được</span>
                  <span className="text-3xl font-extrabold" style={{ color: 'var(--color-success)' }}>+{Math.floor(stScore * 1.5)} XP</span>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button className="btn-secondary py-2 px-6" onClick={handleBackToMenu}>
                  Menu chính
                </button>
                <button 
                  className="btn-primary py-2 px-6" 
                  style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}
                  onClick={startSpaceTyper}
                >
                  Chơi lại 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
