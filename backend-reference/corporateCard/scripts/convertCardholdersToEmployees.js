'use strict'

const Sequelize = require('sequelize')

const CARDS_DB = {
    host: 'localhost',
    port: 3306,
    database: 'peko_in_local',
    username: 'root',
    password: 'REDACTED',
    ssl: true,
}

const SHARED_DB = {
    host: 'localhost',
    port: 3306,
    database: 'corporate-cards',
    username: 'root',
    password: 'REDACTED',
    ssl: true,
}

const CARD_SERVICE_LABEL = 'Corporate Cards'
const CARD_TABLES = [
    'cardIssuances',
    'cardRequests',
    'cardholderKyc',
    'cardTransactions',
    'cardReceipts',
    'cardAuditLogs',
]

const USAGE = `
Converts Corporate Cards sub-corporate cardholders into employee identities.

  node scripts/convertCardholdersToEmployees.js --dry-run
  node scripts/convertCardholdersToEmployees.js --apply
  node scripts/convertCardholdersToEmployees.js --verify

  --dry-run   (default) Reports who would convert, who is blocked, and the row counts
              carried per person. Writes nothing.
  --apply     Creates the employee rows, flips the credentials, backfills the card
              tables, then runs --verify. Idempotent: safe to re-run after a failure.
  --verify    Runs the gate checks alone.

Does NOT drop subCorporateId. That is step 10 of
docs/corporate-cards-cardholder-rekey-production-runbook.md and stays a manual decision
taken after --verify is clean.

Fill CARDS_DB and SHARED_DB at the top of this file before running. They are two separate
servers, so both need host, database, username and password.

Do not commit the file with real credentials in it.
`

const connect = (config, label) => {
    const missing = ['host', 'database', 'username'].filter((key) => !config[key])
    if (missing.length) {
        throw new Error(`${label} is not configured — set ${missing.join(', ')} at the top of this script`)
    }
    return new Sequelize(config.database, config.username, config.password, {
        host: config.host,
        port: config.port || 3306,
        dialect: 'mysql',
        logging: false,
        timezone: '+05:30',
        dialectOptions: {
            charset: 'utf8mb4',
            ...(config.ssl ? { ssl: { require: true, rejectUnauthorized: false } } : {}),
        },
    })
}

const select = async (db, sql, replacements = {}) =>
    db.query(sql, { replacements, type: Sequelize.QueryTypes.SELECT })

const columnExists = async (db, table, column) => {
    const [row] = await select(
        db,
        `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
        { table, column }
    )
    return Number(row.n) > 0
}

const cardholderIds = async (cards) => {
    const unions = CARD_TABLES.map(
        (t) => `SELECT DISTINCT subCorporateId FROM \`${t}\` WHERE subCorporateId IS NOT NULL`
    ).join(' UNION ')
    const rows = await select(cards, `${unions} ORDER BY subCorporateId`)
    return rows.map((r) => String(r.subCorporateId))
}

const rowCounts = async (cards, column, id) => {
    const counts = {}
    for (const table of CARD_TABLES) {
        const [row] = await select(
            cards,
            `SELECT COUNT(*) AS n FROM \`${table}\` WHERE \`${column}\` = :id`,
            { id }
        )
        counts[table] = Number(row.n)
    }
    return counts
}

const loadMembers = async (shared, ids) => {
    if (!ids.length) return []
    return select(
        shared,
        `SELECT s.id                AS subCorporateId,
                s.name, s.email, s.mobileNo, s.role, s.status, s.isDeleted,
                s.credentialId,
                cu.id               AS corporateUserId,
                cu.credentialId     AS corporateCredentialId,
                c.username          AS loginUsername,
                c.role              AS credentialRole,
                (s.credentialId <=> cu.credentialId)            AS isAccountOwner,
                JSON_LENGTH(COALESCE(s.services, JSON_ARRAY())) AS serviceCount
           FROM subCorporateUsers s
           JOIN credentials    c  ON c.id = s.credentialId
           JOIN corporateUsers cu ON cu.credentialId = s.corporateCredentialID
          WHERE s.id IN (:ids)
          ORDER BY cu.id, s.id`,
        { ids }
    )
}

const existingUserRow = async (shared, credentialId) => {
    const [row] = await select(
        shared,
        `SELECT id, userAccessService FROM users WHERE credentialId = :credentialId LIMIT 1`,
        { credentialId }
    )
    return row || null
}

const holdsCardService = (userAccessService) => {
    if (!userAccessService) return false
    const parsed = typeof userAccessService === 'string'
        ? JSON.parse(userAccessService)
        : userAccessService
    return (parsed?.permission || []).some(
        (entry) => String(entry?.label || '').trim().toLowerCase() === CARD_SERVICE_LABEL.toLowerCase()
    )
}

const cardMembership = (member) => ({
    label: CARD_SERVICE_LABEL,
    hasAccess: true,
    role: String(member.role || '').trim() === 'Admin' ? 'Admin' : 'Employee',
    status: member.status || 'ACTIVE',
    ref: null,
})

const classify = (members, foundIds, requestedIds) => {
    const plan = { convert: [], blockedMultiService: [], owners: [], orphans: [] }
    plan.orphans = requestedIds.filter((id) => !foundIds.has(id))
    members.forEach((m) => {
        if (Number(m.isAccountOwner) === 1) plan.owners.push(m)
        else if (Number(m.serviceCount) > 1) plan.blockedMultiService.push(m)
        else plan.convert.push(m)
    })
    return plan
}

const report = (plan, counts) => {
    console.log(`\n  To convert:            ${plan.convert.length}`)
    console.log(`  Account owners (skip): ${plan.owners.length}`)
    console.log(`  Blocked, multi-service:${plan.blockedMultiService.length}`)
    console.log(`  Orphaned card data:    ${plan.orphans.length}\n`)

    plan.convert.forEach((m) => {
        const c = counts[m.subCorporateId]
        console.log(
            `  sub ${String(m.subCorporateId).padEnd(6)} ${String(m.name || '').padEnd(24)}`
            + ` cred ${String(m.credentialId).padEnd(6)} corp ${String(m.corporateUserId).padEnd(5)}`
            + ` ${m.role || '-'}/${m.status || '-'}${Number(m.isDeleted) === 1 ? '/deleted' : ''}`
        )
        console.log(
            `           cards ${c.cardIssuances}  requests ${c.cardRequests}`
            + `  txns ${c.cardTransactions}  receipts ${c.cardReceipts}`
            + `  audit ${c.cardAuditLogs}  kyc ${c.cardholderKyc}`
        )
    })

    plan.blockedMultiService.forEach((m) => {
        console.log(`  BLOCKED sub ${m.subCorporateId} ${m.name} holds ${m.serviceCount} services`)
    })
    plan.orphans.forEach((id) => {
        console.log(`  ORPHAN  sub ${id} has card rows but no subCorporateUsers row`)
    })
}

const createEmployee = async (shared, member) => {
    const existing = await existingUserRow(shared, member.credentialId)
    if (existing) {
        if (!holdsCardService(existing.userAccessService)) {
            await shared.query(
                `UPDATE users
                    SET userAccessService = JSON_SET(
                            COALESCE(userAccessService, JSON_OBJECT('permission', JSON_ARRAY())),
                            '$.permission',
                            JSON_ARRAY_APPEND(
                                COALESCE(JSON_EXTRACT(userAccessService, '$.permission'), JSON_ARRAY()),
                                '$', CAST(:membership AS JSON)))
                  WHERE id = :id`,
                {
                    replacements: { id: existing.id, membership: JSON.stringify(cardMembership(member)) },
                    type: Sequelize.QueryTypes.UPDATE,
                }
            )
            return { userId: String(existing.id), action: 'membership appended' }
        }
        return { userId: String(existing.id), action: 'already converted' }
    }

    await shared.query(
        `INSERT INTO users (name, email, mobileNo, corporateUserId, credentialId, employeeId,
                            userAccessService, isActive, isDeleted, createdAt, updatedAt)
         VALUES (:name, :email, :mobileNo, :corporateUserId, :credentialId, NULL,
                 CAST(:access AS JSON), 1, :isDeleted, NOW(), NOW())`,
        {
            replacements: {
                name: member.name,
                email: member.email,
                mobileNo: member.mobileNo,
                corporateUserId: member.corporateUserId,
                credentialId: member.credentialId,
                isDeleted: Number(member.isDeleted) === 1 ? 1 : 0,
                access: JSON.stringify({ permission: [cardMembership(member)] }),
            },
            type: Sequelize.QueryTypes.INSERT,
        }
    )
    const created = await existingUserRow(shared, member.credentialId)
    return { userId: String(created.id), action: 'created' }
}

const flipCredential = async (shared, member) => {
    if (Number(member.isDeleted) === 1) return 'skipped (deleted)'
    if (member.credentialRole === 'USER') return 'already USER'
    await shared.query(`UPDATE credentials SET role = 'USER' WHERE id = :id`, {
        replacements: { id: member.credentialId },
        type: Sequelize.QueryTypes.UPDATE,
    })
    return 'flipped to USER'
}

const backfill = async (cards, subCorporateId, userId, corporateId) => {
    const moved = {}
    for (const table of CARD_TABLES) {
        const [, affected] = await cards.query(
            `UPDATE \`${table}\` SET userId = :userId WHERE subCorporateId = :subCorporateId`,
            {
                replacements: { userId, subCorporateId },
                type: Sequelize.QueryTypes.UPDATE,
            }
        )
        moved[table] = affected
    }
    await cards.query(
        `UPDATE cardholderKyc SET corporateId = :corporateId
          WHERE userId = :userId AND corporateId IS NULL`,
        { replacements: { userId, corporateId }, type: Sequelize.QueryTypes.UPDATE }
    )
    return moved
}

const verify = async (cards, shared) => {
    let clean = true

    for (const table of CARD_TABLES) {
        const [row] = await select(
            cards,
            `SELECT COUNT(*) AS n FROM \`${table}\` WHERE subCorporateId IS NOT NULL AND userId IS NULL`
        )
        if (Number(row.n) > 0) {
            clean = false
            console.log(`  FAIL  ${table}: ${row.n} row(s) still have no userId`)
        }
    }

    const collisions = await select(
        cards,
        `SELECT userId, COUNT(DISTINCT subCorporateId) AS n FROM cardIssuances
          WHERE userId IS NOT NULL GROUP BY userId HAVING n > 1`
    )
    if (collisions.length) {
        clean = false
        collisions.forEach((c) => console.log(`  FAIL  userId ${c.userId} claimed by ${c.n} members`))
    }

    const dupes = await select(
        shared,
        `SELECT credentialId, COUNT(*) AS n FROM users GROUP BY credentialId HAVING n > 1`
    )
    if (dupes.length) {
        clean = false
        dupes.forEach((d) => console.log(`  FAIL  credential ${d.credentialId} has ${d.n} users rows`))
    }

    const pairs = await select(
        cards,
        `SELECT DISTINCT subCorporateId, userId FROM cardIssuances
          WHERE userId IS NOT NULL AND subCorporateId IS NOT NULL`
    )
    for (const pair of pairs) {
        const [was] = await select(
            shared,
            `SELECT name, mobileNo FROM subCorporateUsers WHERE id = :id`,
            { id: pair.subCorporateId }
        )
        const [now] = await select(shared, `SELECT name, mobileNo FROM users WHERE id = :id`, {
            id: pair.userId,
        })
        const same = was && now
            && String(was.name || '').trim() === String(now.name || '').trim()
            && String(was.mobileNo || '').trim() === String(now.mobileNo || '').trim()
        if (!same) {
            clean = false
            console.log(
                `  FAIL  sub ${pair.subCorporateId} (${was?.name}/${was?.mobileNo})`
                + ` mapped to user ${pair.userId} (${now?.name}/${now?.mobileNo})`
            )
        }
    }

    console.log(clean ? '\n  VERIFY CLEAN\n' : '\n  VERIFY FAILED — do not drop subCorporateId\n')
    return clean
}

const main = async () => {
    const args = process.argv.slice(2)
    if (args.includes('--help') || args.includes('-h')) {
        console.log(USAGE)
        return 0
    }
    const apply = args.includes('--apply')
    const verifyOnly = args.includes('--verify')

    const cards = connect(CARDS_DB, 'CARDS_DB')
    const shared = connect(SHARED_DB, 'SHARED_DB')
    await cards.authenticate()
    await shared.authenticate()
    console.log(`\n  cards  : ${cards.config.database} @ ${cards.config.host}`)
    console.log(`  shared : ${shared.config.database} @ ${shared.config.host}`)

    try {
        if (verifyOnly) return (await verify(cards, shared)) ? 0 : 1

        for (const table of CARD_TABLES) {
            if (!(await columnExists(cards, table, 'userId'))) {
                console.log(`\n  ${table} has no userId column — run step 8 of the runbook first.\n`)
                return 1
            }
            if (!(await columnExists(cards, table, 'subCorporateId'))) {
                console.log(`\n  ${table} has no subCorporateId — already contracted, nothing to map.\n`)
                return 1
            }
        }

        const ids = await cardholderIds(cards)
        if (!ids.length) {
            console.log('\n  No card rows carry a subCorporateId. Nothing to convert.\n')
            return 0
        }

        const members = await loadMembers(shared, ids)
        const found = new Set(members.map((m) => String(m.subCorporateId)))
        const plan = classify(members, found, ids)

        const counts = {}
        for (const m of plan.convert) {
            counts[m.subCorporateId] = await rowCounts(cards, 'subCorporateId', m.subCorporateId)
        }
        report(plan, counts)

        if (plan.blockedMultiService.length || plan.orphans.length) {
            console.log('  Refusing to write while members are blocked or card data is orphaned.')
            console.log('  Resolve them (runbook 4.3 and 4.4), then re-run.\n')
            return 1
        }

        if (!apply) {
            console.log('  Dry run. Nothing written. Re-run with --apply.\n')
            return 0
        }

        for (const m of plan.convert) {
            const { userId, action } = await createEmployee(shared, m)
            const credential = await flipCredential(shared, m)
            const moved = await backfill(cards, String(m.subCorporateId), userId, m.corporateUserId)
            const total = Object.values(moved).reduce((a, b) => a + b, 0)
            console.log(
                `  sub ${m.subCorporateId} -> user ${userId}  (${action}, ${credential},`
                + ` ${total} card row(s) re-keyed)`
            )
        }

        console.log('')
        return (await verify(cards, shared)) ? 0 : 1
    } finally {
        await cards.close()
        await shared.close()
    }
}

main()
    .then((code) => process.exit(code))
    .catch((error) => {
        console.error(`\n  ${error.message}\n`)
        process.exit(1)
    })
