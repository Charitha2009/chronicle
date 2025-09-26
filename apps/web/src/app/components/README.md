# Chronicle App Components

This directory contains all the main components for the Chronicle application, organized by feature.

## Structure

```
components/
├── lobby/
│   └── LobbyPage.tsx          # Main lobby interface for creating/joining campaigns
├── story/
│   └── StorySelectionPage.tsx # Genre selection and campaign creation
├── campaigns/
│   ├── CharacterSelectionPage.tsx # Character creation and management
│   ├── CampaignPlayPage.tsx       # Main gameplay interface
│   └── OldRoomPage.tsx            # Legacy room interface (deprecated)
└── index.ts                   # Component exports
```

## Routes

The components are used in the following Next.js routes:

- `/lobby` → `LobbyPage`
- `/story-selection` → `StorySelectionPage` 
- `/campaigns/[id]/characters` → `CharacterSelectionPage`
- `/campaigns/[id]/play` → `CampaignPlayPage`

## Component Responsibilities

### LobbyPage
- Create new campaigns
- Join existing campaigns with room codes
- Display current players/characters
- Auto-redirect to character selection

### StorySelectionPage
- Select story genre (fantasy, sci-fi, horror, etc.)
- Create campaign with selected genre
- Move to character selection phase

### CharacterSelectionPage
- Create and claim characters
- Select character archetypes
- Lock characters when ready
- Start campaign when all players ready

### CampaignPlayPage
- Display current turn and scene
- Show hook choices for voting
- Display vote results
- Real-time updates for campaign state

## State Machine

The campaign follows this state progression:
`lobby` → `character_select` → `starting` → `active` → `ended`
