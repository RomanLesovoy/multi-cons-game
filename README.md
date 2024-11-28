# Multiplayer Agario Clone

## Description
A multiplayer browser game inspired by Agar.io, built with WebRTC P2P connections. Players can create rooms, join existing games, and compete with each other in real-time.

## Technologies

### Frontend
- Angular 17
- TypeScript
- RxJS
- SCSS
- Socket.IO Client

### Backend
- Node.js
- Express
- Socket.IO
- TypeScript

### Game Engine
- Phaser 3
- WebRTC for P2P communication
- Scene-Manager architecture

## Key Features

### Lobby System
- Create game rooms
- Join existing rooms
- View available games list
- Master peer room management

### Gameplay
- Mouse-controlled character movement
- Absorb smaller players and enemies
- Dynamic player size scaling
- Automatic enemy generation
- Collision system

### Network Features
- P2P connection between players
- Game state synchronization
- Connection quality display
- Player disconnect handling

## Installation and Setup

### Backend
```bash
cd server
npm install
npm run start
```

### Frontend
```bash
cd multi-cons-app
npm install
npm run start
```

## License
MIT

## Authors
Lesovoy Roman

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
