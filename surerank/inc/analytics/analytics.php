<?php
/**
 * Analytics class helps to connect BSFAnalytics.
 *
 * @package surerank.
 */

namespace SureRank\Inc\Analytics;

use SureRank\Inc\Functions\Defaults;
use SureRank\Inc\Functions\Get;
use SureRank\Inc\Functions\Helper;
use SureRank\Inc\Functions\Settings;
use SureRank\Inc\GoogleSearchConsole\Controller;
use SureRank\Inc\Modules\EmailReports\Utils as EmailReportsUtil;
use SureRank\Inc\Traits\Get_Instance;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
/**
 * Analytics class.
 *
 * @since 1.4.0
 */
class Analytics {
	use Get_Instance;

	/**
	 * Events tracker instance.
	 *
	 * @var \BSF_Analytics_Events|null
	 */
	private static $events = null;

	/**
	 * Class constructor.
	 *
	 * @return void
	 * @since 1.4.0
	 */
	public function __construct() {

		// Only run analytics in admin context.
		if ( ! is_admin() ) {
			return;
		}

		if ( ! class_exists( 'Astra_Notices' ) ) {
			require_once SURERANK_DIR . 'inc/lib/astra-notices/class-astra-notices.php';
		}

		add_filter(
			'uds_survey_allowed_screens',
			static function () {
				return [ 'plugins' ];
			}
		);

		/*
		* BSF Analytics.
		*/
		if ( ! class_exists( 'BSF_Analytics_Loader' ) ) {
			require_once SURERANK_DIR . 'inc/lib/bsf-analytics/class-bsf-analytics-loader.php';
		}

		if ( ! class_exists( 'BSF_Analytics_Loader' ) ) {
			return;
		}

		$surerank_bsf_analytics = \BSF_Analytics_Loader::get_instance();

		$surerank_bsf_analytics->set_entity(
			[
				'surerank' => [
					'product_name'        => 'SureRank',
					'path'                => SURERANK_DIR . 'inc/lib/bsf-analytics',
					'author'              => 'SureRank',
					'time_to_display'     => '+24 hours',
					'deactivation_survey' => apply_filters(
						'surerank_deactivation_survey_data',
						[
							[
								'id'                => 'deactivation-survey-surerank',
								'popup_logo'        => SURERANK_URL . 'inc/admin/assets/images/surerank.png',
								'plugin_slug'       => 'surerank',
								'popup_title'       => 'Quick Feedback',
								'support_url'       => 'https://surerank.com/contact/',
								'popup_description' => 'If you have a moment, please share why you are deactivating SureRank:',
								'show_on_screens'   => [ 'plugins' ],
								'plugin_version'    => SURERANK_VERSION,
							],
						]
					),
					'hide_optin_checkbox' => true,
				],
			]
		);

		add_filter( 'bsf_core_stats', [ $this, 'add_surerank_analytics_data' ] );

		// State-based events — throttled to once per day.
		// Transient is set inside detect_state_events() only after confirming
		// BSF_Analytics_Events class is loaded, so it retries on next load if not ready.
		if ( false === get_transient( 'surerank_state_events_checked' ) ) {
			$this->detect_state_events();
		}
	}

	/**
	 * Get shared event tracker instance.
	 *
	 * @return \BSF_Analytics_Events|null
	 * @since 1.7.0
	 */
	public static function events() {
		if ( null === self::$events ) {
			if ( ! class_exists( 'BSF_Analytics_Events' ) ) {
				return null;
			}
			self::$events = new \BSF_Analytics_Events( 'surerank' );
		}
		return self::$events;
	}

	/**
	 * Callback function to add SureRank specific analytics data.
	 *
	 * @param array<string, mixed> $stats_data existing stats_data.
	 * @since 1.4.0
	 * @return array<string, mixed>
	 */
	public function add_surerank_analytics_data( $stats_data ) {
		$settings    = Settings::get();
		$pro_enabled = defined( 'SURERANK_PRO_VERSION' );

		$other_stats = [
			'site_language'                            => get_locale(),
			'gsc_connected'                            => $this->get_gsc_connected(),
			'plugin_version'                           => SURERANK_VERSION,
			'php_version'                              => phpversion(),
			'wordpress_version'                        => get_bloginfo( 'version' ),
			'is_active'                                => $this->is_active(),
			'enable_xml_sitemap'                       => $settings['enable_xml_sitemap'] ?? true,
			'enable_xml_image_sitemap'                 => $settings['enable_xml_image_sitemap'] ?? true,
			'enable_xml_news_sitemap'                  => $pro_enabled ? $settings['enable_xml_news_sitemap'] ?? false : false,
			'robots_custom_rules'                      => $this->has_custom_robots_rules(),
			'author_archive'                           => $settings['author_archive'] ?? true,
			'date_archive'                             => $settings['date_archive'] ?? true,
			'cron_available'                           => Helper::are_crons_available(),
			'redirect_attachment_pages_to_post_parent' => $settings['redirect_attachment_pages_to_post_parent'] ?? true,
			'auto_set_image_alt'                       => $settings['auto_set_image_alt'] ?? true,
			'email_reports_enabled'                    => $this->is_email_reports_enabled(),
			'site_type'                                => $this->get_site_type(),
			'failed_seo_checks_count'                  => $this->get_failed_seo_checks_count(),
			'kpi_records'                              => $this->get_kpi_tracking_data(),
			'events_record'                            => null !== self::events() ? self::events()->flush_pending() : [],
		];

		$stats = array_merge(
			$other_stats,
			$this->get_enabled_features()
		);

		$stats_data['plugin_data'] = [
			'surerank' => $stats,
		];

		return $stats_data;
	}

	/**
	 * Compare top-level and one-level nested settings with defaults.
	 *
	 * @param array<string, mixed> $settings Current settings.
	 * @param array<string, mixed> $defaults Default settings.
	 * @return array<string, mixed> Changed settings (top-level + one-level deep).
	 */
	public static function shallow_two_level_diff( array $settings, array $defaults ) {
		$difference = [];

		if ( isset( $defaults['surerank_usage_optin'] ) ) {
			unset( $defaults['surerank_usage_optin'] );
		}

		foreach ( $settings as $key => $value ) {

			// Key missing in defaults = changed.
			if ( ! array_key_exists( $key, $defaults ) ) {
				$difference[ $key ] = $value;
				continue;
			}

			// If value is an array, only check one level deep.
			if ( is_array( $value ) && is_array( $defaults[ $key ] ) ) {
				$nested_diff = [];
				foreach ( $value as $sub_key => $sub_value ) {
					if ( ! array_key_exists( $sub_key, $defaults[ $key ] ) || $sub_value !== $defaults[ $key ][ $sub_key ] ) {
						$nested_diff[ $sub_key ] = $sub_value;
					}
				}
				if ( ! empty( $nested_diff ) ) {
					$difference[ $key ] = $nested_diff;
				}
			} elseif ( $value !== $defaults[ $key ] ) {
				// Compare scalar values directly.
				$difference[ $key ] = $value;
			}
		}

		return $difference;
	}

	/**
	 * Detect state-based events.
	 *
	 * Checks conditions on admin load. BSF_Analytics_Events dedup prevents duplicates.
	 * Throttled via transient so this only runs once per day.
	 *
	 * @return void
	 * @since 1.7.0
	 */
	private function detect_state_events() {

		$events = self::events();
		if ( null === $events ) {
			// BSF_Analytics_Events class not loaded yet — do NOT set transient,
			// so this retries on the next admin page load.
			return;
		}

		// Class is available — set throttle transient so we don't re-run for 24h.
		set_transient( 'surerank_state_events_checked', 1, DAY_IN_SECONDS );

		// Plugin activated.
		$bsf_referrers = get_option( 'bsf_product_referers', [] );
		$source        = ! empty( $bsf_referrers['surerank'] )
			? sanitize_text_field( $bsf_referrers['surerank'] )
			: 'self';
		$events->track( 'plugin_activated', SURERANK_VERSION, [ 'source' => $source ] );

		// Plugin updated (version change detection).
		$stored_version = get_option( 'surerank_tracked_version', '' );
		if ( SURERANK_VERSION !== $stored_version ) {
			if ( ! empty( $stored_version ) ) {
				$events->flush_pushed( [ 'plugin_updated' ] );
				$events->track(
					'plugin_updated',
					SURERANK_VERSION,
					[
						'from_version' => $stored_version,
					]
				);
			}
			update_option( 'surerank_tracked_version', SURERANK_VERSION );
		}

		// Onboarding completed: detect completed or skipped state.
		$settings           = Settings::get();
		$website_type       = $settings['website_type'] ?? [];
		$onboarding_done    = ! empty( $website_type );
		$onboarding_skipped = get_option( 'surerank_onboarding_skipped', false ) && ! $onboarding_done;

		if ( $onboarding_done || $onboarding_skipped ) {
			$events->track(
				'onboarding_completed',
				'',
				[
					'skipped' => (string) (int) $onboarding_skipped,
				]
			);
		}

		// First post optimized (activation event).
		if ( $this->is_active() ) {
			$install_time = get_option( 'surerank_usage_installed_time', 0 );
			$days         = 0;
			if ( $install_time > 0 ) {
				$days = (int) floor( ( time() - $install_time ) / DAY_IN_SECONDS );
			}
			$events->track(
				'first_post_optimized',
				'',
				[
					'days_since_install' => (string) $days,
				]
			);
		}

		// Google Search Console connected.
		if ( $this->get_gsc_connected() ) {
			$events->track( 'gsc_connected' );
		}

		// Pro license activated.
		if ( defined( 'SURERANK_PRO_VERSION' ) ) {
			$events->track( 'pro_license_activated' );
		}

		// Migration completed (check for migration option).
		$migration_done = get_option( 'surerank_migration_completed', '' );
		if ( ! empty( $migration_done ) ) {
			$events->track(
				'migration_completed',
				'',
				[
					'source' => sanitize_text_field( $migration_done ),
				]
			);
		}

		// First AI content generated (Pro feature).
		if ( defined( 'SURERANK_PRO_VERSION' ) ) {
			$ai_used = get_option( 'surerank_ai_content_used', false );
			if ( $ai_used ) {
				$events->track( 'first_ai_content_generated' );
			}
		}

		// First schema added.
		$schemas_enabled = $settings['enable_schemas'] ?? false;
		if ( $schemas_enabled ) {
			$events->track( 'first_schema_added' );
		}

		// First redirect created (Pro feature).
		if ( defined( 'SURERANK_PRO_VERSION' ) ) {
			$redirect_count = $this->get_redirect_count();
			if ( $redirect_count > 0 ) {
				$events->track( 'first_redirect_created' );
			}
		}

		// First bulk action used.
		$bulk_used = get_option( 'surerank_bulk_action_used', false );
		if ( $bulk_used ) {
			$events->track( 'first_bulk_action_used' );
		}

		// First link scan completed (Pro feature).
		if ( defined( 'SURERANK_PRO_VERSION' ) ) {
			$scan_done = get_option( 'surerank_link_scan_completed', false );
			if ( $scan_done ) {
				$events->track( 'first_link_scan_completed' );
			}
		}
	}

	/**
	 * Check if custom robots rules have been configured.
	 *
	 * @return bool
	 * @since 1.7.0
	 */
	private function has_custom_robots_rules() {
		$robots_data = Helper::get_robots_data();
		return ! empty( $robots_data ) && is_array( $robots_data );
	}

	/**
	 * Check if email reports are enabled.
	 *
	 * @return bool
	 * @since 1.7.0
	 */
	private function is_email_reports_enabled() {
		$email_settings = EmailReportsUtil::get_instance()->get_settings();
		return ! empty( $email_settings['enabled'] );
	}

	/**
	 * Get count of failed site SEO checks.
	 *
	 * @return int
	 * @since 1.7.0
	 */
	private function get_failed_seo_checks_count() {
		$failed_checks = Get::option( 'surerank_site_seo_checks', [] );
		$count         = 0;
		foreach ( $failed_checks as $check ) {
			foreach ( $check as $value ) {
				if ( isset( $value['status'] ) && 'error' === $value['status'] ) {
					++$count;
				}
			}
		}
		return $count;
	}

	/**
	 * Get redirect count (Pro feature).
	 *
	 * @return int
	 * @since 1.7.0
	 */
	private function get_redirect_count() {
		global $wpdb;
		$table = $wpdb->prefix . 'surerank_redirects';

		// Check table exists before querying.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$table_exists = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) );
		if ( ! $table_exists ) {
			return 0;
		}

		return (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$table}" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table name is a hardcoded constant, not user input.
	}

	/**
	 * Get enabled features.
	 *
	 * @return array<string, mixed>
	 */
	private function get_enabled_features() {
		return [
			'enable_page_level_seo' => Settings::get( 'enable_page_level_seo' ),
			'enable_google_console' => Settings::get( 'enable_google_console' ),
			'enable_schemas'        => Settings::get( 'enable_schemas' ),
		];
	}

	/**
	 * Get Google Search Console connected status.
	 *
	 * @return bool
	 */
	private function get_gsc_connected() {
		return Controller::get_instance()->get_auth_status();
	}

	/**
	 * Check if SureRank is active (has settings different from defaults).
	 *
	 * @return bool
	 * @since 1.5.0
	 */
	private function is_active() {
		$cached = get_transient( 'surerank_analytics_is_active' );
		if ( false !== $cached ) {
			return 'yes' === $cached;
		}

		$surerank_defaults = Defaults::get_instance()->get_global_defaults();

		$surerank_settings = get_option( SURERANK_SETTINGS, [] );

		if ( is_array( $surerank_settings ) && is_array( $surerank_defaults ) ) {
				$changed_settings = self::shallow_two_level_diff( $surerank_settings, $surerank_defaults );
			if ( count( $changed_settings ) >= 1 ) {
				set_transient( 'surerank_analytics_is_active', 'yes', DAY_IN_SECONDS );
				return true;
			}
		}

		global $wpdb;
			$posts_like = $wpdb->esc_like( 'surerank_settings_' ) . '%';
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$posts = $wpdb->get_col(
				$wpdb->prepare(
					"
						SELECT DISTINCT pm.post_id
						FROM {$wpdb->postmeta} pm
						INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
						WHERE pm.meta_key LIKE %s
						AND p.post_status = 'publish'
						LIMIT 1
					",
					$posts_like
				)
			);

			// Check if any terms have been optimized.
			$terms_like = $wpdb->esc_like( 'surerank_seo_checks' ) . '%';
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$terms = $wpdb->get_col(
				$wpdb->prepare(
					"
						SELECT DISTINCT tm.term_id
						FROM {$wpdb->termmeta} tm
						INNER JOIN {$wpdb->terms} t ON tm.term_id = t.term_id
						INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
						WHERE tm.meta_key LIKE %s
						LIMIT 1
					",
					$terms_like
				)
			);

		$is_active = ( ! empty( $posts ) && is_array( $posts ) ) || ( ! empty( $terms ) && is_array( $terms ) );

		set_transient( 'surerank_analytics_is_active', $is_active ? 'yes' : 'no', DAY_IN_SECONDS );

		return $is_active;
	}

	/**
	 * Get site type - Inactive|Active|Super|Dormant|Super Dormant.
	 *
	 * @return string Site type.
	 * @since 1.6.3
	 */
	private function get_site_type() {
		$cached = get_transient( 'surerank_analytics_site_type' );
		if ( false !== $cached ) {
			return $cached;
		}

		$recent_optimized_count = $this->get_optimized_posts_count_last_180_days();
		$total_optimized_count  = $this->get_optimized_posts_count();

		if ( 0 === $total_optimized_count ) {
			$site_type = 'inactive';
		} elseif ( 0 === $recent_optimized_count ) {
			$is_super_past = $this->is_super_criteria_met( $total_optimized_count );
			$site_type     = $is_super_past ? 'super_dormant' : 'dormant';
		} else {
			$is_super_recent = $this->is_super_criteria_met( $recent_optimized_count );
			$site_type       = $is_super_recent ? 'super' : 'active';
		}

		set_transient( 'surerank_analytics_site_type', $site_type, DAY_IN_SECONDS );

		return $site_type;
	}

	/**
	 * Get count of unique posts and terms that have been optimized with SureRank.
	 *
	 * @return int Number of optimized posts and terms.
	 * @since 1.6.3
	 */
	private function get_optimized_posts_count() {
		global $wpdb;

		$posts_like        = $wpdb->esc_like( 'surerank_settings_' ) . '%';
		$public_post_types = $this->get_public_post_types_for_query();

		if ( empty( $public_post_types ) ) {
			$post_count = 0;
		} else {
			$placeholders = implode( ', ', array_fill( 0, count( $public_post_types ), '%s' ) );

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$post_count = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT COUNT(DISTINCT pm.post_id)
					FROM {$wpdb->postmeta} pm
					INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
					WHERE pm.meta_key LIKE %s
					AND p.post_status = 'publish'
					AND p.post_type IN ({$placeholders})", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
					array_merge( [ $posts_like ], $public_post_types )
				)
			);
		}

		$terms_like = $wpdb->esc_like( 'surerank_seo_checks' ) . '%';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$term_count = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(DISTINCT tm.term_id)
				FROM {$wpdb->termmeta} tm
				INNER JOIN {$wpdb->terms} t ON tm.term_id = t.term_id
				INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
				WHERE tm.meta_key LIKE %s", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$terms_like
			)
		);

		return absint( $post_count ) + absint( $term_count );
	}

	/**
	 * Get count of posts optimized within last 180 days.
	 *
	 * @return int
	 * @since 1.6.3
	 */
	private function get_optimized_posts_count_last_180_days() {
		global $wpdb;

		$days_180_ago      = strtotime( '-180 days' );
		$public_post_types = $this->get_public_post_types_for_query();

		if ( empty( $public_post_types ) ) {
			$post_count = 0;
		} else {
			$placeholders = implode( ', ', array_fill( 0, count( $public_post_types ), '%s' ) );

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$post_count = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT COUNT(DISTINCT pm.post_id)
					FROM {$wpdb->postmeta} pm
					INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
					WHERE pm.meta_key = 'surerank_post_optimized_at'
					AND CAST(pm.meta_value AS UNSIGNED) > %d
					AND p.post_status = 'publish'
					AND p.post_type IN ({$placeholders})", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
					array_merge( [ $days_180_ago ], $public_post_types )
				)
			);
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$term_count = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(DISTINCT tm.term_id)
				FROM {$wpdb->termmeta} tm
				INNER JOIN {$wpdb->terms} t ON tm.term_id = t.term_id
				INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
				WHERE tm.meta_key = 'surerank_term_optimized_at'
				AND CAST(tm.meta_value AS UNSIGNED) > %d",
				$days_180_ago
			)
		);

		return absint( $post_count ) + absint( $term_count );
	}

	/**
	 * Shared logic for super site criteria.
	 *
	 * @param int $optimized_count Number of optimized posts.
	 * @return bool True if super criteria is met.
	 * @since 1.6.3
	 */
	private function is_super_criteria_met( int $optimized_count ) {
		$total_posts = $this->get_total_published_posts_count();

		if ( 0 === $total_posts ) {
			return false;
		}

		$threshold = 40;

		if ( $total_posts >= $threshold ) {
			return $optimized_count >= 20;
		}

		$percentage = $optimized_count / $total_posts * 100;

		return $percentage >= 50;
	}

	/**
	 * Get total count of published posts.
	 *
	 * @return int
	 * @since 1.6.3
	 */
	private function get_total_published_posts_count() {
		global $wpdb;

		$public_post_types = $this->get_public_post_types_for_query();

		if ( empty( $public_post_types ) ) {
			return 0;
		}

		$placeholders = implode( ', ', array_fill( 0, count( $public_post_types ), '%s' ) );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$count = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*)
				FROM {$wpdb->posts}
				WHERE post_status = 'publish'
				AND post_type IN ({$placeholders})", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
				$public_post_types
			)
		);

		return absint( $count );
	}

	/**
	 * Get public post types for database queries.
	 *
	 * @return array<string>
	 * @since 1.6.3
	 */
	private function get_public_post_types_for_query() {
		$post_types = get_post_types( [ 'public' => true ], 'names' );
		$excluded   = [ 'attachment', 'revision' ];
		return array_values( array_diff( $post_types, $excluded ) );
	}

	/**
	 * Get optimized posts count for a specific date.
	 *
	 * @param string $date Date in Y-m-d format.
	 * @since 1.6.3
	 * @return int
	 */
	private function get_optimized_posts_count_within_date( $date ) {
		global $wpdb;

		$start_timestamp = strtotime( $date . ' 00:00:00' );
		$end_timestamp   = strtotime( $date . ' 23:59:59' );

		$public_post_types = $this->get_public_post_types_for_query();

		if ( empty( $public_post_types ) ) {
			$post_count = 0;
		} else {
			$placeholders = implode( ', ', array_fill( 0, count( $public_post_types ), '%s' ) );

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$post_count = $wpdb->get_var(
				// phpcs:ignore WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
				$wpdb->prepare(
					"SELECT COUNT(DISTINCT pm.post_id)
					FROM {$wpdb->postmeta} pm
					INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
					WHERE pm.meta_key = 'surerank_post_optimized_at'
					AND CAST(pm.meta_value AS UNSIGNED) >= %d
					AND CAST(pm.meta_value AS UNSIGNED) <= %d
					AND p.post_status = 'publish'
					AND p.post_type IN ({$placeholders})", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
					array_merge( [ $start_timestamp, $end_timestamp ], $public_post_types )
				)
			);
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$term_count = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(DISTINCT tm.term_id)
				FROM {$wpdb->termmeta} tm
				INNER JOIN {$wpdb->terms} t ON tm.term_id = t.term_id
				INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
				WHERE tm.meta_key = 'surerank_term_optimized_at'
				AND CAST(tm.meta_value AS UNSIGNED) >= %d
				AND CAST(tm.meta_value AS UNSIGNED) <= %d",
				$start_timestamp,
				$end_timestamp
			)
		);

		return absint( $post_count ) + absint( $term_count );
	}

	/**
	 * Get KPI tracking data for the last 2 days.
	 *
	 * @since 1.6.3
	 * @return array<string, array<string, array<string, int>>>
	 */
	private function get_kpi_tracking_data() {
		$kpi_data = [];
		$today    = current_time( 'Y-m-d' );

		for ( $i = 1; $i <= 2; $i++ ) {
			$timestamp = strtotime( $today . ' -' . $i . ' days' );
			if ( false === $timestamp ) {
				continue;
			}
			$date = (string) wp_date( 'Y-m-d', $timestamp );

			$optimized_count = $this->get_optimized_posts_count_within_date( $date );

			$kpi_data[ $date ] = [
				'numeric_values' => [
					'optimized_posts' => $optimized_count,
				],
			];
		}

		return $kpi_data;
	}
}
