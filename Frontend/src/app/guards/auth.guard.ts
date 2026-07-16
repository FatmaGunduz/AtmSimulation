import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AtmService } from '../services/atm.service';

export const authGuard: CanActivateFn = (route, state) => {
  const atmService = inject(AtmService);
  const router = inject(Router);

  if (atmService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
