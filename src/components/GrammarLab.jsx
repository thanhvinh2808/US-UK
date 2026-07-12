import React, { useState } from 'react';
import { storage } from '../utils/storage';

export default function GrammarLab({ topic, onComplete, onNavigateBack }) {
  const [currentStep, setCurrentStep] = useState('theory'); // theory | examples | quiz | done
  const [quizIdx, setQuizIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // null | 'correct' | 'incorrect'
  const [quizScore, setQuizScore] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const grammar = topic.grammar_focus;

  // Generate dynamic quiz questions based on examples (mutating some to create false options)
  const [quizQuestions] = useState(() => {
    return grammar.examples.map((ex, i) => {
      const isCorrect = i % 2 === 0; // Alternating correct/incorrect
      let sentenceText = ex.en;
      let explanationText = "Câu này đã chia đúng ngữ pháp.";

      if (!isCorrect) {
        // Mutate correct sentences to create grammatical errors
        if (ex.en.includes("is famous")) {
          sentenceText = ex.en.replace("is famous", "are famous");
          explanationText = "Sai: 'Seattle' là danh từ số ít (chủ ngữ ngôi thứ ba số ít) nên động từ to be phải là 'is', không dùng 'are'.";
        } else if (ex.en.includes("is making")) {
          sentenceText = ex.en.replace("is making", "are making");
          explanationText = "Sai: 'Mai' là danh từ số ít nên động từ to be đi kèm trong thì hiện tại tiếp diễn phải là 'is', không dùng 'are'.";
        } else if (ex.en.includes("traveled")) {
          sentenceText = ex.en.replace("traveled", "travel");
          explanationText = "Sai: Câu có trạng ngữ chỉ quá khứ 'Last weekend' nên động từ phải chia ở quá khứ đơn là 'traveled' (thêm -ed).";
        } else if (ex.en.includes("will visit")) {
          sentenceText = ex.en.replace("will visit", "will visited");
          explanationText = "Sai: Sau động từ khuyết thiếu 'will' của thì tương lai đơn luôn là động từ nguyên mẫu không chia ('visit').";
        } else if (ex.en.includes("asks")) {
          sentenceText = ex.en.replace("asks", "ask");
          explanationText = "Sai: 'The barista' là chủ ngữ số ít nên động từ 'ask' phải chia thêm 's' thành 'asks'.";
        } else if (ex.en.includes("are washing")) {
          sentenceText = ex.en.replace("are washing", "is washing");
          explanationText = "Sai: 'The neighbors' là danh từ số nhiều nên động từ to be phải chia là 'are'.";
        } else if (ex.en.includes("left")) {
          sentenceText = ex.en.replace("left", "leaved");
          explanationText = "Sai: 'leave' là động từ bất quy tắc có dạng quá khứ là 'left', không thêm -ed thành 'leaved'.";
        } else if (ex.en.includes("will cook")) {
          sentenceText = ex.en.replace("will cook", "will cooks");
          explanationText = "Sai: Động từ đi sau 'will' luôn luôn giữ nguyên mẫu, không thêm 's/es' dù chủ ngữ là gì.";
        } else {
          // Fallback mutation: strip ending 's' or 'ed'
          sentenceText = ex.en.replace(/s\b/g, "");
          explanationText = "Sai: Chia động từ không chính xác theo quy tắc cấu trúc thì.";
        }
      }

      return {
        id: i,
        original: ex.en,
        sentence: sentenceText,
        vi: ex.vi,
        isCorrect: isCorrect,
        explanation: explanationText,
        question: `Trong câu dưới đây, động từ theo thì ${grammar.tense_vi} (${grammar.tense}) đã được chia đúng hay chưa?`
      };
    });
  });

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAnswer = (answerBool) => {
    const question = quizQuestions[quizIdx];
    const isAnswerRight = answerBool === question.isCorrect;

    setSelectedAnswer(answerBool ? 'true' : 'false');
    
    if (isAnswerRight) {
      setQuizScore(prev => prev + 1);
      setFeedbackMessage({
        type: 'success',
        text: ` chính xác! ${question.explanation}`
      });
    } else {
      setFeedbackMessage({
        type: 'error',
        text: ` chưa chính xác! ${question.explanation}`
      });
    }
  };

  const handleNextQuiz = () => {
    setSelectedAnswer(null);
    setFeedbackMessage(null);

    if (quizIdx < quizQuestions.length - 1) {
      setQuizIdx(quizIdx + 1);
    } else {
      // Completed all questions
      storage.updateTopicProgress(topic.id, 'grammar');
      onComplete(); // refresh stats
      setCurrentStep('done');
    }
  };

  return (
    <div className="grammar-lab-screen animate-slideup">
      {/* Header */}
      <div className="screen-header mb-6">
        <button className="btn-secondary" onClick={onNavigateBack}>
          ← Back to Dashboard
        </button>
        <div className="topic-meta">
          <span className="badge-level">{topic.level}</span>
          <span className="topic-name">{topic.topic}</span>
        </div>
      </div>

      <div className="grammar-lab-layout max-w-2xl mx-auto">
        
        {/* Step 1: Grammar Theory */}
        {currentStep === 'theory' && (
          <div className="grammar-card glass p-6">
            <div className="card-hint mb-2">Grammar Focus</div>
            <h2 className="text-gradient mb-4">{grammar.tense_vi} ({grammar.tense})</h2>
            
            {/* Formula Block */}
            <div className="formula-box p-4 glass-glow mb-6 text-center">
              <span className="label block text-xs color-text-muted mb-2 font-bold uppercase">Cấu trúc công thức</span>
              <code className="text-lg font-bold" style={{ color: 'var(--color-secondary)' }}>{grammar.formula}</code>
            </div>

            <div className="explanation-box mb-8">
              <h4 className="mb-2 font-bold">Giải thích cách dùng:</h4>
              <p className="color-text-muted leading-relaxed">{grammar.explanation}</p>
            </div>

            <button className="btn-primary w-full justify-center" onClick={() => setCurrentStep('examples')}>
              Xem ví dụ thực tế →
            </button>
          </div>
        )}

        {/* Step 2: Examples list */}
        {currentStep === 'examples' && (
          <div className="grammar-card glass p-6">
            <div className="card-hint mb-2">Practical Examples</div>
            <h2 className="text-gradient mb-6">Ví dụ trong bài học</h2>

            <div className="examples-list flex flex-col gap-5 mb-8">
              {grammar.examples.map((ex, idx) => (
                <div key={idx} className="example-item p-4 glass flex justify-between items-start gap-4">
                  <div className="example-details">
                    <p className="text-lg font-semibold color-text-dark">"{ex.en}"</p>
                    <p className="color-text-muted text-sm mt-1">🇻🇳 {ex.vi}</p>
                    {ex.note && (
                      <p className="text-xs italic mt-2" style={{ color: 'var(--color-secondary)' }}>
                        💡 Chú ý: {ex.note}
                      </p>
                    )}
                  </div>
                  <button className="speak-btn-sm" onClick={() => handleSpeak(ex.en)} title="Phát âm mẫu">
                    🔊
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button className="btn-secondary w-1/2 justify-center" onClick={() => setCurrentStep('theory')}>
                ← Xem lại lý thuyết
              </button>
              <button className="btn-primary w-1/2 justify-center" onClick={() => setCurrentStep('quiz')}>
                Làm bài tập kiểm tra →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Interactive Quiz */}
        {currentStep === 'quiz' && (
          <div className="grammar-card glass p-6">
            <div className="progress-bar-container mb-6">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${(quizIdx / quizQuestions.length) * 100}%` }}
              />
              <span className="progress-text">Câu hỏi {quizIdx + 1}/{quizQuestions.length}</span>
            </div>

            <div className="card-hint mb-2">Grammar Quiz</div>
            <p className="color-text-muted mb-4">{quizQuestions[quizIdx].question}</p>

            {/* Quiz sentence box */}
            <div className="quiz-sentence-box p-5 glass-glow mb-6 text-center">
              <h3 className="text-xl color-text-dark font-bold">"{quizQuestions[quizIdx].sentence}"</h3>
              <p className="color-text-muted text-xs mt-2">Dịch nghĩa: {quizQuestions[quizIdx].vi}</p>
            </div>

            {/* Answer buttons */}
            <div className="answer-buttons-row flex gap-4 mb-6">
              <button 
                className={`btn-secondary w-1/2 justify-center py-4 text-base ${selectedAnswer === 'true' ? 'pulse-border' : ''}`}
                onClick={() => handleAnswer(true)}
                disabled={selectedAnswer !== null}
                style={{
                  backgroundColor: selectedAnswer === 'true' ? 'rgba(16, 185, 129, 0.1)' : '',
                  borderColor: selectedAnswer === 'true' ? 'var(--color-success)' : ''
                }}
              >
                👍 Đúng (Correct)
              </button>
              <button 
                className={`btn-secondary w-1/2 justify-center py-4 text-base ${selectedAnswer === 'false' ? 'pulse-border' : ''}`}
                onClick={() => handleAnswer(false)}
                disabled={selectedAnswer !== null}
                style={{
                  backgroundColor: selectedAnswer === 'false' ? 'rgba(239, 68, 68, 0.1)' : '',
                  borderColor: selectedAnswer === 'false' ? 'var(--color-error)' : ''
                }}
              >
                👎 Sai (Incorrect)
              </button>
            </div>

            {/* Feedback box */}
            {feedbackMessage && (
              <div className={`feedback-alert p-4 rounded-md mb-6 glass ${feedbackMessage.type === 'success' ? 'border-success' : 'border-error'}`}
                   style={{ 
                     borderLeft: `4px solid ${feedbackMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`,
                     backgroundColor: feedbackMessage.type === 'success' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
                   }}>
                <strong>
                  {feedbackMessage.type === 'success' ? '🎉 Tuyệt vời' : '⚠️ Tiếc quá'}
                  {feedbackMessage.text}
                </strong>
              </div>
            )}

            {/* Next button */}
            {selectedAnswer !== null && (
              <button className="btn-primary w-full justify-center" onClick={handleNextQuiz}>
                {quizIdx < quizQuestions.length - 1 ? "Câu tiếp theo →" : "Hoàn thành bài học"}
              </button>
            )}
          </div>
        )}

        {/* Step 4: Done page */}
        {currentStep === 'done' && (
          <div className="grammar-card glass-glow p-8 text-center animate-slideup">
            <span className="icon-huge">⚡</span>
            <h2 className="text-gradient mt-4 mb-2">Grammar Lab Completed!</h2>
            <p className="color-text-muted mb-6">Bạn đã nắm vững lý thuyết và các ví dụ của thì **{grammar.tense_vi}**.</p>
            
            <div className="score-radial-progress mb-6">
              <div className="score-percentage">+{Math.round((quizScore / quizQuestions.length) * 10) + 10}</div>
              <div className="score-label">XP Gained</div>
            </div>

            <p className="xp-gain-text mb-8">Thêm <strong>+10 XP</strong> đã được cộng vào tài khoản của bạn.</p>

            <button className="btn-primary w-full justify-center" onClick={onNavigateBack}>
              Quay lại Bảng bài học 🚀
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
