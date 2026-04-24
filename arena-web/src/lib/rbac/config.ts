import { UserRole, RoleConfig } from './types';

export const SYSTEM_ROLES: RoleConfig = {
    [UserRole.SUPER_ADMIN]: {
        name: 'Super Admin (System Owner)',
        description: 'Core Authority, Full platform visibility, Highest-level control, Final decision-maker',
        coreAuthority: [
            'Full platform visibility',
            'Highest-level control',
            'Final decision-maker'
        ],
        permissions: {
            view: [
                'all dashboards (tenant, caretaker, accountant, IT)',
                'all analytics (financial, operational, system)',
                'all user accounts (read-only except admin-controlled fields)',
                'all issues (tenant + caretaker)',
                'all accounts (read-only): Tenant, Caretaker, Accountant',
                'IT system data (read-only)'
            ],
            manage: [
                'own profile & admin card',
                'all employees (Activate / suspend / put on leave, Flag off accounts temporarily, Summon to office)',
                'caretaker group (Update name/logo/description, Mute members, Restrict messaging, Delete messages)',
            ],
            update: [
                'business identity (Logo, Business name, Social handles, Phone / WhatsApp)',
                'rules & regulations (Employees, Tenants, Public website)',
                'FAQ content'
            ],
            create: [
                'plots/apartments',
                'discounts on houses',
            ],
            actions: [
                'Process payroll for all employees',
                'Auto-generate payslips (PDF)',
                'Auto-send payslips to employee private chats',
                'Assign caretakers during plot registration',
                'Resolve, escalate, or archive issues',
                'Broadcast announcements to Tenants, Employees, Public website',
                'Publish public announcements'
            ]
        },
        restrictions: [
            'Cannot edit IT system internals',
            'Cannot override IT security permissions'
        ]
    },

    [UserRole.TENANT]: {
        name: 'Tenant',
        description: 'Personal housing & payment management',
        coreAuthority: [
            'Personal housing & payment management'
        ],
        permissions: {
            view: [
                'own tenant card & profile',
                'Lease',
                'Payment history',
                'House details',
                'Plot rules',
                'FAQ',
                'rent balance & advance payments',
                'announcements'
            ],
            update: [
                'Username',
                'Profile picture'
            ],
            actions: [
                'Download lease PDF',
                'Pay rent (M-Pesa)',
                'Receive automated reminders: Rent (27th monthly), Quarterly, Maintenance',
                'Report issues: To caretaker, To admin, Option to be anonymous',
                'Chat: Caretaker, Admin',
                'Share room listing to friends',
                'Recommend room to others',
                'Use live map: Max 5 times/personal, 15 total loads',
                'Submit feedback & star rating (only after lease ends)'
            ]
        },
        restrictions: [
            'Cannot edit personal legal details',
            'Cannot chat with other tenants',
            'Cannot rate house before lease end',
            'Cannot bypass map usage limits'
        ]
    },

    [UserRole.CARETAKER]: {
        name: 'Caretaker / Landlord',
        description: 'Plot-level operations & tenant management',
        coreAuthority: [
            'Plot-level operations & tenant management'
        ],
        permissions: {
            view: [
                'caretaker card (welcome + plot summary)',
                'assigned plot(s)',
                'room types',
                'tenant directory (assigned plots only)',
                'tenant room allocations',
                'tenant leases (read-only)',
                'tenant payment history (last 4 months)'
            ],
            update: [
                'Username',
                'Profile image',
                'plot facilities (water, parking, etc.)',
                'plot rules (synced to tenant dashboards)'
            ],
            manage: [
                'rooms: Mark taken / vacant',
                'maintenance schedules'
            ],
            actions: [
                'Warn tenants (with reason)',
                'Evict tenants (admin-logged action)',
                'Receive tenant issues',
                'Resolve issues',
                'Forward issues to admin',
                'Receive maintenance requests',
                'Post plot announcements',
                'Export tenant lease & payment records (PDF)'
            ]
        },
        restrictions: [
            'Cannot access global analytics',
            'Cannot modify financial ledger',
            'Cannot manage employees',
            'Cannot change business identity'
        ]
    },

    [UserRole.ACCOUNTANT]: {
        name: 'Accountant / Bookkeeper',
        description: 'Financial oversight & compliance',
        coreAuthority: [
            'Financial oversight & compliance'
        ],
        permissions: {
            view: [
                'accountant dashboard',
                'all financial analytics',
                'Ledger (auto-updated)',
                'Payments',
                'Budgets',
                'income vs expenses',
                'cash flow trends',
                'net profit & debt ratios',
                'caretaker financial records (read-only)',
                'tenant info (read-only)'
            ],
            update: [
                'Edit own profile (limited fields)' // mapped from edit
            ],
            create: [
                'budgets & allocations'
            ],
            actions: [
                'Flag financial discrepancies to admin',
                'Generate monthly financial reports (5th of month): Balance sheet, Tax prep, Expense vs income charts',
                'Generate tax forms (auto-filled)',
                'Download all reports as PDFs',
                'Chat with: Admin, Caretakers'
            ]
        },
        restrictions: [
            'Cannot edit tenant data',
            'Cannot chat directly with tenants',
            'Cannot modify system settings',
            'Cannot process tenant payments'
        ]
    },

    [UserRole.IT_SUPPORT]: {
        name: 'IT Support',
        description: 'System stability & infrastructure',
        coreAuthority: [
            'System stability & infrastructure'
        ],
        permissions: {
            view: [
                'IT dashboard',
                'logs & diagnostics',
                'integrations status (M-Pesa, Maps)',
                'user activity (read-only)',
                'supicious login attempts'
            ],
            update: [
                'own profile'
            ],
            actions: [
                'Monitor system health',
                'Run system scans',
                'Assign & resolve technical tickets',
                'Backup & restore system',
                'Monitor security alerts',
                'Chat with admin'
            ]
        },
        restrictions: [
            'Cannot access financial data',
            'Cannot view personal tenant details',
            'Cannot modify business rules',
            'Cannot access admin privileges'
        ]
    },

    [UserRole.PUBLIC]: {
        name: 'Public User',
        description: 'Browse & discover housing',
        coreAuthority: [
            'Browse & discover housing'
        ],
        permissions: {
            view: [
                'listings',
                'house details',
                'public announcements',
                'FAQ & rules'
            ],
            actions: [
                'Search & filter houses',
                'Contact Arena Homes',
                'Apply for a room'
            ]
        },
        restrictions: [
            'Cannot view tenant-only data',
            'Cannot access dashboards'
        ]
    }
};
