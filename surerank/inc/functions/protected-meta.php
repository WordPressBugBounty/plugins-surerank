<?php
/**
 * Protected Meta.
 *
 * @package SureRank\Inc\Functions
 * @since 1.11.0
 */

namespace SureRank\Inc\Functions;

use SureRank\Inc\Traits\Get_Instance;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Marks SureRank's SEO meta keys as protected.
 *
 * SureRank saves these keys through its own capability-checked endpoints.
 * Without protection, core's Custom Fields box and XML-RPC let anyone who
 * can edit a post (a Contributor on their own draft) write them directly.
 * Protected keys fail core's add/edit/delete_post_meta capability check on
 * those paths, while SureRank's own direct writes keep working.
 *
 * @since 1.11.0
 */
class Protected_Meta {
	use Get_Instance;

	/**
	 * Constructor.
	 *
	 * @since 1.11.0
	 */
	public function __construct() {
		add_filter( 'is_protected_meta', [ $this, 'protect_seo_meta' ], 10, 2 );
	}

	/**
	 * Report SureRank's SEO meta keys as protected.
	 *
	 * @param bool   $protected Whether the key is already protected.
	 * @param string $meta_key  Meta key.
	 * @return bool
	 * @since 1.11.0
	 */
	public function protect_seo_meta( $protected, $meta_key ) {
		if ( $protected || ! is_string( $meta_key ) || 0 !== strpos( $meta_key, 'surerank_settings_' ) ) {
			return $protected;
		}

		$key = substr( $meta_key, strlen( 'surerank_settings_' ) );

		return in_array( $key, Defaults::get_instance()->get_post_meta_keys(), true );
	}
}
