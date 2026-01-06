import { Router } from 'express';
import { createRouter, routeGroup } from '../utils/router.util';
import { logMiddleware } from '../middleware/log.middleware';
import { validateEventMiddleware } from '../middleware/validation.middleware';
import { sequenceManagerRouter } from './sequence-manager.router';
import { eventStoreRouter } from './events-store.router';
import { conflictResolverRouter } from './conflict-resolver.router';
import { roomStateRouter } from './room-state.router';

const router = createRouter();

// Route group with middleware
// All routes in this group will have logMiddleware and validationMiddleware applied
// Validation middleware only affects POST/PUT/PATCH routes with event in body
const apiRoutes = routeGroup(
  {
    middleware: [logMiddleware, validateEventMiddleware],
  },
  (router) => {
    router.use('/sequence', sequenceManagerRouter);
    router.use('/events', eventStoreRouter);
    router.use('/conflict-resolver', conflictResolverRouter);
  }
);

// Mount the room state router
router.use('/room-state', logMiddleware, roomStateRouter);

// Mount the route group
router.use(apiRoutes);

export default router;
