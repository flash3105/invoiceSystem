System Overview

# InvoicePro ERP System

**[🟢 View Live Application](https://invoice.rvestfundgroup.co.za)**

InvoicePro is a modern, multi-tenant Software as a Service (SaaS) invoicing platform designed to scale into a comprehensive Enterprise Resource Planning (ERP) suite. It provides businesses with a flexible, robust foundation for generating professional bills, managing client profiles, and configuring dynamic business settings without rigid database limitations.

Key Features
Multi-Tenant Architecture: Enforces strict data isolation using compound unique database constraints, ensuring secure and conflict-free operations across multiple business profiles.

Dynamic Custom Fields: Utilizes schema-less JSONB storage to allow businesses to define up to five custom invoice data points (e.g., PO numbers, Practice numbers, Tax IDs) dynamically.

Automated PDF Generation: Integrates server-side rendering to produce high-quality, professional PDF invoices featuring custom logos, automated calculations, and multi-date service itemization.

Intelligent Auto-Numbering: Features a synchronized, conflict-free invoice counter equipped with automated database retry logic to guarantee sequential billing.

Centralized Client Management: Maintains a dedicated client directory that feeds directly into the billing engine for seamless document generation.

Technology Stack
Frontend Environment: Built with React and TypeScript, featuring a responsive, tabbed dashboard UI and Lucide Icons.

Backend Application: Powered by a C# / .NET Core API that handles robust data validation, API routing, and document creation via QuestPDF.

Database Infrastructure: Hosted on PostgreSQL (Supabase), leveraging a hybrid approach of strict relational integrity alongside NoSQL-style JSONB columns for maximum flexibility.

Future Roadmap
Project Management Integration: Hierarchical task tracking, milestone setting, and dynamic project scoping tied directly to client profiles.

Accounting & General Ledger: Automated double-entry bookkeeping transitioning generated invoices into trackable accounts receivable.
