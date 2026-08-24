/**
 * Spaced Repetition SM-2 Algorithm Implementation
 * 
 * @param {number} grade - User recall quality: 1 (Again/Reset), 2 (Hard), 3 (Good), 4 (Easy), 5 (Very Easy)
 * @param {number} repetitions - Consecutive successful recall streak
 * @param {number} previousInterval - Interval from previous review (in days)
 * @param {number} previousEase - Easiness factor from previous review
 * @returns {{ repetitions: number, interval: number, easinessFactor: number, nextReviewDate: number }}
 */
export function calculateSM2(grade, repetitions, previousInterval, previousEase) {
  let ease = parseFloat(previousEase) || 2.5;
  let reps = parseInt(repetitions) || 0;
  let interval = 1;

  // Handle grade = 1 (Again / Reset) to review immediately in current session
  if (grade === 1) {
    return {
      repetitions: 0,
      interval: 0,
      easinessFactor: Math.max(1.3, ease - 0.2),
      nextReviewDate: Date.now() // due immediately
    };
  }

  if (grade >= 3) {
    if (reps === 0) {
      interval = 1;
    } else if (reps === 1) {
      interval = 6;
    } else {
      interval = Math.round(previousInterval * ease);
    }
    reps++;
  } else {
    reps = 0;
    interval = 1;
  }

  // Adjust ease factor based on SM-2 formula
  ease = ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (ease < 1.3) ease = 1.3;

  return {
    repetitions: reps,
    interval: interval,
    easinessFactor: ease,
    nextReviewDate: Date.now() + interval * 24 * 60 * 60 * 1000
  };
}
