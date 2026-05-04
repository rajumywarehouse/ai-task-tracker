const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment files...\n');

const clientEnvPath = path.join(__dirname, 'client', '.env');
const clientEnvContent = 'REACT_APP_API_URL=http://localhost:5000/api\n';

if (!fs.existsSync(clientEnvPath)) {
    fs.writeFileSync(clientEnvPath, clientEnvContent);
    console.log('✓ Created client/.env');
} else {
    console.log('✓ client/.env already exists');
}

console.log('\n✅ Setup complete! Starting application...\n');
