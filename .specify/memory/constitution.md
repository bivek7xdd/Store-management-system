<!--
Sync Impact Report:
- Version change: [INITIAL] → 1.0.0
- List of modified principles:
  - [NEW] I. Chiaroscuro Aesthetics
  - [NEW] II. Offline-First Resilience
  - [NEW] III. Type-Safe Fullstack
  - [NEW] IV. Layered Security
  - [NEW] V. Spec-Driven Workflow
- Added sections: Technical Constraints, Development Workflow
- Removed sections: None
- Templates requiring updates (✅ updated / ⚠ pending):
  - ✅ updated: .specify/templates/plan-template.md
  - ✅ updated: .specify/templates/spec-template.md
  - ✅ updated: .specify/templates/tasks-template.md
- Follow-up TODOs: None
-->

# Store Management System Constitution

## Core Principles

### I. Chiaroscuro Aesthetics
The application must strictly adhere to the Chiaroscuro design system as defined in `DESIGN.md`. This includes absolute black/white section alternation, the sparse use of Ferrari Red (`#DA291C`) for primary CTAs only, and a razor-sharp 2px border radius for all interactive elements. Every UI component is a "curated vignette" that prioritizes precision and editorial quality over generic friendliness.

### II. Offline-First Resilience
Critical store management workflows—including Point of Sale (Sales), Debt Tracking, and Inventory Management—must remain fully functional without an active internet connection. All local changes must persist to IndexedDB (via Dexie.js) and synchronize automatically with the Go backend when connectivity is restored. Reliability in low-bandwidth environments is a non-negotiable requirement.

### III. Type-Safe Fullstack
Development must maintain strict type safety across the entire stack. The backend must use SQLC to generate type-safe Go code from SQL schemas, and the frontend must use TypeScript without the use of `any` or `interface{}` unless explicitly justified. This principle ensures that schema changes are propagated safely and runtime errors are minimized.

### IV. Layered Security
Protecting store data and user privacy is paramount. All non-public API groups must enforce JWT-based authentication. Sensitive endpoints (Login, OTP, Password Reset) must implement strict rate-limiting and audit logging. Security controls must be implemented at the infrastructure, backend, and frontend layers to provide defense in depth.

### V. Spec-Driven Workflow
To maintain architectural integrity and developer focus, every new feature must progress through the Specify lifecycle: Requirements (Spec) → Technical Design (Plan) → Atomic Implementation (Tasks). Coding should not begin until the Plan has been reviewed and approved. This discipline ensures that complex features are modular, testable, and documented from the start.

## Technical Constraints
- **Backend Architecture**: Go-driven REST API using Gin, SQLC for database access, Redis for caching, and PostgreSQL for persistence.
- **Frontend Architecture**: React application built with Vite and TypeScript, utilizing PrimeReact and Element Plus components styled with Chiaroscuro tokens.
- **Persistence Layer**: Distributed state management between PostgreSQL (Server) and IndexedDB (Client/Offline).

## Development Workflow
- **Branch Management**: All work must be performed in feature branches following the `feat/` convention.
- **Commits**: Atomic commits that reference the specific task being performed.
- **Testing**: Every backend handler requires unit tests with mock DB interfaces. Frontend components must be verified against Chiaroscuro design tokens.

## Governance
- The Constitution is the "supreme law" of the repository. Architectural or design deviations must be justified through a formal amendment process.
- All Pull Requests must verify compliance with the Core Principles.
- The `CONSTITUTION_VERSION` must be bumped according to semantic versioning for every principle or governance change.

**Version**: 1.0.0 | **Ratified**: 2026-04-19 | **Last Amended**: 2026-04-19
