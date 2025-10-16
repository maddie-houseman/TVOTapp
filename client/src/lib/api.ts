    // client/src/lib/api.ts

    // -------- Types --------
    export type Role = "ADMIN" | "EMPLOYEE";

    export type Me = { id: string; email: string; name: string; role: Role; companyId: string | null };

    export type Department =
    | "ENGINEERING"
    | "SALES"
    | "FINANCE"
    | "HR"
    | "MARKETING"
    | "OPERATIONS";

    export type Tower = "APP_DEV" | "CLOUD" | "END_USER";

    export type L3Category = "PRODUCTIVITY" | "REVENUE_UPLIFT";

    // New Business Framework Types
    export type BusinessUnit = 
        | "SALES_MARKETING"
        | "PRODUCT_DEVELOPMENT"
        | "CUSTOMER_SERVICE"
        | "FINANCE_ACCOUNTING"
        | "HUMAN_RESOURCES"
        | "OPERATIONS"
        | "STRATEGY_LEADERSHIP"
        | "OTHER";

    export type ServiceType = 
        | "END_USER_SERVICES"
        | "BUSINESS_APPLICATION_SERVICES"
        | "DELIVERY_SERVICES"
        | "PLATFORM_SERVICES"
        | "INFRASTRUCTURE_SERVICES"
        | "EMERGING_SERVICES";

    export type ItTower = 
        | "DATA_CENTER"
        | "COMPUTE"
        | "STORAGE"
        | "NETWORK"
        | "OUTPUT"
        | "END_USER"
        | "APPLICATION"
        | "DELIVERY"
        | "SECURITY_COMPLIANCE"
        | "IT_MANAGEMENT";

    export type CostPool = 
        | "INTERNAL_LABOR"
        | "EXTERNAL_LABOR"
        | "OUTSIDE_SERVICES"
        | "HARDWARE"
        | "SOFTWARE"
        | "FACILITIES_POWER"
        | "TELECOM"
        | "OTHER"
        | "INTERNAL_SERVICES";

    export type InsightCategory = 
        | "COST_OPTIMIZATION"
        | "PERFORMANCE_ANALYSIS"
        | "CAPACITY_PLANNING"
        | "RISK_ASSESSMENT"
        | "STRATEGIC_ALIGNMENT"
        | "ROI_ANALYSIS"
        | "BENCHMARKING"
        | "TREND_ANALYSIS";

    export type BusinessUnitModel = {
        id: string;
        companyId: string;
        name: string;
        type: BusinessUnit;
        description?: string;
        budget: number;
        employees: number;
        period: string;
        services?: Service[];
        createdAt: string;
    };

    export type Service = {
        id: string;
        companyId: string;
        businessUnitId: string;
        businessUnit?: BusinessUnitModel;
        name: string;
        type: ServiceType;
        description?: string;
        cost: number;
        slaLevel?: string;
        utilization?: number;
        period: string;
        itTowers?: ServiceItTower[];
        createdAt: string;
    };

    export type ItTowerModel = {
        id: string;
        companyId: string;
        name: string;
        type: ItTower;
        description?: string;
        cost: number;
        capacity?: number;
        utilization?: number;
        period: string;
        services?: ServiceItTower[];
        costPools?: ItTowerCostPool[];
        createdAt: string;
    };

    export type CostPoolModel = {
        id: string;
        companyId: string;
        name: string;
        type: CostPool;
        description?: string;
        amount: number;
        period: string;
        itTowers?: ItTowerCostPool[];
        createdAt: string;
    };

    export type ServiceItTower = {
        id: string;
        serviceId: string;
        itTowerId: string;
        itTower?: ItTowerModel;
        weight: number;
    };

    export type ItTowerCostPool = {
        id: string;
        itTowerId: string;
        costPoolId: string;
        costPool?: CostPoolModel;
        amount: number;
    };

    export type BusinessInsight = {
        id: string;
        companyId: string;
        title: string;
        category: InsightCategory;
        description: string;
        insight: string;
        impact?: string;
        confidence?: number;
        period: string;
        data?: Record<string, unknown>;
        createdAt: string;
    };

    export type FrameworkOverview = {
        summary: {
            totalBudget: number;
            totalCost: number;
            totalEmployees: number;
            avgUtilization: number;
            businessUnitCount: number;
            serviceCount: number;
            itTowerCount: number;
            costPoolCount: number;
        };
        businessUnits: BusinessUnitModel[];
        services: Service[];
        itTowers: ItTowerModel[];
        costPools: CostPoolModel[];
        recentInsights: BusinessInsight[];
    };

    export type L1Input = {
    companyId: string;
    period: string; // YYYY-MM-DD
    department: Department;
    employees: number;
    budget: number;
    };

    export type L2Input = {
    companyId: string;
    period: string;
    department: Department;
    tower: Tower;
    weightPct: number; // 0..1
    };

    export type L3Input = {
    companyId: string;
    period: string;
    category: L3Category;
    weightPct: number; // 0..1
    };

    export type SnapshotAssumptions = {
    revenueUplift: number;
    productivityGainHours: number;
    avgLoadedRate: number;
    };

    export type L4Snapshot = {
    id: string;
    companyId: string;
    period: string;
    totalCost: number;
    totalBenefit: number;
    net: number;
    roiPct: number;
    assumptions: SnapshotAssumptions;
    createdAt?: string;
    updatedAt?: string;
    };

    // -------- Base URL --------
    const BASE = import.meta.env.DEV ? "https://tvotapp-production.up.railway.app" : (import.meta.env.VITE_API_BASE ?? "https://tvotapp-production.up.railway.app");

    // -------- Helpers --------
    function withBase(path: string) {
    return path.startsWith("http") ? path : `${BASE}${path}`;
    }

    async function toApiError(res: Response): Promise<Error> {
    const raw = await res.text();
    let msg = `HTTP ${res.status}`;

    try {
    const data: unknown = JSON.parse(raw);

    if (typeof data === "string") {
        msg = data;
    } else if (data && typeof data === "object" && "error" in data) {
        const maybe = data as { error?: unknown };
        if (typeof maybe.error === "string") {
        msg = maybe.error;
        } else {
        msg = raw;
        }
    } else {
        msg = raw;
    }
    } catch {
    msg = raw; // not JSON
    }

    throw new Error(msg);

    }

    async function jsonFetch<T>(
    path: string,
    init?: RequestInit & { json?: unknown; timeout?: number }
    ): Promise<T> {
    const { json, timeout = 30000, ...rest } = init ?? {}; // 30 second default timeout
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const res = await fetch(withBase(path), {
            credentials: "include", // send/receive cookies
            signal: controller.signal,
            ...rest,
            headers: {
            ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
            ...(rest.headers ?? {}),
            },
            body: json !== undefined ? JSON.stringify(json) : (rest as RequestInit).body,
        });

        clearTimeout(timeoutId);
        
        if (!res.ok) throw await toApiError(res);
        if (res.status === 204) return undefined as unknown as T;

        const text = await res.text();
        return (text ? JSON.parse(text) : undefined) as T;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeout}ms`);
        }
        throw error;
    }
    }

    function isHttpStatus(e: unknown, code: number): e is Error {
    return e instanceof Error && new RegExp(`^HTTP\\s+${code}\\b`).test(e.message);
    }

    // -------- Public API --------
    export const api = {
    // ---- Auth ----
    async signup(email: string, password: string, name: string, companyName?: string, companyDomain?: string, role?: 'ADMIN' | 'EMPLOYEE'): Promise<{ ok: boolean; user?: Me }> {
        return jsonFetch<{ ok: boolean; user?: Me }>("/api/auth/signup", {
        method: "POST",
        json: { email, password, name, companyName, companyDomain, role },
        });
    },

    async login(email: string, password: string): Promise<{ ok: boolean }> {
        return jsonFetch<{ ok: boolean }>("/api/auth/login", {
        method: "POST",
        json: { email, password },
        });
    },

    async me(): Promise<Me | null> {
        try {
        return await jsonFetch<Me>("/api/auth/me");
        } catch (e: unknown) {
        if (isHttpStatus(e, 401)) return null; // not logged in
        throw e instanceof Error ? e : new Error(String(e));
        }
    },

    async getCompany(): Promise<{ id: string; name: string; domain: string } | null> {
        try {
        return await jsonFetch<{ id: string; name: string; domain: string }>("/api/auth/company");
        } catch (e: unknown) {
        if (isHttpStatus(e, 401) || isHttpStatus(e, 404)) return null;
        throw e instanceof Error ? e : new Error(String(e));
        }
    },

    async getCompanies(): Promise<{ id: string; name: string; domain: string }[]> {
        return jsonFetch<{ id: string; name: string; domain: string }[]>("/api/auth/companies");
    },

    async logout(): Promise<void> {
        await jsonFetch<void>("/api/auth/logout", { method: "POST" });
    },

    async updateProfile(name?: string, email?: string): Promise<Me> {
        return jsonFetch<Me>("/api/auth/profile", {
        method: "PUT",
        json: { name, email },
        });
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<{ ok: boolean }> {
        return jsonFetch<{ ok: boolean }>("/api/auth/password", {
        method: "PUT",
        json: { currentPassword, newPassword },
        });
    },

    // ---- L1 ----
    async l1Upsert(v: L1Input): Promise<L1Input> {
        return jsonFetch<L1Input>("/api/l1", { method: "POST", json: v });
    },

    async l1Get(companyId: string, period: string): Promise<L1Input[]> {
        return jsonFetch<L1Input[]>(`/api/l1/${companyId}/${period}`);
    },

    // ---- L2 ----
    async l2Upsert(v: L2Input): Promise<L2Input> {
        return jsonFetch<L2Input>("/api/l2", { method: "POST", json: v });
    },

    async l2Get(companyId: string, period: string): Promise<L2Input[]> {
        return jsonFetch<L2Input[]>(`/api/l2/${companyId}/${period}`);
    },

    // ---- L3 ----
    async l3Upsert(v: L3Input): Promise<L3Input> {
        return jsonFetch<L3Input>("/api/l3", { method: "POST", json: v });
    },

    async l3Get(companyId: string, period: string): Promise<L3Input[]> {
        return jsonFetch<L3Input[]>(`/api/l3/${companyId}/${period}`);
    },

    // ---- L4 ----
    async snapshot(params: {
        companyId: string;
        period: string;
        assumptions: SnapshotAssumptions;
    }): Promise<L4Snapshot> {
        return jsonFetch<L4Snapshot>(`/api/l4/snapshot`, {
        method: "POST",
        json: params,
        timeout: 15000, // 15 second timeout for L4 snapshot
        });
    },

    async snapshots(companyId: string): Promise<{ success: boolean; snapshots: L4Snapshot[] }> {
        return jsonFetch<{ success: boolean; snapshots: L4Snapshot[] }>(`/api/l4/snapshots/${companyId}`);
    },

    // Get the correct company ID that has data
    async getCorrectCompanyId(): Promise<{ id: string; name: string; domain: string }> {
        return jsonFetch<{ id: string; name: string; domain: string }>(`/api/l4/get-company-id`);
    },

    // Simple L4 calculation that actually works
    async calculateSimple(params: {
        companyId: string;
        period: string;
        assumptions: SnapshotAssumptions;
    }): Promise<{ success: boolean; result: { id: string; totalCost: number; totalBenefit: number; roiPct: number; dataCount: number }; duration: number; requestId: string }> {
        return jsonFetch<{ success: boolean; result: { id: string; totalCost: number; totalBenefit: number; roiPct: number; dataCount: number }; duration: number; requestId: string }>(`/api/l4/calculate-simple`, {
            method: "POST",
            json: params,
            timeout: 10000, // 10 second timeout
        });
    },

    async testL4Data(companyId: string, period: string): Promise<{
        success: boolean;
        companyId: string;
        period: string;
        dataCounts: { l1: number; l2: number; l3: number };
        hasAllData: boolean;
    }> {
        return jsonFetch(`/api/l4/test-data?companyId=${companyId}&period=${period}`);
    },

    // ---- Business Framework ----
    
    // Business Units
    async getBusinessUnits(companyId: string, period?: string): Promise<BusinessUnitModel[]> {
        const params = new URLSearchParams({ companyId });
        if (period) params.append('period', period);
        return jsonFetch<BusinessUnitModel[]>(`/api/business-framework/business-units?${params}`);
    },

    async createBusinessUnit(data: {
        companyId: string;
        name: string;
        type: BusinessUnit;
        description?: string;
        budget: number;
        employees: number;
        period: string;
    }): Promise<BusinessUnitModel> {
        return jsonFetch<BusinessUnitModel>('/api/business-framework/business-units', {
            method: 'POST',
            json: data
        });
    },

    // Services
    async getServices(companyId: string, period?: string, businessUnitId?: string): Promise<Service[]> {
        const params = new URLSearchParams({ companyId });
        if (period) params.append('period', period);
        if (businessUnitId) params.append('businessUnitId', businessUnitId);
        return jsonFetch<Service[]>(`/api/business-framework/services?${params}`);
    },

    async createService(data: {
        companyId: string;
        businessUnitId: string;
        name: string;
        type: ServiceType;
        description?: string;
        cost: number;
        slaLevel?: string;
        utilization?: number;
        period: string;
        itTowerAllocations?: Array<{ itTowerId: string; weight: number }>;
    }): Promise<Service> {
        return jsonFetch<Service>('/api/business-framework/services', {
            method: 'POST',
            json: data
        });
    },

    // IT Towers
    async getItTowers(companyId: string, period?: string): Promise<ItTowerModel[]> {
        const params = new URLSearchParams({ companyId });
        if (period) params.append('period', period);
        return jsonFetch<ItTowerModel[]>(`/api/business-framework/it-towers?${params}`);
    },

    async createItTower(data: {
        companyId: string;
        name: string;
        type: ItTower;
        description?: string;
        cost: number;
        capacity?: number;
        utilization?: number;
        period: string;
        costPoolAllocations?: Array<{ costPoolId: string; amount: number }>;
    }): Promise<ItTowerModel> {
        return jsonFetch<ItTowerModel>('/api/business-framework/it-towers', {
            method: 'POST',
            json: data
        });
    },

    // Cost Pools
    async getCostPools(companyId: string, period?: string): Promise<CostPoolModel[]> {
        const params = new URLSearchParams({ companyId });
        if (period) params.append('period', period);
        return jsonFetch<CostPoolModel[]>(`/api/business-framework/cost-pools?${params}`);
    },

    async createCostPool(data: {
        companyId: string;
        name: string;
        type: CostPool;
        description?: string;
        amount: number;
        period: string;
    }): Promise<CostPoolModel> {
        return jsonFetch<CostPoolModel>('/api/business-framework/cost-pools', {
            method: 'POST',
            json: data
        });
    },

    // Business Insights
    async getBusinessInsights(companyId: string, period?: string, category?: InsightCategory): Promise<BusinessInsight[]> {
        const params = new URLSearchParams({ companyId });
        if (period) params.append('period', period);
        if (category) params.append('category', category);
        return jsonFetch<BusinessInsight[]>(`/api/business-framework/insights?${params}`);
    },

    async generateBusinessInsights(companyId: string, period: string): Promise<BusinessInsight[]> {
        return jsonFetch<BusinessInsight[]>('/api/business-framework/insights/generate', {
            method: 'POST',
            json: { companyId, period }
        });
    },

    // Framework Overview
    async getFrameworkOverview(companyId: string, period?: string): Promise<FrameworkOverview> {
        const params = new URLSearchParams({ companyId });
        if (period) params.append('period', period);
        return jsonFetch<FrameworkOverview>(`/api/business-framework/overview?${params}`);
    },
    };

export default api;
