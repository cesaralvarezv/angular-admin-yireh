import { Routes } from '@angular/router';
import { LoginComponent } from './modules/auth/login.component';
import { LayoutComponent } from './layout/layout.component';
import { PosComponent } from './modules/pos/pos.component';
import { CashClosureComponent } from './modules/cash-closure/cash-closure.component';
import { AnalyticsComponent } from './modules/analytics/analytics.component';
import { AssetsComponent } from './modules/assets/assets.component';
import { SatisfactionComponent } from './modules/satisfaction/satisfaction.component';
import { authGuard, adminGuard, cashierGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'pos'
      },
      {
        path: 'pos',
        component: PosComponent,
        canActivate: [cashierGuard]
      },
      {
        path: 'cash-closure',
        component: CashClosureComponent,
        canActivate: [cashierGuard]
      },
      {
        path: 'analytics',
        component: AnalyticsComponent,
        canActivate: [adminGuard]
      },
      {
        path: 'assets',
        component: AssetsComponent,
        canActivate: [adminGuard]
      },
      {
        path: 'satisfaction',
        component: SatisfactionComponent,
        canActivate: [adminGuard]
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
