# Data Model

Five tables. Every primary key is a UUID. Every relationship is a real foreign key.

```mermaid
erDiagram
    employees ||--o{ employees : "manager_id (manages)"
    employees ||--o{ review_cycles : "created_by"
    employees ||--o{ goals : "employee_id"
    review_cycles ||--o{ goals : "cycle_id"
    employees ||--o{ reviews : "employee_id (reviewee)"
    employees ||--o{ reviews : "manager_id (reviewer)"
    review_cycles ||--o{ reviews : "cycle_id"
    reviews ||--o{ goal_ratings : "review_id"
    goals ||--o{ goal_ratings : "goal_id"

    employees {
        uuid id PK
        text clerk_user_id
        text full_name
        text email
        text designation
        text department
        date date_of_joining
        uuid manager_id FK
        text role "employee | manager | hr_admin"
        boolean is_active
        timestamptz created_at
    }
    review_cycles {
        uuid id PK
        text name
        date start_date
        date end_date
        text status "draft | open | closed"
        uuid created_by FK
    }
    goals {
        uuid id PK
        uuid employee_id FK
        uuid cycle_id FK
        text title
        text description
        numeric weightage
        date target_date
        text status "draft | submitted | approved | sent_back"
        text manager_comment
    }
    reviews {
        uuid id PK
        uuid employee_id FK
        uuid manager_id FK
        uuid cycle_id FK
        text status "not_started | self_submitted | manager_reviewed | completed"
        numeric overall_self_rating
        numeric overall_manager_rating
        text manager_summary
        timestamptz submitted_at
        timestamptz reviewed_at
    }
    goal_ratings {
        uuid id PK
        uuid review_id FK
        uuid goal_id FK
        text self_comment
        numeric self_rating
        text manager_comment
        numeric manager_rating
    }
```

## What each foreign key means (one line each)

| Foreign key | Meaning |
|---|---|
| `employees.manager_id -> employees.id` | Who this person reports to. A manager is just an employee row that others point at; no separate managers table. |
| `review_cycles.created_by -> employees.id` | The HR admin who created the cycle. |
| `goals.employee_id -> employees.id` | Whose goal this is. |
| `goals.cycle_id -> review_cycles.id` | Which appraisal cycle the goal belongs to; goals never exist outside a cycle. |
| `reviews.employee_id -> employees.id` | The person being appraised. |
| `reviews.manager_id -> employees.id` | The reviewer, copied from the employee's manager when the review is created, so history survives if the hierarchy changes. |
| `reviews.cycle_id -> review_cycles.id` | The cycle this review belongs to. One review per employee per cycle. |
| `goal_ratings.review_id -> reviews.id` | The review these per-goal ratings belong to. |
| `goal_ratings.goal_id -> goals.id` | The goal being rated. Ratings live here, never on `goals`. |

## Design rules

- A manager's name is never stored as text, always `manager_id`.
- `reviews` has one row per employee per cycle and its `status` column **is** the workflow.
- Only one `review_cycles` row may be `open` at a time.
- Row Level Security is on for every table; all access happens on the server.
