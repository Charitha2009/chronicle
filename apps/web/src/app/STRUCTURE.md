# Chronicle App Structure

## Overview
This document outlines the restructured file organization for the Chronicle application, with descriptive component names and clear separation of concerns.

## Directory Structure

```
src/app/
├── components/                    # Reusable components organized by feature
│   ├── lobby/
│   │   └── LobbyPage.tsx         # Main lobby interface
│   ├── story/
│   │   └── StorySelectionPage.tsx # Genre selection and campaign creation
│   ├── campaigns/
│   │   ├── CharacterSelectionPage.tsx # Character creation and management
│   │   ├── CampaignPlayPage.tsx       # Main gameplay interface
│   │   └── OldRoomPage.tsx            # Legacy room interface (deprecated)
│   ├── index.ts                  # Component exports
│   └── README.md                 # Component documentation
├── types/
│   └── index.ts                  # Centralized type definitions
├── lib/
│   ├── api.ts                    # API utilities
│   └── supabase.ts               # Supabase client configuration
├── lobby/
│   └── page.tsx                  # Route: /lobby
├── story-selection/
│   └── page.tsx                  # Route: /story-selection
├── campaigns/
│   └── [id]/
│       ├── characters/
│       │   └── page.tsx          # Route: /campaigns/[id]/characters
│       └── play/
│           └── page.tsx          # Route: /campaigns/[id]/play
├── layout.tsx                    # Root layout
├── page.tsx                      # Home page
├── providers.tsx                 # Context providers
└── STRUCTURE.md                  # This file
```

## Component Naming Convention

### Before (Generic)
- `lobby/page.tsx` ❌
- `story-selection/page.tsx` ❌
- `campaigns/[id]/characters/page.tsx` ❌

### After (Descriptive)
- `components/lobby/LobbyPage.tsx` ✅
- `components/story/StorySelectionPage.tsx` ✅
- `components/campaigns/CharacterSelectionPage.tsx` ✅

## Benefits of New Structure

1. **Clear Naming**: Component names describe their functionality
2. **Logical Grouping**: Components grouped by feature (lobby, story, campaigns)
3. **Centralized Types**: All TypeScript interfaces in one place
4. **Separation of Concerns**: Route files only handle routing, components handle logic
5. **Better Maintainability**: Easy to find and modify specific functionality
6. **Scalability**: Easy to add new components and features

## Route Mapping

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | HomePage | Landing page |
| `/lobby` | LobbyPage | Create/join campaigns |
| `/story-selection` | StorySelectionPage | Select genre and create campaign |
| `/campaigns/[id]/characters` | CharacterSelectionPage | Character creation and management |
| `/campaigns/[id]/play` | CampaignPlayPage | Main gameplay interface |

## Type Organization

All types are centralized in `types/index.ts`:

- **Campaign Types**: Campaign, CampaignStatus, Genre
- **Character Types**: Character
- **Game Types**: Turn, Resolution, Vote
- **Legacy Types**: Player, Room (for backward compatibility)
- **UI Types**: StoryGenre

## Development Guidelines

1. **New Components**: Add to appropriate feature folder in `components/`
2. **New Types**: Add to `types/index.ts`
3. **New Routes**: Create route folder with `page.tsx` that imports component
4. **Naming**: Use descriptive names that indicate functionality
5. **Exports**: Update `components/index.ts` for new components
