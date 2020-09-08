import React from 'react';

import { mount } from 'enzyme';
import * as historyHelper from 'history';
import { defaultRegistry } from 'react-sweet-state';
import { act } from 'react-dom/test-utils';

import { Router } from '../../../../../controllers';
import {
  useQueryParam,
  usePathParam,
} from '../../../../../controllers/hooks/router-store';
import { getRouterStore } from '../../../../../controllers/router-store';

const mockLocation = {
  pathname: '/projects/123/board/456',
  search: '?foo=hello&bar=world',
  hash: '#hash',
};

const mockRoutes = [
  {
    path: '/projects/:projectId/board/:boardId',
    component: () => <div>path</div>,
    name: '',
  },
  {
    path: '/blah',
    component: () => <div>path</div>,
    name: '',
  },
];

const historyBuildOptions = {
  initialEntries: [
    `${mockLocation.pathname}${mockLocation.search}${mockLocation.hash}`,
  ],
};

let history = historyHelper.createMemoryHistory(historyBuildOptions);
let historyPushSpy = jest.spyOn(history, 'push');
const nextTick = () => new Promise(resolve => setTimeout(resolve));

const MockComponent = ({ children, ...rest }: any) => {
  return children(rest);
};

describe('useQueryParam', () => {
  beforeEach(() => {
    history = historyHelper.createMemoryHistory(historyBuildOptions);
    historyPushSpy = jest.spyOn(history, 'push');
  });

  afterEach(() => {
    defaultRegistry.stores.clear();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should return the right param value', () => {
    mount(
      <Router routes={mockRoutes} history={history}>
        <MockComponent>
          {() => {
            const [param] = useQueryParam('foo');
            expect(param).toEqual('hello');

            return <div>I am a subscriber</div>;
          }}
        </MockComponent>
      </Router>
    );
  });

  it('should return undefined for non-existent params', () => {
    mount(
      <Router routes={mockRoutes} history={history}>
        <MockComponent>
          {() => {
            const [param] = useQueryParam('iamnotaqueryparam');
            expect(param).toEqual(undefined);

            return <div>I am a subscriber</div>;
          }}
        </MockComponent>
      </Router>
    );
  });

  it('should return undefined for non-existent params and update the URL when set for the first time', async () => {
    const mockPath = mockLocation.pathname;
    let qpVal: string | undefined, qpUpdateFn: (qp: string) => void;

    mount(
      <Router routes={mockRoutes} history={history}>
        <MockComponent>
          {() => {
            const [param, setParam] = useQueryParam('newqueryparam');
            qpVal = param;
            qpUpdateFn = setParam;

            return <div>I am a subscriber</div>;
          }}
        </MockComponent>
      </Router>
    );
    expect(qpVal).toEqual(undefined);
    act(() => qpUpdateFn('val'));
    await nextTick();

    expect(historyPushSpy).toBeCalledWith(
      `${mockPath}?foo=hello&bar=world&newqueryparam=val#hash`
    );
  });

  it('should update URL with new param value', async () => {
    const mockPath = mockLocation.pathname;
    let qpVal: string | undefined, qpUpdateFn: (qp: string) => void;

    mount(
      <Router routes={mockRoutes} history={history}>
        <MockComponent>
          {() => {
            const [param, setParam] = useQueryParam('foo');
            qpVal = param;
            qpUpdateFn = setParam;

            return <div>I am a subscriber</div>;
          }}
        </MockComponent>
      </Router>
    );

    expect(qpVal).toEqual('hello');
    act(() => qpUpdateFn('newVal'));
    await nextTick();

    expect(historyPushSpy).toBeCalledWith(
      `${mockPath}?foo=newVal&bar=world#hash`
    );
  });

  it('should remove param from URL when set to null', async () => {
    const mockPath = mockLocation.pathname;
    let qpVal: string | undefined, qpUpdateFn: (qp: string | null) => void;

    mount(
      <Router routes={mockRoutes} history={history}>
        <MockComponent>
          {() => {
            const [param, setParam] = useQueryParam('foo');
            qpVal = param;
            qpUpdateFn = setParam;

            return <div>I am a subscriber</div>;
          }}
        </MockComponent>
      </Router>
    );

    expect(qpVal).toEqual('hello');

    act(() => qpUpdateFn(null));

    await nextTick();

    expect(historyPushSpy).toBeCalledWith(`${mockPath}?bar=world#hash`);
  });

  it('should only re-render components hooked to a specific param', async () => {
    let fooVal: string | undefined,
      barVal: string | undefined,
      fooUpdateFn: (qp: string) => void,
      barUpdateFn: (qp: string) => void;

    let renderedFoo = 0;
    const ComponentFoo = () => {
      const [foo, setFoo] = useQueryParam('foo');
      fooVal = foo;
      fooUpdateFn = setFoo;
      renderedFoo++;

      return <div id="foo-count">{renderedFoo}</div>;
    };
    let renderedBar = 0;
    const ComponentBar = () => {
      const [bar, setBar] = useQueryParam('bar');
      barVal = bar;
      barUpdateFn = setBar;
      renderedBar++;

      return <div id="bar-count">{renderedBar}</div>;
    };

    const wrapper = mount(
      <Router
        routes={mockRoutes}
        history={historyHelper.createBrowserHistory()}
      >
        <ComponentFoo />
        <ComponentBar />
      </Router>
    );

    expect(wrapper.find(ComponentFoo).html()).toEqual(
      '<div id="foo-count">1</div>'
    );
    expect(wrapper.find(ComponentBar).html()).toEqual(
      '<div id="bar-count">1</div>'
    );

    const { storeState, actions } = getRouterStore();

    actions.push('/projects/123/board/456?foo=hello&bar=world');
    await nextTick();

    expect(fooVal).toEqual('hello');
    expect(barVal).toEqual('world');
    expect(wrapper.find(ComponentFoo).html()).toEqual(
      '<div id="foo-count">2</div>'
    );
    expect(wrapper.find(ComponentBar).html()).toEqual(
      '<div id="bar-count">2</div>'
    );

    act(() => fooUpdateFn('newVal'));
    await nextTick();

    // URL is now — /projects/123/board/456?foo=newVal&bar=world
    expect(storeState.getState().location.pathname).toEqual(
      '/projects/123/board/456'
    );
    expect(storeState.getState().location.search).toEqual(
      '?foo=newVal&bar=world'
    );
    expect(fooVal).toEqual('newVal');
    expect(barVal).toEqual('world');
    expect(wrapper.find(ComponentFoo).html()).toEqual(
      '<div id="foo-count">3</div>'
    );
    expect(wrapper.find(ComponentBar).html()).toEqual(
      '<div id="bar-count">2</div>'
    );

    act(() => barUpdateFn('newVal'));
    await nextTick();

    // URL is now — /projects/123/board/456?foo=newVal&bar=newVal
    expect(storeState.getState().location.pathname).toEqual(
      '/projects/123/board/456'
    );
    expect(storeState.getState().location.search).toEqual(
      '?foo=newVal&bar=newVal'
    );
    expect(fooVal).toEqual('newVal');
    expect(barVal).toEqual('newVal');
    expect(wrapper.find(ComponentFoo).html()).toEqual(
      '<div id="foo-count">3</div>'
    );
    expect(wrapper.find(ComponentBar).html()).toEqual(
      '<div id="bar-count">3</div>'
    );
  });
});

describe('usePathParam', () => {
  beforeEach(() => {
    history = historyHelper.createMemoryHistory(historyBuildOptions);
    historyPushSpy = jest.spyOn(history, 'push');
  });

  afterEach(() => {
    defaultRegistry.stores.clear();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should return the right param value', () => {
    let ppVal: string | undefined;

    mount(
      <Router routes={mockRoutes} history={history}>
        <MockComponent>
          {() => {
            const [param] = usePathParam('projectId');
            ppVal = param;

            return <div>I am a subscriber</div>;
          }}
        </MockComponent>
      </Router>
    );
    expect(ppVal).toEqual('123');
  });

  it('should return undefined for non-existent params', () => {
    let ppVal: string | undefined;
    mount(
      <Router routes={mockRoutes} history={history}>
        <MockComponent>
          {() => {
            const [param] = usePathParam('iamnotapathparam');
            ppVal = param;

            return <div>I am a subscriber</div>;
          }}
        </MockComponent>
      </Router>
    );
    expect(ppVal).toEqual(undefined);
  });

  it('should update URL with new param value', async () => {
    let ppVal: string | undefined, ppUpdateFn: (qp: string) => void;

    mount(
      <Router routes={mockRoutes} history={history}>
        <MockComponent>
          {() => {
            const [param, setParam] = usePathParam('projectId');
            ppVal = param;
            ppUpdateFn = setParam;

            return <div>I am a subscriber</div>;
          }}
        </MockComponent>
      </Router>
    );

    expect(ppVal).toEqual('123');

    act(() => ppUpdateFn('newVal'));
    await nextTick();

    const { storeState } = getRouterStore();
    const expectedPath = `/projects/newVal/board/456${mockLocation.search}${mockLocation.hash}`;
    expect(historyPushSpy).toBeCalledWith(expectedPath);
    expect(storeState.getState().location.pathname).toEqual(
      '/projects/newVal/board/456'
    );
  });
});
