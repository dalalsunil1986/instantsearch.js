import algoliasearchHelper from 'algoliasearch-helper';
import isEqual from 'lodash/isEqual';

export default class RoutingManager {
  constructor({ instantSearchInstance, router, stateMapping } = {}) {
    this.originalConfig = null;
    this.firstRender = true;

    this.router = router;
    this.stateMapping = stateMapping;
    this.instantSearchInstance = instantSearchInstance;

    this.currentUIState = this.stateMapping.routeToState(this.router.read());
  }

  init({ state }) {
    // store the initial state from the storage
    // so that we can compare it with the state after the first render
    // in case the searchFunction has modifyied it.
    this.initState = this.getAllUIStates({
      searchParameters: state,
    });
  }

  getConfiguration(currentConfiguration) {
    // we need to create a REAL helper to then get its state. Because some parameters
    // like hierarchicalFacet.rootPath are then triggering a default refinement that would
    // be not present if it was not going trough the SearchParameters constructor
    this.originalConfig = algoliasearchHelper(
      {},
      currentConfiguration.index,
      currentConfiguration
    ).state;
    // The content of getAllSearchParameters is destructured to return a plain object
    return {
      ...this.getAllSearchParameters({
        currentSearchParameters: this.originalConfig,
        uiState: this.currentUIState,
      }),
    };
  }

  render({ state }) {
    if (this.firstRender) {
      this.firstRender = false;
      this.setupRouting(state);
    }
  }

  setupRouting(state) {
    const { helper } = this.instantSearchInstance;

    this.router.onUpdate(route => {
      this.currentUIState = this.stateMapping.routeToState(route);

      const widgetsUIState = this.getAllUIStates({
        searchParameters: helper.state,
      });

      if (isEqual(this.currentUIState, widgetsUIState)) return;

      const searchParameters = this.getAllSearchParameters({
        currentSearchParameters: state,
        instantSearchInstance: this.instantSearchInstance,
        uiState: this.currentUIState,
      });

      const fullHelperState = {
        ...this.originalConfig,
        ...searchParameters,
      };

      if (isEqual(fullHelperState, searchParameters)) return;

      helper
        .overrideStateWithoutTriggeringChangeEvent(searchParameters)
        .search();
    });

    this.renderURLFromState = searchParameters => {
      this.currentUIState = this.getAllUIStates({
        searchParameters,
      });

      const route = this.stateMapping.stateToRoute(this.currentUIState);

      this.router.write(route);
    };

    helper.on('change', this.renderURLFromState);

    // Compare initial state and first render state, in order to see if the
    // query has been changed by a `searchFunction`. It's required because the
    // helper of the `searchFunction` does not trigger change event (not the
    // same instance).

    this.currentUIState = this.getAllUIStates({
      searchParameters: state,
    });

    if (!isEqual(this.initState, this.currentUIState)) {
      // Force update the URL, if the state has changed since the initial read.
      // We do this in order to make the URL update when there is `searchFunction`
      // that prevent the search of the initial rendering.
      // See: https://github.com/algolia/instantsearch.js/issues/2523#issuecomment-339356157
      const route = this.stateMapping.stateToRoute(this.currentUIState);

      this.router.write(route);
    }
  }

  dispose() {
    if (this.renderURLFromState) {
      this.instantSearchInstance.helper.removeListener(
        'change',
        this.renderURLFromState
      );
    }
    this.router.dispose();
  }

  getAllSearchParameters({ currentSearchParameters, uiState }) {
    const { widgets } = this.instantSearchInstance;
    const searchParameters = widgets.reduce((sp, w) => {
      if (!w.getWidgetSearchParameters) return sp;
      return w.getWidgetSearchParameters(sp, {
        uiState,
      });
    }, currentSearchParameters);
    return searchParameters;
  }

  getAllUIStates({ searchParameters }) {
    const { widgets, helper } = this.instantSearchInstance;
    const uiState = widgets
      .filter(w => Boolean(w.getWidgetState))
      .reduce(
        (u, w) =>
          w.getWidgetState(u, {
            helper,
            searchParameters,
          }),
        {}
      );

    return uiState;
  }

  // External API's

  createURL(state) {
    const uiState = this.getAllUIStates({
      searchParameters: state,
    });
    const route = this.stateMapping.stateToRoute(uiState);
    return this.router.createURL(route);
  }

  onHistoryChange(fn) {
    const { helper } = this.instantSearchInstance;

    this.router.onUpdate(route => {
      this.currentUIState = this.stateMapping.routeToState(route);

      const widgetsUIState = this.getAllUIStates({
        searchParameters: helper.state,
      });

      if (isEqual(this.currentUIState, widgetsUIState)) return;

      const searchParameters = this.getAllSearchParameters({
        currentSearchParameters: helper.state,
        instantSearchInstance: this.instantSearchInstance,
        uiState: this.currentUIState,
      });

      const fullSearchParameters = {
        ...this.originalConfig,
        ...searchParameters,
      };

      fn(fullSearchParameters);
    });
  }
}
