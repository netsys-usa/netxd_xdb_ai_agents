#Install dependencies

npm install @langchain/core @langchain/openai axios dotenv express langchain zod --silent
npm install --save-dev @types/express @types/node ts-node typescript --silent


# Create .env file
XDB_BASE_URL=http://localhost:5000
XDB_API_KEY=your_api_key_here
XDB_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----
your_private_key_here
-----END EC PRIVATE KEY-----"
OPENAI_API_KEY=your_openai_key_here


# Run check-env.js to check the dependencies
node check-env.js


# Option 1: Direct Commands
npm run dev:interactive
npm run dev:demo
npm run check

# Option 2: Direct Commands
npx ts-node index.js interactive
