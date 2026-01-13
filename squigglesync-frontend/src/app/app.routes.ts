import { Routes } from '@angular/router';
import { Whiteboard } from './pages/whiteboard/whiteboard';
import { TestStoresComponent } from './test-stores.component';

/**
 * Application Routes
 * 
 * Routes are eager-loaded (not lazy-loaded) as per requirements.
 * All components are standalone (Angular 21 default).
 */
export const routes: Routes = [
  {
    path: '',
    component: Whiteboard,
    title: 'SquiggleSync - Whiteboard'
  },
  {
    path: 'whiteboard/:roomId',
    component: Whiteboard,
    title: 'SquiggleSync - Whiteboard'
  },
  {
    path: 'test-stores',
    component: TestStoresComponent,
    title: 'Test Stores'
  },
  {
    path: '**',
    redirectTo: '/',
    pathMatch: 'full'
  }
];
