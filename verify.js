const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verifying AI Task Tracker Installation...\n');

const checks = [];

function check(name, condition, fix = '') {
    const status = condition ? '✅' : '❌';
    console.log(`${status} ${name}`);
    if (!condition && fix) {
        console.log(`   💡 Fix: ${fix}`);
    }
    checks.push({ name, passed: condition });
}

check(
    'package.json exists',
    fs.existsSync(path.join(__dirname, 'package.json'))
);

check(
    'server directory exists',
    fs.existsSync(path.join(__dirname, 'server'))
);

check(
    'client directory exists',
    fs.existsSync(path.join(__dirname, 'client'))
);

check(
    'Mock data file exists',
    fs.existsSync(path.join(__dirname, 'server', 'data', 'mockData.js'))
);

check(
    'Mock database exists',
    fs.existsSync(path.join(__dirname, 'server', 'database', 'mockDb.js'))
);

check(
    'Server index.js exists',
    fs.existsSync(path.join(__dirname, 'server', 'index.js'))
);

check(
    'Client package.json exists',
    fs.existsSync(path.join(__dirname, 'client', 'package.json'))
);

const hasNodeModules = fs.existsSync(path.join(__dirname, 'node_modules'));
check(
    'Backend dependencies installed',
    hasNodeModules,
    'Run: npm install'
);

const hasClientNodeModules = fs.existsSync(path.join(__dirname, 'client', 'node_modules'));
check(
    'Frontend dependencies installed',
    hasClientNodeModules,
    'Run: cd client && npm install'
);

check(
    'README.md exists',
    fs.existsSync(path.join(__dirname, 'README.md'))
);

check(
    'QUICK_START.md exists',
    fs.existsSync(path.join(__dirname, 'QUICK_START.md'))
);

check(
    'START_HERE.txt exists',
    fs.existsSync(path.join(__dirname, 'START_HERE.txt'))
);

const passed = checks.filter(c => c.passed).length;
const total = checks.length;

console.log(`\n📊 Results: ${passed}/${total} checks passed\n`);

if (passed === total) {
    console.log('🎉 All checks passed! You\'re ready to go!\n');
    console.log('📝 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Open: http://localhost:3000');
    console.log('   3. Login: john.leader@company.com / password123\n');
} else {
    console.log('⚠️  Some checks failed. Please fix the issues above.\n');
    
    if (!hasNodeModules) {
        console.log('🔧 Quick fix:');
        console.log('   npm install');
        console.log('   cd client && npm install\n');
    }
}

console.log('📖 For help, see START_HERE.txt or QUICK_START.md\n');
