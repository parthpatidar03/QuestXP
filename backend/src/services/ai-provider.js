const OpenAI = require('openai');

/**
 * Unified AI Provider using OpenAI.
 * Primary: GPT-4o-mini (Cost-effective and fast)
 */
class AIProvider {
    constructor() {
        this._client = null;
    }

    get openai() {
        if (!this._client) {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) {
                console.error('[AIProvider] CRITICAL: OPENAI_API_KEY is missing!');
                throw new Error('AI configuration missing: OPENAI_API_KEY is not set');
            }
            this._client = new OpenAI({ apiKey });
        }
        return this._client;
    }

    /**
     * Generate JSON response
     * @param {string} prompt 
     * @param {string} systemPrompt 
     */
    async generateJSON(prompt, systemPrompt) {
        try {
            console.log('[AIProvider] Attempting OpenAI JSON generation...');

            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1 // Lower temperature for more consistent JSON
            });

            const text = response.choices[0].message.content;
            return JSON.parse(this._sanitizeJSON(text));
        } catch (error) {
            console.error('[AIProvider] OpenAI JSON failed:', error.message);
            throw error;
        }
    }

    /**
     * Generate text/chat response
     */
    async generateChat(prompt, systemPrompt, history = []) {
        try {
            console.log('[AIProvider] Attempting OpenAI Chat generation...');
            
            const messages = [
                { role: 'system', content: systemPrompt },
                ...history.slice(-10).map(msg => ({
                    role: msg.role === 'bot' || msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content || msg.text
                })),
                { role: 'user', content: prompt }
            ];

            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: messages,
                temperature: 0.7
            });

            return response.choices[0].message.content.trim();
        } catch (error) {
            console.error('[AIProvider] OpenAI Chat failed:', error.message);
            throw error;
        }
    }

    /**
     * Generates a single embedding for a string.
     */
    async generateEmbedding(text) {
        try {
            const response = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text,
            });
            return response.data[0].embedding;
        } catch (error) {
            console.error('[AIProvider] OpenAI Embedding failed:', error.message);
            throw error;
        }
    }

    /**
     * Generates embeddings for a batch of strings.
     */
    async generateBatchEmbeddings(texts) {
        try {
            const response = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: texts,
            });
            return response.data.map(item => item.embedding);
        } catch (error) {
            console.error('[AIProvider] OpenAI Batch Embedding failed:', error.message);
            throw error;
        }
    }

    _sanitizeJSON(text) {
        // Remove potential markdown wrappers
        return text.replace(/```json/g, '').replace(/```/g, '').trim();
    }
}

module.exports = new AIProvider();

