export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    TENANT = 'TENANT',
    CARETAKER = 'CARETAKER', // Also Landlord
    ACCOUNTANT = 'ACCOUNTANT',
    IT_SUPPORT = 'IT_SUPPORT',
    PUBLIC = 'PUBLIC',
}

export interface PermissionAction {
    action: string;
    resource: string;
    description?: string;
    constraints?: string[];
}

export interface RoleDefinition {
    name: string;
    description: string;
    coreAuthority: string[];
    permissions: {
        view: string[];
        manage?: string[];
        update?: string[];
        create?: string[];
        delete?: string[];
        actions: string[]; // specific actions like "summon employees", "process payroll"
    };
    restrictions: string[];
}

export type RoleConfig = Record<UserRole, RoleDefinition>;
