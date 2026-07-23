# Changelog

## [1.4.0](https://github.com/iieg-oficial/catalogo-fuentes/compare/v1.3.0...v1.4.0) (2026-07-23)


### ✨ Features

* **distribuciones:** add shared view-only color for identificador chip ([3da6f32](https://github.com/iieg-oficial/catalogo-fuentes/commit/3da6f329cc5ea99205c995f8b7d88a38e3b786ce))
* **productos:** add datasets-by-product endpoint over physical chain ([a2b86f3](https://github.com/iieg-oficial/catalogo-fuentes/commit/a2b86f390f9bbde9546ba665faaddafc8de5c554))
* **productos:** show feeding datasets column with view-only color ([03b84ab](https://github.com/iieg-oficial/catalogo-fuentes/commit/03b84aba537f7286da715fd1699978d4240bebd7))


### 🔄 Updates

* **archivos:** show distribucion as brand chip for direct relation ([4a59974](https://github.com/iieg-oficial/catalogo-fuentes/commit/4a59974b4a0a3fa68b0ed4111fdaaef1506960c9))
* **productos:** move datasets column next to descripcion ([9969626](https://github.com/iieg-oficial/catalogo-fuentes/commit/996962600a3208b333c35c6662ac7ecc3faef648))

## [1.3.0](https://github.com/iieg-oficial/catalogo-fuentes/compare/v1.2.0...v1.3.0) (2026-07-13)


### ✨ Features

* **distribucion:** add computed distribucion_label identifier ([4c0a065](https://github.com/iieg-oficial/catalogo-fuentes/commit/4c0a0655a7468e52f697e79a54db397fc2ba62b3))
* **distribucion:** show composite identifier in distribuciones and archivos views ([3c486da](https://github.com/iieg-oficial/catalogo-fuentes/commit/3c486da76a98e6eea52e07cd8964a3c8784cb7ea))
* **import:** add CSV import service and reusable ImportCsvButton ([0622e55](https://github.com/iieg-oficial/catalogo-fuentes/commit/0622e55dd1f11f2c8cc5e007e695855568b67474))
* **import:** add CSV import service with FK resolution and all-or-nothing transaction ([cb4acbe](https://github.com/iieg-oficial/catalogo-fuentes/commit/cb4acbe1444a9bf41f341da13ed833849bb5b2cc))
* **import:** add CSV preview overlay and useImportPreview hook ([be2290c](https://github.com/iieg-oficial/catalogo-fuentes/commit/be2290cde8b3e20793e63d66002f0c4cc1b77d2e))
* **import:** add declarative per-entity import config ([7d43ff2](https://github.com/iieg-oficial/catalogo-fuentes/commit/7d43ff28f77acc60b503cb7ac98c4743bd0d09f2))
* **import:** add name normalizer and CSV import result schemas ([00a39fd](https://github.com/iieg-oficial/catalogo-fuentes/commit/00a39fd6e50980f3f843ec5c4a4a2a4d300137f2))
* **import:** add optional-FK flag and import configs for the 7 remaining entities ([8e37508](https://github.com/iieg-oficial/catalogo-fuentes/commit/8e3750891f5b5f3c6aa8021bcdd5b71c2ac05a98))
* **import:** add POST /import/{entidad} endpoint guarded by require_admin ([4a00b30](https://github.com/iieg-oficial/catalogo-fuentes/commit/4a00b304ab73c3ad6b2bf9dd230fe60c251d0c4b))
* **import:** add POST /import/{entidad}/preview dry-run endpoint ([213f241](https://github.com/iieg-oficial/catalogo-fuentes/commit/213f241cdbfd10a6748a234d54c4a27c39eb2091))
* **import:** resolve distribucion and edicion foreign keys by composite key ([fc13fd7](https://github.com/iieg-oficial/catalogo-fuentes/commit/fc13fd7ada80ecf9be705a2804f5327b29c01a6d))
* **import:** support optional FKs, boolean coercion and skip fully-empty rows ([92fb4c1](https://github.com/iieg-oficial/catalogo-fuentes/commit/92fb4c1d563c8d8d4d3618de91afc137ed8d121d))
* **import:** wire CSV import into proyecto and producto views ([02ba9cb](https://github.com/iieg-oficial/catalogo-fuentes/commit/02ba9cb4c4d50ccf1ac78b96a1a2c61662278dbe))
* **import:** wire CSV import into the remaining 7 catalog views ([02ae163](https://github.com/iieg-oficial/catalogo-fuentes/commit/02ae16352c1b4e5c8d38f0e3c68069fbc555a5e8))
* **import:** wire CSV preview flow into all catalog views ([f3e4862](https://github.com/iieg-oficial/catalogo-fuentes/commit/f3e48627f8449f5a8d5ff7f3ad68d7c10647bc78))


### 🐛 Bug Fixes

* **catalogos:** lead proyecto and base_de_datos tables with their name column ([3bd7177](https://github.com/iieg-oficial/catalogo-fuentes/commit/3bd7177352ce09f1df6cc1262c95595acf75154d))
* **catalogos:** normalize rol_archivo whitespace before adding CHECK constraint ([5efde68](https://github.com/iieg-oficial/catalogo-fuentes/commit/5efde688504298a6ae19372b61f50fa2e008f71b))
* **import:** align frontend ImportResult with backend and add preview service ([ac95570](https://github.com/iieg-oficial/catalogo-fuentes/commit/ac9557079b08f2bbdaff46038417ddaede147f9e))
* **import:** reject CSV columns that do not belong to the target entity ([a05b8f0](https://github.com/iieg-oficial/catalogo-fuentes/commit/a05b8f0e11f01183a580c2fbad1caafaad126942))
* **import:** show preview bar when all CSV rows are duplicates ([899d19f](https://github.com/iieg-oficial/catalogo-fuentes/commit/899d19f4aac1b05e00721955a5c46c5fe7a0b7aa))


### ♻️ Refactors

* **import:** centralize preview controls in floating ImportControls bar ([af7cb2b](https://github.com/iieg-oficial/catalogo-fuentes/commit/af7cb2b88a231234497df548b55d2909eec9f5be))
* **import:** extract pure row processing shared by import and preview ([bb8c748](https://github.com/iieg-oficial/catalogo-fuentes/commit/bb8c74812841c867182a3ca72a3c51093c5e48e1))


### 🔧 Chores

* **config:** ignore csv files and lock files ([26add02](https://github.com/iieg-oficial/catalogo-fuentes/commit/26add0234e02e0a2a83d10ffeca6af802f76940e))

## [1.2.0](https://github.com/iieg-oficial/catalogo-fuentes/compare/v1.1.0...v1.2.0) (2026-07-07)


### ✨ Features

* **catalogos:** add dropdown options for tipo_dataset, tipo_de_acceso and rol_archivo ([3c6d300](https://github.com/iieg-oficial/catalogo-fuentes/commit/3c6d30002dff88ca469ba7c6095f739e7b735591))


### 🔄 Updates

* **dictamen:** update dictamen catalog to codes A1-A4, B and C ([abf1e86](https://github.com/iieg-oficial/catalogo-fuentes/commit/abf1e8678abafd1b183cc44a6f707b19c120465f))
* **distribuciones:** remove medio_distribucion attribute ([383b48c](https://github.com/iieg-oficial/catalogo-fuentes/commit/383b48ca346203dc84725a7694ab0ef91f07f36f))


### 🔧 Chores

* **config:** ignore dumps directory ([21ec8d4](https://github.com/iieg-oficial/catalogo-fuentes/commit/21ec8d4f1e9f3e407f398321f0d813cd7e7ec0ed))

## [1.1.0](https://github.com/iieg-oficial/catalogo-fuentes/compare/v1.0.0...v1.1.0) (2026-06-22)


### ✨ Features

* **backend:** add alembic migration for new tracking structure ([7405598](https://github.com/iieg-oficial/catalogo-fuentes/commit/740559812b1ccad6acf0d724942e1687ae8f0406))
* **backend:** add change password and update profile endpoints ([1114d2e](https://github.com/iieg-oficial/catalogo-fuentes/commit/1114d2ec081c9e503500bed12e3053411b4be1ad))
* **backend:** add password and profile schemas, hash password on user creation ([9873fc6](https://github.com/iieg-oficial/catalogo-fuentes/commit/9873fc6a29119a0995896d92cacf33a38f73b89e))
* **backend:** add tipo_periodo catalog model, schema, service, route ([23ff5df](https://github.com/iieg-oficial/catalogo-fuentes/commit/23ff5dfa654022e317bba724e5c47322fc3e5de6))
* **backend:** add tipo_periodo migration and seed base values ([e2be86d](https://github.com/iieg-oficial/catalogo-fuentes/commit/e2be86da1b63178361576d51fdc28f8689c0ae4a))
* **backend:** link edicion_dataset to tipo_periodo via foreign key ([26aab14](https://github.com/iieg-oficial/catalogo-fuentes/commit/26aab14a0acda7a3493377f5b7237ecaa28fbcf3))
* **ediciones:** add puntaje and dictamen fields with color coding ([6360bd3](https://github.com/iieg-oficial/catalogo-fuentes/commit/6360bd384d111914e0fcd7ee79c72a4405ec4393))
* **entidades:** render ERD from models via erdalchemy ([f5250b1](https://github.com/iieg-oficial/catalogo-fuentes/commit/f5250b134e312a6e2ae753caf9dc50fbdf32983c))
* **frontend:** add collapsible sidebar toggle ([d9f2e0b](https://github.com/iieg-oficial/catalogo-fuentes/commit/d9f2e0bce575fe0ef70c2258713fa1eb34457eab))
* **frontend:** add delete confirmation and toast to catalog grid ([9dbba09](https://github.com/iieg-oficial/catalogo-fuentes/commit/9dbba09c85f126db0c5630af98e6ef722f2e4b31))
* **frontend:** add edit and delete user actions ([9a0be8b](https://github.com/iieg-oficial/catalogo-fuentes/commit/9a0be8b39b49be08345b43c602b69c7e1abb8701))
* **frontend:** add fade-in animation to home page sections ([043567d](https://github.com/iieg-oficial/catalogo-fuentes/commit/043567de04e6d77118e55af87544bc01b2d50dd9))
* **frontend:** add inline-create option to SelectInput ([9de7cb8](https://github.com/iieg-oficial/catalogo-fuentes/commit/9de7cb8488ef2979909262a7364b1c6acab4c12f))
* **frontend:** add month and year navigation to date picker ([baa6647](https://github.com/iieg-oficial/catalogo-fuentes/commit/baa6647e143a552ce0557a9aeddb91d1c531e8e3))
* **frontend:** add nombre and temp password fields to create user modal ([e3e48b4](https://github.com/iieg-oficial/catalogo-fuentes/commit/e3e48b45f32d855bef3ea2b1989ff4f753f31dc0))
* **frontend:** add profile page with password change and sidebar navigation ([ce91318](https://github.com/iieg-oficial/catalogo-fuentes/commit/ce91318a84883ac5ef4e15e3aa00faf607defa00))
* **frontend:** add reusable Toast notification component ([95bdb07](https://github.com/iieg-oficial/catalogo-fuentes/commit/95bdb0793cf1e390fa67d8c8d3873fc634b4975b))
* **frontend:** add tipo_dataset create and reorder datasets columns ([ea034a7](https://github.com/iieg-oficial/catalogo-fuentes/commit/ea034a70f6c57cb23ad72577b9a6dd451668f3a5))
* **frontend:** adopt Garet font, blue institutional palette and sidebar redesign ([a70b68c](https://github.com/iieg-oficial/catalogo-fuentes/commit/a70b68c6b187a5e90ceead058be802a3dc9c138f))
* **frontend:** consume tipo_periodo catalog in ediciones and ERD ([60a8dfb](https://github.com/iieg-oficial/catalogo-fuentes/commit/60a8dfbb5eb9eeb44b809b4101ca0281bd2ca873))
* **frontend:** redesign login page to match godin two-column layout ([90bdd9a](https://github.com/iieg-oficial/catalogo-fuentes/commit/90bdd9ae0823f348b0ceef20c1c2d55436931bef))
* **frontend:** show toast on user creation ([cd3b4b0](https://github.com/iieg-oficial/catalogo-fuentes/commit/cd3b4b06e9b7956dac6c30ce5c49506b2d75cefb))
* **justfile:** add confirmation prompts to destructive commands ([c028473](https://github.com/iieg-oficial/catalogo-fuentes/commit/c0284731bed8dfaa690b41b9daaa01f54607e625))
* **migrations:** add schema_migrations tracking table to prevent re-running applied migrations ([c9a8d20](https://github.com/iieg-oficial/catalogo-fuentes/commit/c9a8d200f9763b68818e85088502a9c75c4abdfc)), closes [#42](https://github.com/iieg-oficial/catalogo-fuentes/issues/42)
* **migrations:** migrate from raw SQL to Alembic for schema management ([90f1c0b](https://github.com/iieg-oficial/catalogo-fuentes/commit/90f1c0b6d95b771a1c4435cb9ee95ee581193f32))


### 🔄 Updates

* **backend:** align Pydantic schemas with new tracking structure ([ee8279d](https://github.com/iieg-oficial/catalogo-fuentes/commit/ee8279dffb16888b269d7e803d7cef74496c68db))
* **backend:** migrate SQLAlchemy models to new tracking structure ([7d3de44](https://github.com/iieg-oficial/catalogo-fuentes/commit/7d3de4486d850a8375f2ba1abd12bde41f1b1aa0))
* **backend:** seed catalogs and data matching new structure ([f2bfcfe](https://github.com/iieg-oficial/catalogo-fuentes/commit/f2bfcfe0e22b41d45c28e0a79461c5aa97fa98be))
* **backend:** update services and routes for new schema and catalogs ([90ba16e](https://github.com/iieg-oficial/catalogo-fuentes/commit/90ba16e7e80b5ae10484ad661afab11c48f7bedf))
* **frontend:** add profile nav link and increase sidebar item spacing ([3ae5ae6](https://github.com/iieg-oficial/catalogo-fuentes/commit/3ae5ae6d81cd9893de333e94882471df7bd421d5))
* **frontend:** align types and services with new tracking structure ([d11f40a](https://github.com/iieg-oficial/catalogo-fuentes/commit/d11f40a5d3a0f8a7b5b566f20e2de8cdfe93265f))
* **frontend:** change CatalogGrid heading from Newsreader to Garet ([c73cd2f](https://github.com/iieg-oficial/catalogo-fuentes/commit/c73cd2fe91f8f83b699977fdd4fc09314f34898a))
* **frontend:** improve sidebar avatar contrast ([ff3145e](https://github.com/iieg-oficial/catalogo-fuentes/commit/ff3145e7cc725979a5d60c3e7dd3e5fe0eda8456))
* **frontend:** redesign home with grid and list module views ([826a34e](https://github.com/iieg-oficial/catalogo-fuentes/commit/826a34ef18a4c79dfb1dfb55c58f1cd27f9efa5a))
* **frontend:** refine profile page layout and avatar to match godin ([9b899c7](https://github.com/iieg-oficial/catalogo-fuentes/commit/9b899c737cd00d8f84eef1000020d7d1ec9eac2a))
* **frontend:** remove remember-user checkbox from login page ([09d73c7](https://github.com/iieg-oficial/catalogo-fuentes/commit/09d73c7341a060cc8f0106fef2f94bc53672595f))
* **frontend:** reorder catalog columns, panel order and labels ([482a9b2](https://github.com/iieg-oficial/catalogo-fuentes/commit/482a9b23b6e8fc953b17cf7298ed2a43bfcbc3bb))
* **frontend:** search tables across metadata column ([b8eb5be](https://github.com/iieg-oficial/catalogo-fuentes/commit/b8eb5be1cad67591b0da4b0e76e61ecf77a0284c))
* **frontend:** set base font-size to 14px matching godin ([b3d4713](https://github.com/iieg-oficial/catalogo-fuentes/commit/b3d4713ae13f59397fcb41fb6486df24177ef0ff))
* **frontend:** update catalog pages to new schema fields ([4078f41](https://github.com/iieg-oficial/catalogo-fuentes/commit/4078f413d87dddb37ad449ef3ea889478931406d))
* **frontend:** update document title to Catálogo de fuentes ([19bdfcb](https://github.com/iieg-oficial/catalogo-fuentes/commit/19bdfcbb74cd05121b0a811655ddc363bf997a77))


### 🐛 Bug Fixes

* **a11y:** apply full audit remediation — contrast, aria, memo, touch targets, font token ([f32e23d](https://github.com/iieg-oficial/catalogo-fuentes/commit/f32e23dddbe5d53a3277cf62b13205119255426a))
* **a11y:** fix aria-labels, touch targets, contrast and extract color constants ([6c0d459](https://github.com/iieg-oficial/catalogo-fuentes/commit/6c0d45959affabaaea727f29fd26963596bfb173))
* **a11y:** fix contrast failures and missing labels from second a11y scan ([d5cdb75](https://github.com/iieg-oficial/catalogo-fuentes/commit/d5cdb7591a08d8c96bc9e62e6a97435f9d37e69a))
* **a11y:** fix contrast failures, aria labels, touch targets, and deduplicate PRIORITY_LEVELS ([1ed2a45](https://github.com/iieg-oficial/catalogo-fuentes/commit/1ed2a45454c78cd3d3648b372f9dfd0b65f9b77e))
* **a11y:** raise text-ink/55 to text-ink/70 across remaining cell renderers ([f135771](https://github.com/iieg-oficial/catalogo-fuentes/commit/f135771fc39e4f3c91189384f39a22c232b39cfa))
* **backend:** enforce role hierarchy when assigning user roles ([1fb4230](https://github.com/iieg-oficial/catalogo-fuentes/commit/1fb4230d87f05c98b7f93b56fb3bc132b675c569))
* **ediciones:** send null to clear puntaje and dictamen on edit ([483ddf6](https://github.com/iieg-oficial/catalogo-fuentes/commit/483ddf60cde1886ddc8fb1e460712d05f716d1c4))
* **entidades:** disable diagram controls until iframe loads ([b53c123](https://github.com/iieg-oficial/catalogo-fuentes/commit/b53c1239b68ef9615132dfb5dbac635fd17928d9))
* **frontend:** apply a11y, performance, and theming audit fixes ([c92546c](https://github.com/iieg-oficial/catalogo-fuentes/commit/c92546c97fc8a8040957a3f4f65f2237d7b3e173))
* **frontend:** restrict role dropdown to assignable roles ([88f3aac](https://github.com/iieg-oficial/catalogo-fuentes/commit/88f3aacd9de2661816a70ded50d6c1cfaf181417))
* **justfile:** correct build recipe ([21fc385](https://github.com/iieg-oficial/catalogo-fuentes/commit/21fc385bc0a14c69f6547417d946929dde197ac0))
* **producto-tablas:** add pagination params to list endpoint ([432c273](https://github.com/iieg-oficial/catalogo-fuentes/commit/432c273cde09824167f8fa6ecf4f7d2f39fc0aa9))
* **security:** restrict CORS origins and remove hardcoded secrets ([ba0d497](https://github.com/iieg-oficial/catalogo-fuentes/commit/ba0d4974f7276212f8fcb7921f53f7b585066ea3))
* **sidebar:** add missing accent in Catálogo label ([4bae01c](https://github.com/iieg-oficial/catalogo-fuentes/commit/4bae01ce3b4356e990f67314ce87a497cc2824ec))
* **ux:** set cursor-default on UI chrome elements ([94640af](https://github.com/iieg-oficial/catalogo-fuentes/commit/94640af59b084688c65e7794e1dcbdfa73e2278e))


### ♻️ Refactors

* **auth:** extract signup activation logic to service layer ([5469770](https://github.com/iieg-oficial/catalogo-fuentes/commit/54697704bf01339596c5ed2f084d87e690c98175))
* **catalog:** remove unused priority column type and PRIORITY_LEVELS ([0f7445c](https://github.com/iieg-oficial/catalogo-fuentes/commit/0f7445c5de33736049fecd2b00c7202c8241defd))
* **frontend:** replace inline buttons with reusable Button component ([35cf6bb](https://github.com/iieg-oficial/catalogo-fuentes/commit/35cf6bb00647558af10226d602db9c3ced0e4451))
* **justfile:** split monolithic justfile into modular subcommands ([187988f](https://github.com/iieg-oficial/catalogo-fuentes/commit/187988fd191f79da086cb25841f34250005276df))
* **structure:** normalize all feature pages into pages/ subdirectory ([f2dc28f](https://github.com/iieg-oficial/catalogo-fuentes/commit/f2dc28fdd1a1fc3649d682231e9794435632331f))


### 🔧 Chores

* remove empty barrel files and unused feature index files ([96a4ce4](https://github.com/iieg-oficial/catalogo-fuentes/commit/96a4ce43ae403f90c060436425b770fe2ab7fd37))

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
