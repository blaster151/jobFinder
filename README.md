# JobFinder

Your personal job search assistant built with Next.js, React, Zustand, and Tailwind CSS.

## Features

- **Contact Management**: Track recruiters and hiring managers
- **Interaction Logging**: Log communications (email, phone, etc.)
- **Follow-up Reminders**: Schedule and track follow-ups
- **ChatGPT Integration**: AI-powered prompt suggestions
- **Encouragement System**: Motivational quotes and support

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Testing**: Vitest + Testing Library
- **Validation**: Zod

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage

## Project Structure

```
jobFinder/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   │   └── ui/             # shadcn/ui components
│   ├── stores/             # Zustand stores
│   └── test/               # Test setup
├── lib/                    # Utility functions
├── types.ts               # TypeScript types
├── prompts.ts             # ChatGPT prompts
├── encouragements.ts      # Encouragement quotes
└── TODO.md               # Development tasks
```

## Development

This project uses:
- **Zustand** for state management
- **Zod** for schema validation
- **Vitest** for testing
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components

## Contributing

1. Check the `TODO.md` file for current tasks
2. Follow the existing code patterns
3. Write tests for new features
4. Ensure all tests pass before submitting 