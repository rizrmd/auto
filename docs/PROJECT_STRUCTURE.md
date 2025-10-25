# AutoLeads Project Structure

This document outlines the organized file structure of the AutoLeads platform.

## Directory Structure

```
auto/
├── backend/                    # Backend API and services
│   └── src/
│       ├── bot/               # WhatsApp bot functionality
│       ├── config/            # Configuration files
│       ├── db/                # Database connections and setup
│       ├── llm/               # Language model integration
│       ├── middleware/        # Express middleware
│       ├── routes/            # API routes
│       ├── services/          # Business logic services
│       ├── types/             # TypeScript type definitions
│       ├── utils/             # Backend utility functions
│       ├── validation/        # Input validation schemas
│       └── whatsapp/          # WhatsApp-specific functionality
├── frontend/                   # Frontend application
│   ├── dist/                  # Built frontend files
│   ├── src/                   # Frontend source code
│   │   ├── api/              # API integration layer
│   │   ├── components/       # React components
│   │   ├── context/          # React context providers
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Frontend libraries
│   │   └── pages/            # Page components
│   ├── styles/               # CSS and styling
│   ├── App.tsx               # Main React app
│   ├── index.html            # HTML entry point
│   └── frontend.tsx          # Frontend entry point
├── docs/                      # Documentation (organized by category)
│   ├── deployment/           # Deployment guides and checklists
│   ├── architecture/         # System architecture and requirements
│   ├── guides/               # User guides and references
│   ├── testing/              # Test results and verification reports
│   ├── tasks/                # Task completion reports
│   ├── components/           # Component documentation
│   ├── bot/                  # Bot system documentation
│   ├── storage/              # Storage system documentation
│   └── security/             # Security implementation reports
├── lib/                       # Shared utilities
│   ├── frontend/             # Frontend-specific utilities
│   │   └── utils.ts          # Tailwind/classname utilities
│   └── backend/              # Backend-specific utilities (empty for now)
├── scripts/                   # Automation scripts
│   ├── deployment/           # Deployment-related scripts
│   │   ├── verify-deployment.sh
│   │   ├── verify-deployment.ps1
│   │   ├── production-dashboard.sh
│   │   └── generate-production-secrets.sh
│   ├── migration/           # Data migration scripts
│   │   ├── migrate-storage-to-data.ts
│   │   └── verify-storage-migration.ts
│   ├── testing/             # Testing and verification scripts
│   │   ├── smoke-test.sh
│   │   └── test-rate-limiter.sh
│   └── README.md            # Scripts documentation
├── tests/                     # Test suites
│   └── security/            # Security tests
├── prisma/                    # Database schema and migrations
│   ├── migrations/          # Database migration files
│   └── schema.prisma        # Database schema definition
├── generated/                # Auto-generated files (Prisma client)
└── .claude/                  # Claude Code configuration
    └── agents/               # Custom agent configurations
```

## Key Organizational Principles

1. **Separation of Concerns**: Backend and frontend code are clearly separated
2. **Documentation Organization**: All documentation is categorized in the `docs/` directory
3. **Script Organization**: Scripts are categorized by function (deployment, migration, testing)
4. **Shared Utilities**: Common utilities are in the `lib/` directory, separated by platform
5. **Generated Files**: Auto-generated code (Prisma client) is isolated in `generated/`

## File Naming Conventions

- **TypeScript**: `.ts` for regular files, `.tsx` for React components
- **Documentation**: `KEBAB_CASE.md` with descriptive names
- **Scripts**: Descriptive names with appropriate extensions (`.sh`, `.ps1`, `.ts`)
- **Components**: PascalCase for React components
- **Utilities**: camelCase for utility functions

## Getting Started

Refer to the documentation in the respective directories:
- `docs/deployment/` for deployment information
- `docs/guides/` for development guides
- `scripts/README.md` for available automation scripts