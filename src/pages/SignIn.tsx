
import React from 'react';
import { Logo } from '@/components/ui/logo';

const SignIn = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-4">
        <Logo size="md" />
      </div>
      <h1 className="text-3xl font-bold">Sign In</h1>
      <p className="text-muted-foreground">Sign in to your account</p>
    </div>
  );
};

export default SignIn;
