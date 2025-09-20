#!/usr/bin/env node

/**
 * Quick setup script runner
 * Usage: node blockchain/scripts/run-setup.js
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Running blockchain setup check...\n');

try {
    execSync('node setup-blockchain.js', { 
        cwd: __dirname,
        stdio: 'inherit' 
    });
} catch (error) {
    console.error('❌ Setup check failed:', error.message);
    process.exit(1);
}
