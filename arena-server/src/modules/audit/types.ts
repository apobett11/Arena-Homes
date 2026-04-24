/**
 * Strict Audit Context Structure.
 * This must be present in every state-changing operation in the system.
 */
export interface AuditContext {
    /**
     * The ID of the generic actor (User, System, or External Service)
     */
    actorId: string;

    /**
     * The type of actor performing the action.
     */
    actorType: 'USER' | 'SYSTEM' | 'EXTERNAL_SERVICE';

    /**
     * The specific action being performed (e.g., 'CREATE_LEASE', 'APPROVE_PAYMENT')
     */
    action: string;

    /**
     * The IP address of the request initiator
     */
    ipAddress: string;

    /**
     * User Agent string for device fingerprinting
     */
    userAgent?: string;

    /**
     * Correlation ID for tracing requests across micro-services or modules
     */
    correlationId?: string;
}

export interface AuditLogEntry {
    actor_id: string;
    action: string;
    target_entity: string;
    target_id: string;
    diff_json: Record<string, any>;
    ip_address: string;
    created_at: Date;
}
