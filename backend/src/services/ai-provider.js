const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Unified AI Provider with fallback logic.
 * Primary: Gemini 1.5 Flash
 * Secondary: OpenRouter (Llama 3.1 70B Free)
 */
class AIProvider {
    constructor() {
        this.geminiModel = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            generationConfig: {
                responseMimeType: "application/json",
            }
        });
        
        this.openRouterKey = process.env.OPENROUTER_API_KEY;
    }

    /**
     * Generate JSON response with fallback
     * @param {string} prompt 
     * @param {string} systemPrompt 
     */
    async generateJSON(prompt, systemPrompt) {
        try {
            // 1. Primary: Gemini
            console.log('[AIProvider] Attempting Gemini JSON generation...');
            
            // Manual injection for max compatibility across SDK versions
            const model = genAI.getGenerativeModel({ 
                model: 'gemini-1.5-flash',
                generationConfig: {
                    responseMimeType: "application/json",
                }
            });

            const combinedPrompt = `INSTRUCTIONS:\n${systemPrompt}\n\nINPUT:\n${prompt}\n\nReturn ONLY a valid JSON object.`;
            const result = await model.generateContent(combinedPrompt);
            const response = await result.response;
            const text = response.text();
            return JSON.parse(this._sanitizeJSON(text));
        } catch (error) {
            console.warn('[AIProvider] Gemini JSON failed, falling back to OpenRouter:', error.message);
            
            // 2. Fallback: OpenRouter
            return await this._generateOpenRouter(prompt, systemPrompt, true);
        }
    }

    /**
     * Generate text/chat response with fallback
     */
    async generateChat(prompt, systemPrompt, history = []) {
        try {
            // 1. Primary: Gemini
            console.log('[AIProvider] Attempting Gemini Chat generation...');
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            // Inject system prompt as the first message in history if history is empty
            // or prepend it to the current prompt for simplicity and compatibility
            const geminiHistory = history.slice(-10).map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            // Prepend system prompt to the current message if it's not already in history
            const finalPrompt = `[SYSTEM INSTRUCTIONS: ${systemPrompt}]\n\nUser Question: ${prompt}`;

            const chat = model.startChat({
                history: geminiHistory
            });

            const result = await chat.sendMessage(finalPrompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.warn('[AIProvider] Gemini Chat failed, falling back to OpenRouter:', error.message);
            
            // 2. Fallback: OpenRouter
            return await this._generateOpenRouter(prompt, systemPrompt, false, history);
        }
    }

    async _generateOpenRouter(prompt, systemPrompt, isJson, history = []) {
        if (!this.openRouterKey) {
            throw new Error('OpenRouter API Key missing for fallback');
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: prompt }
        ];

        try {
            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: 'meta-llama/llama-3.2-3b-instruct:free', // Using 3.2 3B Free (more stable endpoint)
                messages: messages,
                response_format: isJson ? { type: 'json_object' } : undefined,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openRouterKey}`,
                    'HTTP-Referer': 'https://questxp.vercel.app',
                    'X-Title': 'QuestXP',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.data.choices || response.data.choices.length === 0) {
                throw new Error('OpenRouter returned no choices');
            }

            const content = response.data.choices[0].message.content;
            return isJson ? JSON.parse(this._sanitizeJSON(content)) : content;
        } catch (error) {
            console.error('[AIProvider] OpenRouter Fallback also failed:', error.response?.data || error.message);
            throw new Error('All AI providers failed');
        }
    }

    _sanitizeJSON(text) {
        // Remove potential markdown wrappers
        return text.replace(/```json/g, '').replace(/```/g, '').trim();
    }
}

module.exports = new AIProvider();
