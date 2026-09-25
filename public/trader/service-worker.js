/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-1ca7ae36'], (function (workbox) { 'use strict';

            self.skipWaiting();
            workbox.clientsClaim();
            workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
              "cacheName": "google-fonts-stylesheets",
              plugins: [new workbox.ExpirationPlugin({
                maxEntries: 20,
                maxAgeSeconds: 31536000
              })]
            }), 'GET');
            workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
              "cacheName": "google-fonts-webfonts",
              plugins: [new workbox.CacheableResponsePlugin({
                statuses: [0, 200]
              }), new workbox.ExpirationPlugin({
                maxEntries: 30,
                maxAgeSeconds: 31536000
              })]
            }), 'GET');
            workbox.registerRoute(/^https:\/\/(cdn\.jsdelivr\.net)\/.*/i, new workbox.StaleWhileRevalidate({
              "cacheName": "cdn-resources",
              plugins: [new workbox.ExpirationPlugin({
                maxEntries: 20,
                maxAgeSeconds: 86400
              })]
            }), 'GET');
            workbox.registerRoute(/public\/images\/(?!.*favicons).*$/, new workbox.CacheFirst({
              "cacheName": "assets",
              plugins: [new workbox.ExpirationPlugin({
                maxAgeSeconds: 86400
              })]
            }), 'GET');
            workbox.registerRoute(({
              url
            }) => {
              return url.pathname.match(/^\/js\/(?!(.*((core\.[a-z_]*-json\.)|smartcharts))).*$/);
            }, new workbox.CacheFirst({
              "cacheName": "core-js-files",
              plugins: [new workbox.ExpirationPlugin({
                maxAgeSeconds: 86400
              })]
            }), 'GET');
            workbox.registerRoute(({
              url
            }) => {
              return url.pathname.match(/^\/js\/(smartcharts)\//);
            }, new workbox.CacheFirst({
              "cacheName": "smartchart-files",
              plugins: [new workbox.ExpirationPlugin({
                maxAgeSeconds: 86400
              })]
            }), 'GET');
            workbox.registerRoute(({
              url
            }) => {
              return url.pathname.match(/^\/css\//);
            }, new workbox.CacheFirst({
              "cacheName": "core-css-files",
              plugins: [new workbox.ExpirationPlugin({
                maxAgeSeconds: 86400
              })]
            }), 'GET');
            workbox.registerRoute(/(trader|reports)\//, new workbox.CacheFirst({
              "cacheName": "packages-files",
              plugins: [new workbox.ExpirationPlugin({
                maxAgeSeconds: 86400
              })]
            }), 'GET');

}));
//# sourceMappingURL=service-worker.js.map
