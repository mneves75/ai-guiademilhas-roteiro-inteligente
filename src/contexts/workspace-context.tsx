'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { Workspace } from '@/db/schema/types';

type WorkspaceWithRole = {
  workspace: Workspace;
  role: string;
};

type WorkspaceContextType = {
  workspaces: WorkspaceWithRole[];
  currentWorkspace: Workspace | null;
  currentRole: string | null;
  isLoading: boolean;
  error: string | null;
  setCurrentWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/workspaces');
      if (!res.ok) throw new Error('Failed to fetch workspaces');
      const data = await res.json();
      setWorkspaces(data.workspaces);

      // Auto-select first workspace if none selected
      if (!currentWorkspace && data.workspaces.length > 0) {
        setCurrentWorkspaceState(data.workspaces[0].workspace);
        setCurrentRole(data.workspaces[0].role);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  const setCurrentWorkspace = useCallback(
    (workspace: Workspace) => {
      setCurrentWorkspaceState(workspace);
      const found = workspaces.find((w) => w.workspace.id === workspace.id);
      setCurrentRole(found?.role ?? null);
      // Persist selection
      localStorage.setItem('currentWorkspaceId', String(workspace.id));
    },
    [workspaces]
  );

  // Load workspaces on mount
  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  // Restore workspace from localStorage
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      const savedId = localStorage.getItem('currentWorkspaceId');
      if (savedId) {
        const found = workspaces.find((w) => w.workspace.id === Number(savedId));
        if (found) {
          setCurrentWorkspaceState(found.workspace);
          setCurrentRole(found.role);
        }
      }
    }
  }, [workspaces, currentWorkspace]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        currentRole,
        isLoading,
        error,
        setCurrentWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

/**
 * RBAC helper hooks
 */
export function useIsWorkspaceOwner() {
  const { currentRole } = useWorkspace();
  return currentRole === 'owner';
}

export function useIsWorkspaceAdmin() {
  const { currentRole } = useWorkspace();
  return currentRole === 'owner' || currentRole === 'admin';
}

export function useCanManageMembers() {
  const { currentRole } = useWorkspace();
  return currentRole === 'owner' || currentRole === 'admin';
}
