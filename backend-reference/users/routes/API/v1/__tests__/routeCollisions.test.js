const fs = require('fs')
const path = require('path')

const V1 = path.join(__dirname, '..')

const read = (file) => fs.readFileSync(path.join(V1, file), 'utf8')

/**
 * `login.js`, `register.js` and `forgot-password.js` are all mounted at "/" — and BEFORE every other router in
 * index.js. Express matches in registration order, so any path they define wins outright over a later
 * `router.use("/<same-path>", ...)`, which is then dead code that answers with the WRONG handler rather than a
 * 404 anyone would notice.
 *
 * That is not hypothetical: the corporate-cards Admin/Employee mode switch was first mounted at
 * "/switch-role", which login.js already owns for the corporate <-> ESS-employee IDENTITY switch. The GET
 * worked (login.js has no GET there) while the POST was silently answered by the identity switcher, which
 * rejected the payload with "You do not have access to this identity".
 */
const ROOT_MOUNTED = ['login.js', 'register.js', 'forgot-password.js', 'idp.js', 'oauth.js']

// `router.get("/x"` / `router.post('/x'` → 'x'
const declaredPaths = (source) =>
    [...source.matchAll(/router\.(?:get|post|put|patch|delete)\(\s*["'`]\/([^"'`/?]+)/g)].map((m) => m[1])

// `router.use("/x", require(...))` → 'x'
const mountedPrefixes = (source) =>
    [...source.matchAll(/router\.use\(\s*["'`]\/([^"'`/?]+)["'`]\s*,/g)].map((m) => m[1])

describe('v1 route mounts', () => {
    const rootPaths = new Set(ROOT_MOUNTED.flatMap((f) => declaredPaths(read(f))))
    const prefixes = mountedPrefixes(read('index.js'))

    it('reads a non-trivial number of paths from each side (guards the regexes themselves)', () => {
        expect(rootPaths.size).toBeGreaterThan(5)
        expect(prefixes.length).toBeGreaterThan(5)
    })

    // The one that matters: a sub-router mounted on a prefix an earlier "/"-mounted file already defines is
    // unreachable for that method, and the caller gets a confusing answer from the wrong feature.
    it.each([['switch-role'], ['available-roles']])(
        'still treats %s as taken by a root-mounted router',
        (taken) => {
            expect(rootPaths.has(taken)).toBe(true)
        }
    )

    it('mounts no sub-router on a prefix a root-mounted router already owns', () => {
        const clashes = prefixes.filter((p) => rootPaths.has(p))

        expect(clashes).toEqual([])
    })

    it('mounts the corporate-cards mode switch somewhere of its own', () => {
        expect(prefixes).toContain('active-role')
        expect(prefixes).not.toContain('switch-role')
    })
})
