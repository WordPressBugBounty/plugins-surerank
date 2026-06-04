<?php
/**
 * Abilities registrar.
 *
 * @package SureRank\Inc\Abilities
 */

namespace SureRank\Inc\Abilities;

use SureRank\Inc\Abilities\Analysis\Get_Post_Seo_Checks;
use SureRank\Inc\Abilities\Analysis\Get_Term_Seo_Checks;
use SureRank\Inc\Abilities\Content\Get_Post_Seo;
use SureRank\Inc\Abilities\Content\Get_Term_Seo;
use SureRank\Inc\Abilities\Content\List_Content_Items;
use SureRank\Inc\Abilities\Content\List_Content_Types;
use SureRank\Inc\Abilities\Content\Update_Post_Seo;
use SureRank\Inc\Abilities\Content\Update_Term_Seo;
use SureRank\Inc\Abilities\Settings\Get_Global_Settings;
use SureRank\Inc\Abilities\Settings\Get_Robots_Txt;
use SureRank\Inc\Abilities\Settings\Get_Sitemap_Settings;
use SureRank\Inc\Abilities\Settings\Update_Global_Settings;
use SureRank\Inc\Abilities\Settings\Update_Robots_Txt;
use SureRank\Inc\Abilities\Settings\Update_Sitemap_Settings;
use SureRank\Inc\Traits\Get_Instance;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Registers SureRank abilities and the optional MCP server.
 */
class Abilities_Registrar {
	use Get_Instance;

	/**
	 * Constructor.
	 *
	 * @since 1.7.5
	 */
	public function __construct() {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		add_action( 'wp_abilities_api_categories_init', [ $this, 'register_category' ] );
		add_action( 'wp_abilities_api_init', [ $this, 'register_abilities' ] );

		if ( self::mcp_adapter_enabled() ) {
			add_action( 'mcp_adapter_init', [ $this, 'register_mcp_server' ] );
		}
	}

	/**
	 * Check whether the MCP adapter should be activated.
	 *
	 * @since 1.7.5
	 * @return bool
	 */
	public static function mcp_adapter_enabled() {
		return function_exists( 'wp_register_ability' ) &&
			class_exists( 'WP\\MCP\\Plugin' ) &&
			(bool) apply_filters( 'surerank_mcp_server_enabled', true );
	}

	/**
	 * Register the SureRank MCP server.
	 *
	 * @since 1.7.5
	 * @param object $adapter MCP adapter instance.
	 * @return void
	 */
	public function register_mcp_server( $adapter ) {
		if ( ! is_object( $adapter ) || ! method_exists( $adapter, 'create_server' ) ) {
			return;
		}

		$abilities = function_exists( 'wp_get_abilities' ) ? wp_get_abilities() : [];
		$tools     = [];

		foreach ( $abilities as $ability ) {
			if ( ! is_object( $ability ) || ! method_exists( $ability, 'get_name' ) ) {
				continue;
			}

			if ( 0 === strpos( $ability->get_name(), 'surerank/' ) ) {
				$tools[] = $ability->get_name();
			}
		}

		$transport_class = class_exists( '\\WP\\MCP\\Transport\\HttpTransport' )
			? '\\WP\\MCP\\Transport\\HttpTransport'
			: '\\WP\\MCP\\Transport\\Http\\RestTransport';

		$adapter->create_server(
			'surerank',
			'surerank/v1',
			'mcp',
			__( 'SureRank MCP Server', 'surerank' ),
			__( 'SureRank MCP Server for SEO settings, metadata, and analysis workflows.', 'surerank' ),
			SURERANK_VERSION,
			[ $transport_class ],
			'\\WP\\MCP\\Infrastructure\\ErrorHandling\\ErrorLogMcpErrorHandler',
			'\\WP\\MCP\\Infrastructure\\Observability\\NullMcpObservabilityHandler',
			$tools,
			[],
			[]
		);
	}

	/**
	 * Register the SureRank category.
	 *
	 * @since 1.7.5
	 * @return void
	 */
	public function register_category() {
		if ( function_exists( 'wp_has_ability_category' ) && wp_has_ability_category( 'surerank' ) ) {
			return;
		}

		if ( function_exists( 'wp_register_ability_category' ) ) {
			wp_register_ability_category(
				'surerank',
				[
					'label'       => __( 'SureRank', 'surerank' ),
					'description' => __( 'SEO settings, metadata, and analysis abilities powered by SureRank.', 'surerank' ),
				]
			);
		}
	}

	/**
	 * Register SureRank abilities.
	 *
	 * @since 1.7.5
	 * @return void
	 */
	public function register_abilities() {
		if ( ! Ability_Base::abilities_enabled() ) {
			return;
		}

		$abilities = [
			new List_Content_Types(),
			new List_Content_Items(),
			new Get_Global_Settings(),
			new Update_Global_Settings(),
			new Get_Post_Seo(),
			new Update_Post_Seo(),
			new Get_Term_Seo(),
			new Update_Term_Seo(),
			new Get_Post_Seo_Checks(),
			new Get_Term_Seo_Checks(),
			new Get_Robots_Txt(),
			new Update_Robots_Txt(),
			new Get_Sitemap_Settings(),
			new Update_Sitemap_Settings(),
		];

		$abilities = apply_filters( 'surerank_register_abilities', $abilities );

		foreach ( $abilities as $ability ) {
			if ( ! $ability instanceof Ability_Base ) {
				continue;
			}

			if ( ! $ability->meets_capability_policy() || ! $ability->is_enabled() ) {
				continue;
			}

			if ( function_exists( 'wp_has_ability' ) && wp_has_ability( $ability->get_id() ) ) {
				continue;
			}

			$ability->register();
		}
	}
}
