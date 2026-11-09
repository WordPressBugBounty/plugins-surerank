# Execution flow: admin metadata display

Issue: #3041. PR: #3042. Target branch: `dev`.

## Before this PR

`Loader` loads `Seo_Bar` → constructor checks `enable_page_level_seo` and `surerank_content_setting_access` → `admin_init` calls `setup_columns()` → public supported post types register `column_heading()` and `column_content()` → `surerank-data` contains the badge's mount element.

`admin_enqueue_scripts()` localizes post type/list context → `src/apps/admin-seo-bar/index.js::renderBadges()` collects row IDs → `getSeoBarChecks()` / `fetchSeoBarChecks()` in `src/store/resolvers.js` call `/surerank/v1/checks/page` → `Analyzer::get_page_seo_checks()` applies per-object authorization and reads cached or fresh checks → `setBatchPageSeoChecks()` categorizes checks → `getSeoBarChecks()` selector feeds `CustomBadge`.

Badge activation → existing SEO popup → `src/apps/seo-popup/components/save-button.js` saves metadata → `surerank:seo-data-saved` → `renderBadge()` forces fresh checks for the saved row. Title and description are visible only inside the popup/editor.

## After this PR

The same entry point and column remain. Asset localization additionally evaluates `Seo_Bar::show_meta_in_admin_list()` after theme loading → the list batch request asks for `include_admin_meta` only when enabled.

`Analyzer::get_page_seo_checks()` → existing `Post::can_manage_post_seo()` object permission check → request flag and `Seo_Bar::show_meta_in_admin_list()` gate → optional `Seo_Bar::get_meta_summary()` → `Settings::prep_post_meta()` merges base/global/extended/per-post metadata → `Variables::replace()` resolves title and description using the row ID → `Get::all_post_meta()` identifies per-field custom/template provenance → plain-text `admin_meta` payload travels beside checks in the same REST response.

`setBatchPageSeoChecks()` retains `adminMeta` separately from scoring → `src/store/selectors.js::getSeoBarChecks()` supplies it to `CustomBadge` → `src/apps/admin-seo-bar/meta-summary.js::MetaSummary` renders title/description below the existing badge. Inherited values have a Template label; empty resolved values show Missing. CSS limits collapsed previews to two lines and native `details` disclosure exposes full values; text is escaped by React.

Popup save → existing saved event → same forced request → fresh badge and metadata together. If analysis fails with metadata enabled, the row retains its metadata and exposes the check error rather than a successful badge. Disabled lists send no metadata request flag, resolve no metadata, and render the existing badge alone.

## Scope

Pages, Posts, and public custom post types accepted by `Seo_Bar::display_metabox()`. Existing page-level SEO/access/exclusion gates also apply to metadata. Taxonomy and user flows are unchanged.

## Verification

24 relevant PHP tests passed with 81 assertions, including eight new metadata tests and existing authorization/save coverage. PHPStan, PHPCS, JavaScript/style lint, production build, and `git diff --check` passed.

The full GitHub PHPUnit matrix passed on PHP 7.4 through 8.4. A CI follow-up sorts the PHP imports in `inc/admin/seo-bar.php`; the entry points, calls, data handling, and execution flow described above remain identical. The exact CI PHP Insights command and affected-file PHPCS passed locally after this correction.

In an isolated WordPress browser fixture, the default list showed only existing badges. Enabling the filter from the theme displayed correct per-row metadata on Pages, Posts, and a supported public custom post type. An excluded post type had no SEO column. Saving a custom title through the existing popup refreshed the displayed title without a list reload, and Enter expanded the full description. Removing the enabling filter restored the badge-only list. Analysis was stubbed in the browser fixture; error preservation and authorization were covered by PHP regression tests.
