import qs from 'qs';

function defaultCreateURL({ qsModule, routeState, location }) {
  const { protocol, hostname, port = '', pathname, hash } = location;
  const queryString = qsModule.stringify(routeState);
  const portWithPrefix = port === '' ? '' : `:${port}`;
  // IE <= 11 has no location.origin or buggy. Therefore we don't rely on it
  if (!routeState || Object.keys(routeState).length === 0)
    return `${protocol}//${hostname}${portWithPrefix}${pathname}${hash}`;
  else
    return `${protocol}//${hostname}${portWithPrefix}${pathname}?${queryString}${hash}`;
}

function defaultParseURL({ qsModule, location }) {
  return qsModule.parse(location.search.slice(1));
}

class BrowserHistory {
  /**
   * Initializes a new storage provider that will sync the search state in the URL
   * using web API (window.location.pushState and onpopstate event).
   * @param {object} $0 the options.
   * @param {function(object):string} [$0.windowTitle] function that transforms a UI state
   * into a title for the page. It takes one parameter: a syncable object (generated by the mapping
   * provided to the URL sync). It should return a string that will be the title.
   * @param {number} [$0.writeDelay = 400] time before a write is actually done.
   * Prevent having too much entries in the history and thus make the back button more friendly.
   * @param {function(qs, object):string} [$0.createURL] generates the full URL. If not provided,
   * the storage adaptor will mapped all syncable keys to the query string of the URL. The first
   * parameter is a utility object that has two methods: `stringify` that creates a query string
   * from an object and `parse` that transforms a query string into an object.
   * @param {function(qs): object} [$0.parseURL] parses an URL into an object. It should symmetrical
   * to `createURL`. It gets as an argument an object that contains two methods: `stringify` that
   * creates a query string from an object and `parse` that transforms a query string into an object.
   */
  constructor({
    windowTitle,
    writeDelay = 400,
    createURL = defaultCreateURL,
    parseURL = defaultParseURL,
  } = {}) {
    this.windowTitle = windowTitle;
    this.writeTimer = undefined;
    this.writeDelay = writeDelay;
    this._createURL = createURL;
    this.parseURL = parseURL;
  }

  /**
   * This method pushes a search state into the URL.
   * @param {object} routeState a syncable UI state
   * @return {undefined}
   */
  write(routeState) {
    const url = this.createURL(routeState);
    const title = this.windowTitle && this.windowTitle(routeState);

    if (this.writeTimer) {
      window.clearTimeout(this.writeTimer);
    }

    this.writeTimer = setTimeout(() => {
      if (title) window.document.title = title;
      window.history.pushState(routeState, title || '', url);
      this.writeTimer = undefined;
    }, this.writeDelay);
  }

  /**
   * This methods read the URL and returns a syncable UI search state.
   * @return {object} the equivalent to what is store in the URL as an object
   */
  read() {
    return this.parseURL({ qsModule: qs, location: window.location });
  }

  /**
   * This methods sets a callback on the `onpopstate` event of the history API
   * of the current page. This way, the URL sync can keep track of the changes.
   * @param {function(object)} cb the callback that will receive the latest routeState.
   * It is called when the URL is updated.
   * @returns {undefined}
   */
  onUpdate(cb) {
    this._onPopState = event => {
      if (this.writeTimer) {
        window.clearTimeout(this.writeTimer);
        this.writeTimer = undefined;
      }
      const routeState = event.state;
      // at initial load, the state is read from the URL without
      // update. Therefore the state object is not there. In this
      // case we fallback and read the URL.
      if (!routeState) {
        cb(this.read());
      } else {
        cb(routeState);
      }
    };
    window.addEventListener('popstate', this._onPopState);
  }

  /**
   * This method creates a complete URL from a given syncable UI state.
   *
   * It always generates the full url, not a relative one.
   * This way we can handle cases like using a <base href>, see
   * https://github.com/algolia/instantsearch.js/issues/790 for the original issue
   *
   * @param {object} routeState a syncable UI state
   * @returns {string} the full URL for the provided syncable state
   */
  createURL(routeState) {
    return this._createURL({
      qsModule: qs,
      routeState,
      location: window.location,
    });
  }

  /**
   * This method removes the event listener and cleans up the URL.
   * @returns {undefined}
   */
  dispose() {
    window.removeEventListener('popstate', this._onPopState);
    if (this.writeTimer) window.clearTimeout(this.writeTimer);
    this.write();
  }
}

export default function(...args) {
  return new BrowserHistory(...args);
}
