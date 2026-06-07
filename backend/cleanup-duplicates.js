require('dotenv').config();
const { ConvexClient } = require('./utils/convexClient');

const KEEP_ROLES = ['admin'];
const TEST_EMAIL_PATTERNS = [/^test_/, /@example\.com$/, /test/i];

(async () => {
    const client = new ConvexClient(process.env.CONVEX_URL, process.env.CONVEX_ADMIN_KEY);

    const allUsers = await client.getUsers({});
    const users = allUsers.data || [];
    console.log(`Found ${users.length} users in Convex`);

    const byEmail = new Map();
    for (const u of users) {
        if (!byEmail.has(u.email)) byEmail.set(u.email, []);
        byEmail.get(u.email).push(u);
    }

    let deleted = 0;
    let kept = 0;

    for (const [email, group] of byEmail) {
        if (group.length === 1) {
            kept++;
            continue;
        }

        console.log(`\nDUPLICATE: ${email} has ${group.length} rows`);
        group.forEach((u, i) => console.log(`  [${i}] _id=${u._id} role=${u.role} name=${u.name}`));

        const adminRow = group.find(u => u.role === 'admin');
        const survivors = new Set();
        if (adminRow) survivors.add(adminRow._id);

        const isTestEmail = TEST_EMAIL_PATTERNS.some(p => p.test(email));
        if (isTestEmail) {
            const newest = [...group].sort((a, b) => (b._creationTime || 0) - (a._creationTime || 0))[0];
            survivors.add(newest._id);
        }

        for (const u of group) {
            if (survivors.has(u._id)) {
                console.log(`  KEEP: ${u._id} (${u.role})`);
                kept++;
            } else {
                console.log(`  DELETE: ${u._id} (${u.role})`);
                await client.deleteUser(u._id);
                deleted++;
            }
        }
    }

    console.log(`\nDone. Kept ${kept} user(s), deleted ${deleted} duplicate(s).`);

    const after = await client.getUsers({});
    console.log(`\nRemaining users: ${(after.data || []).length}`);
    for (const u of after.data || []) {
        console.log(`  ${u.email} | role=${u.role} | name=${u.name} | _id=${u._id}`);
    }
})().catch(e => { console.error('ERROR:', e.message || e); process.exit(1); });
