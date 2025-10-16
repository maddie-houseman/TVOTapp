// Department label mapping utility
// Maps database enum values to user-friendly display labels

export type DatabaseDepartment = 
  | "ENGINEERING"
  | "SALES"
  | "MARKETING"
  | "FINANCE"
  | "HR"
  | "OPERATIONS";

export type DisplayDepartment = 
  | "Labour"
  | "Cloud Services"
  | "Software & SaaS"
  | "Hardware"
  | "Data Centre Facilities"
  | "Telecom";

// Mapping from database values to display labels
export const DEPARTMENT_LABELS: Record<DatabaseDepartment, DisplayDepartment> = {
  ENGINEERING: "Labour",
  SALES: "Cloud Services", 
  MARKETING: "Software & SaaS",
  FINANCE: "Hardware",
  HR: "Data Centre Facilities",
  OPERATIONS: "Telecom"
};

// Reverse mapping for form selection
export const DISPLAY_TO_DATABASE: Record<DisplayDepartment, DatabaseDepartment> = {
  "Labour": "ENGINEERING",
  "Cloud Services": "SALES",
  "Software & SaaS": "MARKETING", 
  "Hardware": "FINANCE",
  "Data Centre Facilities": "HR",
  "Telecom": "OPERATIONS"
};

// Utility functions
export function getDisplayLabel(databaseValue: DatabaseDepartment): DisplayDepartment {
  return DEPARTMENT_LABELS[databaseValue] || databaseValue as DisplayDepartment;
}

export function getDatabaseValue(displayLabel: DisplayDepartment): DatabaseDepartment {
  return DISPLAY_TO_DATABASE[displayLabel] || displayLabel as DatabaseDepartment;
}

// Get all display labels for dropdowns
export function getAllDisplayLabels(): DisplayDepartment[] {
  return Object.values(DEPARTMENT_LABELS);
}

// Get all database values
export function getAllDatabaseValues(): DatabaseDepartment[] {
  return Object.keys(DEPARTMENT_LABELS) as DatabaseDepartment[];
}
