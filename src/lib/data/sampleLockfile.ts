// Sample package-lock.json matching samplePackageJson
// Includes transitive dependencies to demonstrate depth analysis
export const sampleLockfile = JSON.stringify(
  {
    name: "acme-dashboard",
    version: "2.1.0",
    lockfileVersion: 3,
    requires: true,
    packages: {
      "": {
        name: "acme-dashboard",
        version: "2.1.0",
        dependencies: {
          express: "^4.18.2",
          lodash: "^4.17.21",
          zod: "^3.22.0",
          minimist: "1.2.5",
          "shell-quote": "1.7.2",
          json5: "2.2.1",
          tar: "6.1.0",
          qs: "6.5.2",
          "follow-redirects": "1.14.0",
          "node-fetch": "2.6.1",
          lodahs: "^1.0.0",
          expresss: "^1.0.0",
          request: "^2.88.2",
          moment: "^2.29.4",
          underscore: "*",
          async: ">=2.0.0",
          "some-internal-lib": "github:acme/internal-lib#main",
          "readline-sync": "^1.4.10",
        },
        devDependencies: {
          typescript: "^5.3.0",
          "@types/node": "^20.10.0",
          "@types/express": "^4.17.0",
          eslint: "^8.56.0",
          prettier: "^3.2.0",
          vitest: "^1.2.0",
        },
      },

      // ============ DIRECT DEPENDENCIES ============
      
      "node_modules/express": {
        version: "4.18.2",
        resolved: "https://registry.npmjs.org/express/-/express-4.18.2.tgz",
        license: "MIT",
        dependencies: {
          accepts: "~1.3.8",
          "body-parser": "1.20.1",
          "content-disposition": "0.5.4",
          cookie: "0.5.0",
          debug: "2.6.9",
          depd: "2.0.0",
          qs: "6.11.0",
          "raw-body": "2.5.1",
          send: "0.18.0",
          "serve-static": "1.15.0",
          "path-to-regexp": "0.1.7",
        },
      },
      "node_modules/lodash": {
        version: "4.17.21",
        resolved: "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",
        license: "MIT",
      },
      "node_modules/zod": {
        version: "3.22.4",
        resolved: "https://registry.npmjs.org/zod/-/zod-3.22.4.tgz",
        license: "MIT",
      },
      "node_modules/minimist": {
        version: "1.2.5",
        resolved: "https://registry.npmjs.org/minimist/-/minimist-1.2.5.tgz",
        license: "MIT",
      },
      "node_modules/shell-quote": {
        version: "1.7.2",
        resolved: "https://registry.npmjs.org/shell-quote/-/shell-quote-1.7.2.tgz",
        license: "MIT",
      },
      "node_modules/json5": {
        version: "2.2.1",
        resolved: "https://registry.npmjs.org/json5/-/json5-2.2.1.tgz",
        license: "MIT",
      },
      "node_modules/tar": {
        version: "6.1.0",
        resolved: "https://registry.npmjs.org/tar/-/tar-6.1.0.tgz",
        license: "ISC",
        dependencies: {
          chownr: "^2.0.0",
          "fs-minipass": "^2.0.0",
          minipass: "^3.0.0",
          minizlib: "^2.1.1",
          mkdirp: "^1.0.3",
          yallist: "^4.0.0",
        },
      },
      "node_modules/qs": {
        version: "6.5.2",
        resolved: "https://registry.npmjs.org/qs/-/qs-6.5.2.tgz",
        license: "BSD-3-Clause",
      },
      "node_modules/follow-redirects": {
        version: "1.14.0",
        resolved: "https://registry.npmjs.org/follow-redirects/-/follow-redirects-1.14.0.tgz",
        license: "MIT",
      },
      "node_modules/node-fetch": {
        version: "2.6.1",
        resolved: "https://registry.npmjs.org/node-fetch/-/node-fetch-2.6.1.tgz",
        license: "MIT",
      },
      "node_modules/lodahs": {
        version: "1.0.0",
        resolved: "https://registry.npmjs.org/lodahs/-/lodahs-1.0.0.tgz",
        license: "MIT",
      },
      "node_modules/expresss": {
        version: "1.0.0",
        resolved: "https://registry.npmjs.org/expresss/-/expresss-1.0.0.tgz",
        license: "MIT",
      },
      "node_modules/request": {
        version: "2.88.2",
        resolved: "https://registry.npmjs.org/request/-/request-2.88.2.tgz",
        license: "Apache-2.0",
        deprecated: "request has been deprecated",
        dependencies: {
          "aws-sign2": "~0.7.0",
          "aws4": "^1.8.0",
          "caseless": "~0.12.0",
          "combined-stream": "~1.0.6",
          "extend": "~3.0.2",
          "forever-agent": "~0.6.1",
          "form-data": "~2.3.2",
          "har-validator": "~5.1.3",
          "http-signature": "~1.2.0",
          "is-typedarray": "~1.0.0",
          "isstream": "~0.1.2",
          "json-stringify-safe": "~5.0.1",
          "mime-types": "~2.1.19",
          "oauth-sign": "~0.9.0",
          "performance-now": "^2.1.0",
          qs: "~6.5.2",
          "safe-buffer": "^5.1.2",
          "tough-cookie": "~2.5.0",
          "tunnel-agent": "^0.6.0",
          uuid: "^3.3.2",
        },
      },
      "node_modules/moment": {
        version: "2.29.4",
        resolved: "https://registry.npmjs.org/moment/-/moment-2.29.4.tgz",
        license: "MIT",
      },
      "node_modules/underscore": {
        version: "1.13.6",
        resolved: "https://registry.npmjs.org/underscore/-/underscore-1.13.6.tgz",
        license: "MIT",
      },
      "node_modules/async": {
        version: "3.2.5",
        resolved: "https://registry.npmjs.org/async/-/async-3.2.5.tgz",
        license: "MIT",
      },
      "node_modules/readline-sync": {
        version: "1.4.10",
        resolved: "https://registry.npmjs.org/readline-sync/-/readline-sync-1.4.10.tgz",
        license: "MIT",
      },

      // ============ DEV DEPENDENCIES ============
      
      "node_modules/typescript": {
        version: "5.3.3",
        resolved: "https://registry.npmjs.org/typescript/-/typescript-5.3.3.tgz",
        license: "Apache-2.0",
        dev: true,
      },
      "node_modules/@types/node": {
        version: "20.10.5",
        resolved: "https://registry.npmjs.org/@types/node/-/node-20.10.5.tgz",
        license: "MIT",
        dev: true,
      },
      "node_modules/@types/express": {
        version: "4.17.21",
        resolved: "https://registry.npmjs.org/@types/express/-/express-4.17.21.tgz",
        license: "MIT",
        dev: true,
      },
      "node_modules/eslint": {
        version: "8.56.0",
        resolved: "https://registry.npmjs.org/eslint/-/eslint-8.56.0.tgz",
        license: "MIT",
        dev: true,
        dependencies: {
          ajv: "^6.12.4",
          chalk: "^4.0.0",
          debug: "^4.3.2",
          espree: "^9.6.0",
          globals: "^13.19.0",
          minimatch: "^3.1.2",
        },
      },
      "node_modules/prettier": {
        version: "3.2.4",
        resolved: "https://registry.npmjs.org/prettier/-/prettier-3.2.4.tgz",
        license: "MIT",
        dev: true,
      },
      "node_modules/vitest": {
        version: "1.2.1",
        resolved: "https://registry.npmjs.org/vitest/-/vitest-1.2.1.tgz",
        license: "MIT",
        dev: true,
      },

      // ============ TRANSITIVE DEPENDENCIES (Depth 1) ============
      
      "node_modules/accepts": {
        version: "1.3.8",
        resolved: "https://registry.npmjs.org/accepts/-/accepts-1.3.8.tgz",
        license: "MIT",
        dependencies: {
          "mime-types": "~2.1.34",
          negotiator: "0.6.3",
        },
      },
      "node_modules/body-parser": {
        version: "1.20.1",
        resolved: "https://registry.npmjs.org/body-parser/-/body-parser-1.20.1.tgz",
        license: "MIT",
        dependencies: {
          bytes: "3.1.2",
          "content-type": "~1.0.4",
          debug: "2.6.9",
          depd: "2.0.0",
          destroy: "1.2.0",
          "http-errors": "2.0.0",
          iconv: "0.6.3",
          "on-finished": "2.4.1",
          qs: "6.11.0",
          "raw-body": "2.5.1",
          "type-is": "~1.6.18",
          unpipe: "1.0.0",
        },
      },
      "node_modules/debug": {
        version: "2.6.9",
        resolved: "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
        license: "MIT",
        dependencies: {
          ms: "2.0.0",
        },
      },
      "node_modules/depd": {
        version: "2.0.0",
        resolved: "https://registry.npmjs.org/depd/-/depd-2.0.0.tgz",
        license: "MIT",
      },
      "node_modules/send": {
        version: "0.18.0",
        resolved: "https://registry.npmjs.org/send/-/send-0.18.0.tgz",
        license: "MIT",
        dependencies: {
          debug: "2.6.9",
          destroy: "1.2.0",
          "escape-html": "~1.0.3",
          etag: "~1.8.1",
          fresh: "0.5.2",
          "http-errors": "2.0.0",
          mime: "1.6.0",
          ms: "2.1.3",
          "on-finished": "2.4.1",
          "range-parser": "~1.2.1",
          statuses: "2.0.1",
        },
      },
      "node_modules/serve-static": {
        version: "1.15.0",
        resolved: "https://registry.npmjs.org/serve-static/-/serve-static-1.15.0.tgz",
        license: "MIT",
        dependencies: {
          encodeurl: "~1.0.2",
          "escape-html": "~1.0.3",
          parseurl: "~1.3.3",
          send: "0.18.0",
        },
      },
      "node_modules/chownr": {
        version: "2.0.0",
        resolved: "https://registry.npmjs.org/chownr/-/chownr-2.0.0.tgz",
        license: "ISC",
      },
      "node_modules/fs-minipass": {
        version: "2.1.0",
        resolved: "https://registry.npmjs.org/fs-minipass/-/fs-minipass-2.1.0.tgz",
        license: "ISC",
        dependencies: {
          minipass: "^3.0.0",
        },
      },
      "node_modules/minipass": {
        version: "3.3.6",
        resolved: "https://registry.npmjs.org/minipass/-/minipass-3.3.6.tgz",
        license: "ISC",
        dependencies: {
          yallist: "^4.0.0",
        },
      },
      "node_modules/minizlib": {
        version: "2.1.2",
        resolved: "https://registry.npmjs.org/minizlib/-/minizlib-2.1.2.tgz",
        license: "MIT",
        dependencies: {
          minipass: "^3.0.0",
          yallist: "^4.0.0",
        },
      },
      "node_modules/mkdirp": {
        version: "1.0.4",
        resolved: "https://registry.npmjs.org/mkdirp/-/mkdirp-1.0.4.tgz",
        license: "MIT",
      },
      "node_modules/yallist": {
        version: "4.0.0",
        resolved: "https://registry.npmjs.org/yallist/-/yallist-4.0.0.tgz",
        license: "ISC",
      },
      "node_modules/combined-stream": {
        version: "1.0.8",
        resolved: "https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz",
        license: "MIT",
        dependencies: {
          "delayed-stream": "~1.0.0",
        },
      },
      "node_modules/form-data": {
        version: "2.3.3",
        resolved: "https://registry.npmjs.org/form-data/-/form-data-2.3.3.tgz",
        license: "MIT",
        dependencies: {
          asynckit: "^0.4.0",
          "combined-stream": "^1.0.6",
          "mime-types": "^2.1.12",
        },
      },
      "node_modules/tough-cookie": {
        version: "2.5.0",
        resolved: "https://registry.npmjs.org/tough-cookie/-/tough-cookie-2.5.0.tgz",
        license: "BSD-3-Clause",
        dependencies: {
          psl: "^1.1.28",
          punycode: "^2.1.1",
        },
      },
      "node_modules/safe-buffer": {
        version: "5.2.1",
        resolved: "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
        license: "MIT",
      },

      // ============ TRANSITIVE DEPENDENCIES (Depth 2) ============
      
      "node_modules/mime-types": {
        version: "2.1.35",
        resolved: "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
        license: "MIT",
        dependencies: {
          "mime-db": "1.52.0",
        },
      },
      "node_modules/negotiator": {
        version: "0.6.3",
        resolved: "https://registry.npmjs.org/negotiator/-/negotiator-0.6.3.tgz",
        license: "MIT",
      },
      "node_modules/bytes": {
        version: "3.1.2",
        resolved: "https://registry.npmjs.org/bytes/-/bytes-3.1.2.tgz",
        license: "MIT",
      },
      "node_modules/content-type": {
        version: "1.0.5",
        resolved: "https://registry.npmjs.org/content-type/-/content-type-1.0.5.tgz",
        license: "MIT",
      },
      "node_modules/destroy": {
        version: "1.2.0",
        resolved: "https://registry.npmjs.org/destroy/-/destroy-1.2.0.tgz",
        license: "MIT",
      },
      "node_modules/http-errors": {
        version: "2.0.0",
        resolved: "https://registry.npmjs.org/http-errors/-/http-errors-2.0.0.tgz",
        license: "MIT",
        dependencies: {
          depd: "2.0.0",
          inherits: "2.0.4",
          setprototypeof: "1.2.0",
          statuses: "2.0.1",
          toidentifier: "1.0.1",
        },
      },
      "node_modules/on-finished": {
        version: "2.4.1",
        resolved: "https://registry.npmjs.org/on-finished/-/on-finished-2.4.1.tgz",
        license: "MIT",
        dependencies: {
          "ee-first": "1.1.1",
        },
      },
      "node_modules/raw-body": {
        version: "2.5.1",
        resolved: "https://registry.npmjs.org/raw-body/-/raw-body-2.5.1.tgz",
        license: "MIT",
        dependencies: {
          bytes: "3.1.2",
          "http-errors": "2.0.0",
          unpipe: "1.0.0",
        },
      },
      "node_modules/type-is": {
        version: "1.6.18",
        resolved: "https://registry.npmjs.org/type-is/-/type-is-1.6.18.tgz",
        license: "MIT",
        dependencies: {
          "media-typer": "0.3.0",
          "mime-types": "~2.1.24",
        },
      },
      "node_modules/unpipe": {
        version: "1.0.0",
        resolved: "https://registry.npmjs.org/unpipe/-/unpipe-1.0.0.tgz",
        license: "MIT",
      },
      "node_modules/ms": {
        version: "2.0.0",
        resolved: "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
        license: "MIT",
      },
      "node_modules/escape-html": {
        version: "1.0.3",
        resolved: "https://registry.npmjs.org/escape-html/-/escape-html-1.0.3.tgz",
        license: "MIT",
      },
      "node_modules/etag": {
        version: "1.8.1",
        resolved: "https://registry.npmjs.org/etag/-/etag-1.8.1.tgz",
        license: "MIT",
      },
      "node_modules/fresh": {
        version: "0.5.2",
        resolved: "https://registry.npmjs.org/fresh/-/fresh-0.5.2.tgz",
        license: "MIT",
      },
      "node_modules/mime": {
        version: "1.6.0",
        resolved: "https://registry.npmjs.org/mime/-/mime-1.6.0.tgz",
        license: "MIT",
      },
      "node_modules/range-parser": {
        version: "1.2.1",
        resolved: "https://registry.npmjs.org/range-parser/-/range-parser-1.2.1.tgz",
        license: "MIT",
      },
      "node_modules/statuses": {
        version: "2.0.1",
        resolved: "https://registry.npmjs.org/statuses/-/statuses-2.0.1.tgz",
        license: "MIT",
      },
      "node_modules/encodeurl": {
        version: "1.0.2",
        resolved: "https://registry.npmjs.org/encodeurl/-/encodeurl-1.0.2.tgz",
        license: "MIT",
      },
      "node_modules/parseurl": {
        version: "1.3.3",
        resolved: "https://registry.npmjs.org/parseurl/-/parseurl-1.3.3.tgz",
        license: "MIT",
      },
      "node_modules/delayed-stream": {
        version: "1.0.0",
        resolved: "https://registry.npmjs.org/delayed-stream/-/delayed-stream-1.0.0.tgz",
        license: "MIT",
      },
      "node_modules/asynckit": {
        version: "0.4.0",
        resolved: "https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz",
        license: "MIT",
      },
      "node_modules/psl": {
        version: "1.9.0",
        resolved: "https://registry.npmjs.org/psl/-/psl-1.9.0.tgz",
        license: "MIT",
      },
      "node_modules/punycode": {
        version: "2.3.1",
        resolved: "https://registry.npmjs.org/punycode/-/punycode-2.3.1.tgz",
        license: "MIT",
      },

      // ============ TRANSITIVE DEPENDENCIES (Depth 3) ============
      
      "node_modules/mime-db": {
        version: "1.52.0",
        resolved: "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
        license: "MIT",
      },
      "node_modules/inherits": {
        version: "2.0.4",
        resolved: "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
        license: "ISC",
      },
      "node_modules/setprototypeof": {
        version: "1.2.0",
        resolved: "https://registry.npmjs.org/setprototypeof/-/setprototypeof-1.2.0.tgz",
        license: "ISC",
      },
      "node_modules/toidentifier": {
        version: "1.0.1",
        resolved: "https://registry.npmjs.org/toidentifier/-/toidentifier-1.0.1.tgz",
        license: "MIT",
      },
      "node_modules/ee-first": {
        version: "1.1.1",
        resolved: "https://registry.npmjs.org/ee-first/-/ee-first-1.1.1.tgz",
        license: "MIT",
      },
      "node_modules/media-typer": {
        version: "0.3.0",
        resolved: "https://registry.npmjs.org/media-typer/-/media-typer-0.3.0.tgz",
        license: "MIT",
      },
    },
  },
  null,
  2
);
