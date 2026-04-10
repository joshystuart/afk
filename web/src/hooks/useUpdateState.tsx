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

    let unmounted = false;

    api
      .getState()
      .then((s) => {
        if (!unmounted) setState(s);
      })
      .catch(console.error);

    const unsubscribe = api.onStateChanged((s) => {
      if (!unmounted) setState(s);
    });

    return () => {
      unmounted = true;
      unsubscribe();
    };
  }, []);

  return (
    <UpdateStateContext.Provider value={state}>
      {children}
    </UpdateStateContext.Provider>
  );
};

export function useUpdateState(): UpdateState {
  return useContext(UpdateStateContext);
}
