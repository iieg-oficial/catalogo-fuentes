# Changelog

## [1.0.0](https://github.com/iieg-oficial/dashboard-tracking/compare/v0.3.0...v1.0.0) (2026-05-15)


### ⚠ BREAKING CHANGES

* **frontend:** removes all pages, services, hooks, and components for deprecated v3 entities: Instrumentos, Tablas, Urls, Users.
* **backend:** removes User, Tabla, TablaProducto, Instrumento, Url, and MetaColumnConfig models.

### ✨ Features

* **backend:** add async CRUD services for all v4 entities ([fa4c594](https://github.com/iieg-oficial/dashboard-tracking/commit/fa4c594ce967c0dc331c9bc70ff5613e178a81b0))
* **backend:** add PUT endpoint for producto-tablas updates ([5becd18](https://github.com/iieg-oficial/dashboard-tracking/commit/5becd181b0d282edc9d4002230319324f96dfdfd))
* **backend:** add Pydantic v2 schemas for all v4 entities with ref pattern ([302e91d](https://github.com/iieg-oficial/dashboard-tracking/commit/302e91d7e58f5c903716c4ce57c1903658532eda))
* **backend:** add REST routes, RBAC auth, and seed data for v4 entities ([62ee3fb](https://github.com/iieg-oficial/dashboard-tracking/commit/62ee3fbee420a82f0ea66cd44a00102af998c4e9))
* **backend:** add v4 SQL migration with 14-table data governance schema ([90ae062](https://github.com/iieg-oficial/dashboard-tracking/commit/90ae062d12d1b86ddf6260d5b9607f144f3246c7))
* **backend:** replace legacy models with v4 SQLAlchemy entity models ([b7e0c47](https://github.com/iieg-oficial/dashboard-tracking/commit/b7e0c47a21aa279607d85971c3084929c363574c))
* **frontend:** add catalog pages for v4 entities (fuentes, datasets, ediciones, distribuciones, informacion_tablas, producto_tablas, usuarios) ([695af80](https://github.com/iieg-oficial/dashboard-tracking/commit/695af807306d035f8681786c447cfe213936bdd9))
* **frontend:** add copy-on-hover button to URL cells across catalog pages ([72127e0](https://github.com/iieg-oficial/dashboard-tracking/commit/72127e01b0a2c30d735c15b9d4b0756a486b8631))
* **frontend:** add custom date picker with react-day-picker for inline and create forms ([445dc3c](https://github.com/iieg-oficial/dashboard-tracking/commit/445dc3c5bcbf88c2144eeac68e882299fa19a873))
* **frontend:** add FK selects, boolean toggles, date inputs, and full create forms to all catalog pages ([5529a39](https://github.com/iieg-oficial/dashboard-tracking/commit/5529a394a703d5e32a77d5b310a41fce91f89f58))
* **frontend:** add hash_sha256 field to archivo across full stack ([ab179f6](https://github.com/iieg-oficial/dashboard-tracking/commit/ab179f63fe77395be355d91e7c611a111d29b018))
* **frontend:** add inline editing and expanded create forms to all catalog pages ([bed0012](https://github.com/iieg-oficial/dashboard-tracking/commit/bed0012ed42a910ac51d008a24ce71cb3b17961c))
* **frontend:** add inline editing and full create form to usuarios page ([2b00a74](https://github.com/iieg-oficial/dashboard-tracking/commit/2b00a740d8a010c238292fe500efebdf81da214c))
* **frontend:** add JSON and tags editor panels for JSONB fields ([290c872](https://github.com/iieg-oficial/dashboard-tracking/commit/290c87231bbe156a3461874804705e22df16f705))
* **frontend:** add missing edit/create for dates, etiquetas, FK datasets, and archivo fields ([889af79](https://github.com/iieg-oficial/dashboard-tracking/commit/889af79b9cf84c3d843196187d917b26be0da822))
* **frontend:** add TextCell component with tooltip and copy for long text fields ([534249a](https://github.com/iieg-oficial/dashboard-tracking/commit/534249a6ba44b3114e89a9c5c9b45c28bd02768d))
* **frontend:** remove legacy features (instrumentos, tablas, urls, users) ([5ab4dcb](https://github.com/iieg-oficial/dashboard-tracking/commit/5ab4dcb1d82d3f76312c5f8410224455d2b00620))
* **frontend:** update existing pages, routing, and sidebar for v4 schema ([e243a0d](https://github.com/iieg-oficial/dashboard-tracking/commit/e243a0dfdbf005289ef2a47341bc0e1d65123d12))
* integrate RBAC permission checks from permiso_rol table ([df4f018](https://github.com/iieg-oficial/dashboard-tracking/commit/df4f018c920c5fdfcbcfd2bea1e481476859f53b))


### 🔄 Updates

* **frontend:** add column name and row number to preview cards and enable producto-tablas FK editing ([c88fac9](https://github.com/iieg-oficial/dashboard-tracking/commit/c88fac9c6a2bded99c6af880b82fb57fd500038d))
* **frontend:** add editor/json toggle to JSON panel and improve cell display ([30238e8](https://github.com/iieg-oficial/dashboard-tracking/commit/30238e86f7eaa712b970fd47b15f5138e3cc6854))
* **frontend:** add fuzzy search, modal create form and page scroll to usuarios page ([2d6076c](https://github.com/iieg-oficial/dashboard-tracking/commit/2d6076c617d00c1fcc3f7453a6923f3b6cbd9686))
* **frontend:** change date display format to dd/mm/yyyy numeric ([387e0b3](https://github.com/iieg-oficial/dashboard-tracking/commit/387e0b303851bd54285170025b7a1e05a69304a7))
* **frontend:** improve column header labels with accents and descriptive names ([6e498e9](https://github.com/iieg-oficial/dashboard-tracking/commit/6e498e925b8f3a0ed990b317d6c6980396f918f1))
* **frontend:** make global search navigate to list page with filter and fix dropdown overlay ([3696d81](https://github.com/iieg-oficial/dashboard-tracking/commit/3696d81bf3bd3546674f58d674686179448aabff))
* **frontend:** migrate etiquetas from array to JSONB and unify JSON cell components ([a5ab508](https://github.com/iieg-oficial/dashboard-tracking/commit/a5ab50875648c319f37d2596731fc5a1c303c653))
* **frontend:** redesign homepage cards with square layout and custom color palette ([e7d6a40](https://github.com/iieg-oficial/dashboard-tracking/commit/e7d6a40910c70e66b431798fbb4306314e82a7f8))
* **frontend:** restore custom usuarios page with avatars, role pills, toggles and filters ([7634c5d](https://github.com/iieg-oficial/dashboard-tracking/commit/7634c5d9f38050207630bf80ca23073fbd9bf9df))
* **frontend:** restrict admin section in sidebar to users with manage permission ([53628f9](https://github.com/iieg-oficial/dashboard-tracking/commit/53628f9f1e8e9353214331aaaa6d5449befd6a10))
* **frontend:** set minimum column width to 320px in CatalogGrid ([029bf26](https://github.com/iieg-oficial/dashboard-tracking/commit/029bf26d24a54f88689316e544833ea866de3d6f))
* **frontend:** show user name instead of email in sidebar ([7f53df8](https://github.com/iieg-oficial/dashboard-tracking/commit/7f53df814923a10ba0947fb49eaf704dc6e00c7e))
* **frontend:** standardize cell color scheme across all catalog pages ([bbd6e7e](https://github.com/iieg-oficial/dashboard-tracking/commit/bbd6e7e91f068cf1ccb97ba71b4abed2262d5bb7))


### 🐛 Bug Fixes

* **frontend:** apply TextCell to all text fields and fix FK optimistic updates ([9b42bb8](https://github.com/iieg-oficial/dashboard-tracking/commit/9b42bb84c5bfe9acf5a06326fa756684c3ec0115))
* **frontend:** enforce canWrite permission on CatalogGrid inline editing ([72e2ad3](https://github.com/iieg-oficial/dashboard-tracking/commit/72e2ad3c0ec23738c86de6c86ad96febb76a8f92))
* **frontend:** fix overlapping nodes in entidades ERD layout ([7d4465c](https://github.com/iieg-oficial/dashboard-tracking/commit/7d4465c595918ad2403f02b237a697fbc33eaf68))
* **frontend:** fix register page field names and error handling for v4 schema ([1b9524d](https://github.com/iieg-oficial/dashboard-tracking/commit/1b9524d5366566f0e8327a7f8e8a2347fc89e568))
* **frontend:** fix role dropdown missing viewer and add optimistic updates ([b20d2d9](https://github.com/iieg-oficial/dashboard-tracking/commit/b20d2d94ed99336d9a07d2b6d3da21bd65a117ca))
* **frontend:** use native date picker for inline date editing and fix UTC timezone offset ([42bf7f3](https://github.com/iieg-oficial/dashboard-tracking/commit/42bf7f3c3afc7e6bb65f1259eb6b364c4f3e31ee))


### ♻️ Refactors

* remove hash_sha256 field from archivo entity ([c326aa5](https://github.com/iieg-oficial/dashboard-tracking/commit/c326aa583ed5c2fb137a04181e54e6bf89c0a7df))
* remove visualizer role, keep only viewer for read-only access ([b84d06a](https://github.com/iieg-oficial/dashboard-tracking/commit/b84d06abcfb751a9a83a822db568b77ab3180082))

## [0.3.0](https://github.com/iieg-oficial/dashboard-tracking/compare/v0.2.3...v0.3.0) (2026-04-29)


### ✨ Features

* **config:** add db-dump-prod and db-insert-prod commands to justfile ([68bb24c](https://github.com/iieg-oficial/dashboard-tracking/commit/68bb24c8f2c654999a1d2b7c5dbce96d1bb5112e))
* **frontend:** add client-side pagination to CatalogGrid (100 rows per page) ([92bd3c1](https://github.com/iieg-oficial/dashboard-tracking/commit/92bd3c18783af85b551d3182a2827d3151632719))
* **frontend:** add csv export button to catalog grid toolbar ([e8b7ab0](https://github.com/iieg-oficial/dashboard-tracking/commit/e8b7ab03af732b6f215f1db8af0133bdcd3696e9))


### 🐛 Bug Fixes

* **backend:** raise default list limit from 100 to 10_000 in all routes and services ([5555d43](https://github.com/iieg-oficial/dashboard-tracking/commit/5555d430ba649b1415a74edaf956893e2292e132))

## [0.2.3](https://github.com/iieg-oficial/dashboard-tracking/compare/v0.2.2...v0.2.3) (2026-04-28)


### 🐛 Bug Fixes

* **backend:** eagerly load updated_by on all nested relations to fix MissingGreenlet 500s ([fced64d](https://github.com/iieg-oficial/dashboard-tracking/commit/fced64d471927cb173a086a1e991a17789fb6d49))

## [0.2.2](https://github.com/iieg-oficial/dashboard-tracking/compare/v0.2.1...v0.2.2) (2026-04-28)


### 🐛 Bug Fixes

* **backend:** set allow_credentials=False to fix CORS with wildcard origin ([79af117](https://github.com/iieg-oficial/dashboard-tracking/commit/79af117df8e24330ea53ce991ef7dc81a550f61b))

## [0.2.1](https://github.com/iieg-oficial/dashboard-tracking/compare/v0.2.0...v0.2.1) (2026-04-27)


### 🔄 Updates

* **frontend:** redirect to catalog home after login ([54f235c](https://github.com/iieg-oficial/dashboard-tracking/commit/54f235c40b1e7954d6c7a32e52bd1072365f709d))


### 🐛 Bug Fixes

* **frontend:** prevent duplicate row creation on Enter key in CatalogGrid ([307a785](https://github.com/iieg-oficial/dashboard-tracking/commit/307a785f625558bda89944da4fac2ddd6d60a523))

## [0.2.0](https://github.com/iieg-oficial/dashboard-tracking/compare/v0.1.1...v0.2.0) (2026-04-27)


### ✨ Features

* **deploy:** add dev/prod environment split with separate seeds ([068580c](https://github.com/iieg-oficial/dashboard-tracking/commit/068580c30d012d2fb54316754a5e3521ea2c161a))
* **deploy:** add dev/prod environment split with separate seeds and docker compose override ([16f68a0](https://github.com/iieg-oficial/dashboard-tracking/commit/16f68a0c03166c23a3b8185193ffc78b0dbad971))

## [0.1.1](https://github.com/iieg-oficial/dashboard-tracking/compare/v0.1.0...v0.1.1) (2026-04-27)


### 🐛 Bug Fixes

* **ci:** align release-please workflow with working config ([a72f8f2](https://github.com/iieg-oficial/dashboard-tracking/commit/a72f8f2afbb6efbbcae8cb3f7b2932987443dba1))
* **ci:** downgrade release-please-action to v3 to avoid GraphQL 502 errors ([8fb6fc5](https://github.com/iieg-oficial/dashboard-tracking/commit/8fb6fc52506654d4fc0d27e0c2bee8d130360837))
* **ci:** remove package-name so release-please finds v0.1.0 tag ([12134a4](https://github.com/iieg-oficial/dashboard-tracking/commit/12134a4e8ba7ce751ef32345f4e868e4d4d57b08))


### 🔧 Chores

* **ci:** restore changelog sections in release-please config ([d38a18b](https://github.com/iieg-oficial/dashboard-tracking/commit/d38a18ba6b8856d04707cab12c59361c89e4c85d))
