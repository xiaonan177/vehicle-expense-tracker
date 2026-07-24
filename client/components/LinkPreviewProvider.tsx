import { type ReactNode } from 'react';
import { LinkPreviewContextProvider as ExpoLinkPreviewContextProvider } from 'expo-router/build/link/preview/LinkPreviewContext';

export function LinkPreviewProvider({ children }: { children: ReactNode }) {
  return <ExpoLinkPreviewContextProvider>{children}</ExpoLinkPreviewContextProvider>;
}
