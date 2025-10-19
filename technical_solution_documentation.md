# Technical Solution Documentation

## 1. System Structure

### a) Hosting

**Evidence (file: server/src/index.ts:1-15)**
The web application is hosted on Railway, a cloud platform that provides secure, scalable hosting. Railway automatically handles server deployment, database connections, and SSL certificates to ensure the application is accessible worldwide with enterprise-grade security.

**Evidence (file: Railway deployment logs)**
Railway deployment logs showing successful container deployment and health checks, confirming the application is running on a stable, managed infrastructure.

**Evidence (file: client environment variables)**
Environment variables configuration showing VITE_API_BASE pointing to the production API endpoint, enabling secure communication between the frontend and backend services.

**Evidence (file: Network tab showing CORS headers)**
Browser developer tools displaying secure CORS headers, credential settings, and cookie configurations that protect user data during cross-origin requests.

The application runs on a secure, managed hosting platform that automatically handles security certificates, database connections, and server scaling. Users can access the system from any web browser without needing to install special software.

### b) Architecture

**Evidence (file: server/src/index.ts:1-25 and client/src/App.tsx:1-20)**
The system uses a modern three-tier architecture with React for the user interface, Express.js for the business logic, and PostgreSQL for data storage. This separation allows each component to be developed, tested, and maintained independently while ensuring data flows securely between layers.

**Evidence (file: server/prisma/schema.prisma:1-50)**
Database schema showing the relationships between companies, users, and TBM framework data. The schema ensures data integrity and prevents unauthorized access between different companies' information.

**Evidence (file: server/src/index.ts:15-30)**
Express.js server setup with modular route organization, showing how different business functions (authentication, data entry, calculations) are separated into logical components for maintainability.

**Evidence (file: client/src/App.tsx:10-25)**
React application structure with authentication context and navigation, demonstrating how the user interface is organized into reusable components that provide a consistent experience.

The system is built using industry-standard technologies that separate the user interface from business logic and data storage. This approach makes the system reliable, secure, and easy to maintain while allowing for future enhancements.

### c) Routing

**Evidence (file: client/src/main.tsx:1-15 and client/src/components/Navigation.tsx:1-30)**
React Router manages navigation between different pages of the application, ensuring users can only access features they're authorized to use. The navigation system provides clear visual feedback about the current page and available options.

**Evidence (file: Browser showing navigation bar)**
Screenshot of the application navigation bar displaying active route highlighting and URL structure, showing how users can navigate between different sections of the TBM framework.

**Evidence (file: Browser developer tools showing route structure)**
React Developer Tools displaying the component hierarchy and route configuration, demonstrating how the application manages different pages and user permissions.

**Evidence (file: Network tab showing /api/auth/me)**
Browser network tab showing authentication API calls that verify user identity and permissions before allowing access to sensitive business data.

The application uses intelligent routing that automatically checks user permissions and redirects unauthorized users to appropriate pages. This ensures that business data remains secure while providing a smooth user experience.

## 2. User Account Management

### a) Registration and Login

**Evidence (file: client/src/pages/Login.tsx:1-50 and server/src/routes/auth.ts:1-40)**
The login system uses secure authentication that protects user credentials and maintains session security. Users can register with their company information and are automatically assigned appropriate access levels based on their role.

**Evidence (file: Login form with network tab)**
Screenshot showing the login interface with secure form fields and network requests demonstrating successful authentication with secure cookie responses.

**Evidence (file: User registration form)**
Registration form displaying fields for user details, company information, and role assignment, with validation to ensure data quality and security.

**Evidence (file: server/src/routes/admin.ts:1-30)**
Admin seed route implementation showing secure administrator account creation with API key protection, ensuring only authorized personnel can create initial system accounts.

The authentication system provides secure access control that protects business data while allowing authorized users to easily log in and access their company's TBM framework information.

### b) Security

**Evidence (file: Environment variables showing JWT_SECRET, COOKIE_SAMESITE, COOKIE_SECURE)**
Security configuration displaying encrypted session management, secure cookie settings, and authentication tokens that protect user sessions from unauthorized access.

**Evidence (file: server/src/routes/auth.ts:20-35)**
Password hashing implementation using industry-standard bcrypt encryption, ensuring user passwords are never stored in readable format and are protected against data breaches.

**Evidence (file: JWT token creation and validation)**
Secure session token implementation that automatically expires and validates user sessions, preventing unauthorized access even if session data is compromised.

**Evidence (file: HTTP-Only secure cookie implementation)**
Cookie security configuration that prevents malicious scripts from accessing authentication data, ensuring user sessions remain secure across different browsers and devices.

The security system uses multiple layers of protection including encrypted passwords, secure session management, and protected data transmission to ensure business information remains confidential and secure.

### c) Access Control

**Evidence (file: server/src/routes/l1.ts:1-30 and server/src/middleware/rbac.ts:1-25)**
Role-based access control system that ensures users can only access their own company's data while administrators have appropriate oversight capabilities. The system automatically enforces data isolation between different organizations.

**Evidence (file: 403 response when accessing other company data)**
Network tab showing access denied responses when users attempt to access data from different companies, demonstrating the security boundaries that protect business information.

**Evidence (file: RBAC middleware for company data isolation)**
Server-side middleware implementation that automatically checks user permissions and company associations before allowing access to sensitive business data.

**Evidence (file: Admin role verification)**
Administrator access control showing how admin users can access multiple companies' data for oversight purposes while regular users are restricted to their own organization.

**Evidence (file: Route protection with authentication middleware)**
API endpoint protection demonstrating how all sensitive business operations require valid authentication and appropriate permissions before execution.

The access control system ensures that each company's TBM data remains completely separate and secure, while providing administrators with appropriate oversight capabilities to manage the system effectively.

## 3. Input System (Data Entry)

### a) Data Submission

**Evidence (file: client/src/pages/FrameworkEntry.tsx:1-100 and server/src/routes/l1.ts:1-50)**
The TBM framework data entry system guides users through a structured four-layer process (L1-L4) that captures operational inputs, allocation weights, benefit priorities, and ROI assumptions. The system provides immediate feedback and validation to ensure data accuracy.

**Evidence (file: L1 form with department, employees, and budget inputs)**
Screenshot of the L1 operational inputs form showing department selection, employee count, and budget amount fields with real-time validation and error checking.

**Evidence (file: L2 weights form with technology tower allocations)**
L2 allocation weights interface displaying Application Development, Cloud Infrastructure, and End User Services weight percentages with automatic sum validation to ensure proper distribution.

**Evidence (file: L3 weights form with benefit category allocations)**
L3 benefit weights form showing Productivity and Revenue Uplift weight percentages with validation to ensure strategic priorities are properly weighted.

**Evidence (file: L4 snapshot button and assumptions form)**
L4 ROI assumptions form with revenue uplift, productivity gain hours, and average loaded rate inputs, plus the compute and save functionality for final calculations.

The data entry system provides an intuitive, step-by-step process that guides users through entering their TBM framework data while ensuring accuracy and completeness through built-in validation and feedback.

### b) Data Mapping

**Evidence (file: server/prisma/schema.prisma:1-100 and client/src/lib/api.ts:1-50)**
The system maps user inputs directly to the TBM framework structure, ensuring that department data, technology allocations, benefit priorities, and ROI assumptions are properly categorized and stored for accurate calculations.

**Evidence (file: UI fields annotated with TBM categories)**
Framework Entry form with visual annotations showing how each input field corresponds to specific TBM framework categories, helping users understand the relationship between their inputs and business outcomes.

**Evidence (file: TBM framework categories and department mapping)**
Database schema demonstrating the TBM framework category mapping with predefined options for departments, technology towers, and benefit categories that ensure consistent data classification.

**Evidence (file: Database schema with TBM framework relationships)**
Database structure showing how L1, L2, L3, and L4 data are interconnected to support comprehensive TBM analysis and reporting.

The data mapping system ensures that all user inputs are properly categorized according to TBM framework standards, enabling accurate cost allocation, benefit analysis, and ROI calculations.

### c) Persistence and Editing

**Evidence (file: server/src/routes/l1.ts:20-60)**
Database operations that automatically save user inputs and allow for easy editing and updates. The system prevents duplicate entries while enabling users to refine their data as business conditions change.

**Evidence (file: Success alert after save)**
User interface showing confirmation messages when data is successfully saved, providing immediate feedback that builds user confidence in the system.

**Evidence (file: Database upsert for data persistence)**
Server-side database operations that handle both creating new records and updating existing ones, ensuring data integrity while allowing iterative refinement of TBM inputs.

**Evidence (file: Data retrieval API for editing)**
API endpoints that allow users to fetch and modify their existing TBM framework data, supporting the iterative nature of business planning and analysis.

The persistence system ensures that all TBM framework data is securely stored and easily accessible for editing, allowing organizations to refine their technology investment strategies over time.

## 4. Backend Calculation Engine

### a) Processing Logic

**Evidence (file: server/src/utils/roi.ts:1-50 and server/src/routes/l4.ts:1-40)**
The calculation engine processes TBM framework data through a structured four-layer approach that transforms operational inputs into meaningful business insights. The system combines cost allocation, benefit weighting, and ROI assumptions to provide comprehensive financial analysis.

**Evidence (file: Diagram of layered flow L1→L2→L3→L4)**
Visual representation of the TBM calculation flow showing how operational inputs flow through allocation weights and benefit priorities to produce ROI analysis and business recommendations.

**Evidence (file: Modular backend TBM logic)**
Server-side calculation functions that implement TBM methodology with separated concerns for cost allocation, benefit calculation, and ROI computation, ensuring maintainable and accurate business logic.

**Evidence (file: L4 ROI snapshot processing)**
L4 snapshot processing that combines multiple TBM calculations into comprehensive ROI analysis, providing executives with actionable insights about technology investment returns.

The processing logic implements industry-standard TBM methodology to transform raw business data into strategic insights that support technology investment decisions and resource allocation.

### b) Calculations

**Evidence (file: server/src/utils/roi.ts:20-80)**
ROI and net benefit calculations that combine revenue uplift, productivity savings, and cost data to provide comprehensive financial analysis. The system generates historical snapshots for trend analysis and performance tracking.

**Evidence (file: Dashboard with ROI/net benefit example)**
Dashboard interface displaying calculated ROI percentages, net benefit amounts, and other financial metrics derived from TBM framework analysis, providing clear visibility into technology investment performance.

**Evidence (file: ROI calculation with financial metrics)**
Server-side ROI calculation algorithm that computes return on investment using cost and benefit inputs, providing accurate financial analysis for technology investments.

**Evidence (file: Cost allocation algorithm)**
Cost allocation algorithm that distributes department budgets across technology towers based on L2 weights, ensuring accurate cost attribution for TBM analysis.

**Evidence (file: Benefit calculation with multiple categories)**
Benefit calculation algorithm that aggregates revenue uplifts, productivity gains, and risk avoidance values to provide comprehensive benefit analysis for technology investments.

The calculation engine provides accurate financial analysis that helps organizations understand the true value of their technology investments and make informed decisions about resource allocation.

### c) Security

**Evidence (file: Environment settings for internal compute)**
Configuration settings that ensure calculation endpoints are only accessible through authenticated API calls, protecting sensitive business calculations from unauthorized access.

**Evidence (file: Secure backend processing)**
Server-side processing with comprehensive input validation and error handling that ensures calculation accuracy while protecting against malicious inputs and data corruption.

**Evidence (file: Protected calculation endpoints)**
Authentication-protected calculation endpoints that ensure only authorized users can access financial calculations and business intelligence features.

The calculation engine maintains security while providing powerful business intelligence capabilities, ensuring that sensitive financial analysis remains protected while delivering valuable insights to authorized users.

## 5. Dashboard

### a) Presentation

**Evidence (file: client/src/pages/Dashboard.tsx:1-100)**
The dashboard presents TBM framework results in a clear, visually appealing format that makes complex financial data accessible to non-technical stakeholders. The interface uses consistent design principles and intuitive layouts to support business decision-making.

**Evidence (file: Full-page screenshot of dashboard layout)**
Complete dashboard interface showing the overall layout, navigation, and main content areas that provide comprehensive visibility into TBM framework results and business performance.

**Evidence (file: Clear, visually appealing dashboard with ROI metrics)**
Dashboard display with clear ROI metrics, cost vs. revenue analysis, and trend visualization that helps executives understand technology investment performance at a glance.

**Evidence (file: Key financial metrics with visual indicators)**
Key metrics display showing total budget, headcount, ROI percentage, and net benefit calculations with visual indicators that highlight important business insights.

The dashboard provides an executive-level view of TBM framework results that enables informed decision-making about technology investments and resource allocation strategies.

### b) Updates

**Evidence (file: client/src/pages/Dashboard.tsx:50-150)**
The dashboard automatically updates when new TBM framework data is submitted, providing immediate visibility into the impact of changes and enabling iterative refinement of technology investment strategies.

**Evidence (file: Before/after screenshots showing updated data)**
Dashboard comparison showing how new inputs immediately update displayed metrics and visualizations, demonstrating the real-time nature of the TBM framework analysis.

**Evidence (file: Dashboard updates with new input data)**
Dynamic dashboard updates with period selection and real-time data refresh capabilities that support ongoing business planning and analysis.

**Evidence (file: Period selection for historical data analysis)**
Period selection interface that allows users to view different time periods and compare historical data, supporting trend analysis and strategic planning.

The dashboard provides real-time visibility into TBM framework results, enabling organizations to track performance, identify trends, and make data-driven decisions about technology investments.

### c) Charts and Visuals

**Evidence (file: client/src/pages/Dashboard.tsx:200-300)**
The dashboard includes comprehensive charting capabilities that visualize TBM framework data through line charts for trends, bar charts for comparisons, and pie charts for proportional analysis.

**Evidence (file: Line/bar/pie chart implementations)**
Chart implementations displaying time-series trends, categorical breakdowns, and proportional data visualizations that make complex TBM data accessible and actionable.

**Evidence (file: Department budget distribution with visual bars)**
Department budget distribution chart with visual progress bars and sorting functionality that helps users understand cost allocation across different business units.

**Evidence (file: Tower allocation with color-coded visualizations)**
Technology tower allocation visualization with color-coded progress bars and percentage displays that clearly show how resources are distributed across different technology areas.

The charting system transforms complex TBM framework data into intuitive visualizations that support business decision-making and stakeholder communication.

## 6. Export and Reporting

### a) Export Capabilities

**Evidence (file: client/src/utils/exportPdf.ts:1-50 and client/src/pages/Dashboard.tsx:300-350)**
The system provides comprehensive export capabilities that allow users to generate PDF reports of their TBM framework analysis. The export functionality preserves all formatting, charts, and data visualizations for professional reporting and stakeholder communication.

**Evidence (file: Print-to-PDF dialog or export UI)**
PDF export interface or browser print dialog when exporting the dashboard to PDF format, showing the user-friendly export process that maintains professional document formatting.

**Evidence (file: PDF export functionality with period-specific naming)**
PDF export implementation that converts dashboard HTML to PDF with preserved formatting and period-specific file naming, ensuring reports are clearly identified and professionally formatted.

**Evidence (file: Export button with period-specific file naming)**
Export button interface that allows users to export the dashboard with the selected period in the filename, supporting organized report management and historical analysis.

The export system enables organizations to create professional reports of their TBM framework analysis that can be shared with stakeholders, included in business presentations, and used for strategic planning documentation.

### b) Data Coverage

**Evidence (file: Historical data analysis capabilities)**
The system maintains comprehensive historical data that enables trend analysis, performance tracking, and strategic planning. Users can compare results across different time periods and analyze the evolution of their technology investment strategies.

**Evidence (file: Projection vs. actual comparison)**
Comparison capabilities that allow organizations to track expected vs. actual ROI performance, supporting variance analysis and continuous improvement of technology investment strategies.

**Evidence (file: Multi-period analysis)**
Multi-period analysis functionality that enables organizations to track TBM framework results over time, identify trends, and make informed decisions about future technology investments.

The data coverage system provides comprehensive historical analysis capabilities that support strategic planning, performance tracking, and continuous improvement of technology investment strategies.

## 7. Usability

### a) User Experience

**Evidence (file: client/src/pages/FrameworkEntry.tsx:1-50)**
The user interface is designed for non-technical business users, with clear labels, intuitive navigation, and helpful guidance throughout the TBM framework data entry process.

**Evidence (file: Clear tooltips and validation messages)**
User interface elements showing clear tooltips, validation messages, and guidance that help users understand TBM framework concepts and enter accurate data.

**Evidence (file: Intuitive navigation and workflow)**
Navigation system that guides users through the TBM framework process with clear progress indicators and logical workflow that minimizes confusion and errors.

**Evidence (file: Responsive design across devices)**
Application interface that works consistently across different devices and screen sizes, ensuring accessibility for users working from various locations and devices.

The user experience is optimized for business users who need to understand and implement TBM framework analysis without requiring technical expertise or extensive training.

### b) Responsiveness

**Evidence (file: Cross-browser compatibility)**
The application works consistently across different web browsers and operating systems, ensuring that all users can access the TBM framework analysis regardless of their technical environment.

**Evidence (file: Mobile and tablet compatibility)**
Responsive design that adapts to different screen sizes and input methods, enabling users to access TBM framework analysis from various devices and locations.

**Evidence (file: Performance optimization)**
Application performance that loads quickly and responds smoothly to user interactions, ensuring a professional user experience that supports efficient business analysis.

The responsiveness system ensures that the TBM framework analysis is accessible to all users regardless of their device, browser, or technical environment, supporting widespread adoption and effective use.

## 8. Data Security

### a) Encryption

**Evidence (file: HTTPS and SSL configuration)**
Secure data transmission using industry-standard encryption protocols that protect all communication between users and the TBM framework system, ensuring business data remains confidential.

**Evidence (file: Database encryption at rest)**
Database security measures that protect stored TBM framework data using encryption, ensuring that sensitive business information remains secure even if storage systems are compromised.

**Evidence (file: Secure session management)**
Session security that protects user authentication and prevents unauthorized access to TBM framework data, ensuring that business analysis remains confidential and secure.

The encryption system provides comprehensive protection for TBM framework data throughout its lifecycle, from initial entry through storage and analysis, ensuring business confidentiality and regulatory compliance.

### b) Access Control

**Evidence (file: Company data isolation)**
Access control system that ensures each company's TBM framework data remains completely separate and secure, preventing unauthorized access to sensitive business information.

**Evidence (file: Role-based permissions)**
User permission system that provides appropriate access levels for different types of users, ensuring that TBM framework data is only accessible to authorized personnel.

**Evidence (file: Audit trail and logging)**
System logging that tracks all access to TBM framework data, providing accountability and supporting compliance with business security requirements.

The access control system ensures that TBM framework data remains secure and accessible only to authorized users, supporting business confidentiality and regulatory compliance requirements.

### c) Query Safety

**Evidence (file: SQL injection protection)**
Database security measures that prevent malicious code injection and protect TBM framework data from unauthorized manipulation or access.

**Evidence (file: Input validation and sanitization)**
Comprehensive input validation that ensures all TBM framework data is properly formatted and secure, preventing data corruption and unauthorized access.

**Evidence (file: Secure API endpoints)**
API security that protects all TBM framework operations from unauthorized access and ensures that business data remains confidential and secure.

The query safety system ensures that all TBM framework data operations are secure and protected from malicious attacks, supporting business confidentiality and data integrity.

## 9. Functionality and Scalability

### a) Load Handling

**Evidence (file: Concurrent user support)**
System architecture that supports multiple users accessing TBM framework analysis simultaneously, ensuring that business operations can continue efficiently regardless of user load.

**Evidence (file: Session management)**
User session management that maintains secure access to TBM framework data while supporting multiple concurrent users and preventing session conflicts.

**Evidence (file: Performance monitoring)**
System performance monitoring that ensures TBM framework analysis remains responsive and efficient even under high user load, supporting business operations and user productivity.

The load handling system ensures that TBM framework analysis remains accessible and efficient for all users, supporting business operations and enabling widespread adoption of technology business management practices.

### b) Scalability

**Evidence (file: Multi-company support)**
System architecture that supports multiple companies using the TBM framework simultaneously, enabling widespread adoption and supporting business growth.

**Evidence (file: Database scalability)**
Database design that supports growing amounts of TBM framework data while maintaining performance and security, ensuring the system can scale with business needs.

**Evidence (file: Modular architecture)**
System architecture that allows for easy expansion and enhancement of TBM framework capabilities, supporting future business requirements and technology evolution.

The scalability system ensures that the TBM framework can grow with business needs while maintaining performance, security, and usability for all users.

## 10. Projection Tracking Over Time

### a) Time-Series Analysis

**Evidence (file: Historical data tracking)**
Comprehensive historical data tracking that enables organizations to monitor TBM framework performance over time, identify trends, and make informed decisions about technology investments.

**Evidence (file: Trend analysis capabilities)**
Trend analysis functionality that helps organizations understand how their technology investments are performing and identify opportunities for improvement.

**Evidence (file: Performance tracking)**
Performance tracking system that monitors TBM framework results over time, enabling organizations to measure the success of their technology investment strategies.

The time-series analysis system provides comprehensive historical tracking that enables organizations to monitor TBM framework performance and make data-driven decisions about technology investments.

### b) Variance Reporting

**Evidence (file: Expected vs. actual comparison)**
Comparison capabilities that allow organizations to track expected vs. actual ROI performance, supporting variance analysis and continuous improvement of technology investment strategies.

**Evidence (file: Variance analysis)**
Variance analysis functionality that helps organizations understand the differences between expected and actual TBM framework results, supporting strategic planning and decision-making.

**Evidence (file: Performance explanations)**
Performance analysis that provides explanations for variances in TBM framework results, helping organizations understand the factors that influence technology investment performance.

The variance reporting system provides comprehensive analysis of TBM framework performance that enables organizations to understand the factors influencing technology investment success and make informed strategic decisions.
