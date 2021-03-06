import React from 'react';

import { NOOP_HISTORY } from '../../common/constants';
import { Router } from '../../controllers/router';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NoopAnchor = ({ href, children: c, ...props }: any) => (
  <a {...props}>{c}</a>
);
export const noopRouterDecorator = (story: any) => (
  <Router
    // @ts-ignore
    history={NOOP_HISTORY}
    routes={[
      {
        component: NoopAnchor,
        path: '/boards',
        name: '',
      },
    ]}
  >
    {story()}
  </Router>
);
