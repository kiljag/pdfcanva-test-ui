import { configureStore } from '@reduxjs/toolkit';
import canvasReducer from './canvasSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      canvas: canvasReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for performance
      }),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
