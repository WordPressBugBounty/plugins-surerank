# Decisions: filter-controlled admin metadata display

Issue: #3041. PR: #3042. Target branch: `dev`.

## Filter only, disabled by default

Use `surerank_show_meta_in_admin_list`, default `false`, with the current post type as its second argument. Evaluate it during admin asset localization and REST handling, after themes and snippet plugins have loaded. No saved option or settings control is needed. This preserves the current list until explicitly enabled and follows the existing boolean `surerank_*` filter convention.

## Reuse the existing batch request and save refresh

Add an optional metadata payload to `/surerank/v1/checks/page` only when the list requests it and the PHP filter permits it. Carry it beside checks through the existing store. The existing `surerank:seo-data-saved` handler already forces a fresh batch request for the saved row. This avoids a new endpoint and per-row metadata requests. Metadata must remain available if existing SEO analysis fails; that error must still be represented by the badge.

## Resolve values in PHP using existing conventions

Use `Settings::prep_post_meta()` and `Variables::replace()` for the title and description. These preserve global defaults, Pro extended templates, per-post overrides, and content variables without crawling the frontend. Do not invent an extra description fallback that the frontend does not use. Use `Get::all_post_meta()` to distinguish custom values from templates: production storage groups these fields under `surerank_settings_general`; standalone `surerank_settings_page_title` keys are not the production format. Regression tests exposed and corrected the initial standalone-key assumption before any commit. Resolve each row using its own post ID and actual post type.

## Keep the current editing entry point

Show a read-only summary beneath the existing clickable SEO badge. Render strings as React text, with visually shortened previews and native keyboard-accessible disclosure of the complete values. Retain the existing capability, public post type, page-level SEO, and exclusion gates. Taxonomy and author lists remain outside this issue's content-list scope.

## Validation and isolation

Added eight PHP regression tests for opt-in behavior, permissions/exclusions, overrides, template variables, missing values, multiple-row context, batch response gating, text normalization, and analysis failures. Together with existing analyzer authorization and save-parity coverage, 24 tests passed with 81 assertions. PHPStan, PHPCS, JavaScript/style lint, and the production build passed. The build retains existing Sass deprecation and bundle-size warnings.

GitHub CI passed the full PHPUnit matrix on PHP 7.4 through 8.4, PHPCS, JavaScript/style lint, and PHPStan. PHP Insights identified an import-order violation in `inc/admin/seo-bar.php`. After sorting the imports, the exact CI PHP Insights command passed locally with 100-point code, architecture, and style scores; PHPCS also passed again for that file. This follow-up changes import ordering only and preserves the implementation decisions above.

Used an isolated clone of current `dev` because the existing local checkout had a broken Git worktree pointer. Installed dependencies and built assets locally without committing generated assets, dependency updates, or unrelated local changes. Browser validation used a separate WordPress installation and database. Existing analysis was stubbed and external requests blocked in that fixture; real plugin metadata persistence, batch REST handling, and popup save-refresh were exercised. This keeps fixture checks deterministic and avoids changing the user's active site.

Browser checks confirmed the badge-only default, theme-filter enablement, custom/template/missing summaries, keyboard expansion of full values, immediate row refresh after popup save, Posts and public custom post type support, excluded content, and removal of the enabling filter. Chrome logged viewport-transition cancellations during navigation; no metadata-rendering exception occurred.

## Usage

Add to a child theme's `functions.php` or a PHP snippets plugin (without a second `<?php` tag in an already open PHP file):

```php
add_filter( 'surerank_show_meta_in_admin_list', '__return_true' );
```

Only Pages:

```php
add_filter( 'surerank_show_meta_in_admin_list', static function ( $show, $post_type ) {
    return 'page' === $post_type;
}, 10, 2 );
```

Remove the enabling snippet or return `false` to hide the display. The filter controls admin visibility only.
