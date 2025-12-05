# Seed Data Implementation Guide

## Overview

This document describes the seed data system for populating the curriculum database with Mathematics content for Serbian "Mala Matura" (final exam) preparation.

**Status**: ✅ COMPLETE - All content seeded to database.

## Directory Structure

```
packages/backend/
├── convex/seed/
│   ├── index.ts              # Main seed orchestrator mutation
│   ├── types.ts              # TypeScript interfaces for seed data
│   └── data/
│       └── matematika/
│           ├── subject.json              # Subject metadata
│           ├── 01-prirodni-brojevi.json  # Chapter 1
│           ├── 02-celi-brojevi.json      # Chapter 2
│           ├── 03-razlomci.json          # Chapter 3
│           ├── 04-decimalni-brojevi.json # Chapter 4
│           ├── 05-procenti.json          # Chapter 5
│           ├── 06-racionalni-brojevi.json # Chapter 6
│           ├── 07-algebarski-izrazi.json # Chapter 7
│           ├── 08-linearne-jednacine.json # Chapter 8
│           ├── 09-geometrija-u-ravni.json # Chapter 9
│           ├── 10-geometrija-u-prostoru.json # Chapter 10
│           ├── 11-linearna-funkcija.json # Chapter 11
│           └── 12-statistika-verovatnoca.json # Chapter 12
└── scripts/
    └── seed-runner.ts        # Script to load and run seed data
```

## Data Types

### Subject

```typescript
interface SeedSubject {
  name: string;           // "Matematika"
  slug: string;           // "matematika"
  description: string;    // Subject description in Serbian
  icon?: string;          // Icon identifier
  chapters: SeedChapter[];
}
```

### Chapter

```typescript
interface SeedChapter {
  name: string;           // Chapter name in Serbian Latin
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

### Generate Seed Data

```bash
pnpm seed:generate
```

This creates `seed-data.json` with all curriculum content combined.

### Run Seed to Database

```bash
pnpm seed:run
```

This runs the `seedCurriculum` mutation with the generated seed data.

### Via Convex Dashboard

1. Open Convex dashboard
2. Navigate to Functions
3. Find `seed:seedCurriculum`
4. Paste the content from `seed-data.json` as the `data` argument

## Curriculum Structure (Actual)

Based on Serbian educational standards for "Završni ispit" (Final Exam):

| # | Chapter (Serbian Latin) | Chapter (English) | Sections | Lessons | Questions |
|---|-------------------------|-------------------|----------|---------|-----------|
| 1 | Prirodni brojevi | Natural Numbers | 3 | 9 | 18 |
| 2 | Celi brojevi | Integers | 2 | 6 | 12 |
| 3 | Razlomci | Fractions | 3 | 9 | 18 |
| 4 | Decimalni brojevi | Decimal Numbers | 3 | 9 | 18 |
| 5 | Procenti | Percentages | 3 | 9 | 18 |
| 6 | Racionalni brojevi | Rational Numbers | 2 | 6 | 12 |
| 7 | Algebarski izrazi | Algebraic Expressions | 2 | 6 | 12 |
| 8 | Linearne jednačine | Linear Equations | 3 | 9 | 21 |
| 9 | Geometrija u ravni | Plane Geometry | 4 | 12 | 24 |
| 10 | Geometrija u prostoru | Solid Geometry | 3 | 9 | 18 |
| 11 | Linearna funkcija | Linear Functions | 3 | 9 | 18 |
| 12 | Statistika i verovatnoća | Statistics & Probability | 3 | 9 | 18 |
| **Total** | | | **38** | **102** | **227** |

### Summary Statistics

| Metric | Count |
|--------|-------|
| Subject | 1 |
| Chapters | 12 |
| Sections | 38 |
| Lessons | 102 |
| Tests | 38 |
| Questions | 227 |
| Question Options | 898 |

## Question Difficulty Distribution

Per official standards, questions are distributed across three levels:

- **Basic (Osnovni nivo)**: 40% - Fundamental concepts
- **Intermediate (Srednji nivo)**: 40% - Application problems
- **Advanced (Napredni nivo)**: 20% - Complex problem-solving

## Content Guidelines

1. **Language**: All content in Serbian Latin script (not Cyrillic)
2. **Accuracy**: Based on official Serbian curriculum standards
3. **Explanations**: Every question must have a detailed explanation
4. **Lesson Links**: Questions reference related lessons via `lessonSlug` for the "Learn More" feature
5. **Progressive Difficulty**: Within each section, lessons progress from basic to advanced

## Sources

- [Zavod za vrednovanje kvaliteta obrazovanja](https://ceo.edu.rs) - Official test repository
- [eVežbaonica](https://evezbaonica.zvkov.gov.rs) - Official practice platform
- [Obrazovni standardi](https://radosnaucionica.files.wordpress.com/2013/12/obrazovni-standardi.pdf) - Educational standards
- [TIMSS Serbia](https://timssandpirls.bc.edu/timss2015/encyclopedia/countries/serbia/) - International curriculum comparison

## Maintenance

To update content:

1. Modify the relevant JSON file in `convex/seed/data/matematika/`
2. Run `pnpm seed:generate` to regenerate the combined data
3. Run `pnpm seed:run` to update the database
4. Verify changes in the application

## Related Issues

- [IZA-130](https://linear.app/iza/issue/IZA-130): Create Dummy Curriculum Content (parent) ✅
- [IZA-233](https://linear.app/iza/issue/IZA-233): Create seed script infrastructure ✅
- [IZA-234](https://linear.app/iza/issue/IZA-234): Generate Mathematics curriculum JSON content ✅
- IZA-207 - IZA-214: Chapter-specific content issues ✅
