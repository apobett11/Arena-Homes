declare namespace Express {
    export interface Request {
        user?: {
            id: string;
            email: string;
            roleId: string;
        };
        auditContext?: import('../../modules/audit/types').AuditContext;
    }
}
