export type RoiInputs = {
    l1: { department: string; budget: number }[];
    l2: { department: string; tower: string; weightPct: number }[];
    l3: { category: string; weightPct: number }[];
    benefitAssumptions?: {
        revenueUplift?: number;
        productivityGainHours?: number;
        avgLoadedRate?: number;
        riskAvoidedValue?: number;
        costAvoided?: number
    };
};

export function computeCost(l1: RoiInputs['l1'], l2: RoiInputs['l2']) {
    const towerCost: Record<string, number> = {};
    for (const { department, budget } of l1) {
        const weights = l2.filter(w => w.department === department);
        const sum = weights.reduce((s, w) => s + w.weightPct, 0);
        if (sum > 1.0001 || sum < 0.9999) throw new Error(`L2 weights for ${department} must sum to 1`);
        for (const w of weights) {
            towerCost[w.tower] = (towerCost[w.tower] || 0) + budget * w.weightPct;
        }
    }
    const totalCost = Object.values(towerCost).reduce((a, b) => a + b, 0);
    return { totalCost, towerCost };
}

export function computeBenefit(l3: RoiInputs['l3'], assumptions: NonNullable<RoiInputs['benefitAssumptions']>) {
    const { revenueUplift = 0, productivityGainHours = 0, avgLoadedRate = 0, riskAvoidedValue = 0, costAvoided = 0 } = assumptions;
    const base: Record<string, number> = {
        REVENUE_UPLIFT: revenueUplift,
        PRODUCTIVITY: productivityGainHours * avgLoadedRate,
        RISK_AVOIDANCE: riskAvoidedValue,
        COST_AVOIDANCE: costAvoided,
        OTHER: 0,
    };
    const sum = l3.reduce((s, w) => s + w.weightPct, 0);
    if (sum > 1.0001 || sum < 0.9999) throw new Error('L3 benefit weights must sum to 1');
    let totalBenefit = 0;
    for (const w of l3) totalBenefit += base[w.category] * w.weightPct;
    return { totalBenefit, baseBreakdown: base };
}

export function computeRoi(cost: number, benefit: number) {
    if (cost <= 0) throw new Error('Cost must be > 0');
    const roiPct = (benefit - cost) / cost;
    return roiPct;
}