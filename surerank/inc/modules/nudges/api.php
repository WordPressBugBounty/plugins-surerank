<?php
/**
 * Nudges API class
 *
 * Handles pro nudges related REST API endpoints.
 *
 * @package SureRank\Inc\Modules\Nudges
 * @since 1.5.0
 */

namespace SureRank\Inc\Modules\Nudges;

use SureRank\Inc\Functions\Send_Json;
use SureRank\Inc\Traits\Get_Instance;
use SureRank\Inc\API\Api_Base;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class Api
 *
 * @package SureRank\Inc\Modules\Nudges
 * @since 1.5.0
 */
class Api extends Api_Base {



	use Get_Instance;

	/**
	 * Register API routes.
	 *
	 * @since 1.5.0
	 * @return void
	 */
	public function register_routes() {
		// Register a single POST endpoint to disable pro nudges.
		register_rest_route(
			$this->get_api_namespace(),
			'/nudges/disable',
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'disable_nudge' ],
				'permission_callback' => [ $this, 'validate_permission' ],
				'args'                => [
					'type' => [
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
						'enum'              => [ 'upgrade_banner', 'permalink_redirect' ],
					],
				],
			]
		);

		register_rest_route(
			$this->get_api_namespace(),
			'/nudges/activate-pro',
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'activate_pro' ],
				'permission_callback' => [ $this, 'validate_activate_pro_permission' ],
			]
		);

		register_rest_route(
			$this->get_api_namespace(),
			'/nudges/geo-status',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'get_geo_status' ],
				'permission_callback' => [ $this, 'validate_permission' ],
				'role_capability'     => 'global_setting',
			]
		);
	}

	/**
	 * Permission for activating Pro: the usual REST checks, plus the right to
	 * activate plugins.
	 *
	 * @since 1.11.0
	 * @param WP_REST_Request<array<string, mixed>> $request The request object.
	 * @return bool|\WP_Error
	 */
	public function validate_activate_pro_permission( $request ) {
		$permission = $this->validate_permission( $request );

		if ( true !== $permission ) {
			return $permission;
		}

		if ( ! current_user_can( 'activate_plugins' ) ) {
			return new \WP_Error(
				'surerank_rest_cannot_activate',
				__( 'You do not have permission to activate plugins.', 'surerank' ),
				[ 'status' => rest_authorization_required_code() ]
			);
		}

		return true;
	}

	/**
	 * Activate the installed SureRank Pro plugin.
	 *
	 * Takes no plugin from the request: the plugin file is looked up on the
	 * server, so this route can only ever activate SureRank Pro.
	 *
	 * @since 1.11.0
	 * @return void
	 */
	public function activate_pro() {
		$plugin_file = Utils::get_instance()->get_pro_plugin_file();

		if ( '' === $plugin_file ) {
			Send_Json::error( [ 'message' => __( 'SureRank Pro is not installed.', 'surerank' ) ] );
			return;
		}

		if ( ! is_plugin_active( $plugin_file ) ) {
			$result = activate_plugin( $plugin_file );

			if ( is_wp_error( $result ) ) {
				Send_Json::error( [ 'message' => $result->get_error_message() ] );
				return;
			}
		}

		// Pro only boots on the next request, so the GEO screen reads its
		// state from the geo-status route after this.
		Send_Json::success( [ 'message' => __( 'SureRank Pro is active.', 'surerank' ) ] );
	}

	/**
	 * The values the GEO screen picks its next step from, as the dashboard
	 * would localize them on a fresh page load.
	 *
	 * @since 1.11.0
	 * @return void
	 */
	public function get_geo_status() {
		$vars = apply_filters( 'surerank_globals_localization_vars', [] );
		$vars = is_array( $vars ) ? $vars : [];
		$keys = [
			'is_pro_active',
			'can_activate_pro',
			'geo_supported',
			'license_activated',
			'can_manage_license',
			'license_admin_url',
			'geo_features_enabled',
		];

		Send_Json::success( array_intersect_key( $vars, array_flip( $keys ) ) );
	}

	/**
	 * Disable a pro nudge (persist the disabled type with count and next display time).
	 *
	 * @param WP_REST_Request<array<string, mixed>> $request The request object.
	 * @return void
	 */
	public function disable_nudge( $request ) {
		$type = $request->get_param( 'type' );

		if ( ! in_array( $type, [ 'upgrade_banner', 'permalink_redirect' ], true ) ) {
			Send_Json::error( [ 'message' => __( 'Invalid type provided.', 'surerank' ) ] );
			return;
		}

		$nudges = (array) get_option( SURERANK_NUDGES, [] );

		// Initialize if not set.
		if ( ! isset( $nudges[ $type ] ) ) {
			$nudges[ $type ] = [
				'count'                => 0,
				'next_time_to_display' => 0,
				'display'              => true,
			];
		}

		// Increment count and set next display time.
		$nudges[ $type ]['count']++;
		$nudges[ $type ]['next_time_to_display'] = time() + ( 7 * DAY_IN_SECONDS );
		$nudges[ $type ]['display']              = $nudges[ $type ]['count'] < 2;

		if ( ! update_option( SURERANK_NUDGES, $nudges ) ) {
			Send_Json::error( [ 'message' => __( 'Could not disable the nudge. Please try again.', 'surerank' ) ] );
			return;
		}

		Send_Json::success(
			[
				'message'              => sprintf( /* translators: %s: nudge type */ __( '"%s" has been disabled.', 'surerank' ), $type ),
				'count'                => $nudges[ $type ]['count'],
				'next_time_to_display' => $nudges[ $type ]['next_time_to_display'],
			]
		);
	}
}
