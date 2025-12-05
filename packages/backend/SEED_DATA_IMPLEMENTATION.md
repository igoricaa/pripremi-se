# Seed Data Implementation Guide

## Overview

This document describes the seed data system for populating the curriculum database with Mathematics content for Serbian "Mala Matura" (final exam) preparation.

## Directory Structure

```
packages/backend/convex/seed/
├── index.ts              # Main seed orchestrator mutation
├── types.ts              # TypeScript interfaces for seed data
├── validators.ts         # Zod schemas for validation
├── helpers.ts            # Utility functions
└── data/
    └── matematika/
        ├── subject.json          # Subject metadata
        ├── chapters/
        │   ├── 01-prirodni-brojevi.json
        │   ├── 02-celi-brojevi.json
        │   ├── 03-razlomci.json
        │   ├── 04-decimalni-brojevi.json
        │   ├── 05-algebarski-izrazi.json
        │   ├── 06-linearne-jednacine.json
        │   ├── 07-funkcije.json
        │   ├── 08-geometrija-planimetrija.json
        │   ├── 09-geometrija-stereometrija.json
        │   └── 10-merenje-podaci.json
        └── (sections, lessons, questions embedded in chapter files)
```

## Data Types

### Subject

```typescript
interface SeedSubject {
  name: string;           // "Математика"
  slug: string;           // "matematika"
  description: string;    // Subject description in Serbian
  icon?: string;          // Icon identifier
  chapters: SeedChapter[];
}
```

### Chapter

```typescript
interface SeedChapter {
  name: string;           // Chapter name in Serbian
  slug: string;           // URL-friendly slug
  description: string;    // Chapter description
  sections: SeedSection[];
}
```

### Section

```typescript
interface SeedSection {
  name: string;
  slug: string;
  description?: string;
  lessons: SeedLesson[];
  test?: SeedTest;        // Section test (optional)
}
```

### Lesson

```typescript
interface SeedLesson {
  title: string;
  slug: string;
  content: string;        // Markdown content
  contentType: "text" | "video" | "interactive";
  estimatedMinutes: number;
}
```

### Test & Questions

```typescript
interface SeedTest {
  title: string;
  description: string;
  timeLimit?: number;     // Minutes
  passingScore: number;   // Percentage (0-100)
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  questions: SeedQuestion[];
}

interface SeedQuestion {
  text: string;
  type: "single_choice" | "multiple_choice" | "true_false" | "short_answer";
  explanation: string;    // Shown after answering
  difficulty: "easy" | "medium" | "hard";
  points: number;
  lessonSlug?: string;    // Links to lesson for "Learn More"
  options?: SeedQuestionOption[];
}

interface SeedQuestionOption {
  text: string;
  isCorrect: boolean;
  order: number;
}
```

## Running the Seed

### Via Convex Dashboard

1. Open Convex dashboard
2. Navigate to Functions
3. Find `seed:seedCurriculum`
4. Run with empty args (data loaded from JSON files)

### Via CLI (if script added)

```bash
pnpm --filter @pripremi-se/backend seed:curriculum
```

## Curriculum Structure

Based on Serbian educational standards for "Завршни испит" (Final Exam):

| # | Chapter (Serbian) | Chapter (English) | Sections | Lessons | Questions |
|---|-------------------|-------------------|----------|---------|-----------|
| 1 | Природни бројеви | Natural Numbers | 5 | 15 | 30 |
| 2 | Цели бројеви | Integers | 4 | 12 | 25 |
| 3 | Разломци | Fractions | 5 | 18 | 35 |
| 4 | Децимални бројеви | Decimal Numbers | 4 | 12 | 25 |
| 5 | Алгебарски изрази | Algebraic Expressions | 5 | 15 | 30 |
| 6 | Линеарне једначине | Linear Equations | 5 | 18 | 35 |
| 7 | Функције | Functions | 5 | 15 | 30 |
| 8 | Геометрија - планиметрија | Plane Geometry | 6 | 20 | 35 |
| 9 | Геометрија - стереометрија | Solid Geometry | 6 | 18 | 35 |
| 10 | Мерење и подаци | Measurement & Data | 5 | 12 | 25 |
| **Total** | | | **50** | **155** | **305** |

## Question Difficulty Distribution

Per official standards, questions are distributed across three levels:

- **Basic (Основни ниво)**: 40% - Fundamental concepts
- **Intermediate (Средњи ниво)**: 40% - Application problems
- **Advanced (Напредни ниво)**: 20% - Complex problem-solving

## Content Guidelines

1. **Language**: All content in Serbian (Cyrillic preferred, Latin acceptable)
2. **Accuracy**: Based on official Serbian curriculum standards
3. **Explanations**: Every question must have a detailed explanation
4. **Lesson Links**: Questions should reference related lessons for the "Learn More" feature
5. **Progressive Difficulty**: Within each section, lessons progress from basic to advanced

## Sources

- [Завод за вредновање квалитета образовања](https://ceo.edu.rs) - Official test repository
- [еВежбаоница](https://evezbaonica.zvkov.gov.rs) - Official practice platform
- [Образовни стандарди](https://radosnaucionica.files.wordpress.com/2013/12/obrazovni-standardi.pdf) - Educational standards
- [TIMSS Serbia](https://timssandpirls.bc.edu/timss2015/encyclopedia/countries/serbia/) - International curriculum comparison

## Maintenance

To update content:

1. Modify the relevant JSON file in `seed/data/matematika/`
2. Run the seed mutation (it handles updates idempotently)
3. Verify changes in the application

## Related Issues

- [IZA-130](https://linear.app/iza/issue/IZA-130): Create Dummy Curriculum Content (parent)
- [IZA-233](https://linear.app/iza/issue/IZA-233): Create seed script infrastructure
- [IZA-234](https://linear.app/iza/issue/IZA-234): Generate Mathematics curriculum JSON content
- IZA-207 - IZA-214: Chapter-specific content issues
