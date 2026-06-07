require('dotenv').config();
const bcrypt = require('bcryptjs');
const { ConvexClient } = require('./utils/convexClient');

(async () => {
    const client = new ConvexClient(process.env.CONVEX_URL, process.env.CONVEX_ADMIN_KEY);

    const allUsers = await client.getUsers({});
    console.log('--- All users in Convex ---');
    for (const u of allUsers.data || []) {
        console.log(`  _id: ${u._id}`);
        console.log(`  email: ${u.email}`);
        console.log(`  name: ${u.name}`);
        console.log(`  role: ${u.role}`);
        console.log(`  password (first 30 chars): ${String(u.password || '').slice(0, 30)}`);
        console.log(`  password (length): ${String(u.password || '').length}`);
        console.log(`  password looks like bcrypt?: ${/^\$2[aby]\$\d{2}\$/.test(String(u.password || ''))}`);

        const test1 = await bcrypt.compare('admin123', u.password || '');
        const test2 = await bcrypt.compare('password', u.password || '');
        const test3 = await bcrypt.compare('admin', u.password || '');
        console.log(`  bcrypt('admin123'):  ${test1}`);
        console.log(`  bcrypt('password'):  ${test2}`);
        console.log(`  bcrypt('admin'):     ${test3}`);
        console.log('');
    }

    console.log('--- Lookup by getUserByEmail("admin@phoenix.com") ---');
    const byEmail = await client.getUserByEmail('admin@phoenix.com');
    console.log('  result:', byEmail ? `FOUND _id=${byEmail._id} email=${byEmail.email}` : 'NULL');
    if (byEmail) {
        const ok = await bcrypt.compare('admin123', byEmail.password || '');
        console.log(`  bcrypt('admin123') on this user: ${ok}`);
    }

    console.log('\n--- Re-seed now and re-test ---');
    const email = 'admin@phoenix.com';
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('  freshly hashed admin123:', hashedPassword);
    console.log('  self-check bcrypt:', await bcrypt.compare('admin123', hashedPassword));

    const target = (allUsers.data || []).find(u => u.email === email);
    if (target) {
        await client.updateUser(target._id, { role: 'admin', password: hashedPassword });
        console.log('  re-updated user via Convex');

        const refetched = await client.getUserByEmail(email);
        console.log('  refetched password (first 30):', String(refetched?.password || '').slice(0, 30));
        console.log('  refetched bcrypt match:', await bcrypt.compare('admin123', refetched?.password || ''));
    }
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
