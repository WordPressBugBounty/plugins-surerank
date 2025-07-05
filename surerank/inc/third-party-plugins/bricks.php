<?php
/**
 * Third Party Plugins class - Bricks
 *
 * Handles Bricks Plugin related compatibility.
 *
 * @package SureRank\Inc\ThirdPartyPlugins
 */

namespace SureRank\Inc\ThirdPartyPlugins;

use SureRank\Inc\Admin\Seo_Popup;
use SureRank\Inc\Traits\Get_Instance;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class Bricks
 *
 * Handles Bricks Plugin related compatibility.
 */
class Bricks {
	use Get_Instance;

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'wp_enqueue_scripts', [ $this, 'register_script' ], 9999 );
	}

	/**
	 * Register Script
	 *
	 * @return void
	 * @since 1.0.0
	 */
	public function register_script() {
		if ( function_exists( 'bricks_is_builder_main' ) && bricks_is_builder_main() ) {
			Seo_Popup::get_instance()->admin_enqueue_scripts();
			wp_register_script( 'surerank-bricks', SURERANK_URL . 'build/bricks/index.js', [ 'jquery', 'wp-data' ], SURERANK_VERSION, false );
			wp_enqueue_script( 'surerank-bricks' );
		}
	}
}
