import React from 'react';

export default function TopicDetail({ topic, progress, onSelectModule, onNavigateBack }) {
  const topicProg = progress[topic.id] || {
    is_reading_completed: false,
    max_speaking_score: 0,
    max_listening_score: 0,
    is_grammar_completed: false,
    max_writing_score: 0
  };

  const hasGrammar = !!topic.grammar_focus;

  return (
    <div className="topic-hub-screen animate-slideup">
      {/* Back Button */}
      <div className="screen-header mb-4">
        <button className="btn-secondary" onClick={onNavigateBack}>
          ← Back to Learning Path
        </button>
      </div>

      {/* Topic Hero Card */}
      <div className="topic-hero-card glass p-8 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className={`badge-level level-${topic.level.toLowerCase()}`}>{topic.level}</span>
          <span className="color-text-muted text-sm">{topic.topic} Topic</span>
        </div>
        <h1 className="text-gradient mb-4">{topic.title}</h1>
        <p className="color-text-muted max-w-2xl leading-relaxed">
          "{topic.reading_passage.slice(0, 160)}..."
        </p>
      </div>

      {/* 5 Modules Section */}
      <h2 className="section-title mb-6">Training Modules</h2>
      
      <div className="hub-modules-grid">
        {/* Module 1: Reading & Vocab */}
        <div className="module-select-card glass p-6">
          <div className="module-icon-large" style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '24px' }}>R</div>
          <h3 className="mb-2">Module 1: Read & Translate</h3>
          <p className="color-text-muted text-sm mb-6">
            Read the text, click on unfamiliar words to see their IPA, audio pronunciation, and translation. Save words to your notebook.
          </p>
          <div className="module-status-indicator mb-6">
            {topicProg.is_reading_completed ? (
              <span className="status-pill mastered">Completed</span>
            ) : (
              <span className="status-pill learning">Not Completed</span>
            )}
          </div>
          <button 
            className="btn-primary w-full justify-center mt-auto"
            onClick={() => onSelectModule('reader')}
          >
            Start Reading
          </button>
        </div>

        {/* Module 1.5: Grammar Lab */}
        <div className="module-select-card glass p-6">
          <div className="module-icon-large" style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '24px' }}>G</div>
          <h3 className="mb-2">
            {hasGrammar ? `Grammar Lab: ${topic.grammar_focus.tense_vi}` : "Grammar Lab: Coming Soon"}
          </h3>
          <p className="color-text-muted text-sm mb-6">
            {hasGrammar 
              ? topic.grammar_focus.explanation 
              : "Cấu trúc ngữ pháp cho chủ đề này sẽ được cập nhật trong phiên bản tiếp theo."}
          </p>
          <div className="module-status-indicator mb-6">
            {hasGrammar ? (
              topicProg.is_grammar_completed ? (
                <span className="status-pill mastered">Completed</span>
              ) : (
                <span className="status-pill learning">Not Completed</span>
              )
            ) : (
              <span className="status-pill learning">Locked</span>
            )}
          </div>
          <button 
            className="btn-primary w-full justify-center mt-auto"
            onClick={() => onSelectModule('grammar')}
            disabled={!hasGrammar}
            style={{
              background: !hasGrammar ? 'rgba(255,255,255,0.05)' : '',
              color: !hasGrammar ? 'var(--color-text-muted)' : '',
              cursor: !hasGrammar ? 'not-allowed' : 'pointer'
            }}
          >
            {hasGrammar ? "Start Grammar Lab" : "Locked"}
          </button>
        </div>

        {/* Module 2: Listening & Dictation */}
        <div className="module-select-card glass p-6">
          <div className="module-icon-large" style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '24px' }}>D</div>
          <h3 className="mb-2">Module 2: Dictation Arena</h3>
          <p className="color-text-muted text-sm mb-6">
            Listen to dialogues sentence by sentence and transcribe them. Test your listening comprehension and spelling precision.
          </p>
          <div className="module-status-indicator mb-6">
            {topicProg.max_listening_score > 0 ? (
              <span className="status-pill mastered">
                Best Score: {Math.round(topicProg.max_listening_score * 100)}%
              </span>
            ) : (
              <span className="status-pill learning">Not Started</span>
            )}
          </div>
          <button 
            className="btn-primary w-full justify-center mt-auto"
            onClick={() => onSelectModule('dictation')}
          >
            Start Dictation
          </button>
        </div>

        {/* Module 2.5: Writing Lab */}
        <div className="module-select-card glass p-6">
          <div className="module-icon-large" style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '24px' }}>W</div>
          <h3 className="mb-2">
            {hasGrammar ? "Module 2.5: Writing Challenge" : "Writing Challenge: Coming Soon"}
          </h3>
          <p className="color-text-muted text-sm mb-6">
            {hasGrammar 
              ? "Hoàn thành các bài tập điền từ, sắp xếp câu và tự do để rèn luyện khả năng đặt câu và ngữ pháp chính xác."
              : "Thử thách viết luận ngắn theo chủ đề sẽ được cập nhật sớm."}
          </p>
          <div className="module-status-indicator mb-6">
            {hasGrammar ? (
              topicProg.max_writing_score > 0 ? (
                <span className="status-pill mastered">
                  Best Score: {Math.round(topicProg.max_writing_score * 100)}%
                </span>
              ) : (
                <span className="status-pill learning">Not Started</span>
              )
            ) : (
              <span className="status-pill learning">Locked</span>
            )}
          </div>
          <button 
            className="btn-primary w-full justify-center mt-auto"
            onClick={() => onSelectModule('writing')}
            disabled={!hasGrammar}
            style={{
              background: !hasGrammar ? 'rgba(255,255,255,0.05)' : '',
              color: !hasGrammar ? 'var(--color-text-muted)' : '',
              cursor: !hasGrammar ? 'not-allowed' : 'pointer'
            }}
          >
            {hasGrammar ? "Start Writing Lab" : "Locked"}
          </button>
        </div>

        {/* Module 3: Speaking & Pronunciation */}
        <div className="module-select-card glass p-6">
          <div className="module-icon-large" style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '24px' }}>S</div>
          <h3 className="mb-2">Module 3: Speaking Arena</h3>
          <p className="color-text-muted text-sm mb-6">
            Speak into the microphone to read the sentences. Our system evaluates your voice input and highlights pronunciation errors.
          </p>
          <div className="module-status-indicator mb-6">
            {topicProg.max_speaking_score > 0 ? (
              <span className="status-pill mastered">
                Best Score: {Math.round(topicProg.max_speaking_score * 100)}%
              </span>
            ) : (
              <span className="status-pill learning">Not Started</span>
            )}
          </div>
          <button 
            className="btn-primary w-full justify-center mt-auto"
            onClick={() => onSelectModule('pronunciation')}
          >
            Start Speaking
          </button>
        </div>
      </div>
    </div>
  );
}
