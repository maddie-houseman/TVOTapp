```mermaid
erDiagram
  COMPANY ||--o{ USER : ""
  COMPANY ||--o{ L1_OPERATIONAL_INPUT : ""
  COMPANY ||--o{ L2_ALLOCATION_WEIGHT : ""
  COMPANY ||--o{ L3_BENEFIT_WEIGHT : ""
  COMPANY ||--o{ L4_ROI_SNAPSHOT : ""

  USER }o--|| COMPANY : ""
  USER ||--o{ L1_OPERATIONAL_INPUT : ""
  USER ||--o{ L2_ALLOCATION_WEIGHT : ""
  USER ||--o{ L3_BENEFIT_WEIGHT : ""
  USER ||--o{ L4_ROI_SNAPSHOT : ""

```
