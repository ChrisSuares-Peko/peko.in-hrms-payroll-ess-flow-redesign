import { readFileSync } from 'fs';

const KNOWN_DEV_ONLY_UNPATCHED = ['GHSA-vfj7-8cjw-p6xm'];

const file = process.argv[2];
let lines = [];
try {
    lines = readFileSync(file, 'utf8').split('\n');
} catch {
    console.log('No audit output to check.');
    process.exit(0);
}

let remaining = 0;
const allowed = new Set();
const unresolved = new Set();

for (const line of lines) {
    if (!line.trim()) continue;
    try {
        const entry = JSON.parse(line);
        if (entry.type !== 'auditAdvisory') continue;
        const adv = entry.data.advisory;
        if (adv.severity !== 'high' && adv.severity !== 'critical') continue;
        const ghsa = (adv.url || '').split('/').pop();
        if (KNOWN_DEV_ONLY_UNPATCHED.includes(ghsa)) {
            allowed.add(`${adv.module_name} (${ghsa})`);
        } else {
            remaining += 1;
            unresolved.add(`${adv.module_name} (${ghsa})`);
        }
    } catch {
        /* ignore non-JSON lines */
    }
}

if (allowed.size) {
    console.log(`Allowlisted (no upstream fix, dev-only): ${[...allowed].join(', ')}`);
}

if (remaining > 0) {
    console.error(`High/Critical vulnerabilities found: ${[...unresolved].join(', ')}`);
    process.exit(1);
}

console.log('No actionable High/Critical vulnerabilities.');
process.exit(0);
