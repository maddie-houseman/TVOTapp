import { z } from 'zod';

export const emailSchema = z.string().email();
export const passwordSchema = z.string().min(8);
export const periodSchema = z.string().regex(/^\d{4}-\d{2}-01$/, 'Use YYYY-MM-01');

export const l1Schema = z.object({
    companyId: z.string().cuid(),
    period: periodSchema,
    department: z.enum(['LABOUR','CLOUD_SERVICES','SOFTWARE_SAAS','HARDWARE','DATA_CENTRE_FACILITIES','TELECOM','MISC_COSTS','INTERNAL_SERVICES']),
    employees: z.number().int().nonnegative(),
    budget: z.number().nonnegative(),
    baselineKpi: z.number().optional()
});

export const l2Schema = z.object({
    companyId: z.string().cuid(),
    period: periodSchema,
    department: z.enum(['LABOUR','CLOUD_SERVICES','SOFTWARE_SAAS','HARDWARE','DATA_CENTRE_FACILITIES','TELECOM','MISC_COSTS','INTERNAL_SERVICES']),
    tower: z.enum(['APP_DEV','SERVICE_DESK','DATA_CENTER','NETWORK','END_USER','SECURITY','CLOUD','OTHER']),
    weightPct: z.number().min(0).max(1)
});

export const l3Schema = z.object({
    companyId: z.string().cuid(),
    period: periodSchema,
    category: z.enum(['REVENUE_UPLIFT','PRODUCTIVITY','RISK_AVOIDANCE','COST_AVOIDANCE','OTHER']),
    weightPct: z.number().min(0).max(1)
});