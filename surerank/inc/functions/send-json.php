<?php
/**
 * Send JSON
 *
 * @package surerank
 * @since 0.0.1
 */

namespace SureRank\Inc\Functions;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Send JSON
 *
 * @since X.X.X
 */
class Send_Json {

	/**
	 * Sends the success JSON response.
	 *
	 * @param array<string, mixed>|array<int, string> $data array of data to be send.
	 *
	 * @since X.X.X
	 * @return void
	 */
	public static function success( $data = [] ) {
		$response = [ 'success' => true ];
		Send_Json::response( $response, $data );
	}

	/**
	 * Sends the error JSON response.
	 *
	 * @param array<string, mixed>|array<int, string> $data array of data to be send.
	 *
	 * @since X.X.X
	 * @return void
	 */
	public static function error( $data = [] ) {
		$response = [ 'success' => false ];
		Send_Json::response( $response, $data );
	}

	/**
	 * Sends the JSON response.
	 * using WordPress function wp_send_json
	 *
	 * @param array<string, mixed>|array<int, string> $response required data.
	 * @param array<string, mixed>|array<int, string> $data     array of data to be send.
	 *
	 * @since X.X.X
	 * @return void
	 */
	public static function response( $response, $data = [] ) {
		if ( ! empty( $data ) && is_array( $data ) ) {
			$response = array_merge( $response, $data );
		}

		wp_send_json( $response );
	}
}
