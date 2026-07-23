const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '../public/version.json');

const versionData = {
  version: "1.0.0",
  buildTime: Date.now(),
  timestamp: new Date().toISOString()
};

try {
  fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2), 'utf8');
  console.log('Successfully generated public/version.json:', versionData.timestamp);
} catch (err) {
  console.error('Failed to generate version.json:', err);
}
