import { Database } from '../../infrastructure/database/connection';
import { db } from '../../infrastructure/orm/drizzle';
import { eq } from 'drizzle-orm';
import { users, employeeProfiles, tenantProfiles } from '../../modules/users/schema';
import { properties } from '../../modules/property/schema';
import { units } from '../../modules/unit/schema';
import { tenants } from '../../modules/tenant/schema';
import { leases } from '../../modules/lease/schema';
import { payments } from '../../modules/payment/schema';
import { budgets, budgetAllocations } from '../../modules/budget/schema';
import { financialSnapshots } from '../../modules/financial_snapshot/schema';
import { LeaseService } from '../../modules/lease/service';
import { PaymentService } from '../../modules/payment/service';
import { TenantRepository } from '../../modules/tenant/repository';
import { UserRepository } from '../../modules/users/repository';
import {
    createSeedAuditContext,
    hashPassword,
    generateUnitCode,
    generateMpesaReference,
    formatDate,
    getDateOffset,
    seedLog,
    SeededRandom,
} from './utils';
import { seedMinimal } from './minimal';

/**
 * DEMO SEED
 * Larger dataset for charts, graphs, and dashboard demonstrations
 * 
 * Creates:
 * - All minimal seed data (via seedMinimal)
 * - 2 additional properties (3 total)
 * - 40-80 units across properties
 * - 15-30 tenants
 * - 10-20 active leases
 * - Historical payments (last 4 months)
 * - 2 budgets with allocations
 * - Monthly financial snapshots (last 4 months)
 */

export async function seedDemo() {
    seedLog.section('DEMO SEED - Starting');

    // First, run minimal seed to establish base data
    await seedMinimal();

    const database = db();
    const ctx = createSeedAuditContext('SEED_DEMO');
    const rng = new SeededRandom(42); // Deterministic randomness

    try {
        // ===== STEP 1: Create Additional Properties =====
        seedLog.section('Demo Step 1: Additional Properties');

        const additionalProperties = [
            {
                name: 'Arena Main Gate B',
                location: 'Main Gate',
                facilities: {
                    water: 'SCHEDULED',
                    parking: true,
                    wifi: false,
                    security: '24/7',
                    gateColor: 'Red',
                },
            },
            {
                name: 'Arena Town C',
                location: 'Njoro Town',
                facilities: {
                    water: 'CONSTANT',
                    parking: false,
                    wifi: true,
                    security: 'Daytime',
                    gateColor: 'Green',
                },
            },
        ];

        // Get caretaker1 for assignment
        const caretaker1 = await database
            .select()
            .from(users)
            .where(eq(users.email, 'caretaker1@arenahomes.test'))
            .limit(1);

        const propertyIds: string[] = [];

        // Get existing property
        const existingProps = await database.select().from(properties);
        propertyIds.push(...existingProps.map(p => p.id));

        for (const propData of additionalProperties) {
            const existing = await database
                .select()
                .from(properties)
                .where(eq(properties.name, propData.name))
                .limit(1);

            if (existing.length === 0) {
                const [newProp] = await database.insert(properties).values({
                    ...propData,
                    caretakerId: caretaker1[0].id,
                }).returning();
                propertyIds.push(newProp.id);
                seedLog.info(`Created property: ${propData.name}`);
            } else {
                if (!propertyIds.includes(existing[0].id)) {
                    propertyIds.push(existing[0].id);
                }
                seedLog.warn(`Property already exists: ${propData.name}`);
            }
        }

        // ===== STEP 2: Create Additional Units (40-80 total) =====
        seedLog.section('Demo Step 2: Additional Units');

        const unitTypes = ['SINGLE', 'BEDSITTER', 'ONE_BEDROOM', 'TWO_BEDROOM', 'APARTMENT'];
        const basePrices: Record<string, number> = {
            SINGLE: 3500,
            BEDSITTER: 5500,
            ONE_BEDROOM: 9000,
            TWO_BEDROOM: 12000,
            APARTMENT: 15000,
        };

        const propertyPrefixes = ['NJK-A', 'MG-B', 'TN-C'];
        let totalUnitsCreated = 0;

        // Get current unit count
        const currentUnits = await database.select().from(units);
        const targetUnits = 60; // Target total units

        if (currentUnits.length < targetUnits) {
            const unitsToCreate = targetUnits - currentUnits.length;

            for (let i = 0; i < unitsToCreate; i++) {
                const propertyIndex = i % propertyIds.length;
                const propertyId = propertyIds[propertyIndex];
                const prefix = propertyPrefixes[propertyIndex];
                const type = rng.choice(unitTypes);
                const basePrice = basePrices[type];
                const priceVariation = rng.nextInt(-500, 500);
                const finalPrice = Math.max(basePrice + priceVariation, basePrice * 0.8);

                const unitCode = `${prefix}-${type.substring(0, 2)}-${i + currentUnits.length + 1}`;

                const existing = await database
                    .select()
                    .from(units)
                    .where(eq(units.description, unitCode))
                    .limit(1);

                if (existing.length === 0) {
                    await database.insert(units).values({
                        propertyId,
                        type,
                        description: unitCode,
                        basePrice: finalPrice.toFixed(2),
                        status: 'VACANT',
                    });
                    totalUnitsCreated++;
                }
            }
            seedLog.info(`Created ${totalUnitsCreated} additional units`);
        } else {
            seedLog.warn('Target unit count already reached');
        }

        // ===== STEP 3: Create Additional Tenants (15-30 total) =====
        seedLog.section('Demo Step 3: Additional Tenants');

        const currentTenantUsers = await database
            .select()
            .from(users)
            .where(eq(users.roleId, 'TENANT'));

        const targetTenants = 20;
        let tenantsCreated = 0;

        if (currentTenantUsers.length < targetTenants) {
            const tenantsToCreate = targetTenants - currentTenantUsers.length;

            for (let i = 0; i < tenantsToCreate; i++) {
                const tenantNum = currentTenantUsers.length + i + 1;
                const email = `tenant${tenantNum}@arenahomes.test`;
                const password = 'Ten#1234';

                const existing = await database
                    .select()
                    .from(users)
                    .where(eq(users.email, email))
                    .limit(1);

                if (existing.length === 0) {
                    const passwordHash = await hashPassword(password);
                    const userId = await UserRepository.create(
                        {
                            email,
                            passwordHash,
                            roleId: 'TENANT',
                            profile: {
                                fullName: `Tenant ${tenantNum}`,
                                username: `tenant${tenantNum}`,
                                phoneNumber: `07${String(tenantNum).padStart(8, '0')}`,
                                avatarUrl: `/avatars/tenant${tenantNum}.png`,
                                universityRegNo: `EG/2021/${String(tenantNum).padStart(3, '0')}`,
                            },
                        },
                        ctx
                    );

                    // Create tenant domain record
                    const tenantId = await TenantRepository.create(userId, ctx);
                    // Update status based on random selection
                    const status = rng.next() > 0.3 ? 'ACTIVE' : 'PROSPECT';
                    if (status === 'ACTIVE') {
                        await TenantRepository.updateStatus(tenantId, 'ACTIVE', ctx);
                    }
                    tenantsCreated++;
                }
            }
            seedLog.info(`Created ${tenantsCreated} additional tenants`);
        } else {
            seedLog.warn('Target tenant count already reached');
        }

        // ===== STEP 4: Create Additional Active Leases (10-20 total) =====
        seedLog.section('Demo Step 4: Additional Leases');

        const allUnits = await database.select().from(units);
        const vacantUnits = allUnits.filter(u => u.status === 'VACANT');
        const allTenants = await database.select().from(tenants).where(eq(tenants.status, 'ACTIVE'));

        const currentLeases = await database.select().from(leases);
        const targetActiveLeases = 15;
        let leasesCreated = 0;

        if (currentLeases.length < targetActiveLeases && vacantUnits.length > 0 && allTenants.length > 0) {
            const leasesToCreate = Math.min(
                targetActiveLeases - currentLeases.length,
                vacantUnits.length,
                allTenants.length
            );

            for (let i = 0; i < leasesToCreate; i++) {
                const unit = vacantUnits[i];
                const tenant = allTenants[i % allTenants.length];
                const today = new Date();
                const startDate = formatDate(today);
                const endDate = formatDate(new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()));

                const leaseData = {
                    tenantId: tenant.id,
                    unitId: unit.id,
                    startDate,
                    endDate,
                    pdfUrl: `/contracts/lease-${tenant.id}-${unit.id}.pdf`,
                };

                try {
                    const leaseId = await LeaseService.draftLease(leaseData, ctx);
                    await LeaseService.activateLease(leaseId, ctx);
                    leasesCreated++;
                } catch (error) {
                    // Unit might already be taken, skip
                    seedLog.warn(`Could not create lease for unit ${unit.description}`);
                }
            }
            seedLog.info(`Created ${leasesCreated} additional active leases`);
        } else {
            seedLog.warn('Cannot create more leases (no vacant units or active tenants)');
        }

        // ===== STEP 5: Create Historical Payments (Last 4 Months) =====
        seedLog.section('Demo Step 5: Historical Payments');

        const activeLeases = await database
            .select()
            .from(leases)
            .where(eq(leases.status, 'ACTIVE'));

        let paymentsCreated = 0;
        let paymentIndex = 1000; // Start from 1000 to avoid conflicts

        for (let monthsAgo = 3; monthsAgo >= 0; monthsAgo--) {
            const paymentDate = getDateOffset(monthsAgo);

            // Create payments for 70% of active leases (some tenants miss payments)
            const leasesToPay = activeLeases.filter(() => rng.next() > 0.3);

            for (const lease of leasesToPay) {
                const unit = await database
                    .select()
                    .from(units)
                    .where(eq(units.id, lease.unitId))
                    .limit(1);

                if (unit.length === 0) continue;

                const amount = unit[0].basePrice;
                const ref = `SEED-MPESA-2025-${String(paymentDate.getMonth() + 1).padStart(2, '0')}-${String(paymentIndex).padStart(4, '0')}`;

                const existing = await database
                    .select()
                    .from(payments)
                    .where(eq(payments.gatewayTransactionId, ref))
                    .limit(1);

                if (existing.length === 0) {
                    const paymentId = await PaymentService.initiatePayment(
                        {
                            tenantId: lease.tenantId,
                            leaseId: lease.id,
                            amount,
                            gateway: 'MPESA',
                            description: `Rent payment - ${paymentDate.toLocaleString('default', { month: 'long' })}`,
                        },
                        ctx
                    );

                    // 95% success rate
                    if (rng.next() > 0.05) {
                        await PaymentService.confirmPayment(paymentId, ref, ctx);
                    } else {
                        await PaymentService.failPayment(paymentId, 'Transaction timeout', ctx);
                    }

                    paymentsCreated++;
                    paymentIndex++;
                }
            }
        }
        seedLog.info(`Created ${paymentsCreated} historical payments`);

        // ===== STEP 6: Create Budgets =====
        seedLog.section('Demo Step 6: Budgets');

        const budgetData = [
            {
                name: 'Maintenance Budget 2025',
                periodStart: new Date(2025, 0, 1),
                periodEnd: new Date(2025, 11, 31),
                totalAmount: '500000',
                status: 'ACTIVE' as const,
                allocations: [
                    { category: 'Water', allocatedAmount: '150000' },
                    { category: 'Electricity', allocatedAmount: '200000' },
                    { category: 'Repairs', allocatedAmount: '150000' },
                ],
            },
            {
                name: 'Operations Budget 2025',
                periodStart: new Date(2025, 0, 1),
                periodEnd: new Date(2025, 11, 31),
                totalAmount: '300000',
                status: 'ACTIVE' as const,
                allocations: [
                    { category: 'Security', allocatedAmount: '120000' },
                    { category: 'Cleaning', allocatedAmount: '100000' },
                    { category: 'Internet', allocatedAmount: '80000' },
                ],
            },
        ];

        for (const budget of budgetData) {
            const existing = await database
                .select()
                .from(budgets)
                .where(eq(budgets.name, budget.name))
                .limit(1);

            if (existing.length === 0) {
                const [newBudget] = await database.insert(budgets).values({
                    name: budget.name,
                    periodStart: budget.periodStart,
                    periodEnd: budget.periodEnd,
                    totalAmount: budget.totalAmount,
                    status: budget.status,
                }).returning();

                for (const allocation of budget.allocations) {
                    await database.insert(budgetAllocations).values({
                        budgetId: newBudget.id,
                        category: allocation.category,
                        allocatedAmount: allocation.allocatedAmount,
                    });
                }

                seedLog.info(`Created budget: ${budget.name}`);
            } else {
                seedLog.warn(`Budget already exists: ${budget.name}`);
            }
        }

        // ===== STEP 7: Create Financial Snapshots (Last 4 Months) =====
        seedLog.section('Demo Step 7: Financial Snapshots');

        let snapshotsCreated = 0;

        for (let monthsAgo = 3; monthsAgo >= 0; monthsAgo--) {
            const snapshotDate = getDateOffset(monthsAgo);
            const month = snapshotDate.getMonth() + 1;
            const year = snapshotDate.getFullYear();

            for (const propertyId of propertyIds) {
                const existing = await database
                    .select()
                    .from(financialSnapshots)
                    .where(eq(financialSnapshots.month, month))
                    .limit(1);

                if (existing.length === 0) {
                    // Calculate income from payments in that month
                    const monthPayments = await database
                        .select()
                        .from(payments)
                        .where(eq(payments.status, 'SUCCESS'));

                    const totalIncome = monthPayments
                        .reduce((sum, p) => sum + parseFloat(p.amount), 0) / 4; // Rough estimate per month

                    const totalExpenses = rng.nextFloat(5000, 15000);
                    const netProfit = totalIncome - totalExpenses;

                    await database.insert(financialSnapshots).values({
                        month,
                        year,
                        propertyId,
                        totalIncome: totalIncome.toFixed(2),
                        totalExpenses: totalExpenses.toFixed(2),
                        netProfit: netProfit.toFixed(2),
                        discrepancyAmount: '0',
                        status: 'FINALIZED',
                        pdfUrl: `/reports/financial-${year}-${String(month).padStart(2, '0')}-${propertyId}.pdf`,
                    });

                    snapshotsCreated++;
                }
            }
        }
        seedLog.info(`Created ${snapshotsCreated} financial snapshots`);

        // ===== SUMMARY =====
        seedLog.section('DEMO SEED - Summary');

        const finalStats = {
            users: await database.select().from(users),
            properties: await database.select().from(properties),
            units: await database.select().from(units),
            tenants: await database.select().from(tenants),
            leases: await database.select().from(leases),
            payments: await database.select().from(payments),
            budgets: await database.select().from(budgets),
            snapshots: await database.select().from(financialSnapshots),
        };

        seedLog.data('Total Users', finalStats.users.length);
        seedLog.data('Total Properties', finalStats.properties.length);
        seedLog.data('Total Units', finalStats.units.length);

        const vacantCount = finalStats.units.filter(u => u.status === 'VACANT').length;
        const takenCount = finalStats.units.filter(u => u.status === 'TAKEN').length;
        const occupancyRate = ((takenCount / finalStats.units.length) * 100).toFixed(1);

        seedLog.data('Vacant Units', vacantCount);
        seedLog.data('Occupied Units', takenCount);
        seedLog.data('Occupancy Rate', `${occupancyRate}%`);

        const activeLeaseCount = finalStats.leases.filter(l => l.status === 'ACTIVE').length;
        const pendingLeaseCount = finalStats.leases.filter(l => l.status === 'PENDING').length;

        seedLog.data('Active Leases', activeLeaseCount);
        seedLog.data('Pending Leases', pendingLeaseCount);

        const successPayments = finalStats.payments.filter(p => p.status === 'SUCCESS').length;
        const failedPayments = finalStats.payments.filter(p => p.status === 'FAILED').length;

        seedLog.data('Successful Payments', successPayments);
        seedLog.data('Failed Payments', failedPayments);
        seedLog.data('Budgets', finalStats.budgets.length);
        seedLog.data('Financial Snapshots', finalStats.snapshots.length);

        seedLog.section('DEMO SEED - Complete ✓');
    } catch (error) {
        seedLog.error('Demo seed failed with error:');
        console.error(error);
        throw error;
    }
}
