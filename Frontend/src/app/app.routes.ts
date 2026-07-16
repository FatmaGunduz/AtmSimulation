import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { WithdrawComponent } from './components/withdraw/withdraw';
import { DepositComponent } from './components/deposit/deposit';
import { TransferComponent } from './components/transfer/transfer';
import { TransactionsComponent } from './components/transactions/transactions';
import { ChangePinComponent } from './components/change-pin/change-pin';
import { AccountSelectionComponent } from './components/account-selection/account-selection';
import { AccountActionsComponent } from './components/account-actions/account-actions';
import { LimitInquiryComponent } from './components/limit-inquiry/limit-inquiry';
import { OtherActionsComponent } from './components/other-actions/other-actions';
import { BillPaymentComponent } from './components/bill-payment/bill-payment';
import { StatementComponent } from './components/statement/statement';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

import { AtmLayoutComponent } from './components/atm-layout';
import { AdminLoginComponent } from './components/admin/admin-login';

// Admin Components
import { AdminLayoutComponent } from './components/admin/admin-layout';
import { AdminDashboardComponent } from './components/admin/admin-dashboard';
import { AtmManagementComponent } from './components/admin/admin-atms';
import { CustomerManagementComponent } from './components/admin/admin-customers';
import { TransactionMonitorComponent } from './components/admin/admin-transactions';

export const routes: Routes = [
  // ATM ROTASI
  {
    path: '',
    component: AtmLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent },
      { path: 'accounts', component: AccountSelectionComponent, canActivate: [authGuard] },
      { path: 'account-actions', component: AccountActionsComponent, canActivate: [authGuard] },
      { path: 'withdraw', component: WithdrawComponent, canActivate: [authGuard] },
      { path: 'deposit', component: DepositComponent, canActivate: [authGuard] },
      { path: 'transfer', component: TransferComponent, canActivate: [authGuard] },
      { path: 'transactions', component: TransactionsComponent, canActivate: [authGuard] },
      { path: 'statement', component: StatementComponent, canActivate: [authGuard] },
      { path: 'change-pin', component: ChangePinComponent, canActivate: [authGuard] },
      { path: 'limit-inquiry', component: LimitInquiryComponent, canActivate: [authGuard] },
      { path: 'other-actions', component: OtherActionsComponent, canActivate: [authGuard] },
      { path: 'bill-payment', component: BillPaymentComponent, canActivate: [authGuard] },
    ]
  },

  // ADMIN LOGIN (ATM Dışında, Kendi Sayfası)
  { path: 'admin-login', component: AdminLoginComponent },

  // ADMIN ROUTES
  { 
    path: 'admin', 
    component: AdminLayoutComponent, 
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'atms', component: AtmManagementComponent },
      { path: 'customers', component: CustomerManagementComponent },
      { path: 'transactions', component: TransactionMonitorComponent }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
