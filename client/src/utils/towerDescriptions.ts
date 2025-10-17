// Tower category descriptions based on Technology Resource Towers framework

export type TowerCategory = "INFRASTRUCTURE" | "APPLICATIONS" | "OPERATIONS" | "FIELD_OFFICE";

export const TOWER_DESCRIPTIONS: Record<TowerCategory, {
  name: string;
  description: string;
  includes: string[];
}> = {
  INFRASTRUCTURE: {
    name: "Infrastructure",
    description: "Core technology infrastructure and foundational systems",
    includes: [
      "Data Center facilities and management",
      "Storage systems and data repositories", 
      "Compute resources and servers",
      "Network infrastructure and connectivity"
    ]
  },
  APPLICATIONS: {
    name: "Applications", 
    description: "Software applications and data platforms",
    includes: [
      "Application development and maintenance",
      "Data management and analytics platforms",
      "Business application platforms",
      "Integration and middleware systems"
    ]
  },
  OPERATIONS: {
    name: "Operations",
    description: "IT operations, security, and governance",
    includes: [
      "Delivery and deployment processes",
      "Security systems and monitoring",
      "Technology management and governance", 
      "Risk management and compliance"
    ]
  },
  FIELD_OFFICE: {
    name: "Field & Office",
    description: "End-user technology and field operations",
    includes: [
      "Smart devices and IoT systems",
      "End-user computing and support",
      "Field technology and mobile solutions",
      "Office productivity tools"
    ]
  }
};

// Utility functions
export function getTowerDescription(tower: TowerCategory) {
  return TOWER_DESCRIPTIONS[tower];
}

export function getAllTowerCategories(): TowerCategory[] {
  return Object.keys(TOWER_DESCRIPTIONS) as TowerCategory[];
}

export function getTowerDisplayName(tower: TowerCategory): string {
  return TOWER_DESCRIPTIONS[tower].name;
}
