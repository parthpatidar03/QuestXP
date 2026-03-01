// AI Pipeline constants - spec 003
module.exports = {
    // Duration thresholds (in seconds)
    MIN_DURATION_FOR_QUIZ_FULL: 300,   // 5 min — full 10-question quiz
    MIN_DURATION_FOR_QUIZ_SHORT: 120,  // 2 min — 3-question short quiz
    MIN_DURATION_FOR_TOPICS: 120,      // 2 min — topic segmentation eligible

    // Human-readable error reasons for failed pipeline stages
    ERROR_NO_CAPTIONS: 'No captions available for this video.',
    ERROR_STT_FAILED: 'Speech-to-text transcription failed.',
    ERROR_BOTH_FAILED: 'Both caption fetch and speech-to-text transcription failed.',
    ERROR_GPT_SCHEMA_INVALID: 'AI response did not match the expected schema. Retrying.',
    ERROR_RESOURCE_EXHAUSTED: 'OpenAI API quota exceeded. Please try again later.',
    ERROR_VIDEO_UNAVAILABLE: 'Video is private or unavailable.',
    ERROR_SERVICE_UNAVAILABLE: 'AI service temporarily unavailable. Retrying.',
};
