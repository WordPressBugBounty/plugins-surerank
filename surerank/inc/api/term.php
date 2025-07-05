<?php
/**
 * Term class
 *
 * Handles term related REST API endpoints for the SureRank plugin.
 *
 * @package SureRank\Inc\API
 */

namespace SureRank\Inc\API;

use SureRank\Inc\Analyzer\TermAnalyzer;
use SureRank\Inc\Functions\Defaults;
use SureRank\Inc\Functions\Get;
use SureRank\Inc\Functions\Send_Json;
use SureRank\Inc\Functions\Settings;
use SureRank\Inc\Functions\Update;
use SureRank\Inc\Traits\Get_Instance;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class Term
 *
 * Handles term related REST API endpoints.
 */
class Term extends Api_Base {
	use Get_Instance;

	/**
	 * Route Get Term Seo Data
	 */
	protected const TERM_SEO_DATA = '/term-seo-data';

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
	}

	/**
	 * Register API routes.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->get_api_namespace(),
			self::TERM_SEO_DATA,
			[
				'methods'             => WP_REST_Server::READABLE, // GET Term Seo Data.
				'callback'            => [ $this, 'get_term_seo_data' ],
				'permission_callback' => [ $this, 'validate_permission' ],
				'args'                => [
					'term_id'   => [
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					],
					'post_type' => [
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					],
				],
			]
		);

		register_rest_route(
			$this->get_api_namespace(),
			self::TERM_SEO_DATA,
			[
				'methods'             => WP_REST_Server::CREATABLE, // Update Term Seo Data.
				'callback'            => [ $this, 'update_term_seo_data' ],
				'permission_callback' => [ $this, 'validate_permission' ],
				'args'                => [
					'term_id'  => [
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					],
					'metaData' => [
						'type'              => 'object',
						'required'          => true,
						'sanitize_callback' => [ $this, 'sanitize_array_data' ],
					],
				],

			]
		);
	}

	/**
	 * Get term seo data
	 *
	 * @param WP_REST_Request<array<string, mixed>> $request Request object.
	 * @since X.X.X
	 * @return void
	 */
	public function get_term_seo_data( $request ) {

		$term_id     = $request->get_param( 'term_id' );
		$post_type   = $request->get_param( 'post_type' );
		$is_taxonomy = $request->get_param( 'is_taxonomy' );

		$data = self::get_term_data_by_id( $term_id, $post_type, $is_taxonomy );

		Send_Json::success( $data );
	}

	/**
	 * Get term data by id
	 *
	 * @param int    $term_id Term ID.
	 * @param string $post_type Post type.
	 * @param bool   $is_taxonomy Is taxonomy.
	 * @return array<string, mixed>
	 */
	public static function get_term_data_by_id( $term_id, $post_type, $is_taxonomy ) {
		$all_options = Settings::format_array( Defaults::get_instance()->get_post_defaults( false ) );
		return [
			'data'           => array_intersect_key( Settings::prep_term_meta( $term_id, $post_type, $is_taxonomy ), $all_options ),
			'global_default' => Settings::get(),
		];
	}

	/**
	 * Update seo data
	 *
	 * @param WP_REST_Request<array<string, mixed>> $request Request object.
	 * @since X.X.X
	 * @return void
	 */
	public function update_term_seo_data( $request ) {

		$term_id     = $request->get_param( 'term_id' );
		$data        = $request->get_param( 'metaData' );
		$all_options = Defaults::get_instance()->get_post_defaults( false );
		/** Getting post meta if exists, otherwise getting all options(defaults) */
		$term_meta = Get::all_term_meta( $term_id );
		if ( ! empty( $term_meta ) ) {
			$data = array_merge( $term_meta, $data );
		}

		foreach ( $all_options as $option_name => $option_value ) {
			$new_option_value = $option_value;
			if ( is_array( $option_value ) ) {
				if ( empty( $option_value ) ) {
					$new_option_value[ $option_name ] = $data[ $option_name ];
				} else {

					foreach ( $option_value as $key => $value ) {
						$new_option_value[ $key ] = $data[ $key ] ?? $value;
					}
				}
			} else {
				if ( isset( $data[ $option_name ] ) ) {
					$new_option_value = $data[ $option_name ] === '' ? false : $data[ $option_name ];
				}
			}

			Update::term_meta( $term_id, 'surerank_settings_' . $option_name, $new_option_value );
		}

		if ( is_wp_error( $this->run_checks( $term_id ) ) ) {
			Send_Json::error( [ 'message' => __( 'Error while running SEO Checks.', 'surerank' ) ] );
		}

		Send_Json::success( [ 'message' => __( 'Data updated', 'surerank' ) ] );
	}

	/**
	 * Run checks
	 *
	 * @param int $term_id Term ID.
	 * @return WP_Error|array<string, mixed>
	 */
	public function run_checks( $term_id ) {
		if ( ! $term_id ) {
			return new WP_Error( 'no_term_id', __( 'No term ID provided.', 'surerank' ) );
		}

		$term = get_term( $term_id );

		if ( ! $term || is_wp_error( $term ) ) {
			return new WP_Error( 'no_term', __( 'No term found.', 'surerank' ) );
		}

		return TermAnalyzer::get_instance()->run_checks( $term_id, $term );
	}
}
