# Azuralis Healthcare Platform - Architecture Documentation

## C4 Model Overview

### System Context (Level 1)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│          Azuralis Healthcare Platform                          │
│          (Medical Record Management System)                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ System Components:                                       │ │
│  │  - Clinical Staff Interface (Web)                        │ │
│  │  - Patient Portal (Web)                                  │ │
│  │  - Guardian Access (Web)                                 │ │
│  │  - Backend API (NestJS)                                  │ │
│  │  - Database (PostgreSQL)                                 │ │
│  │  - Cloud Storage (Cloudflare R2)                         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**External Systems:**
- **PostgreSQL**: Persistent data storage
- **Cloudflare R2**: Document and file storage
- **Email Service**: Notifications (optional)
- **QR/NFC Hardware**: Patient identification (future)

---

### Container Architecture (Level 2)

```
┌────────────────────────────────────────────────────────────────┐
│                    User Interface Layer                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Clinical Web │  │  Patient Web │  │  Guardian Web│        │
│  │   (React)    │  │   (React)    │  │   (React)    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│         │                 │                 │                 │
└─────────┼─────────────────┼─────────────────┼─────────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │ (HTTPS/REST)
          ┌─────────────────┴─────────────────┐
          │                                   │
┌─────────┴──────────────────────────────────┴────────┐
│        Backend API Layer (NestJS)                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ Controllers (API Routes)                    │   │
│  │  - AuthController                           │   │
│  │  - PatientsController                       │   │
│  │  - UsersController                          │   │
│  │  - CareTeamController                       │   │
│  │  - EmergencyAccessController                │   │
│  └─────────────────────────────────────────────┘   │
│                     │                               │
│  ┌─────────────────┴──────────────────────────┐   │
│  │ Business Logic Layer (Services)            │   │
│  │  - AuthService                             │   │
│  │  - PatientsService                         │   │
│  │  - UsersService                            │   │
│  │  - CareTeamService                         │   │
│  │  - DocumentService                         │   │
│  │  - R2StorageService                        │   │
│  └─────────────────────────────────────────────┘   │
│                     │                               │
│  ┌─────────────────┴──────────────────────────┐   │
│  │ Data Access Layer (Repositories/TypeORM)   │   │
│  │  - User Repository                         │   │
│  │  - Patient Repository                      │   │
│  │  - CareTeamMember Repository               │   │
│  │  - PatientNote Repository                  │   │
│  │  - PatientDocument Repository              │   │
│  └─────────────────────────────────────────────┘   │
│                     │                               │
└─────────────────────┼───────────────────────────────┘
                      │
          ┌───────────┼──────────────┐
          │           │              │
    ┌─────┴────┐  ┌──┴─────┐   ┌────┴──────┐
    │           │  │        │   │           │
┌───┴────────┐ │┌─┴──────┐ │ ┌─┴──────────┐│
│ PostgreSQL ├─┤│ R2     │ │ │ Logger     ││
│ (Supabase) │ │└────────┘ │ └────────────┘│
└────────────┘ └──────────┘               │
                                           │
                                    ┌──────┴──────┐
                                    │  Winston    │
                                    │   Logger    │
                                    └─────────────┘
```

---

### Component Diagram (Level 3)

#### Frontend Components (React)

```
App
├── AuthContext
│   ├── Login/Register Logic
│   ├── Token Management
│   └── User State
├── PatientContext
│   ├── Selected Patient State
│   └── Patient Data Cache
└── Pages
    ├── HomePage
    ├── LoginScreen
    ├── RegisterScreen
    ├── DashboardClinicalStaff
    │   ├── PatientSearch
    │   ├── PatientRecord
    │   │   ├── Notes Tab
    │   │   ├── Documents Tab
    │   │   ├── Care Team Tab
    │   │   └── Medical History Tab
    │   └── ManageCareTeam
    ├── DashboardPatient
    │   └── MyMedicalRecord (Read-only)
    ├── DashboardGuardian
    │   └── AssignedPatients
    └── EmergencyAccess
```

#### Backend Components (NestJS)

```
AppModule
├── AuthModule
│   ├── AuthController
│   ├── AuthService
│   ├── JwtStrategy
│   ├── JwtAuthGuard
│   ├── RolesGuard
│   └── Entities: User
├── PatientsModule
│   ├── PatientsController
│   ├── PatientsService
│   └── Entities:
│       ├── Patient
│       ├── PatientNote
│       ├── PatientDocument
│       ├── EmergencyContact
│       ├── Operation
│       └── CareTeamMember
├── UsersModule
│   ├── UsersController
│   ├── UsersService
│   └── User Entity
├── SharedModule
│   ├── R2StorageService
│   ├── EnumProvider (UserRole)
│   └── Decorators
└── Common
    ├── LoggerConfig (Winston)
    └── ValidationRules
```

---

### Data Flow Diagrams

#### Authentication Flow

```
┌──────────────┐
│  User Input  │
│  (Email/PW)  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ RegisterScreen /     │
│ LoginScreen          │
│ (Validation)         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ AuthContext          │
│ (Call API)           │
└──────┬───────────────┘
       │ (HTTPS POST)
       ▼
┌──────────────────────┐
│ AuthController       │
│ (register/login)     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ AuthService          │
│ (Validate & Hash)    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ PostgreSQL           │
│ (User Entity)        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ JWT Token Generated  │
│ (JwtService)         │
└──────┬───────────────┘
       │ (Response)
       ▼
┌──────────────────────┐
│ Frontend             │
│ (Store Token & User) │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Redirect to          │
│ Dashboard            │
└──────────────────────┘
```

#### Patient Record Access Flow

```
┌──────────────┐
│  User Click  │
│ "View Record"│
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ PatientSelector      │
│ (Search by RUT)      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ API Request          │
│ /patients (GET)      │
└──────┬───────────────┘
       │ (With JWT Token)
       ▼
┌──────────────────────┐
│ PatientsController   │
├──────────────────────┤
│ Verify JwtAuthGuard  │
│ Verify RolesGuard    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ PatientsService      │
│ (Query DB)           │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Patient Record       │
│ + Care Team          │
│ + Notes              │
│ + Documents          │
│ + Emergency Contacts │
└──────┬───────────────┘
       │ (Response)
       ▼
┌──────────────────────┐
│ PatientRecord        │
│ Component            │
│ (Display Data)       │
└──────────────────────┘
```

---

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 19.2.0 |
| **Frontend Build** | Vite | Latest |
| **Frontend Styling** | Tailwind CSS | Latest |
| **Frontend UI** | Radix UI | Latest |
| **Backend** | NestJS | 11.0.1 |
| **Backend ORM** | TypeORM | 0.3.27 |
| **Database** | PostgreSQL | 15 |
| **Database Host** | Supabase (Prod) / Docker (Dev) | - |
| **File Storage** | Cloudflare R2 | - |
| **Authentication** | JWT + Passport | - |
| **Validation** | class-validator | 0.14.2 |
| **Logging** | Winston | 3.11.0 |
| **Testing** | Jest | Latest |
| **Testing E2E** | Supertest | Latest |
| **CI/CD** | GitHub Actions | - |

---

### Database Schema Overview

```
User Table
├── id (UUID)
├── email (VARCHAR, UNIQUE)
├── password (VARCHAR, hashed)
├── name (VARCHAR)
├── rut (VARCHAR, UNIQUE)
├── role (ENUM: patient, doctor, nurse, guardian)
├── createdAt (TIMESTAMP)
└── updatedAt (TIMESTAMP)

Patient Table
├── id (UUID)
├── rut (VARCHAR, UNIQUE)
├── name (VARCHAR)
├── dateOfBirth (DATE)
├── gender (ENUM)
├── phone (VARCHAR)
├── email (VARCHAR)
├── address (VARCHAR)
├── allergies (JSON)
├── currentMedications (JSON)
├── cancerType (VARCHAR)
├── cancerStage (VARCHAR)
├── diagnosisDate (DATE)
├── qrCode (VARCHAR, UNIQUE)
├── careTeam (ONE-TO-MANY: CareTeamMember)
├── notes (ONE-TO-MANY: PatientNote)
├── documents (ONE-TO-MANY: PatientDocument)
├── emergencyContacts (ONE-TO-MANY: EmergencyContact)
├── operations (ONE-TO-MANY: Operation)
├── createdAt (TIMESTAMP)
└── updatedAt (TIMESTAMP)

PatientNote Table
├── id (UUID)
├── patientId (UUID, FK)
├── authorId (UUID, FK → User)
├── title (VARCHAR)
├── content (TEXT)
├── createdAt (TIMESTAMP)
└── updatedAt (TIMESTAMP)

CareTeamMember Table
├── id (UUID)
├── patientId (UUID, FK)
├── userId (UUID, FK)
├── role (VARCHAR: Oncólogo, Cirujano, Enfermera, etc.)
├── status (ENUM: active, inactive)
├── createdAt (TIMESTAMP)
└── updatedAt (TIMESTAMP)

PatientDocument Table
├── id (UUID)
├── patientId (UUID, FK)
├── title (VARCHAR)
├── type (VARCHAR)
├── s3Url (VARCHAR) → Cloudflare R2
├── uploadedBy (UUID, FK)
├── uploadedAt (TIMESTAMP)
└── updatedAt (TIMESTAMP)
```

---

### Security Architecture

```
┌─────────────────────────────────────────────────┐
│              Security Layers                    │
├─────────────────────────────────────────────────┤
│                                                 │
│ 1. Transport Security                           │
│    └─ HTTPS/TLS for all communications          │
│                                                 │
│ 2. Authentication (AuthController)              │
│    ├─ Email + Password validation               │
│    ├─ bcrypt password hashing (rounds: 10)      │
│    ├─ JWT token generation (expiry: 24h)        │
│    └─ Refresh token mechanism (optional)        │
│                                                 │
│ 3. Authorization (Guards)                       │
│    ├─ JwtAuthGuard (Token validation)           │
│    ├─ RolesGuard (Role-based access control)    │
│    └─ Custom decorators (@Roles, @Auth)         │
│                                                 │
│ 4. Input Validation (class-validator)           │
│    ├─ Email format validation                   │
│    ├─ Password strength requirements            │
│    ├─ RUT format validation                     │
│    └─ Whitelist non-allowed fields              │
│                                                 │
│ 5. Data Protection                              │
│    ├─ Sensitive fields encrypted (passwords)    │
│    ├─ No sensitive data in logs                 │
│    ├─ PII access logged and audited             │
│    └─ CORS restrictions enabled                 │
│                                                 │
│ 6. API Security                                 │
│    ├─ Rate limiting (recommended)               │
│    ├─ CORS configuration                        │
│    ├─ Helmet.js headers (recommended)           │
│    └─ SQL injection prevention (TypeORM)        │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### Deployment Architecture

```
┌──────────────────────────────────────────────────┐
│           Deployment Pipeline                    │
├──────────────────────────────────────────────────┤
│                                                  │
│ 1. Development                                   │
│    ├─ Local Docker PostgreSQL                   │
│    ├─ npm run dev (Frontend & Backend)          │
│    └─ Localhost:5173 & Localhost:3000           │
│                                                  │
│ 2. Staging (Optional)                            │
│    ├─ Render / Heroku deployment                │
│    ├─ Staging database (PostgreSQL)             │
│    └─ Full E2E testing                          │
│                                                  │
│ 3. Production                                    │
│    ├─ Frontend: Render / Netlify                │
│    ├─ Backend: Render / AWS                     │
│    ├─ Database: Supabase (PostgreSQL)           │
│    ├─ Storage: Cloudflare R2                    │
│    └─ CI/CD: GitHub Actions                     │
│                                                  │
│ 4. Monitoring                                    │
│    ├─ Winston logs (error.log, combined.log)   │
│    ├─ Application error tracking                │
│    ├─ Database performance monitoring           │
│    └─ Uptime monitoring                         │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### Quality Assurance Architecture

```
Testing Pyramid
        △
       /│\
      / │ \
     /  │  \  E2E Tests (12 cases)
    /   │   \
   /────┼────\
  /     │     \ Integration Tests (TypeORM)
 /      │      \
/───────┼───────\
        │        Unit Tests (15 cases)
    ┌───┴───┐    Repository Tests
    │ Tests │    Controller Tests
    └───────┘    Service Tests


CI/CD Pipeline (GitHub Actions)
┌─────────────────────────────────────┐
│ On: Push to main/deployment/web     │
├─────────────────────────────────────┤
│                                     │
│ Job 1: Backend Testing              │
│  ├─ npm test (Unit tests)           │
│  ├─ npm test:cov (Coverage)         │
│  └─ npm test:e2e (E2E tests)        │
│                                     │
│ Job 2: Frontend Build               │
│  ├─ npm install                     │
│  ├─ npm run lint                    │
│  └─ npm run build                   │
│                                     │
│ Job 3: Code Quality Analysis        │
│  ├─ ESLint                          │
│  └─ Type checking (TypeScript)      │
│                                     │
│ Job 4: Report Generation            │
│  ├─ Coverage reports                │
│  ├─ Test results                    │
│  └─ Artifacts storage               │
│                                     │
└─────────────────────────────────────┘
```

---

## Key Decisions & Rationale

### 1. NestJS Backend
- **Reason**: Type-safe, modular architecture, excellent dependency injection
- **Alternative**: Express.js (more verbose), Fastify (less ecosystem)

### 2. React Frontend
- **Reason**: Component-based, large ecosystem, good performance
- **Alternative**: Vue.js (less adoption), Svelte (newer)

### 3. PostgreSQL + Supabase
- **Reason**: Robust relational DB, PostGIS for future features, Supabase simplifies DevOps
- **Alternative**: MongoDB (schema flexibility), Firebase (vendor lock-in)

### 4. TypeORM
- **Reason**: Type-safe queries, migration support, good NestJS integration
- **Alternative**: Prisma (modern but newer), Sequelize (less type-safe)

### 5. Tailwind CSS
- **Reason**: Utility-first, rapid development, excellent accessibility
- **Alternative**: Bootstrap (opinionated), CSS-in-JS (runtime overhead)

---

## Performance Considerations

### Frontend
- Code splitting via React Router
- Image optimization (Cloudflare R2)
- Lazy loading for patient documents
- Local storage caching for user data

### Backend
- Database indexes on frequently queried fields (email, rut, patientId)
- Connection pooling (TypeORM default)
- Pagination for patient lists
- Selective field loading (avoiding N+1 queries)

### Database
- Indexed searches: User.email, Patient.rut
- Cached queries for reference data
- Periodic cleanup of soft-deleted records (future)

---

## Scalability Path

### Phase 1 (Current)
- Single backend instance
- Single database instance
- R2 storage for documents

### Phase 2 (Future)
- Load balancer for backend
- Read replicas for database
- Redis cache layer (session, reference data)

### Phase 3 (Future)
- Microservices (Auth, Patients, Documents)
- Event-driven architecture (Kafka/RabbitMQ)
- Mobile app (React Native)

---

## References

- [C4 Model](https://c4model.com/) - Architecture Visualization
- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeORM Documentation](https://typeorm.io/)
