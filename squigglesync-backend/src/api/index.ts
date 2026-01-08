import { Router } from 'express';
import { createRouter, routeGroup } from '../utils/router.util';
import { logMiddleware } from '../middleware/log.middleware';
import { validateEventMiddleware } from '../middleware/validation.middleware';
import { sequenceManagerRouter } from './sequence-manager.router';
import { eventStoreRouter } from './events-store.router';
import { conflictResolverRouter } from './conflict-resolver.router';
import { roomStateRouter } from './room-state.router';
import { eventsRouter } from './events.router';
import { roomsRouter } from './rooms.router';

const router = createRouter();

// Test endpoints
const testRoutes = routeGroup(
    {
      middleware: [logMiddleware],
    },
    (router) => {
      router.use('/sequence', sequenceManagerRouter);
      router.use('/events-store', eventStoreRouter);
      router.use('/conflict-resolver', conflictResolverRouter);
      // router.use('/validation', validationRouter);
      router.use('/room-state', roomStateRouter);
    }
  );

// Production endpoints
const productionRoutes = routeGroup(
    {
      middleware: [logMiddleware, validateEventMiddleware],
    },
    (router) => {
      router.use('/events', eventsRouter);
      router.use('/rooms', roomsRouter);
    }
  );
  

// Mount the room state router
router.use('/room-state', logMiddleware, roomStateRouter);

// Mount the route group
router.use('/test', testRoutes); // All test endpoints under /api/test
router.use(productionRoutes); // Production endpoints under /api

export default router;
