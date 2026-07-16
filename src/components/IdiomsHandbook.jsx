import React, { useState } from 'react';
import { speak, speakCompare, playSound, vibrate } from '../utils/sounds';
import confetti from 'canvas-confetti';

const IDIOMS_DATA = [
  {
    id: 'piece_of_cake',
    phrase: 'A piece of cake',
    type: 'idiom',
    category: 'success',
    definition_vi: 'Dễ như ăn bánh',
    definition_en: 'Something that is very easy to do.',
    example_en: 'The English test was a piece of cake; I finished it in ten minutes.',
    example_vi: 'Bài thi tiếng Anh dễ như ăn bánh vậy; tôi làm xong chỉ trong mười phút.',
    origin: 'Có nguồn gốc từ những năm 1870 ở Mỹ, khi các cuộc thi đi bộ có giải thưởng là những chiếc bánh kem ngọt ngào dễ nhận.'
  },
  {
    id: 'break_a_leg',
    phrase: 'Break a leg',
    type: 'idiom',
    category: 'emotions',
    definition_vi: 'Chúc may mắn (thường dùng trong nghệ thuật biểu diễn)',
    definition_en: 'A way to wish someone good luck, especially before a performance.',
    example_en: 'Break a leg at your concert tonight! You will do great.',
    example_vi: 'Chúc buổi biểu diễn tối nay của cậu thành công nhé! Cậu sẽ làm tốt thôi.',
    origin: 'Xuất phát từ giới sân khấu kịch, khi chúc trực tiếp "may mắn" được cho là mang điềm gở, người ta nói ngược lại.'
  },
  {
    id: 'bite_the_bullet',
    phrase: 'Bite the bullet',
    type: 'idiom',
    category: 'emotions',
    definition_vi: 'Cắn răng chịu đựng, dũng cảm đối mặt nghịch cảnh',
    definition_en: 'To face a difficult situation with courage and endurance.',
    example_en: 'I hate dentists, but I just have to bite the bullet and go.',
    example_vi: 'Tôi rất ghét nha sĩ, nhưng tôi đành phải cắn răng chịu đựng để đi khám thôi.',
    origin: 'Trong chiến tranh trước đây khi chưa có thuốc gây tê, các thương binh phải cắn chặt viên đạn chì để chịu đau khi phẫu thuật.'
  },
  {
    id: 'burn_the_midnight_oil',
    phrase: 'Burn the midnight oil',
    type: 'idiom',
    category: 'work',
    definition_vi: 'Thức khuya làm việc, học bài',
    definition_en: 'To study or work late into the night.',
    example_en: 'She is burning the midnight oil to prepare for the final exam.',
    example_vi: 'Cô ấy đang thức khuya học bài để chuẩn bị cho kỳ thi cuối kỳ.',
    origin: 'Ách chỉ việc đốt đèn dầu để làm việc thâu đêm từ thế kỷ 17 trước khi có điện.'
  },
  {
    id: 'under_the_weather',
    phrase: 'Under the weather',
    type: 'idiom',
    category: 'emotions',
    definition_vi: 'Cảm thấy không khỏe, mệt mỏi',
    definition_en: 'Feeling slightly sick or unwell.',
    example_en: 'I think I will stay home today; I am feeling a bit under the weather.',
    example_vi: 'Tôi nghĩ tôi sẽ ở nhà hôm nay; tôi cảm thấy hơi mệt trong người.',
    origin: 'Thuật ngữ hàng hải cổ: Thủy thủ khi say sóng hoặc ốm sẽ đi xuống boong dưới để tránh thời tiết xấu bên ngoài.'
  },
  {
    id: 'cost_an_arm_and_a_leg',
    phrase: 'Cost an arm and a leg',
    type: 'idiom',
    category: 'general',
    definition_vi: 'Rất đắt đỏ, tốn kém',
    definition_en: 'To be extremely expensive.',
    example_en: 'This designer leather bag costs an arm and a leg.',
    example_vi: 'Chiếc túi xách da hàng hiệu này đắt cắt cổ.',
    origin: 'Có giả thuyết cho rằng sau thế chiến, chi phí vẽ chân dung giảm đi nếu không vẽ chi tiết cánh tay và chân.'
  },
  {
    id: 'look_forward_to',
    phrase: 'Look forward to',
    type: 'phrasal_verb',
    category: 'general',
    definition_vi: 'Mong đợi, trông mong điều gì đó',
    definition_en: 'To feel excited about something that is going to happen.',
    example_en: 'I am looking forward to hearing from you soon.',
    example_vi: 'Tôi rất mong sớm nhận được phản hồi từ bạn.',
    origin: 'Cụm động từ ghép: look (nhìn) + forward (phía trước) + to (tới).'
  },
  {
    id: 'call_off',
    phrase: 'Call off',
    type: 'phrasal_verb',
    category: 'work',
    definition_vi: 'Hủy bỏ (cuộc họp, trận đấu, sự kiện)',
    definition_en: 'To cancel something that was planned.',
    example_en: 'They had to call off the soccer match due to heavy rain.',
    example_vi: 'Họ đã phải hủy bỏ trận bóng đá do trời mưa to.',
    origin: 'Bản chất ban đầu: Gọi động vật săn mồi quay lại, sau đó chuyển nghĩa thành dừng/hủy bỏ sự việc.'
  },
  {
    id: 'give_up',
    phrase: 'Give up',
    type: 'phrasal_verb',
    category: 'emotions',
    definition_vi: 'Từ bỏ, đầu hàng',
    definition_en: 'To stop trying to do something; surrender.',
    example_en: 'Never give up on your dreams, no matter how hard it gets.',
    example_vi: 'Đừng bao giờ từ bỏ ước mơ của bạn, bất kể khó khăn đến đâu.',
    origin: 'Ghép từ give (trao đi) + up (lên trên), mang ý nghĩa dâng nộp quyền lực hoặc đầu hàng.'
  },
  {
    id: 'run_out_of',
    phrase: 'Run out of',
    type: 'phrasal_verb',
    category: 'general',
    definition_vi: 'Hết sạch, cạn kiệt thứ gì đó',
    definition_en: 'To use up all of something so that there is none left.',
    example_en: 'We ran out of petrol in the middle of the highway.',
    example_vi: 'Chúng tôi đã hết sạch xăng ngay giữa đường cao tốc.',
    origin: 'Diễn tả luồng chảy của chất lỏng thoát ra hết khỏi bình chứa.'
  },
  {
    id: 'bring_up',
    phrase: 'Bring up',
    type: 'phrasal_verb',
    category: 'work',
    definition_vi: 'Nuôi nấng / Đề cập đến một chủ đề thảo luận',
    definition_en: 'To raise a child / To mention a topic in discussion.',
    example_en: 'Please do not bring up that painful memory during the meeting.',
    example_vi: 'Xin đừng đề cập đến ký ức đau buồn đó trong cuộc họp.',
    origin: 'Mang một thứ dưới thấp nâng lên cao (đưa chủ đề ra bàn luận hoặc nuôi dạy con lớn lên).'
  }
];

export default function IdiomsHandbook({ onNavigateBack }) {
  const [activeTab, setActiveTab] = useState('list'); // list, quiz
  const [filterType, setFilterType] = useState('all'); // all, idiom, phrasal_verb
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Quiz States
  const [quizItem, setQuizItem] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [quizFeedback, setQuizFeedback] = useState('');

  // Handle speak phrase
  const handleSpeak = (text, accent = 'US') => {
    speak(text, { accent, rate: 0.85 });
  };

  const handleSpeakCompare = (text) => {
    speakCompare(text);
  };

  // Filter items
  const filteredItems = IDIOMS_DATA.filter(item => {
    const matchesSearch = item.phrase.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.definition_vi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'Tất cả chủ đề' },
    { value: 'success', label: 'Thành công & Khó khăn' },
    { value: 'emotions', label: 'Cảm xúc & Sức khỏe' },
    { value: 'work', label: 'Học tập & Công việc' },
    { value: 'general', label: 'Giao tiếp thông dụng' }
  ];

  // Start Quiz
  const startQuiz = () => {
    if (IDIOMS_DATA.length < 4) return;
    
    // Choose random correct idiom
    const correctIndex = Math.floor(Math.random() * IDIOMS_DATA.length);
    const correct = IDIOMS_DATA[correctIndex];
    
    // Pick 3 random wrong options
    const wrongOptions = IDIOMS_DATA
      .filter(item => item.id !== correct.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
      
    const allOptions = [...wrongOptions, correct].sort(() => 0.5 - Math.random());
    
    setQuizItem(correct);
    setOptions(allOptions);
    setSelectedAnswer(null);
    setQuizFeedback('');
  };

  const handleAnswerSubmit = (option) => {
    if (selectedAnswer) return; // already answered
    setSelectedAnswer(option);
    
    const isCorrect = option.id === quizItem.id;
    setQuizScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    if (isCorrect) {
      playSound('correct');
      vibrate(50);
      setQuizFeedback("Chính xác! Bạn ghi nhớ từ rất tốt. ✨");
      if (quizScore.correct + 1 >= 5 && (quizScore.correct + 1) === (quizScore.total + 1)) {
        confetti({ particleCount: 40, spread: 60 });
      }
    } else {
      playSound('incorrect');
      vibrate([50, 50]);
      setQuizFeedback(`Chưa đúng! Đáp án đúng phải là: "${quizItem.phrase}" - ${quizItem.definition_vi}`);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'quiz') {
      startQuiz();
    }
  };

  return (
    <div className="idioms-handbook-screen animate-slideup p-6 glass">
      <div className="flex justify-between items-center mb-6">
        <button className="btn-secondary" onClick={onNavigateBack}>
          ← Quay về Dashboard
        </button>
        <h2 className="glow-text text-gradient">Idioms & Phrasal Verbs Handbook</h2>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex gap-4 border-b border-light pb-4 mb-6">
        <button
          onClick={() => switchTab('list')}
          className={`pb-2 font-semibold text-sm cursor-pointer border-b-2 transition ${activeTab === 'list' ? 'border-primary color-primary' : 'border-transparent color-text-muted'}`}
          style={{ borderColor: activeTab === 'list' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'list' ? 'var(--color-primary)' : '' }}
        >
          📖 Tra cứu từ & cụm từ
        </button>
        <button
          onClick={() => switchTab('quiz')}
          className={`pb-2 font-semibold text-sm cursor-pointer border-b-2 transition ${activeTab === 'quiz' ? 'border-primary color-primary' : 'border-transparent color-text-muted'}`}
          style={{ borderColor: activeTab === 'quiz' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'quiz' ? 'var(--color-primary)' : '' }}
        >
          🎮 Trắc nghiệm ôn tập nhanh
        </button>
      </div>

      {/* TAB 1: LIST LOOKUP */}
      {activeTab === 'list' && (
        <div className="flex flex-col gap-6 animate-slideup">
          {/* Filters Bar */}
          <div className="flex flex-wrap gap-4 items-center justify-between glass p-4 rounded-md">
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Tìm kiếm thành ngữ, phrasal verb..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="translation-text-input max-w-xs"
                style={{ padding: '8px 12px' }}
              />

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="btn-secondary"
                style={{ padding: '8px 12px', background: 'var(--bg-dark)' }}
              >
                <option value="all">Tất cả loại</option>
                <option value="idiom">Idioms (Thành ngữ)</option>
                <option value="phrasal_verb">Phrasal Verbs (Cụm động từ)</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="btn-secondary"
                style={{ padding: '8px 12px', background: 'var(--bg-dark)' }}
              >
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <span className="text-xs color-text-muted font-semibold">Tìm thấy {filteredItems.length} kết quả</span>
          </div>

          {/* Cards List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div 
                  key={item.id} 
                  className={`glass p-5 rounded-md transition cursor-pointer flex flex-col gap-3 ${isExpanded ? 'border-primary' : 'hover:bg-white/5'}`}
                  style={{
                    borderColor: isExpanded ? 'var(--color-primary)' : 'var(--border-light)',
                    borderLeft: `4px solid ${item.type === 'idiom' ? 'var(--color-secondary)' : 'var(--color-primary)'}`
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className={`badge-level text-[10px] font-bold uppercase tracking-wider mb-1 ${item.type === 'idiom' ? 'level-b2' : 'level-a2'}`}>
                        {item.type === 'idiom' ? 'Idiom' : 'Phrasal Verb'}
                      </span>
                      <h3 className="font-extrabold text-lg color-text-dark">{item.phrase}</h3>
                      <p className="font-semibold text-sm color-text-muted mt-1">🇻🇳 {item.definition_vi}</p>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button className="row-speak-btn" onClick={() => handleSpeak(item.phrase, 'US')} title="Nghe giọng Mỹ">🇺🇸</button>
                      <button className="row-speak-btn" onClick={() => handleSpeak(item.phrase, 'UK')} title="Nghe giọng Anh">🇬🇧</button>
                      <button className="row-speak-btn" onClick={() => handleSpeakCompare(item.phrase)} title="So sánh giọng US-UK">🆚</button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="expanded-details border-t border-light pt-3 mt-2 flex flex-col gap-3 animate-slideup" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <strong className="text-xs color-text-muted block">Giải nghĩa bằng tiếng Anh:</strong>
                        <p className="text-sm color-text-dark font-medium italic mt-0.5">"{item.definition_en}"</p>
                      </div>

                      <div className="glass p-3 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <strong className="text-xs color-text-muted block">Ví dụ song ngữ:</strong>
                        <p className="text-sm color-text-dark font-bold mt-1">"{item.example_en}"</p>
                        <p className="text-xs color-text-muted mt-0.5">↳ {item.example_vi}</p>
                        <div className="flex gap-2 justify-end mt-2">
                          <button className="btn-secondary" style={{ padding: '2px 8px', fontSize: '10px' }} onClick={() => handleSpeak(item.example_en, 'US')}>🔊 Nghe ví dụ (US)</button>
                          <button className="btn-secondary" style={{ padding: '2px 8px', fontSize: '10px' }} onClick={() => handleSpeak(item.example_en, 'UK')}>🔊 Nghe ví dụ (UK)</button>
                        </div>
                      </div>

                      {item.origin && (
                        <div className="text-[11px] color-text-muted leading-relaxed">
                          💡 <strong>Nguồn gốc lịch sử:</strong> {item.origin}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE QUIZ */}
      {activeTab === 'quiz' && quizItem && (
        <div className="flex flex-col items-center gap-6 py-6 animate-slideup">
          <div className="quiz-progress text-sm color-text-muted">
            Tỉ lệ chính xác: <strong className="color-primary">{quizScore.correct}</strong> / {quizScore.total} câu
          </div>

          <div className="glass p-6 rounded-md text-center max-w-lg w-full flex flex-col gap-4 border border-light">
            <span className="text-xs uppercase tracking-wider color-text-muted font-bold block">Hãy chọn thành ngữ phù hợp với nghĩa sau:</span>
            <span className="text-xl font-bold color-text-dark leading-relaxed">
              " {quizItem.definition_vi} "
            </span>
            <span className="text-sm color-text-muted block">({quizItem.definition_en})</span>
          </div>

          <div className="quiz-options flex flex-col gap-3 w-full max-w-md">
            {options.map((option) => {
              const isSelected = selectedAnswer && selectedAnswer.id === option.id;
              const isCorrectOption = option.id === quizItem.id;
              
              let btnStyle = {};
              if (selectedAnswer) {
                if (isCorrectOption) {
                  btnStyle = { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--color-success)' };
                } else if (isSelected) {
                  btnStyle = { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'var(--color-error)' };
                }
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswerSubmit(option)}
                  className="btn-secondary w-full py-4 text-base font-bold justify-between px-6 rounded-md transition"
                  style={{
                    border: '2px solid var(--border-light)',
                    ...btnStyle
                  }}
                >
                  <span>{option.phrase}</span>
                  <span className="text-xs font-normal color-text-muted">({option.type === 'idiom' ? 'Thành ngữ' : 'Cụm ĐT'})</span>
                </button>
              );
            })}
          </div>

          {quizFeedback && (
            <div className="quiz-feedback-box glass p-4 text-center w-full max-w-md animate-slideup">
              <p className="font-semibold text-sm leading-relaxed mb-3">{quizFeedback}</p>
              <div className="flex gap-2 justify-center">
                <button className="btn-secondary py-2 px-4 text-xs" onClick={() => handleSpeak(quizItem.phrase, 'US')}>🇺🇸 Nghe phát âm</button>
                <button className="btn-primary py-2 px-6 text-sm" onClick={startQuiz}>
                  Tiếp tục câu khác →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
