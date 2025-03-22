
import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';

interface AccountingPageLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export const AccountingPageLayout = ({ title, description, children }: AccountingPageLayoutProps) => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Separator />
      <div className="mt-6">
        {children}
      </div>
    </div>
  );
};
