# TBM Framework Implementation

This document describes the implementation of the Technology Business Management (TBM) framework extension to the existing L1-L4 system.

## Overview

The TBM implementation extends the current 4-layer framework while maintaining **100% backward compatibility** with existing UI and API contracts. The system now supports:

- **Cost Pools** → **Resource Towers** → **Solutions** → **Business** allocation flow
- **Advanced financial calculations** (ROI, NPV, IRR, Payback)
- **Materialized views** for performance
- **Allocation pipeline** for automated cost distribution

## Architecture

### Data Flow
```
L1 (Department Budgets) → Cost Pool Spend
L2 (Tower Weights) → Allocation Rules (Cost Pool → Resource Tower)
L3 (Benefit Weights) → Benefit Metrics
L4 (Assumptions) → Financial Calculations

Allocation Pipeline:
Cost Pool Spend → Tower Costs → Solution Costs → Business Costs
```

### New Database Tables

#### Core TBM Tables
- `DepartmentModel` - Departments (mapped from enum)
- `CostPool` - Cost pools (e.g., "Department IT Budget")
- `CostPoolSpend` - Actual spend amounts per department/period
- `ResourceTower` - TBM towers (Application, Cloud, etc.)
- `AllocationRuleCpToRt` - Rules for Cost Pool → Resource Tower allocation
- `Solution` - Solutions (e.g., "Run - Engineering")
- `AllocationRuleRtToSol` - Rules for Resource Tower → Solution allocation
- `BenefitMetric` - Benefit measurement categories
- `InitiativeCost` - Initiative-specific costs
- `InitiativeBenefit` - Initiative-specific benefits

#### Materialized Results
- `TowerCost` - Computed tower costs per department
- `SolutionCost` - Computed solution costs
- `BusinessCost` - Computed business costs

## Setup Instructions

### 1. Database Migration
```bash
# Generate Prisma client with new schema
npx prisma generate

# Push schema to database
npx prisma db push
```

### 2. Seed TBM Reference Data
```bash
# Seed departments, cost pools, resource towers, and benefit metrics
npm run seed-tbm
```

### 3. Migrate Existing Data
```bash
# Convert existing L1-L4 data to TBM structure
npm run migrate-to-tbm
```

### 4. Run Allocation Pipeline
```bash
# Compute tower costs, solution costs, and business costs
npm run allocation-pipeline
```

### 5. Complete Setup (All Steps)
```bash
# Run all setup steps in sequence
npm run setup-tbm
```

## API Changes

### Backward Compatibility
All existing API endpoints (`/api/l1`, `/api/l2`, `/api/l3`, `/api/l4`) maintain their exact same:
- Request/response formats
- Validation rules
- Error handling
- Authentication

### New Functionality
- L1 data now creates both legacy records AND TBM cost pool spend
- L2 data now creates both legacy records AND TBM allocation rules
- L4 calculations use TBM data when available, fallback to legacy

### Enhanced L4 Calculation
The L4 endpoint now:
1. **Tries TBM calculation first** using solution costs
2. **Falls back to legacy** if no TBM data exists
3. **Returns same format** regardless of calculation method

## Allocation Pipeline

The allocation pipeline runs automatically and computes:

### Step 1: Tower Costs
```sql
-- Cost Pool Spend → Tower Costs
SELECT period, resourceTowerId, departmentId,
       SUM(amount * percent) AS amount
FROM costPoolSpend s
JOIN allocationRulesCpToRt r ON ...
GROUP BY period, resourceTowerId, departmentId
```

### Step 2: Solution Costs
```sql
-- Tower Costs → Solution Costs
SELECT period, solutionId, SUM(amount * percent) AS amount
FROM towerCosts t
JOIN allocationRulesRtToSol r ON ...
GROUP BY period, solutionId
```

### Step 3: Business Costs
```sql
-- Solution Costs → Business Costs
SELECT period, departmentId, businessTag, SUM(amount) AS amount
FROM solutionCosts sc
JOIN solutions s ON ...
GROUP BY period, departmentId, businessTag
```

## Running the Pipeline

### Manual Execution
```bash
# Run for current period
npm run allocation-pipeline

# Run for specific period
npm run allocation-pipeline 2024-01
```

### Automated Execution
The pipeline is designed to be run as a nightly job:
```bash
# Add to crontab for nightly execution at 2 AM
0 2 * * * cd /path/to/server && npm run allocation-pipeline
```

## Validation & Reconciliation

### Weight Validation
- L2 weights must sum to 1.0 per department/period
- L3 weights must sum to 1.0 per period
- Allocation rules maintain the same validation

### Reconciliation Checks
```bash
# Verify allocation integrity
curl /api/health/recon?period=2024-01
```

Expected response:
```json
{
  "status": "OK",
  "period": "2024-01",
  "checks": {
    "costPoolSpend": 100000,
    "towerCosts": 100000,
    "solutionCosts": 100000,
    "tolerance": "±0.5%"
  }
}
```

## Dashboard Parity

The dashboard will show **identical results** to the previous system:
- **Total Cost**: Same value (now from solution costs)
- **Total Benefit**: Same calculation (productivity + revenue)
- **ROI %**: Same formula and result

### Optional Advanced Metrics
New metrics available behind feature flags:
- **Unit Costs**: Cost per vCPU-hour, per user, etc.
- **NPV/IRR**: Advanced financial metrics
- **Payback Period**: Time to recover investment
- **Savings Opportunities**: AI-powered recommendations

## Troubleshooting

### Common Issues

1. **"No TBM data found"**
   - Run `npm run seed-tbm` to create reference data
   - Run `npm run migrate-to-tbm` to convert existing data

2. **"Allocation pipeline failed"**
   - Check that L1 and L2 data exists
   - Verify allocation rules sum to 1.0
   - Run pipeline manually: `npm run allocation-pipeline`

3. **"Dashboard shows different results"**
   - Run reconciliation check
   - Verify allocation pipeline completed successfully
   - Check that TBM data exists for the period

### Debug Commands
```bash
# Check TBM data exists
npx prisma studio

# Verify allocation rules
SELECT department, tower, SUM(percent) 
FROM allocationRulesCpToRt 
GROUP BY department, period;

# Check materialized results
SELECT * FROM towerCosts WHERE period = '2024-01-01';
SELECT * FROM solutionCosts WHERE period = '2024-01-01';
```

## Performance Considerations

### Materialized Views
- Tower costs, solution costs, and business costs are pre-computed
- Updates happen via allocation pipeline (not real-time)
- Significantly faster than computing on-demand

### Indexing
- All period-based queries are indexed
- Unique constraints prevent duplicate data
- Foreign key relationships maintain integrity

### Scaling
- Pipeline can be run per-company for large deployments
- Materialized results can be partitioned by period
- Consider read replicas for dashboard queries

## Future Enhancements

### Phase 2 Features
- **Unit Cost Tracking**: Track cost per vCPU, per user, per transaction
- **Advanced Analytics**: Trend analysis, benchmarking, forecasting
- **AI Insights**: Automated recommendations for cost optimization
- **Multi-Currency**: Support for multiple currencies and FX rates

### Phase 3 Features
- **Value Stream Mapping**: Map solutions to business value streams
- **Chargeback**: Automated IT chargeback to business units
- **Budget Planning**: Integrated budget planning and forecasting
- **Compliance**: SOX, GDPR, and other compliance reporting

## Support

For issues or questions:
1. Check this documentation
2. Review the troubleshooting section
3. Check server logs for detailed error messages
4. Verify database schema and data integrity
