const KNOWN_DEV_ONLY_UNPATCHED = ['GHSA-vfj7-8cjw-p6xm'];

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
    let audit;
    try {
        audit = JSON.parse(raw);
    } catch {
        console.log('No audit JSON to check.');
        process.exit(0);
    }

    const allowed = new Set();
    const unresolved = new Set();

    for (const vuln of Object.values(audit.vulnerabilities || {})) {
        for (const via of vuln.via || []) {
            if (typeof via !== 'object') continue;
            if (via.severity !== 'high' && via.severity !== 'critical') continue;
            const ghsa = (via.url || '').split('/').pop();
            if (KNOWN_DEV_ONLY_UNPATCHED.includes(ghsa)) {
                allowed.add(`${via.name} (${ghsa})`);
            } else {
                unresolved.add(`${via.name} (${ghsa})`);
            }
        }
    }

    if (allowed.size) {
        console.log(`Allowlisted (no upstream fix, dev-only): ${[...allowed].join(', ')}`);
    }
    if (unresolved.size) {
        console.error(`High/Critical vulnerabilities found: ${[...unresolved].join(', ')}`);
        process.exit(1);
    }
    console.log('No actionable High/Critical vulnerabilities.');
    process.exit(0);
});
