// client/src/pages/FrameworkEntry.tsx
import { useEffect, useState } from 'react';
import { api, type Me, type Department, } from '../lib/api';

export default function FrameworkEntry() {
  // auth / context
  const [me, setMe] = useState<Me | null>(null);

  // period YYYY-MM (we send YYYY-MM-01 to the server)
  const [period, setPeriod] = useState<string>(new Date().toISOString().slice(0, 7));

  // --- L1 - inputs
  const [dept, setDept] = useState<Department>('ENGINEERING');
  const [employees, setEmployees] = useState<number>(10);
  const [budget, setBudget] = useState<number>(200000);

  // --- L2 - tower weights; must sum to 1
  const [appDev, setAppDev] = useState<number>(0.7);
  const [cloud, setCloud] = useState<number>(0.3);
  const [endUser, setEndUser] = useState<number>(0);

  // --- L3 - benefit weights; must sum to 1
  const [prod, setProd] = useState<number>(0.6);
  const [rev, setRev] = useState<number>(0.4);

  // --- L4 - assumptions for snapshot / ROI
  const [uplift, setUplift] = useState<number>(100000);
  const [hours, setHours] = useState<number>(400);
  const [rate, setRate] = useState<number>(50);

  // loading current user
  useEffect(() => {
    api.me().then(setMe).catch(() => setMe(null));
  }, []);

  if (!me) return <div className="text-sm">Please login.</div>;
  const companyId = me?.companyId ?? '';
  const full = `${period}-01`; // server expects YYYY-MM-DD

  // ----- Actions -----
  async function saveL1() {
    if (!companyId) return alert('No company in context');
    await api.l1Upsert({
      companyId,
      period: full,
      department: dept,
      employees,
      budget,
    });
    alert('Saved L1');
  }

  async function saveL2() {
    if (!companyId) return alert('No company in context');

    await Promise.all([
      api.l2Upsert({ companyId, period: full, department: dept, tower: 'APP_DEV', weightPct: appDev }),
      api.l2Upsert({ companyId, period: full, department: dept, tower: 'CLOUD', weightPct: cloud }),
      api.l2Upsert({ companyId, period: full, department: dept, tower: 'END_USER', weightPct: endUser }),
    ]);
    alert('Saved L2');
  }

  async function saveL3() {
    if (!companyId) return alert('No company in context');

    await Promise.all([
      api.l3Upsert({ companyId, period: full, category: 'PRODUCTIVITY', weightPct: prod }),
      api.l3Upsert({ companyId, period: full, category: 'REVENUE_UPLIFT', weightPct: rev }),
    ]);
    alert('Saved L3');
  }

  async function computeAndSave() {
    if (!companyId) return alert('No company in context');

    await api.snapshot(companyId, full, {
      revenueUplift: uplift,
      productivityGainHours: hours,
      avgLoadedRate: rate,
    });
    alert('Snapshot computed & saved');
  }

  // helpers for numeric inputs
  const num = (v: string) => Number(v);

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold text-lg">Framework Entry</h2>

      {/* Period */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <div className="text-sm mb-1">Period (YYYY-MM)</div>
          <input
            className="input"
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </label>
      </div>

      {/* L1 */}
      <div>
        <h3 className="font-semibold mb-2">L1 – Operational inputs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <div className="text-sm mb-1">Department</div>
            <select
              className="input"
              value={dept}
              onChange={(e) => setDept(e.target.value as Department)}
            >
              {(['ENGINEERING', 'SALES', 'FINANCE', 'HR', 'MARKETING', 'OPERATIONS'] as Department[]).map(
                (d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="block">
            <div className="text-sm mb-1">Employees</div>
            <input
              className="input"
              type="number"
              min={0}
              value={employees}
              onChange={(e) => setEmployees(num(e.target.value))}
            />
          </label>

          <label className="block">
            <div className="text-sm mb-1">Budget</div>
            <input
              className="input"
              type="number"
              min={0}
              value={budget}
              onChange={(e) => setBudget(num(e.target.value))}
            />
          </label>
        </div>

        <div className="mt-3">
          <button className="btn" onClick={saveL1}>
            Save L1
          </button>
        </div>
      </div>

      {/* L2 */}
      <div>
        <h3 className="font-semibold mb-2">L2 – Allocation weights (sum to 1)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <div className="text-sm mb-1">APP_DEV</div>
            <input
              className="input"
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={appDev}
              onChange={(e) => setAppDev(num(e.target.value))}
            />
          </label>
          <label className="block">
            <div className="text-sm mb-1">CLOUD</div>
            <input
              className="input"
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={cloud}
              onChange={(e) => setCloud(num(e.target.value))}
            />
          </label>
          <label className="block">
            <div className="text-sm mb-1">END_USER</div>
            <input
              className="input"
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={endUser}
              onChange={(e) => setEndUser(num(e.target.value))}
            />
          </label>
        </div>
        <div className="text-xs text-gray-600 mt-1">
          Current sum: {(appDev + cloud + endUser).toFixed(3)}
        </div>

        <div className="mt-3">
          <button className="btn" onClick={saveL2}>
            Save L2
          </button>
        </div>
      </div>

      {/* L3 */}
      <div>
        <h3 className="font-semibold mb-2">L3 – Benefit weights (sum to 1)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <div className="text-sm mb-1">PRODUCTIVITY</div>
            <input
              className="input"
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={prod}
              onChange={(e) => setProd(num(e.target.value))}
            />
          </label>
          <label className="block">
            <div className="text-sm mb-1">REVENUE_UPLIFT</div>
            <input
              className="input"
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={rev}
              onChange={(e) => setRev(num(e.target.value))}
            />
          </label>
        </div>
        <div className="text-xs text-gray-600 mt-1">
          Current sum: {(prod + rev).toFixed(3)}
        </div>

        <div className="mt-3">
          <button className="btn" onClick={saveL3}>
            Save L3
          </button>
        </div>
      </div>

      {/*  L4 assumptions + compute */}
      <div>
        <h3 className="font-semibold mb-2">FAKE DATA FOR DEMO</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <div className="text-sm mb-1">Revenue uplift</div>
            <input
              className="input"
              type="number"
              min={0}
              value={uplift}
              onChange={(e) => setUplift(num(e.target.value))}
            />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Productivity gain (hours)</div>
            <input
              className="input"
              type="number"
              min={0}
              value={hours}
              onChange={(e) => setHours(num(e.target.value))}
            />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Avg loaded rate</div>
            <input
              className="input"
              type="number"
              min={0}
              value={rate}
              onChange={(e) => setRate(num(e.target.value))}
            />
          </label>
        </div>

        <div className="mt-3">
          <button className="btn" onClick={computeAndSave}>
            Compute &amp; Save Snapshot
          </button>
        </div>
      </div>
    </div>
  );
}
