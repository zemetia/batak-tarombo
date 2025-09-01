# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (runs on port 9002 with Turbopack)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Type checking**: `npm run typecheck`
- **Database commands**:
  - Generate Prisma client: `npm run db:generate`
  - Run migrations: `npm run db:migrate`
  - Seed database: `npm run db:seed`
  - Open Prisma Studio: `npm run db:studio`
- **AI Development**:
  - Start Genkit development: `npm run genkit:dev`
  - Watch Genkit development: `npm run genkit:watch`

## Architecture Overview

**Batak Lineage** is a Next.js 15 application for visualizing and managing Batak family lineage data. The app allows users to explore ancestral connections through an interactive graph visualization and contribute to the family tree.

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **UI**: Radix UI components with Tailwind CSS
- **Graph Visualization**: ReactFlow with Dagre layout
- **Authentication**: Custom auth system with bcrypt
- **AI Integration**: Google Genkit with Gemini 2.0 Flash

### Key Architecture Patterns

**Data Layer**:
- Prisma schema defines core entities: `Person`, `Contributor`, `Admin`, `DataSubmission`, `ProposedPerson`
- Service layer in `src/services/` handles all database operations
- Server actions in `src/lib/actions.ts` provide the API interface

**Frontend Architecture**:
- Client-side state management using React hooks
- Custom components for lineage visualization (`lineage-graph.tsx`)
- Radix UI design system with custom styling
- Search functionality with real-time suggestions

**Database Schema**:
- `Person`: Main lineage data with hierarchical relationships (father-children)
- `Contributor`: Users who can submit lineage data
- `DataSubmission`: Pending changes with approval workflow
- `ProposedPerson`: Temporary entities for submissions under review

### Component Structure

**Core Components**:
- `lineage-graph.tsx`: Main ReactFlow visualization with interactive nodes
- `custom-node.tsx` & `editable-node.tsx`: Graph node implementations
- `ancestor-profile.tsx`: Person detail view
- `person-form.tsx`: Form for adding/editing people

**Key Features**:
- Interactive lineage graph with search and navigation
- User authentication and contribution system
- Admin panel for managing submissions
- Responsive design with mobile support

### Development Notes

- Uses custom fonts: Playfair Display (headings) and PT Sans (body)
- Color scheme: Red primary (#E53935), Black secondary (#212121)
- All database operations go through service layer
- Authentication uses session-based approach
- AI features integrated via Google Genkit for enhanced functionality