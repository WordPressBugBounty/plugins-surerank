<?php
/**
 * Third Party Plugins class - Elementor
 *
 * Handles Elementor Plugin related compatibility.
 *
 * @package SureRank\Inc\ThirdPartyPlugins
 */

namespace SureRank\Inc\ThirdPartyPlugins;

use SureRank\Inc\Admin\Dashboard;
use SureRank\Inc\Traits\Get_Instance;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class Elementor
 *
 * Handles Elementor Plugin related compatibility.
 */
class Elementor {
	use Get_Instance;

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'elementor/editor/after_enqueue_scripts', [ $this, 'register_script' ] );
	}

	/**
	 * Register Script
	 *
	 * @return void
	 * @since 1.0.0
	 */
	public function register_script() {
		wp_register_script( 'surerank-elementor', SURERANK_URL . 'build/elementor/index.js', [ 'jquery', 'wp-data' ], SURERANK_VERSION, false );
		wp_enqueue_script( 'surerank-elementor' );

		wp_localize_script(
			'jquery',
			'surerank_globals',
			array_merge(
				[
					'check_score' => Dashboard::get_instance()->get_seo_score(),
				],
				Dashboard::get_instance()->get_common_variables()
			)
		);
	}
}
