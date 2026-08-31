'use client';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from './lib/store';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';
import { initAuthListener } from './lib/features/auth/authListener';

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store] = useState<AppStore>(makeStore);
  const [persistor] = useState(() => persistStore(store));

  useEffect(() => {
    const unsubscribe = initAuthListener(store);
    return unsubscribe;
  }, [store]);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}