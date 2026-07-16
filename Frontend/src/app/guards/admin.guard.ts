import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Basit admin kontrolü: localStorage'da admin_token varsa girer
  if (typeof window !== 'undefined' && localStorage.getItem('admin_token') === 'true') {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
