require('dotenv').config();
const aiProvider = require('./src/services/ai-provider');

async function test() {
    const key = process.env.OPENAI_API_KEY;
    console.log(`Key length: ${key?.length}`);
    console.log(`Key start: ${key?.substring(0, 10)}`);
    console.log(`Key end: ${key?.substring(key.length - 5)}`);
    try {
        // console.log('Testing Chat...');
        // const chat = await aiProvider.generateChat('Hello', 'You are a bot');
        // console.log('Chat Response:', chat);

        console.log('Testing Embedding...');
        const embed = await aiProvider.generateEmbedding('Hello');
        console.log('Embedding length:', embed.length);

        console.log('SUCCESS');
        process.exit(0);
    } catch (err) {
        console.error('TEST FAILED:', err);
        process.exit(1);
    }
}

test();
