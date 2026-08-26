import React from 'react';
import '../../styles/learningVisuals.css';

export default function LessonIllustration({
  type,
  data,
  className = ''
}) {
  if (!data) return null;

  // 1. Daily Routine Timeline Sequence (Unit 2)
  if (type === 'sequence' && Array.isArray(data.steps)) {
    return (
      <div className={`space-y-2 ${className}`}>
        {data.title && (
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {data.title}
          </h4>
        )}
        <div className="v-situation-sequence">
          {data.steps.map((step, idx) => (
            <div key={idx} className="v-sequence-step">
              <span className="v-sequence-time">{step.time}</span>
              <span className="v-sequence-action">{step.action}</span>
              <span className="v-sequence-action-vi">{step.actionVi}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Family Tree Structure (Unit 3)
  if (type === 'family_tree' && Array.isArray(data.generations)) {
    return (
      <div className={`space-y-2 ${className}`}>
        {data.title && (
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {data.title}
          </h4>
        )}
        <div className="v-family-tree">
          {data.generations.map((gen, idx) => (
            <div key={idx} className="v-family-generation">
              <span className="v-family-gen-title">{gen.level}</span>
              <div className="v-family-members-row">
                {gen.members.map((member, mIdx) => (
                  <span key={mIdx} className="v-family-chip">
                    {member}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. Grammar Subject Pronouns Visual Breakdown (Unit 1)
  if (type === 'grammar_pronouns' && Array.isArray(data.items)) {
    return (
      <div className={`space-y-2 ${className}`}>
        {data.title && (
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {data.title}
          </h4>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          {data.items.map((item, idx) => (
            <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-1">
              <span className="text-sm font-black text-indigo-600 font-mono block">{item.pronoun}</span>
              <span className="text-xs font-semibold text-slate-700 block">{item.vi}</span>
              <span className="text-[11px] text-slate-500 italic block">{item.example}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
