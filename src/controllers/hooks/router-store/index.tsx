import React from 'react';
import { createHook } from 'react-sweet-state';
import {
  useRouterStore,
  useRouterStoreStatic,
  RouterStore,
} from '../../router-store';
import {
  RouterActionsType,
  RouterState,
  EntireRouterState,
  AllRouterActions,
} from '../../router-store/types';

/**
 * Utility hook for accessing the public router store
 */
export const useRouter = (): [RouterState, RouterActionsType] => {
  const [entireState, allActions] = useRouterStore();

  return [entireState, allActions];
};

/**
 * Hook for accessing the public router store without re-rendering on route change
 */
export const useRouterActions = (): RouterActionsType => {
  const [, allActions] = useRouterStoreStatic();

  return allActions;
};

const createQueryParamHook = createHook<
  EntireRouterState,
  AllRouterActions,
  string,
  { paramKey: string }
>(RouterStore, {
  selector: ({ query }, { paramKey }): string => query[paramKey],
});

const createPathParamHook = createHook<
  EntireRouterState,
  AllRouterActions,
  string,
  { paramKey: string }
>(RouterStore, {
  selector: ({ match: { params } }, { paramKey }): string =>
    params[paramKey] as string,
});

/**
 * Utility hook for accessing URL query params
 */
export const useQueryParam = (
  paramKey: string
): [string | undefined, (qp: string | null | undefined) => void] => {
  const [paramVal, routerActions] = createQueryParamHook({ paramKey });

  const setQueryParam = React.useCallback(
    (newValue: string | undefined | null) => {
      routerActions.pushQueryParam({ [paramKey]: newValue });
    },
    [paramKey, routerActions]
  );

  return [paramVal, setQueryParam];
};

/**
 * Utility hook for accessing URL path params
 */
export const usePathParam = (
  paramKey: string
): [string | undefined, (pp: string) => void] => {
  const [paramVal, routerActions] = createPathParamHook({ paramKey });

  const setPathParam = React.useCallback(
    (newValue: string) => {
      routerActions.pushPathParam({ [paramKey]: newValue });
    },
    [paramKey, routerActions]
  );

  return [paramVal, setPathParam];
};
