-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'ADMIN');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('ENGINEERING', 'SALES', 'MARKETING', 'FINANCE', 'HR', 'OPERATIONS', 'OTHER');

-- CreateEnum
CREATE TYPE "TbmTower" AS ENUM ('APP_DEV', 'SERVICE_DESK', 'DATA_CENTER', 'NETWORK', 'END_USER', 'SECURITY', 'CLOUD', 'OTHER');

-- CreateEnum
CREATE TYPE "BenefitCategory" AS ENUM ('REVENUE_UPLIFT', 'PRODUCTIVITY', 'RISK_AVOIDANCE', 'COST_AVOIDANCE', 'OTHER');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "L1OperationalInput" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "department" "Department" NOT NULL,
    "employees" INTEGER NOT NULL,
    "budget" DECIMAL(18,2) NOT NULL,
    "baselineKpi" DECIMAL(18,4),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "L1OperationalInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "L2AllocationWeight" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "department" "Department" NOT NULL,
    "tower" "TbmTower" NOT NULL,
    "weightPct" DECIMAL(7,4) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "L2AllocationWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "L3BenefitWeight" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "category" "BenefitCategory" NOT NULL,
    "weightPct" DECIMAL(7,4) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "L3BenefitWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "L4RoiSnapshot" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "totalCost" DECIMAL(18,2) NOT NULL,
    "totalBenefit" DECIMAL(18,2) NOT NULL,
    "roiPct" DECIMAL(9,4) NOT NULL,
    "assumptions" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "L4RoiSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_domain_key" ON "Company"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "L1OperationalInput_companyId_period_idx" ON "L1OperationalInput"("companyId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "L1OperationalInput_companyId_period_department_key" ON "L1OperationalInput"("companyId", "period", "department");

-- CreateIndex
CREATE INDEX "L2AllocationWeight_companyId_period_idx" ON "L2AllocationWeight"("companyId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "L2AllocationWeight_companyId_period_department_tower_key" ON "L2AllocationWeight"("companyId", "period", "department", "tower");

-- CreateIndex
CREATE INDEX "L3BenefitWeight_companyId_period_idx" ON "L3BenefitWeight"("companyId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "L3BenefitWeight_companyId_period_category_key" ON "L3BenefitWeight"("companyId", "period", "category");

-- CreateIndex
CREATE INDEX "L4RoiSnapshot_companyId_period_idx" ON "L4RoiSnapshot"("companyId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "L4RoiSnapshot_companyId_period_key" ON "L4RoiSnapshot"("companyId", "period");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "L1OperationalInput" ADD CONSTRAINT "L1OperationalInput_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "L1OperationalInput" ADD CONSTRAINT "L1OperationalInput_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "L2AllocationWeight" ADD CONSTRAINT "L2AllocationWeight_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "L2AllocationWeight" ADD CONSTRAINT "L2AllocationWeight_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "L3BenefitWeight" ADD CONSTRAINT "L3BenefitWeight_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "L3BenefitWeight" ADD CONSTRAINT "L3BenefitWeight_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "L4RoiSnapshot" ADD CONSTRAINT "L4RoiSnapshot_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "L4RoiSnapshot" ADD CONSTRAINT "L4RoiSnapshot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
