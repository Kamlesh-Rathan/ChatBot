import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Checking backend setup...\n');

// Check Node version
const nodeVersion = process.version;
console.log(`✅ Node.js version: ${nodeVersion}`);

// Check API keys
const apiKeys = process.env.OPENROUTER_API_KEYS
    ? process.env.OPENROUTER_API_KEYS.split(',')
    : (process.env.OPENROUTER_API_KEY ? [process.env.OPENROUTER_API_KEY] : []);

if (apiKeys.length === 0) {
    console.log('❌ No API keys found in .env file');
    console.log('   Please add OPENROUTER_API_KEYS to your .env file\n');
    process.exit(1);
}

console.log(`✅ Found ${apiKeys.length} API key(s)`);
apiKeys.forEach((key, i) => {
    const preview = key ? `...${key.slice(-4)}` : 'invalid';
    console.log(`   Key ${i + 1}: ${preview}`);
});

// Check port
const port = process.env.PORT || 3001;
console.log(`✅ Port configured: ${port}`);

console.log('\n✨ Backend setup looks good! Run "npm start" to start the server.\n');
