function toNumberOrNull(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundGrade(value) {
  return Math.round(value * 100) / 100;
}

function parseQuizConfig(field) {
  if (!field) {
    return null;
  }

  const raw = field.options || (field.expected_entity && field.expected_entity !== 'none' && field.expected_entity !== 'quiz'
    ? field.expected_entity
    : null);

  if (!raw) {
    return null;
  }

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return parsed && parsed.questionType ? parsed : null;
  } catch {
    return null;
  }
}

function parseAiErrors(aiErrors) {
  if (!aiErrors) {
    return [];
  }

  if (Array.isArray(aiErrors)) {
    return aiErrors;
  }

  try {
    const parsed = JSON.parse(aiErrors);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeForComparison(value, caseSensitive) {
  const normalized = String(value || '').trim();
  return caseSensitive ? normalized : normalized.toLowerCase();
}

function evaluateQuizAnswer(answerValue, quizConfig) {
  const maxScore = Number(quizConfig.points) > 0 ? Number(quizConfig.points) : 1;
  const questionType = quizConfig.questionType;
  const expectedAnswer = String(quizConfig.correctAnswer || '').trim();
  const userAnswer = String(answerValue || '').trim();
  const matchMode = quizConfig.matchMode || 'case_insensitive';
  const caseSensitive = matchMode === 'case_sensitive';

  let isCorrect = false;
  if (questionType === 'fill_blank') {
    isCorrect = normalizeForComparison(userAnswer, caseSensitive) === normalizeForComparison(expectedAnswer, caseSensitive);
  } else {
    isCorrect = normalizeForComparison(userAnswer, false) === normalizeForComparison(expectedAnswer, false);
  }

  const score = isCorrect ? maxScore : 0;
  const summary = isCorrect
    ? 'Matched the expected answer.'
    : `Expected "${expectedAnswer || 'N/A'}" but received "${userAnswer || 'No answer'}".`;

  return {
    score,
    maxScore,
    summary,
    type: 'quiz',
    needsReview: !isCorrect,
  };
}

function evaluateOpenEndedAnswer(answer) {
  const maxScore = 10;
  const aiErrors = parseAiErrors(answer.ai_errors);
  const errorCount = aiErrors.filter((item) => item.severity === 'error').length;
  const warningCount = aiErrors.filter((item) => item.severity === 'warning').length;

  let score = maxScore;
  if (answer.ai_not_evaluated) {
    score = maxScore / 2;
  } else {
    score -= errorCount * 4;
    score -= warningCount * 2;
  }

  score = Math.max(0, roundGrade(score));

  let summary = 'Passed automated review cleanly.';
  if (answer.ai_not_evaluated) {
    summary = 'AI could not evaluate this answer. Teacher review recommended.';
  } else if (aiErrors.length > 0) {
    const issueSummary = aiErrors
      .map((item) => `${item.type}: ${item.issue}`)
      .join(' | ');
    summary = issueSummary;
  } else if (!String(answer.value || '').trim()) {
    summary = 'No answer was provided.';
    score = 0;
  }

  return {
    score,
    maxScore,
    summary,
    type: 'ai_validation',
    needsReview: answer.ai_not_evaluated || errorCount > 0,
    errorCount,
    warningCount,
  };
}

function buildAiGradeDraft(submission) {
  const answers = Array.isArray(submission?.answers) ? submission.answers : [];

  let totalScore = 0;
  let totalMaxScore = 0;
  let needsTeacherReview = false;
  const feedbackLines = [];
  const breakdown = [];

  for (const answer of answers) {
    const label = answer?.field?.label || 'Response';
    const quizConfig = parseQuizConfig(answer?.field);
    const evaluation = quizConfig
      ? evaluateQuizAnswer(answer?.value, quizConfig)
      : evaluateOpenEndedAnswer(answer || {});

    totalScore += evaluation.score;
    totalMaxScore += evaluation.maxScore;
    needsTeacherReview = needsTeacherReview || evaluation.needsReview;

    breakdown.push({
      fieldId: answer?.field_id || answer?.field?.id || null,
      label,
      type: evaluation.type,
      score: roundGrade(evaluation.score),
      maxScore: roundGrade(evaluation.maxScore),
      summary: evaluation.summary,
      submittedValue: answer?.value || '',
      aiErrors: parseAiErrors(answer?.ai_errors),
    });

    feedbackLines.push(`${label}: ${evaluation.summary}`);
  }

  const normalizedMax = roundGrade(totalMaxScore);
  const normalizedScore = roundGrade(totalScore);
  const aiFeedback = feedbackLines.length > 0
    ? feedbackLines.join('\n')
    : 'No answers were available for AI review.';

  return {
    aiGradeScore: normalizedScore,
    aiGradeMaxScore: normalizedMax,
    aiFeedback,
    breakdown,
    recommendedStatus: needsTeacherReview ? 'pending_review' : 'pending_review',
  };
}

function resolveSubmissionGrade(submission) {
  const draft = buildAiGradeDraft(submission);
  const aiGradeScore = toNumberOrNull(submission?.ai_grade_score) ?? draft.aiGradeScore;
  const aiGradeMaxScore = toNumberOrNull(submission?.ai_grade_max_score) ?? draft.aiGradeMaxScore;
  const teacherGradeScore = toNumberOrNull(submission?.teacher_grade_score);
  const teacherGradeMaxScore = toNumberOrNull(submission?.teacher_grade_max_score);
  const finalGradeScore = teacherGradeScore ?? aiGradeScore;
  const finalGradeMaxScore = teacherGradeMaxScore ?? aiGradeMaxScore;
  const aiFeedback = submission?.ai_feedback || draft.aiFeedback;
  const teacherFeedback = submission?.teacher_feedback || '';
  const finalFeedback = teacherFeedback || aiFeedback;

  return {
    aiGradeScore,
    aiGradeMaxScore,
    aiFeedback,
    teacherGradeScore,
    teacherGradeMaxScore,
    teacherFeedback,
    finalGradeScore,
    finalGradeMaxScore,
    finalFeedback,
    gradeStatus: submission?.grade_status || 'pending_review',
    gradedAt: submission?.graded_at || null,
    publishedAt: submission?.published_at || null,
    hasTeacherOverride: teacherGradeScore !== null || !!teacherFeedback,
    breakdown: draft.breakdown,
  };
}

module.exports = {
  buildAiGradeDraft,
  resolveSubmissionGrade,
  toNumberOrNull,
  roundGrade,
};