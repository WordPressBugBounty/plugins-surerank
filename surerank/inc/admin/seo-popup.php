<?php
/**
 * Post Popup
 *
 * @since X.X.X
 * @package surerank
 */

namespace SureRank\Inc\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use SureRank\Inc\Frontend\Crawl_Optimization;
use SureRank\Inc\Functions\Get;
use SureRank\Inc\Functions\Update;
use SureRank\Inc\Schema\Rules;
use SureRank\Inc\Schema\Utils;
use SureRank\Inc\Schema\Variables;
use SureRank\Inc\Traits\Enqueue;
use SureRank\Inc\Traits\Get_Instance;

/**
 * Post Popup
 *
 * @method void wp_enqueue_scripts()
 * @since X.X.X
 */
class Seo_Popup {

	use Enqueue;
	use Get_Instance;

	/**
	 * Constructor
	 *
	 * @since 0.0.1
	 * @return void
	 */
	public function __construct() {
		$this->enqueue_scripts_admin();
		add_action( 'category_term_edit_form_top', [ $this, 'add_meta_box_trigger' ] );
		add_action( 'created_category', [ $this, 'update_category_seo_values' ] );
		add_action( 'edited_category', [ $this, 'update_category_seo_values' ] );
		// Add meta box trigger in the Elementor editor.
		add_action( 'elementor/editor/before_enqueue_scripts', [ $this, 'add_meta_box_trigger' ], 5 );
		// Enqueue admin scripts in the Elementor editor.
		add_action( 'elementor/editor/after_enqueue_scripts', [ $this, 'admin_enqueue_scripts' ] );
	}

	/**
	 * Add tags
	 *
	 * @since 0.0.1
	 * @return void
	 */
	public function add_meta_box_trigger() {
		echo '<span id="seo-popup" class="surerank-root"></span>';
	}

	/**
	 * Enqueue admin scripts
	 *
	 * @since 0.0.1
	 * @return void
	 */
	public function admin_enqueue_scripts() {
		wp_enqueue_media();

		$screen = null;

		if ( function_exists( 'get_current_screen' ) ) {
			$screen = get_current_screen();
			if ( ! $screen || empty( $screen->base ) || ! in_array( $screen->base, [ 'post', 'term' ], true ) ) {
				return;
			}
		}

		$term_data = [];
		$post_data = [];

		if ( class_exists( \Elementor\Plugin::class ) && \Elementor\Plugin::instance()->editor->is_edit_mode() ) {
			$editor_type = 'elementor';
		} elseif ( function_exists( 'bricks_is_builder_main' ) && bricks_is_builder_main() ) {
			$editor_type = 'bricks';
		} elseif ( $screen && $screen->is_block_editor ) {
			$editor_type = 'block';
		} else {
			$editor_type = 'classic';
		}

		if ( ( $screen && 'post' === $screen->base ) || $editor_type === 'bricks' ) {
			$post_data = [
				'post_id'     => get_the_ID(),
				'editor_type' => $editor_type,
				'link'        => get_the_permalink( (int) get_the_ID() ),
			];
		}

		if ( $screen && 'term' === $screen->base ) {
			global $tag_ID;

			$final_link = get_term_link( (int) $tag_ID );

			if ( is_wp_error( $final_link ) ) {
				return;
			}

			if ( 'category' === $screen->taxonomy ) {
				if ( apply_filters( 'surerank_remove_category_base', false ) ) {
					$final_link = Crawl_Optimization::get_instance()->remove_category_base_from_links( $final_link, $tag_ID, $screen->taxonomy );
				}
			}

			$term_data = [
				'term_id' => $tag_ID,
				'link'    => $final_link,
			];
		}

		$post_type   = $screen ? ( ! empty( $screen->taxonomy ) ? $screen->taxonomy : $screen->post_type ) : ''; // post type or taxonomy localized.
		$is_taxonomy = $screen && ! empty( $screen->taxonomy ) ? true : false;

		// Set post type and is taxonomy flag for Bricks editor.
		if ( $editor_type === 'bricks' ) {
			$post_type   = get_the_ID() ? get_post_type( get_the_ID() ) : '';
			$is_taxonomy = false;
		}

		// Enqueue vendor and common assets.
		$this->enqueue_vendor_and_common_assets();

		$this->build_assets_operations(
			'seo-popup',
			[
				'hook'        => 'seo-popup',
				'object_name' => 'seo_popup',
				'data'        => array_merge(
					[
						'admin_assets_url'    => SURERANK_URL . 'inc/admin/assets',
						'site_icon_url'       => get_site_icon_url( 16 ),
						'editor_type'         => $editor_type,
						'post_type'           => $post_type,
						'is_taxonomy'         => $is_taxonomy,
						'schema_rules'        => Rules::get_schema_rules_selections(),
						'default_schemas'     => Utils::get_default_schemas(),
						'schema_type_options' => Utils::get_schema_type_options(),
						'schema_type_data'    => Utils::get_schema_type_data(),
						'schema_variables'    => Variables::get_instance()->get_schema_variables(),
						'description_length'  => Get::description_length(),
						'title_length'        => Get::title_length(),
					],
					$post_data,
					$term_data
				),
			]
		);
	}

	/**
	 * Update seo values
	 *
	 * @param int $term_id Post ID.
	 *
	 * @since 0.0.1
	 * @return void
	 */
	public function update_category_seo_values( $term_id ) {
		// Validate post ID.
		if ( empty( $term_id ) || ! is_int( $term_id ) ) {
			return;
		}

		// Update post seo values.
		$result = Update::term_meta( $term_id, [], [] );

		if ( is_wp_error( $result ) ) {
			return;
		}

		do_action( 'surerank_after_update_category_seo_values', $term_id );
	}
}
