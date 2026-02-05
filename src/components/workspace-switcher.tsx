'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useWorkspace } from '@/contexts/workspace-context';
import { cn } from '@/lib/utils';

export function WorkspaceSwitcher() {
  const router = useRouter();
  const { workspaces, currentWorkspace, setCurrentWorkspace, isLoading } = useWorkspace();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <Button variant="outline" className="w-[200px] justify-between" disabled>
        Loading...
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select workspace"
          className="w-[200px] justify-between"
        >
          {currentWorkspace?.name ?? 'Select workspace'}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search workspace..." />
          <CommandList>
            <CommandEmpty>No workspace found.</CommandEmpty>
            <CommandGroup heading="Workspaces">
              {workspaces.map(({ workspace, role }) => (
                <CommandItem
                  key={workspace.id}
                  onSelect={() => {
                    setCurrentWorkspace(workspace);
                    setOpen(false);
                  }}
                  className="text-sm"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      currentWorkspace?.id === workspace.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{workspace.name}</span>
                    <span className="text-xs text-muted-foreground">{role}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  router.push('/dashboard/workspaces/new');
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Workspace
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
