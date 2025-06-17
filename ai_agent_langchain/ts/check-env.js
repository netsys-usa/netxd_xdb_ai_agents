// check-env.js
// Quick environment verification script

require('dotenv').config();

console.log('🔧 XDB AI Agent Environment Check');
console.log('=' .repeat(40));

const checks = [
  {
    name: 'XDB_BASE_URL',
    value: process.env.XDB_BASE_URL,
    required: false,
    default: 'http://localhost:5000'
  },
  {
    name: 'XDB_API_KEY',
    value: process.env.XDB_API_KEY,
    required: false,
    default: 'Using default test key'
  },
  {
    name: 'XDB_PRIVATE_KEY',
    value: process.env.XDB_PRIVATE_KEY,
    required: false,
    default: 'Using default test key'
  },
  {
    name: 'OPENAI_API_KEY',
    value: process.env.OPENAI_API_KEY,
    required: true,
    default: null
  }
];

let allGood = true;

checks.forEach(check => {
  const isSet = check.value && check.value.trim() !== '' && check.value !== 'your_actual_openai_key_here';
  const status = isSet ? '✅' : (check.required ? '❌' : '⚠️ ');
  
  console.log(`${status} ${check.name}: ${isSet ? 'Set' : 'Not set'}`);
  
  if (!isSet && check.default) {
    console.log(`   Using: ${check.default}`);
  }
  
  if (!isSet && check.required) {
    allGood = false;
    console.log(`   ❗ This is required! Please set it in your .env file.`);
  }
});

console.log('\n' + '=' .repeat(40));

if (allGood) {
  console.log('✅ Environment setup looks good!');
  console.log('\n🚀 You can now run:');
  console.log('   npm run dev:demo        # Run automated demo');
  console.log('   npm run dev:interactive # Start interactive chat');
} else {
  console.log('❌ Environment setup needs attention!');
  console.log('\n🔧 Please fix the issues above:');
  console.log('1. Edit your .env file');
  console.log('2. Add your actual OpenAI API key:');
  console.log('   OPENAI_API_KEY=sk-your_actual_key_here');
  console.log('3. Run this check again: node check-env.js');
}

console.log('\n📁 Files in current directory:');
const fs = require('fs');
const files = fs.readdirSync('.').filter(f => !f.startsWith('.') && !f.includes('node_modules'));
files.forEach(file => {
  const isRequired = ['index.ts', 'package.json', '.env'].includes(file);
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}${isRequired ? ' (required)' : ''}`);
});

// Check if dependencies are installed
console.log('\n📦 Dependencies check:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['@langchain/openai', 'langchain', 'zod', 'axios', 'dotenv'];
  
  if (fs.existsSync('node_modules')) {
    console.log('✅ node_modules exists');
    
    requiredDeps.forEach(dep => {
      try {
        require.resolve(dep);
        console.log(`   ✅ ${dep}`);
      } catch (e) {
        console.log(`   ❌ ${dep} - run: npm install ${dep}`);
      }
    });
  } else {
    console.log('❌ node_modules not found - run: npm install');
  }
} catch (e) {
  console.log('❌ package.json not found or invalid');
}