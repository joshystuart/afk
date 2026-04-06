import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UpdateState } from '../types/electron';

const IDLE_STATE: UpdateState = { status: 'idle' };

const UpdateStateContext = createContext<UpdateState>(IDLE_STATE);

export const UpdateStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<UpdateState>(IDLE_STATE);

  useEffect(() => {
    const api = window.electronAPI?.updater;
    if (!api) {
      return;
    }

    void api.getState().then(setState);

    return api.onStateChanged(setState);
  }, []);

  return React.createElement(
    UpdateStateContext.Provider,
    { value: state },
    children,
  );
};

export function useUpdateState(): UpdateState {
  return useContext(UpdateStateContext);
}
