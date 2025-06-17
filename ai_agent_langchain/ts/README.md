### Install dependencies

npm install @langchain/core @langchain/openai axios dotenv express langchain zod --silent
npm install --save-dev @types/express @types/node ts-node typescript --silent


### 1. Set Environment Variables

```bash
export XDB_BASE_URL="http://localhost:5000"
export XDB_API_KEY="your-xdb-api-key"
export XDB_PRIVATE_KEY_PATH="/path/to/private-key.pem"
export OPENAI_API_KEY="your-openai-api-key"
```


### Run check-env.js to check the dependencies
```bash
node check-env.js
```


### Option 1: Direct Commands
```bash
npm run dev:interactive
npm run dev:demo
npm run check
```

### Option 2: Direct Commands
```bash
npx ts-node index.js interactive
```
