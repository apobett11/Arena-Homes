
import { Database } from '../../src/infrastructure/database/connection';
import { db } from '../../src/infrastructure/orm/drizzle';
import { users } from '../../src/modules/users/schema';
import { properties } from '../../src/modules/property/schema';
import { leases } from '../../src/modules/lease/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4001;
const API_URL = process.env.API_URL || `http://localhost:${PORT}/api`;

async function verify() {
    console.log('🚀 Starting Verification Smoke Test...');
    let passed = true;

    // 1. Check API Health
    try {
        console.log(`\nChecking Backend API (${API_URL})...`);
        const res = await fetch(`${API_URL}/system/health`);
        if (res.status === 200) {
            console.log('✅ API is reachable and healthy');
        } else {
            console.error(`❌ API returned status ${res.status}`);
            passed = false;
        }
    } catch (error) {
        console.error('❌ API is unreachable');
        passed = false;
    }

    // 2. Check Database Content
    try {
        console.log('\nChecking Database Content...');
        Database.initialize();
        const database = db();

        // Check Users
        const userCount = await database.select().from(users);
        if (userCount.length > 0) {
            console.log(`✅ Users found: ${userCount.length}`);
            const admin = userCount.find(u => u.email === 'admin@arenahomes.test');
            if (admin) console.log('✅ Admin user exists');
            else {
                console.error('❌ Admin user missing');
                passed = false;
            }
        } else {
            console.error('❌ No users found in DB');
            passed = false;
        }

        // Check Properties
        const props = await database.select().from(properties);
        if (props.length > 0) {
            console.log(`✅ Properties found: ${props.length}`);
        } else {
            console.error('❌ No properties found');
            passed = false;
        }

        // Check Leases
        const leaseCount = await database.select().from(leases);
        if (leaseCount.length > 0) {
            console.log(`✅ Leases found: ${leaseCount.length}`);
        } else {
            console.error('❌ No leases found');
            passed = false;
        }

    } catch (error) {
        console.error('❌ Database verification failed', error);
        passed = false;
    } finally {
        await Database.close();
    }

    console.log('\n========================================');
    if (passed) {
        console.log('✅ SMOKE VERIFICATION PASSED');
        process.exit(0);
    } else {
        console.error('❌ SMOKE VERIFICATION FAILED');
        process.exit(1);
    }
}

verify();
