
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface StaffSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function StaffSearch({ searchTerm, onSearchChange }: StaffSearchProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search staff by name, role or email"
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
