# A³P-Web — Coding Conventions

---

## 1. General

- All files use **LF line endings** (enforced by `.editorconfig`)
- All text files end with a newline
- No trailing whitespace
- Delete commented-out code before committing — use git to recover it

---

## 2. Git Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

### Types
| Type | When |
|---|---|
| `feat` | New feature or page |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code change that's neither fix nor feature |
| `chore` | Build, config, dependencies |
| `test` | Adding or updating tests |

### Scopes (A³P-Web specific)
`frontend`, `backend`, `docs`, `db`, `api`, `ingestion`, `engine`, `ai`, `auth`, `ui`

### Examples
```
feat(frontend): add faculty directory page with search and filter
fix(engine): correct h-index scoring function boundary at 21+
docs(api): add evidence endpoint contract
chore(frontend): update next.js to 14.2.x
```

---

## 3. Frontend Conventions (TypeScript / Next.js)

### File Naming
| Type | Convention | Example |
|---|---|---|
| Pages | `page.tsx` | `app/faculty/page.tsx` |
| Layouts | `layout.tsx` | `app/layout.tsx` |
| Components | PascalCase | `FacultyCard.tsx` |
| Hooks | camelCase, `use` prefix | `useConflictResolution.ts` |
| Utilities | camelCase | `formatScore.ts` |
| Types | PascalCase | `FacultyEntity.ts` |
| Constants | UPPER_SNAKE_CASE | `ROUTES.ts` |

### Component Structure
```tsx
// 1. Imports (external → internal → types → styles)
import { motion } from 'framer-motion'
import { FacultyCard } from '@/components/faculty/FacultyCard'
import type { FacultyEntity } from '@/types/faculty'

// 2. Types / interfaces for this file
interface Props {
  faculty: FacultyEntity[]
}

// 3. Component (named export, not default for non-page files)
export function FacultyList({ faculty }: Props) {
  return (...)
}
```

- **Named exports** for components in `components/` — enables tree-shaking and easier refactoring
- **Default exports** for page files only (Next.js App Router requirement)
- **No `any`** — use `unknown` and narrow, or define proper types
- **No implicit `any`** — TypeScript `strict: true` is enforced

### Tailwind Usage
- Use design token CSS custom properties for values not in Tailwind's default scale
- Extend Tailwind config with project-specific tokens — do not use arbitrary values `[value]` in components
- `cn()` utility from `clsx` + `tailwind-merge` for conditional class composition

### API Client
- All API calls go through typed functions in `lib/api/`
- No raw `fetch` in components or pages
- Every API function is typed with request and response interfaces from `types/api.ts`

---

## 4. Backend Conventions (Python / FastAPI)

> Backend not yet implemented. Establish these conventions before writing code.

### File Naming
- All lowercase with underscores: `faculty_service.py`, `identity_resolver.py`
- Router files named after the resource: `faculty.py`, `assessment.py`

### Structure
- **Schemas** (Pydantic) are in `schemas/` — separate from ORM models in `models/`
- **Business logic** lives in `services/` — routes are thin; they validate, call service, return response
- **Rule engine** is in `services/rule_engine/` — pure functions, no database access
- **AI service** is in `services/ai/` — explicitly separate; receives read-only assessment result

### Critical Boundary (Enforced by Code Review)
```python
# CORRECT — rule engine is synchronous, deterministic, no I/O
def compute_publication_score(profile: UnifiedProfile) -> KPIScore:
    raw = len([p for p in profile.publications if p.dedup_status == "unique"])
    score = _publication_scoring_function(raw)
    return KPIScore(rule_id="research_output.publication_count", score=score, ...)

# CORRECT — AI service is called AFTER rule engine, reads result only
async def generate_insight(assessment: AssessmentResult) -> InsightText:
    prompt = build_insight_prompt(assessment)  # assessment is read-only here
    response = await llm_client.complete(prompt)
    return InsightText(text=response, is_advisory=True)

# WRONG — never do this
async def compute_score_with_ai(profile: UnifiedProfile) -> float:
    response = await llm_client.complete(f"Rate this professor: {profile}")
    return float(response)  # ← VIOLATION of core principle
```

### Type Annotations
- All function signatures must have complete type annotations
- Use Pydantic v2 models for all API inputs and outputs
- `Optional[X]` → use `X | None` syntax (Python 3.10+)

---

## 5. Documentation Standards

- Each PR that adds a new feature should update the relevant doc in `/docs/`
- Architectural decisions that deviate from docs must update the doc first (docs-first approach)
- Use present tense in docs: "The rule engine computes..." not "The rule engine will compute..."

---

## 6. What Requires Review

The following changes require team review before merging:

- Any change to `services/rule_engine/` — affects assessment scores
- Any change to `services/ai/` — must not touch score computation
- New KPI rules or changes to existing rule scoring functions
- Database migrations
- Changes to `types/` in the frontend — affects the entire API contract
