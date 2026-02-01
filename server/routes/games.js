import { Router } from 'express';

const router = Router();

const GAMES = [
  { id: 'obby', name: 'Obby Park', description: 'Salta plataformas y llega a la meta.', thumb: '/games/obby.png', scene: 'obby' },
  { id: 'tag', name: 'Tag', description: 'Persigue o escapa. El que sea tocado pasa a perseguir.', thumb: '/games/tag.png', scene: 'tag' },
  { id: 'lobby', name: 'City Lobby', description: 'Explora la ciudad y chatea con otros.', thumb: '/games/lobby.png', scene: 'lobby' },
];

export { gamesRouter: router };

router.get('/', (_, res) => {
  res.json({ games: GAMES });
});

router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  const list = q
    ? GAMES.filter(g => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q))
    : GAMES;
  res.json({ games: list });
});
