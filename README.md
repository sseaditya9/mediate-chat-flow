# ElderFives

A real-time debate and mediation platform with AI-powered moderation.

## About

ElderFives is a platform for meaningful conversations and structured debates, featuring:

- Real-time two-person debates with end-to-end encryption
- AI mediator ("The EldersFive") that evaluates arguments and provides feedback
- Win-O-Meter scoring system to track debate performance
- Friend system for connecting with other users
- Secure authentication via Supabase

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **UI Components**: shadcn-ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Realtime + Edge Functions)
- **AI**: Custom LLM integration via Supabase Edge Functions

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Supabase account and project

### Installation

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd mediate-chat-flow
```

2. Install dependencies:
```sh
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your Supabase project credentials

4. Start the development server:
```sh
npm run dev
```

The app will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

This project can be deployed to:
- **Vercel** (recommended)
- **Cloudflare Pages**
- **Netlify**
- Any static hosting service

Build the project with `npm run build` and deploy the `dist` folder.

## License

MIT
