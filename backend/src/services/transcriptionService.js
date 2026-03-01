const { YoutubeTranscript } = require('youtube-transcript');
const { spawn } = require('child_process');
const path = require('path');
const {
    ERROR_NO_CAPTIONS,
    ERROR_STT_FAILED,
    ERROR_BOTH_FAILED
} = require('../constants/aiPipeline');

class TranscriptionService {
    /**
     * Transcribe a YouTube video using captions first, then STT fallback.
     * @param {string} youtubeId 
     * @returns {Promise<{source: string, fullText: string, segments: Array, durationSecs: number}>}
     */
    async transcribe(youtubeId, durationSecs) {
        try {
            // Attempt 1: Fetch platform captions
            const transcriptList = await YoutubeTranscript.fetchTranscript(youtubeId);
            
            if (transcriptList && transcriptList.length > 0) {
                const fullText = transcriptList.map(t => t.text).join(' ');
                
                // Format segments
                const segments = transcriptList.map(t => ({
                    text: t.text,
                    start: t.offset / 1000, 
                    end: (t.offset + t.duration) / 1000
                }));

                return {
                    source: 'platform_captions',
                    fullText,
                    segments,
                    durationSecs
                };
            }
        } catch (error) {
            console.warn(`[TranscriptionService] Platform captions unavailable for ${youtubeId}: ${error.message}`);
        }

        // Attempt 2: Local STT via faster-whisper
        try {
            const sttResult = await this.fallbackToSTT(youtubeId);
            return {
                ...sttResult,
                source: 'local_stt',
                durationSecs
            };
        } catch (sttError) {
            console.error(`[TranscriptionService] STT failed for ${youtubeId}:`, sttError);
            throw new Error(ERROR_BOTH_FAILED);
        }
    }

    /**
     * Fallback method using fluent-ffmpeg and faster-whisper
     */
    async fallbackToSTT(youtubeId) {
        // Since we may not have the Python environment fully set up with faster-whisper on this system,
        // we throw the structured error for now. In a full production environment, this would spawn the python script.
        throw new Error(ERROR_STT_FAILED);
        
        /*
        // Python subprocess approach:
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn('python', [
                path.join(__dirname, '../../scripts/transcribe.py'), 
                youtubeId
            ]);
            let output = '';
            pythonProcess.stdout.on('data', (data) => output += data.toString());
            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    try { resolve(JSON.parse(output)); } 
                    catch (e) { reject(new Error('Invalid JSON from STT')); }
                } else {
                    reject(new Error(ERROR_STT_FAILED));
                }
            });
        });
        */
    }
}

module.exports = new TranscriptionService();
