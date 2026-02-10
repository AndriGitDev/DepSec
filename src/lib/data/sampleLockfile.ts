// Sample package-lock.json with transitive dependencies for demo
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
          axios: "^1.6.0",
          express: "^4.18.2",
          lodash: "^4.17.21",
          minimist: "~1.2.5",
          "node-fetch": "~2.6.1",
          qs: "~6.5.2",
          "shell-quote": "~1.7.2",
          "follow-redirects": "^1.14.0",
          jsonwebtoken: "^9.0.0",
          tar: "~6.1.0",
          semver: "~7.3.7",
          "xml2js": "~0.4.23",
        },
        devDependencies: {
          typescript: "^5.3.0",
          eslint: "^8.56.0",
        },
      },
      // Direct dependencies
      "node_modules/axios": {
        version: "1.6.0",
        resolved: "https://registry.npmjs.org/axios/-/axios-1.6.0.tgz",
        dependencies: {
          "follow-redirects": "^1.15.0",
          "form-data": "^4.0.0",
          "proxy-from-env": "^1.1.0",
        },
      },
      "node_modules/express": {
        version: "4.18.2",
        resolved: "https://registry.npmjs.org/express/-/express-4.18.2.tgz",
        dependencies: {
          accepts: "~1.3.8",
          "body-parser": "1.20.1",
          "content-disposition": "0.5.4",
          "cookie": "0.5.0",
          debug: "2.6.9",
          depd: "2.0.0",
          qs: "6.11.0",
          "raw-body": "2.5.1",
          "send": "0.18.0",
          "serve-static": "1.15.0",
        },
      },
      "node_modules/lodash": {
        version: "4.17.21",
        resolved: "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",
      },
      "node_modules/minimist": {
        version: "1.2.5",
        resolved: "https://registry.npmjs.org/minimist/-/minimist-1.2.5.tgz",
      },
      "node_modules/node-fetch": {
        version: "2.6.1",
        resolved: "https://registry.npmjs.org/node-fetch/-/node-fetch-2.6.1.tgz",
      },
      "node_modules/qs": {
        version: "6.5.2",
        resolved: "https://registry.npmjs.org/qs/-/qs-6.5.2.tgz",
      },
      "node_modules/shell-quote": {
        version: "1.7.2",
        resolved: "https://registry.npmjs.org/shell-quote/-/shell-quote-1.7.2.tgz",
      },
      "node_modules/follow-redirects": {
        version: "1.14.0",
        resolved: "https://registry.npmjs.org/follow-redirects/-/follow-redirects-1.14.0.tgz",
      },
      "node_modules/jsonwebtoken": {
        version: "9.0.0",
        resolved: "https://registry.npmjs.org/jsonwebtoken/-/jsonwebtoken-9.0.0.tgz",
        dependencies: {
          "jws": "^3.2.2",
          "lodash": "^4.17.21",
          "ms": "^2.1.1",
          "semver": "^7.3.8",
        },
      },
      "node_modules/tar": {
        version: "6.1.0",
        resolved: "https://registry.npmjs.org/tar/-/tar-6.1.0.tgz",
        dependencies: {
          chownr: "^2.0.0",
          "fs-minipass": "^2.0.0",
          minipass: "^3.0.0",
          minizlib: "^2.1.1",
          mkdirp: "^1.0.3",
          yallist: "^4.0.0",
        },
      },
      "node_modules/semver": {
        version: "7.3.7",
        resolved: "https://registry.npmjs.org/semver/-/semver-7.3.7.tgz",
        dependencies: {
          "lru-cache": "^6.0.0",
        },
      },
      "node_modules/xml2js": {
        version: "0.4.23",
        resolved: "https://registry.npmjs.org/xml2js/-/xml2js-0.4.23.tgz",
        dependencies: {
          sax: ">=0.6.0",
          xmlbuilder: "~11.0.0",
        },
      },
      "node_modules/typescript": {
        version: "5.3.0",
        resolved: "https://registry.npmjs.org/typescript/-/typescript-5.3.0.tgz",
        dev: true,
      },
      "node_modules/eslint": {
        version: "8.56.0",
        resolved: "https://registry.npmjs.org/eslint/-/eslint-8.56.0.tgz",
        dev: true,
        dependencies: {
          ajv: "^6.12.4",
          chalk: "^4.0.0",
          debug: "^4.3.2",
          "espree": "^9.6.0",
          "globals": "^13.19.0",
          minimatch: "^3.1.2",
        },
      },
      // Transitive dependencies (depth 1)
      "node_modules/form-data": {
        version: "4.0.0",
        resolved: "https://registry.npmjs.org/form-data/-/form-data-4.0.0.tgz",
        dependencies: {
          "asynckit": "^0.4.0",
          "combined-stream": "^1.0.8",
          "mime-types": "^2.1.12",
        },
      },
      "node_modules/proxy-from-env": {
        version: "1.1.0",
        resolved: "https://registry.npmjs.org/proxy-from-env/-/proxy-from-env-1.1.0.tgz",
      },
      "node_modules/accepts": {
        version: "1.3.8",
        resolved: "https://registry.npmjs.org/accepts/-/accepts-1.3.8.tgz",
        dependencies: {
          "mime-types": "~2.1.34",
          negotiator: "0.6.3",
        },
      },
      "node_modules/body-parser": {
        version: "1.20.1",
        resolved: "https://registry.npmjs.org/body-parser/-/body-parser-1.20.1.tgz",
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
          "unpipe": "1.0.0",
        },
      },
      "node_modules/debug": {
        version: "2.6.9",
        resolved: "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
        dependencies: {
          ms: "2.0.0",
        },
      },
      "node_modules/depd": {
        version: "2.0.0",
        resolved: "https://registry.npmjs.org/depd/-/depd-2.0.0.tgz",
      },
      "node_modules/send": {
        version: "0.18.0",
        resolved: "https://registry.npmjs.org/send/-/send-0.18.0.tgz",
        dependencies: {
          debug: "2.6.9",
          destroy: "1.2.0",
          "escape-html": "~1.0.3",
          etag: "~1.8.1",
          fresh: "0.5.2",
          "http-errors": "2.0.0",
          "mime": "1.6.0",
          ms: "2.1.3",
          "on-finished": "2.4.1",
          "range-parser": "~1.2.1",
          statuses: "2.0.1",
        },
      },
      "node_modules/serve-static": {
        version: "1.15.0",
        resolved: "https://registry.npmjs.org/serve-static/-/serve-static-1.15.0.tgz",
        dependencies: {
          "encodeurl": "~1.0.2",
          "escape-html": "~1.0.3",
          "parseurl": "~1.3.3",
          "send": "0.18.0",
        },
      },
      "node_modules/jws": {
        version: "3.2.2",
        resolved: "https://registry.npmjs.org/jws/-/jws-3.2.2.tgz",
        dependencies: {
          "jwa": "^1.4.1",
          "safe-buffer": "^5.0.1",
        },
      },
      "node_modules/ms": {
        version: "2.1.3",
        resolved: "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      },
      "node_modules/chownr": {
        version: "2.0.0",
        resolved: "https://registry.npmjs.org/chownr/-/chownr-2.0.0.tgz",
      },
      "node_modules/fs-minipass": {
        version: "2.1.0",
        resolved: "https://registry.npmjs.org/fs-minipass/-/fs-minipass-2.1.0.tgz",
        dependencies: {
          minipass: "^3.0.0",
        },
      },
      "node_modules/minipass": {
        version: "3.3.6",
        resolved: "https://registry.npmjs.org/minipass/-/minipass-3.3.6.tgz",
        dependencies: {
          yallist: "^4.0.0",
        },
      },
      "node_modules/minizlib": {
        version: "2.1.2",
        resolved: "https://registry.npmjs.org/minizlib/-/minizlib-2.1.2.tgz",
        dependencies: {
          minipass: "^3.0.0",
          yallist: "^4.0.0",
        },
      },
      "node_modules/mkdirp": {
        version: "1.0.4",
        resolved: "https://registry.npmjs.org/mkdirp/-/mkdirp-1.0.4.tgz",
      },
      "node_modules/yallist": {
        version: "4.0.0",
        resolved: "https://registry.npmjs.org/yallist/-/yallist-4.0.0.tgz",
      },
      "node_modules/lru-cache": {
        version: "6.0.0",
        resolved: "https://registry.npmjs.org/lru-cache/-/lru-cache-6.0.0.tgz",
        dependencies: {
          yallist: "^4.0.0",
        },
      },
      "node_modules/sax": {
        version: "1.2.4",
        resolved: "https://registry.npmjs.org/sax/-/sax-1.2.4.tgz",
      },
      "node_modules/xmlbuilder": {
        version: "11.0.1",
        resolved: "https://registry.npmjs.org/xmlbuilder/-/xmlbuilder-11.0.1.tgz",
      },
      // Transitive dependencies (depth 2+)
      "node_modules/asynckit": {
        version: "0.4.0",
        resolved: "https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz",
      },
      "node_modules/combined-stream": {
        version: "1.0.8",
        resolved: "https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz",
        dependencies: {
          "delayed-stream": "~1.0.0",
        },
      },
      "node_modules/delayed-stream": {
        version: "1.0.0",
        resolved: "https://registry.npmjs.org/delayed-stream/-/delayed-stream-1.0.0.tgz",
      },
      "node_modules/mime-types": {
        version: "2.1.35",
        resolved: "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
        dependencies: {
          "mime-db": "1.52.0",
        },
      },
      "node_modules/mime-db": {
        version: "1.52.0",
        resolved: "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
      },
      "node_modules/negotiator": {
        version: "0.6.3",
        resolved: "https://registry.npmjs.org/negotiator/-/negotiator-0.6.3.tgz",
      },
      "node_modules/bytes": {
        version: "3.1.2",
        resolved: "https://registry.npmjs.org/bytes/-/bytes-3.1.2.tgz",
      },
      "node_modules/content-type": {
        version: "1.0.5",
        resolved: "https://registry.npmjs.org/content-type/-/content-type-1.0.5.tgz",
      },
      "node_modules/destroy": {
        version: "1.2.0",
        resolved: "https://registry.npmjs.org/destroy/-/destroy-1.2.0.tgz",
      },
      "node_modules/http-errors": {
        version: "2.0.0",
        resolved: "https://registry.npmjs.org/http-errors/-/http-errors-2.0.0.tgz",
        dependencies: {
          depd: "2.0.0",
          inherits: "2.0.4",
          setprototypeof: "1.2.0",
          statuses: "2.0.1",
          toidentifier: "1.0.1",
        },
      },
      "node_modules/inherits": {
        version: "2.0.4",
        resolved: "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
      },
      "node_modules/setprototypeof": {
        version: "1.2.0",
        resolved: "https://registry.npmjs.org/setprototypeof/-/setprototypeof-1.2.0.tgz",
      },
      "node_modules/statuses": {
        version: "2.0.1",
        resolved: "https://registry.npmjs.org/statuses/-/statuses-2.0.1.tgz",
      },
      "node_modules/toidentifier": {
        version: "1.0.1",
        resolved: "https://registry.npmjs.org/toidentifier/-/toidentifier-1.0.1.tgz",
      },
      "node_modules/on-finished": {
        version: "2.4.1",
        resolved: "https://registry.npmjs.org/on-finished/-/on-finished-2.4.1.tgz",
        dependencies: {
          "ee-first": "1.1.1",
        },
      },
      "node_modules/ee-first": {
        version: "1.1.1",
        resolved: "https://registry.npmjs.org/ee-first/-/ee-first-1.1.1.tgz",
      },
      "node_modules/raw-body": {
        version: "2.5.1",
        resolved: "https://registry.npmjs.org/raw-body/-/raw-body-2.5.1.tgz",
        dependencies: {
          bytes: "3.1.2",
          "http-errors": "2.0.0",
          iconv: "0.6.3",
          unpipe: "1.0.0",
        },
      },
      "node_modules/unpipe": {
        version: "1.0.0",
        resolved: "https://registry.npmjs.org/unpipe/-/unpipe-1.0.0.tgz",
      },
      "node_modules/type-is": {
        version: "1.6.18",
        resolved: "https://registry.npmjs.org/type-is/-/type-is-1.6.18.tgz",
        dependencies: {
          "media-typer": "0.3.0",
          "mime-types": "~2.1.24",
        },
      },
      "node_modules/media-typer": {
        version: "0.3.0",
        resolved: "https://registry.npmjs.org/media-typer/-/media-typer-0.3.0.tgz",
      },
      "node_modules/escape-html": {
        version: "1.0.3",
        resolved: "https://registry.npmjs.org/escape-html/-/escape-html-1.0.3.tgz",
      },
      "node_modules/etag": {
        version: "1.8.1",
        resolved: "https://registry.npmjs.org/etag/-/etag-1.8.1.tgz",
      },
      "node_modules/fresh": {
        version: "0.5.2",
        resolved: "https://registry.npmjs.org/fresh/-/fresh-0.5.2.tgz",
      },
      "node_modules/range-parser": {
        version: "1.2.1",
        resolved: "https://registry.npmjs.org/range-parser/-/range-parser-1.2.1.tgz",
      },
      "node_modules/jwa": {
        version: "1.4.1",
        resolved: "https://registry.npmjs.org/jwa/-/jwa-1.4.1.tgz",
        dependencies: {
          "buffer-equal-constant-time": "1.0.1",
          "ecdsa-sig-formatter": "1.0.11",
          "safe-buffer": "^5.0.1",
        },
      },
      "node_modules/safe-buffer": {
        version: "5.2.1",
        resolved: "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
      },
      "node_modules/buffer-equal-constant-time": {
        version: "1.0.1",
        resolved: "https://registry.npmjs.org/buffer-equal-constant-time/-/buffer-equal-constant-time-1.0.1.tgz",
      },
      "node_modules/ecdsa-sig-formatter": {
        version: "1.0.11",
        resolved: "https://registry.npmjs.org/ecdsa-sig-formatter/-/ecdsa-sig-formatter-1.0.11.tgz",
        dependencies: {
          "safe-buffer": "^5.0.1",
        },
      },
    },
  },
  null,
  2
);
