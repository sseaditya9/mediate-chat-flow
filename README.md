# ElderFives

A real-time debate and mediation platform with AI-powered moderation.

## The Concept

EldersFive is based on the ancient tradition of having a set of five wise and learned elders to solve debates about ideas, grievances, or impasses between two parties.

In EldersFive, we give the authority of the five elders to the LLMs, and we place our trust in them to judge our ideas and debates with objective impartiality—no fluffy soft talk, just pure honesty and a strong personality. The EldersFive will call out the wrong idea and reward the right one with the **Win-O-Meter**, which tracks who is winning the clash and by how much, starting from a 50-50 balance.

**Note:** Your conversation will be sent to OpenAI for AI mediation, then encrypted in the database. Nobody except you and your opponent will be able to view the conversation.

## Features

- Real-time two-person debates with encryption at rest
- AI mediator ("The EldersFive") that evaluates arguments with brutal honesty
- Win-O-Meter scoring system to track debate performance
- Friend system for connecting with other users
- Secure authentication via Supabase

## Security & Privacy

### How Encryption Works

**Message Processing:**
1. When you send a message, it is first processed by our AI mediator (powered by OpenAI) to generate feedback and scoring
2. After AI processing, your message is encrypted using AES encryption before being stored in the database
3. Each conversation has a unique encryption key that is generated when the conversation is created

**Data Storage:**
- All messages are stored in encrypted form in our database
- Encryption keys are stored separately in the database with strict access controls
- Only participants in a conversation can access the encryption key for that conversation
- Database-level Row Level Security (RLS) policies ensure you can only access conversations you're part of

**What This Means:**
- ✅ Your messages are encrypted at rest (in storage)
- ✅ Only conversation participants can decrypt and read messages
- ✅ Database administrators cannot read your encrypted messages without the encryption key
- ⚠️ Messages are processed by OpenAI's LLM in unencrypted form to enable AI mediation features
- ⚠️ OpenAI processes message content according to their [privacy policy](https://openai.com/policies/privacy-policy)

**Important Notes:**
- This is not end-to-end encryption in the traditional sense, as messages are processed by our AI mediator before encryption
- For maximum privacy, avoid sharing sensitive personal information in debates
- We use Supabase Edge Functions to communicate with OpenAI, ensuring messages are transmitted securely over HTTPS

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
