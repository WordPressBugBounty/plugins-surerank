<?php
/**
 * Utils class.
 *
 * @package SureRank\Inc\Modules\Nudges
 * @since 1.5.0
 */

namespace SureRank\Inc\Modules\Nudges;

use SureRank\Inc\Traits\Get_Instance;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * The Utils class.
 *
 * @package SureRank\Inc\Modules\Nudges
 * @since 1.5.0
 */
class Utils {



	use Get_Instance;

	/**
	 * Installed Pro plugin file for this request, null until looked up.
	 *
	 * @since 1.11.0
	 * @var string|null
	 */
	private $pro_plugin_file = null;


	/**
	 * Check if Pro version is active.
	 * 
	 * @return bool True if pro is active, false otherwise.
	 */
	public function is_pro_active() {
		return defined( 'SURERANK_PRO_VERSION' );
	}

	/**
	 * Plugin file of the installed Pro plugin, active or not.
	 *
	 * Found by its text domain rather than its folder, so a renamed folder
	 * still counts as installed.
	 *
	 * @since 1.11.0
	 * @return string Plugin file relative to the plugins folder, or empty when Pro is not installed.
	 */
	public function get_pro_plugin_file() {
		if ( null !== $this->pro_plugin_file ) {
			return $this->pro_plugin_file;
		}

		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$this->pro_plugin_file = '';

		foreach ( get_plugins() as $plugin_file => $plugin_data ) {
			if ( 'surerank-pro' === ( $plugin_data['TextDomain'] ?? '' ) ) {
				$this->pro_plugin_file = $plugin_file;
				break;
			}
		}

		return $this->pro_plugin_file;
	}

	/**
	 * Whether the current user can activate the installed, inactive Pro plugin.
	 *
	 * @since 1.11.0
	 * @return bool
	 */
	public function can_activate_pro() {
		return ! $this->is_pro_active()
			&& current_user_can( 'activate_plugins' )
			&& '' !== $this->get_pro_plugin_file();
	}

	/**
	 * Get Pro Nudges.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public function get_nudges() {
		$nudges = get_option( SURERANK_NUDGES, [] );

		if ( empty( $nudges ) ) {
			return [];
		}

		foreach ( $nudges as $key => $nudge ) {

			if ( isset( $nudge['display'] ) && $nudge['display'] === false ) {
				continue;
			}

			if ( isset( $nudge['next_time_to_display'] ) && time() < $nudge['next_time_to_display'] ) {
				$nudges[ $key ]['display'] = false;
			}
		}
		return $nudges;
	}

}
