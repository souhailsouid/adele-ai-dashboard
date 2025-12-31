# MarketFlow

A modern web application for tracking institutional market movements, whale transactions, and macro economic events.

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── MacroCalendar.tsx
│   ├── TransactionFlow.tsx
│   ├── Features.tsx
│   └── Footer.tsx
└── IMPLEMENTATION_GUIDE.md # Detailed implementation guide
```

## Next Steps

1. **Add Real Data**: Connect to market data APIs (see IMPLEMENTATION_GUIDE.md)
2. **Authentication**: Implement user login/signup
3. **Real-time Updates**: Add WebSocket connections for live data
4. **Database**: Setup PostgreSQL for user data and historical records
5. **Deploy**: Deploy to Vercel or your preferred platform

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide Icons** - Icon library

## Features

- ✅ Responsive design
- ✅ Glassmorphism UI
- ✅ Real-time transaction flow (mock data)
- ✅ Macro calendar visualization
- ✅ Dark mode optimized

## Development

```bash
# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## License

MIT


