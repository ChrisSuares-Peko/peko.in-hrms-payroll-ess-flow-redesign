/**
 * Scoped TypeScript check for pre-commit (lint-staged).
 *
 * Instead of running `tsc --noEmit` over the whole project on every commit,
 * this type-checks only the staged .ts/.tsx files plus everything they import
 * (their transitive dependencies). It catches the cases we care about at commit
 * time: undefined variables (TS2304), invalid/missing named imports (TS2305),
 * unresolved module paths, and type errors inside the touched files.
 *
 * It works by generating a temporary tsconfig that EXTENDS the project config
 * (so compilerOptions, path aliases and `types` are preserved) and declares its
 * own `include`. Declaring `include` is required: without it the temp config
 * inherits the base config's broad include (`**\/*.ts`) and ends up checking the
 * whole project again. We include `src/**\/*.d.ts` so ambient `declare module`
 * declarations (react-lottie, react-reveal, etc.) still resolve.
 *
 * NOTE ON SCOPE: this checks the staged files and the files THEY import. It does
 * not check files that import the staged files (reverse dependencies). Changing
 * a shared signature can still break a non-staged caller — keep a full
 * `tsc --noEmit` in CI / pre-push as the safety net for that case.
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();

const toRelative = (file) => relative(projectRoot, resolve(file)).split('\\').join('/');

const stagedFiles = process.argv
    .slice(2)
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .map(toRelative);

if (stagedFiles.length === 0) {
    process.exit(0);
}

const tempConfigPath = resolve(projectRoot, `tsconfig.staged.${process.pid}.json`);

const tempConfig = {
    extends: './tsconfig.json',
    compilerOptions: {
        noEmit: true,
        skipLibCheck: true,
    },
    // vitest.setup.ts's `import '@testing-library/jest-dom'` is what ambiently augments
    // `expect(...)` with matchers like `toBeInTheDocument` — without it here, any staged
    // test file using those matchers fails with a false-positive TS2339.
    files: [...stagedFiles, 'vitest.setup.ts'],
    // Must be set so we don't inherit the base config's project-wide include.
    // The glob keeps ambient `declare module` declarations available.
    include: ['src/**/*.d.ts'],
};

writeFileSync(tempConfigPath, JSON.stringify(tempConfig, null, 2));

let exitCode = 1;
try {
    // Runs the project's `yarn tsc` against the scoped temp config (changed
    // files + their imports), so the same TypeScript compiler check the team
    // uses runs on every commit — just scoped instead of project-wide.
    const result = spawnSync('yarn', ['tsc', '--noEmit', '-p', tempConfigPath], {
        stdio: 'inherit',
        shell: process.platform === 'win32',
    });
    exitCode = result.status ?? 1;
} finally {
    // Clean up here (not after process.exit, which would skip the finally block).
    rmSync(tempConfigPath, { force: true });
}

process.exit(exitCode);
