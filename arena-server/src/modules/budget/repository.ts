import { eq } from 'drizzle-orm';
import { db } from '../../infrastructure/orm/drizzle';
import { budgets, budgetAllocations } from './schema';
import { AuditContext } from '../audit/types';
import { AuditService } from '../audit/service';
import { withTransaction } from '../../infrastructure/orm/transaction';

export class BudgetRepository {
    public static async create(
        data: {
            name: string;
            periodStart: Date;
            periodEnd: Date;
            totalAmount: string;
            allocations: { category: string; amount: string }[];
        },
        context: AuditContext
    ): Promise<string> {
        return await withTransaction(async (tx) => {
            const [newBudget] = await tx.insert(budgets).values({
                name: data.name,
                periodStart: data.periodStart,
                periodEnd: data.periodEnd,
                totalAmount: data.totalAmount,
                status: 'DRAFT',
            }).returning({ id: budgets.id });

            if (data.allocations.length > 0) {
                await tx.insert(budgetAllocations).values(
                    data.allocations.map(a => ({
                        budgetId: newBudget.id,
                        category: a.category,
                        allocatedAmount: a.amount,
                    }))
                );
            }

            await AuditService.log(
                context,
                'FINANCIAL',
                newBudget.id,
                { action: 'CREATE_BUDGET', data },
                tx
            );

            return newBudget.id;
        });
    }

    // Additional methods for updating/getting would go here...
    public static async get(id: string) {
        return (await db().select().from(budgets).where(eq(budgets.id, id)))[0];
    }
}
