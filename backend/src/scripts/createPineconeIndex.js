const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

async function setupIndex() {
    try {
        if (!process.env.PINECONE_API_KEY) {
            console.error('Error: PINECONE_API_KEY is missing from .env');
            process.exit(1);
        }

        const pc = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });

        const indexName = process.env.PINECONE_INDEX_NAME || 'questxp';

        const existingIndexes = await pc.listIndexes();
        const indexExists = existingIndexes.indexes?.some(idx => idx.name === indexName);

        if (indexExists) {
            console.log(`Pinecone index '${indexName}' already exists. Setup complete.`);
            return;
        }

        console.log(`Creating Pinecone index '${indexName}'... This might take a few minutes.`);
        await pc.createIndex({
            name: indexName,
            dimension: 1536, // For text-embedding-3-small
            metric: 'cosine',
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-east-1' // Adjust region as needed
                }
            }
        });
        console.log(`Index '${indexName}' created successfully.`);

    } catch (error) {
        console.error('Failed to setup Pinecone index:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    setupIndex();
}

module.exports = setupIndex;
