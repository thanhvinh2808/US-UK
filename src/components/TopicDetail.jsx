import React from 'react';

export default function TopicDetail({ topic, progress, onSelectModule, onNavigateBack }) {
  const topicProg = progress[topic.id] || {
    is_reading_completed: false,
    max_speaking_score: -1,
    max_listening_score: -1,
    is_grammar_completed: false,
    max_writing_score: -1
  };

  const maxSpeaking = topicProg.max_speaking_score !== undefined ? topicProg.max_speaking_score : -1;
  const maxListening = topicProg.max_listening_score !== undefined ? topicProg.max_listening_score : -1;
  const maxWriting = topicProg.max_writing_score !== undefined ? topicProg.max_writing_score : -1;

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
          {topic.description}
        </p>
      </div>

      {/* Modules Selection Grid */}
      <div className="modules-grid mb-8">
        {/* Module 1: Reading & Vocab */}
        <div className="module-select-card glass p-6">
          <div className="module-icon-large" style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '24px' }}>R</div>
          <h3 className="mb-2">Module 1: Reading passage</h3>
          <p className="color-text-muted text-sm mb-6">
            Read the main passage and build your vocabulary. Select any words to get instant translations, pronunciation, and detailed definitions.
          </p>
          <div className="module-status-indicator mb-6">
            {topicProg.is_reading_completed ? (
              <span className="status-pill mastered">Completed</span>
            ) : (
              <span className="status-pill learning">Not Started</span>
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
            {hasGrammar ? "Module 1.5: Grammar Lab" : "Grammar Lab: Coming Soon"}
          </h3>
          <p className="color-text-muted text-sm mb-6">
            {hasGrammar 
              ? `Học và thực hành cấu trúc ngữ pháp trọng tâm của bài: ${topic.grammar_focus.tense_vi} (${topic.grammar_focus.tense}).`
              : "Bài học ngữ pháp trọng tâm sẽ được cập nhật sớm."}
          </p>
          <div className="module-status-indicator mb-6">
            {hasGrammar ? (
              topicProg.is_grammar_completed ? (
                <span className="status-pill mastered">Completed</span>
              ) : (
                <span className="status-pill learning">Not Started</span>
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
            {maxListening >= 0 ? (
              <span className="status-pill mastered">
                Best Score: {Math.round(maxListening * 100)}%
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
              maxWriting >= 0 ? (
                <span className="status-pill mastered">
                  Best Score: {Math.round(maxWriting * 100)}%
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
            {maxSpeaking >= 0 ? (
              <span className="status-pill mastered">
                Best Score: {Math.round(maxSpeaking * 100)}%
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

        {/* Module 3.5: Shadowing Reflex */}
        <div className="module-select-card glass p-6">
          <div className="module-icon-large" style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '24px' }}>⚡</div>
          <h3 className="mb-2">Module 3.5: Shadowing Reflex</h3>
          <p className="color-text-muted text-sm mb-6">
            Luyện phản xạ nói đuổi theo giọng mẫu. Hệ thống tự động mở ghi âm sau khi âm thanh kết thúc và đo đạc độ trễ phản hồi của bạn.
          </p>
          <div className="module-status-indicator mb-6">
            <span className="status-pill mastered" style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}>
              Sẵn sàng
            </span>
          </div>
          <button 
            className="btn-primary w-full justify-center mt-auto"
            onClick={() => onSelectModule('shadowing')}
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #3b82f6 100%)'
            }}
          >
            Start Shadowing
          </button>
        </div>
      </div>
    </div>
  );
}
