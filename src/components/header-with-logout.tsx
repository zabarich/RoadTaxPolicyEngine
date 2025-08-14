'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

export function HeaderWithLogout() {
  const { logout } = useAuth();

  return (
    <div className="flex justify-between items-center mb-6 p-4 bg-white border-b">
      <h1 className="text-2xl font-bold">Road Tax Policy Engine</h1>
      <Button onClick={logout} variant="outline">
        Logout
      </Button>
    </div>
  );
}