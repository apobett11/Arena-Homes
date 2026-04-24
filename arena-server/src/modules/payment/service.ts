import { PaymentRepository } from './repository';
import { LedgerService } from '../ledger/service';
import { TenantRepository } from '../tenant/repository'; // Assuming update logic exists or I need to add it
import { AuditContext } from '../audit/types';

// Constants for System Accounts (In real app, fetch from config DB)
const PLATFORM_CASH_ACCOUNT_ID = '00000000-0000-0000-0000-000000000000';

export class PaymentService {
    public static async initiatePayment(
        data: {
            tenantId: string;
            leaseId?: string;
            amount: string;
            gateway: 'MPESA' | 'STRIPE' | 'CASH' | 'BANK_TRANSFER';
            description?: string;
        },
        context: AuditContext
    ) {
        return await PaymentRepository.create(data, context);
    }

    public static async confirmPayment(
        paymentId: string,
        gatewayTransactionId: string,
        context: AuditContext
    ) {
        const payment = await PaymentRepository.get(paymentId);
        if (!payment) throw new Error('Payment not found');
        if (payment.status === 'SUCCESS') return; // Idempotent

        // 1. Update Payment Status
        await PaymentRepository.updateStatus(paymentId, 'SUCCESS', gatewayTransactionId, context);

        // 2. Record in Ledger
        // Debit Cash (Asset +), Credit Tenant (Receivable -)
        await LedgerService.recordTransaction({
            description: `Payment ${paymentId} from Tenant`,
            referenceId: paymentId,
            referenceType: 'PAYMENT',
            entries: [
                {
                    accountId: PLATFORM_CASH_ACCOUNT_ID,
                    accountType: 'PLATFORM',
                    amount: payment.amount,
                    direction: 'DEBIT'
                },
                {
                    accountId: payment.tenantId,
                    accountType: 'TENANT',
                    amount: payment.amount,
                    direction: 'CREDIT'
                }
            ]
        }, context);

        // 3. Update Tenant Stats (e.g. months paid)
        // This is a rough estimation. In reality, we'd check rent amount vs payment amount.
        // I will just increment months paid if it looks like a full month payment?? 
        // Or leave it to a separate "Rent Recognition" service.
        // For requirement "Track active leases, months paid", I'll assume 1 payment = 1 month for simplicity or just skip auto-calc.
        // Let's skipping auto-calc of months paid to avoid erroneous business logic without Rent amount context.
    }

    public static async failPayment(
        paymentId: string,
        reason: string,
        context: AuditContext
    ) {
        await PaymentRepository.updateStatus(paymentId, 'FAILED', reason, context);
    }
}
