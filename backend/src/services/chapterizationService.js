const aiProvider = require('./ai-provider');

class ChapterizationService {
    /**
     * Splits a long transcript into logical chapters/lessons.
     * @param {string} fullText The complete transcript
     * @param {number} totalDurationSec Total video duration
     * @returns {Promise<Array<{title: string, startTime: number, endTime: number}>>}
     */
    async splitTranscript(fullText, totalDurationSec) {
        const systemPrompt = `
            You are an expert educational content architect.
            Task: Split a long video transcript into logical, high-impact learning modules.
            
            Context: You are given a transcript of a long video. You need to identify logical topic shifts.
            
            Rules:
            1. Each module must focus on ONE core concept.
            2. Modules should ideally be 10-20 minutes long.
            3. Provide a clear, catchy title for each module (e.g., "The Power of Closures", not "Part 1").
            4. Ensure startTime and endTime are in seconds and strictly chronological.
            5. The last chapter's endTime MUST match the total video duration (${totalDurationSec}).
            6. The first chapter's startTime MUST be 0.
            7. Return ONLY a valid JSON object with a "chapters" array.
            
            JSON Format:
            {
                "chapters": [
                    { "title": "Introduction to React", "startTime": 0, "endTime": 600 },
                    { "title": "JSX and Rendering", "startTime": 600, "endTime": 1500 }
                ]
            }
        `;

        const userPrompt = `
            Video Duration: ${totalDurationSec} seconds.
            Full Transcript:
            ${fullText}
            
            Identify the natural boundaries where the teacher shifts to a new major topic.
        `;

        try {
            const result = await aiProvider.generateJSON(userPrompt, systemPrompt);
            return result.chapters || [];
        } catch (error) {
            console.error('[ChapterizationService] Failed to split transcript:', error);
            // Return a single chapter as fallback
            return [{ title: 'Full Lecture', startTime: 0, endTime: totalDurationSec }];
        }
    }
}

module.exports = new ChapterizationService();
