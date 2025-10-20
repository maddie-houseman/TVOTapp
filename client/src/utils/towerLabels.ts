// Tower category label mapping - client-side only
// Maps database values to labels updated

export type DatabaseTower = "APP_DEV" | "CLOUD" | "END_USER";

export type DisplayTower = 
  | "Infrastructure"
  | "Applications" 
  | "Operations";

// Mapping from database values to overlay labels
export const TOWER_LABELS: Record<DatabaseTower, DisplayTower> = {
  APP_DEV: "Applications",
  CLOUD: "Infrastructure", 
  END_USER: "Operations",
};

// Mapping from display labels to database values
export const DISPLAY_TO_TOWER: Record<DisplayTower, DatabaseTower> = {
  "Infrastructure": "CLOUD",
  "Applications": "APP_DEV",
  "Operations": "END_USER",
};

// Tower descriptions 
export const TOWER_DESCRIPTIONS: Record<DisplayTower, {
  description: string;
  includes: string[];
}> = {
  Infrastructure: {
    description: "Core technology infrastructure and foundational systems",
    includes: [
      "Data Center facilities and management",
      "Storage systems and data repositories", 
      "Compute resources and servers",
      "Network infrastructure and connectivity"
    ]
  },
  Applications: {
    description: "Software applications and data platforms",
    includes: [
      "Application development and maintenance",
      "Data management and analytics platforms",
      "Business application platforms",
      "Integration and middleware systems"
    ]
  },
  Operations: {
    description: "IT operations, security, and governance",
    includes: [
      "Delivery and deployment processes",
      "Security systems and monitoring",
      "Technology management and governance", 
      "Risk management and compliance"
    ]
  }
};

export function getDisplayLabel(dbValue: DatabaseTower): DisplayTower {
  return TOWER_LABELS[dbValue];
}

export function getDatabaseValue(displayLabel: DisplayTower): DatabaseTower {
  return DISPLAY_TO_TOWER[displayLabel];
}

export function getAllDisplayLabels(): DisplayTower[] {
  return Object.values(TOWER_LABELS);
}
