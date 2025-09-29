    // client/src/lib/api.ts

    /* --------------------------------- Types ---------------------------------- */

    export type Role = "ADMIN" | "EMPLOYEE";

    export type Me = {
    id: string;
    role: Role;
    companyId: string | null;
    };

    export type Department =
    | "ENGINEERING"
    | "SALES"
    | "FINANCE"
    | "HR"
    | "MARKETING"
    | "OPERATIONS";

    export type Tower = "APP_DEV" | "CLOUD" | "END_USER";

    export type L3Category = "PRODUCTIVITY" | "REVENUE_UPLIFT";

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

    /* ------------------------------ Configuration ----------------------------- */

    const BASE =
    import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

    const API_KEY = (import.meta.env.VITE_API_KEY as string | undefined) ?? undefined;

    /* --------------------------------- Helpers -------------------------------- */

    function withBase(path: string): string {
    return /^https?:\/\//i.test(path) ? path : `${BASE}${path}`;
    }

    async function toApiError(res: Response): Promise<Error> {
    const text = await res.text();
    let message = `HTTP ${res.status}`;

    try {
        const data = text ? JSON.parse(text) : undefined;
        if (typeof data === "string") message = data;
        else if (data && typeof data === "object" && "error" in data) {
        message = String((data as Record<string, unknown>).error);
        } else if (text) {
        message = text;
        }
    } catch {
        if (text) message = text;
    }

    return new Error(message);
    }

    function isHttpStatus(e: unknown, code: number): e is Error {
    return e instanceof Error && new RegExp(`^HTTP\\s+${code}\\b`).test(e.message);
    }

    async function jsonFetch<T>(
    path: string,
    init?: RequestInit & { json?: unknown }
    ): Promise<T> {
    const { json, ...rest } = init ?? {};
    const headers: HeadersInit = {
        ...(rest.headers ?? {}),
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(API_KEY ? { "x-api-key": API_KEY } : {}),
    };

    const res = await fetch(withBase(path), {
        credentials: "include",
        ...rest,
        headers,
        body: json !== undefined ? JSON.stringify(json) : rest.body,
    });

    if (!res.ok) throw await toApiError(res);
    const text = await res.text();
    return (text ? (JSON.parse(text) as T) : (undefined as unknown as T));
    }

    /* ---------------------------------- API ----------------------------------- */

    export const api = {
    // ---- Auth ----
    async login(email: string, password: string): Promise<{ ok: boolean }> {
        return jsonFetch<{ ok: boolean }>("/api/auth/login", {
        method: "POST",
        json: { email, password },
        });
    },

    async me(): Promise<Me | null> {
        try {
        return await jsonFetch<Me>("/api/auth/me");
        } catch (e) {
        if (isHttpStatus(e, 401)) return null;
        throw e instanceof Error ? e : new Error(String(e));
        }
    },

    async logout(): Promise<void> {
        await jsonFetch<void>("/api/auth/logout", { method: "POST" });
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

    // ---- L4 (Snapshots) ----
    async snapshot(params: {
        companyId: string;
        period: string;
        assumptions: SnapshotAssumptions;
    }): Promise<L4Snapshot> {
        const { companyId, period, assumptions } = params;
        return jsonFetch<L4Snapshot>("/api/l4/snapshot", {
        method: "POST",
        json: { companyId, period, assumptions },
        });
    },

    async snapshots(companyId: string): Promise<L4Snapshot[]> {
        return jsonFetch<L4Snapshot[]>(`/api/l4/snapshots/${companyId}`);
    },
    };

    export default api;
