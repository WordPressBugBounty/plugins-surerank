<?php
/**
 * Image SEO Processor
 *
 * Handles image-specific SEO enhancement logic.
 *
 * @package surerank
 * @since 1.5.0
 */

namespace SureRank\Inc\Frontend;

use SureRank\Inc\Functions\Settings;
use SureRank\Inc\Traits\Get_Instance;
use SureRank\Inc\Traits\Tag_Attribute_Helpers;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Image SEO processor
 *
 * @since 1.5.0
 */
class Image_Seo {

	use Get_Instance;
	use Tag_Attribute_Helpers;

	/**
	 * Check if image enhancement is enabled
	 *
	 * @return bool
	 * @since 1.5.0
	 */
	public function is_enabled(): bool {
		return apply_filters( 'surerank_auto_set_image_title_and_alt', true );
	}

	/**
	 * Backward compatibility method for status check
	 *
	 * @return bool
	 * @since 1.5.0
	 */
	public function status(): bool {
		return $this->is_enabled();
	}

	/**
	 * Extract images that need processing
	 *
	 * @param string $content Clean content.
	 * @return array<string> Image tags that need enhancement
	 * @since 1.5.0
	 */
	public function extract_processable_images( $content ): array {
		$images = [];
		foreach ( $this->extract_html_tags( $content, 'IMG' ) as $tag ) {
			$attributes = $this->parse_image_attributes( $tag );
			if ( '' === trim( $attributes['alt'] ?? '' ) || '' === trim( $attributes['title'] ?? '' ) ) {
				$images[] = $tag;
			}
		}

		return array_values( array_unique( $images ) );
	}

	/**
	 * Process image tags in content
	 *
	 * @param string        $content Original content.
	 * @param array<string> $image_tags Image tags to process.
	 * @param int|null      $post_id Post context.
	 * @return string Enhanced content
	 * @since 1.5.0
	 */
	public function process_images( $content, $image_tags, $post_id ): string {
		$context = $this->build_processing_context( $post_id );
		return $this->enhance_image_tags( $content, $image_tags, $context );
	}

	/**
	 * Build processing context object
	 *
	 * @param int|null $post_id Post ID.
	 * @return object{title: string, slug: string, site_name: string} Context data
	 * @since 1.5.0
	 */
	private function build_processing_context( $post_id ): object {
		$post = get_post( $post_id );

		return (object) [
			'title'     => $post->post_title ?? '',
			'slug'      => $post->post_name ?? '',
			'site_name' => get_bloginfo( 'name' ),
		];
	}

	/**
	 * Enhance individual image tags
	 *
	 * @param string                                                 $content Original content.
	 * @param array<string>                                          $images Image tag array.
	 * @param object{title: string, slug: string, site_name: string} $context Processing context.
	 * @return string Enhanced content
	 * @since 1.5.0
	 */
	private function enhance_image_tags( $content, $images, $context ): string {
		$replacements = [];
		foreach ( $images as $original_tag ) {
			$replacements[ $original_tag ] = $this->enhance_single_image( $original_tag, $context );
		}

		return $this->replace_html_tags( $content, 'IMG', $replacements );
	}

	/**
	 * Enhance single image tag
	 *
	 * @param string                                                 $tag Original image tag.
	 * @param object{title: string, slug: string, site_name: string} $context Processing context.
	 * @return string Enhanced tag
	 * @since 1.5.0
	 */
	private function enhance_single_image( $tag, $context ): string {
		$attributes = $this->parse_image_attributes( $tag );

		if ( empty( $attributes ) ) {
			return $tag;
		}

		$image_src = $this->resolve_image_source( $attributes );

		if ( empty( $image_src ) ) {
			return $tag;
		}

		$enhancements = $this->calculate_needed_enhancements( $attributes );
		$enhancements = apply_filters( 'surerank_image_seo_enhancements', $enhancements, $attributes, $image_src, $context );

		if ( empty( $enhancements ) ) {
			return $tag;
		}

		return $this->apply_enhancements( $tag, $attributes, $enhancements, $image_src, $context );
	}

	/**
	 * Parse attributes from image tag
	 *
	 * @param string $tag Image tag.
	 * @return array<string, string> Parsed attributes
	 * @since 1.5.0
	 */
	private function parse_image_attributes( $tag ): array {
		return $this->parse_tag_attributes( $tag );
	}

	/**
	 * Resolve image source URL (supports lazy loading)
	 *
	 * @param array<string, string> $attributes Image attributes.
	 * @return string Image source
	 * @since 1.5.0
	 */
	private function resolve_image_source( $attributes ): string {
		$lazy_attrs = [ 'data-src', 'data-lazy-src', 'data-layzr' ];

		foreach ( $lazy_attrs as $attr ) {
			if ( ! empty( $attributes[ $attr ] ) ) {
				return $attributes[ $attr ];
			}
		}

		return $attributes['src'] ?? '';
	}

	/**
	 * Calculate which enhancements are needed
	 *
	 * @param array<string, string> $attributes Current attributes.
	 * @return array<string, string> Needed enhancements
	 * @since 1.5.0
	 */
	private function calculate_needed_enhancements( $attributes ): array {
		$needed = [];

		$auto_add_alt = ! empty( Settings::get( 'auto_set_image_alt' ) );

		if ( $auto_add_alt && empty( $attributes['alt'] ) ) {
			$needed['alt'] = apply_filters( 'surerank_image_seo_alt_template', '%filename%' );
		}

		if ( apply_filters( 'surerank_image_seo_enable_title', true ) && empty( $attributes['title'] ) ) {
			$needed['title'] = apply_filters( 'surerank_image_seo_title_template', '%title%' );
		}

		return $needed;
	}

	/**
	 * Apply enhancements directly to the original tag string. Updating only
	 * the selected attributes with the HTML parser preserves unrelated boolean
	 * and data-* attributes exactly as authored.
	 *
	 * @param string                                                 $tag Original image tag.
	 * @param array<string, string>                                  $attributes Parsed attributes.
	 * @param array<string, string>                                  $enhancements Needed enhancements.
	 * @param string                                                 $src Image source.
	 * @param object{title: string, slug: string, site_name: string} $context Processing context.
	 * @return string Enhanced image tag
	 * @since 1.5.0
	 */
	private function apply_enhancements( $tag, $attributes, $enhancements, $src, $context ): string {
		$filename = $this->extract_clean_filename( $src );
		$result   = $tag;

		foreach ( $enhancements as $attr => $template ) {
			// Post titles and the site name are stored HTML-encoded (`&amp;`); decode so set_attribute() does not double-encode them.
			$value  = \WP_HTML_Decoder::decode_attribute( $this->resolve_template( $template, $context, $filename ) );
			$result = array_key_exists( $attr, $attributes )
				? $this->replace_attribute_value( $result, $attr, $value )
				: $this->inject_attribute( $result, $attr, $value );
		}

		return $result;
	}

	/**
	 * Extract and clean filename from URL
	 *
	 * @param string $url Image URL.
	 * @return string Clean filename
	 * @since 1.5.0
	 */
	private function extract_clean_filename( $url ): string {
		if ( empty( $url ) ) {
			return '';
		}

		return $this->sanitize_filename( $this->get_basename_without_extension( $url ) );
	}

	/**
	 * Get filename without extension
	 *
	 * @param string $url URL.
	 * @return string Basename
	 * @since 1.5.0
	 */
	private function get_basename_without_extension( $url ): string {
		$filename = basename( $url );
		/**
		 * Using regex to get the basename without the extension
		 * Regex pattern breakdown:
		 *
		 * \. matches a literal dot
		 * [^.]+ matches one or more characters that are not a dot
		 * $ matches the end of the string
		 */
		$result = preg_replace( '/\.[^.]+$/', '', $filename );
		return $result !== null ? $result : $filename;
	}

	/**
	 * Sanitize filename for readability
	 *
	 * @param string $filename Raw filename.
	 * @return string Sanitized filename
	 * @since 1.5.0
	 */
	private function sanitize_filename( $filename ): string {
		/**
		 * Using regex to sanitize the filename
		 * Regex pattern breakdown:
		 *
		 * [-_] matches a hyphen or underscore
		 * + matches one or more of the preceding element
		 * $ matches the end of the string
		 */
		$cleaned      = preg_replace( '/[-_]+/', ' ', $filename );
		$safe_cleaned = $cleaned !== null ? $cleaned : $filename;
		return ucwords( trim( $safe_cleaned ) );
	}

	/**
	 * Resolve template variables
	 *
	 * @param string                                                 $template Template string.
	 * @param object{title: string, slug: string, site_name: string} $context Context data.
	 * @param string                                                 $filename Clean filename.
	 * @return string Resolved string
	 * @since 1.5.0
	 */
	private function resolve_template( $template, $context, $filename ): string {
		if ( empty( $template ) ) {
			return '';
		}

		$variables = $this->build_variable_map( $context, $filename );

		$resolved = trim( strtr( $template, $variables ) );

		return apply_filters( 'surerank_image_seo_resolved_text', $resolved, $template, $context, $filename );
	}

	/**
	 * Build variable replacement map
	 *
	 * @param object{title: string, slug: string, site_name: string} $context Context data.
	 * @param string                                                 $filename Filename.
	 * @return array<string, string> Variable mappings
	 * @since 1.5.0
	 */
	private function build_variable_map( $context, $filename ): array {
		$default_vars = [
			'%title%'     => $context->title,
			'%filename%'  => $filename,
			'%site_name%' => $context->site_name,
			'%slug%'      => $context->slug,
		];

		return apply_filters( 'surerank_image_seo_variable_map', $default_vars, $context, $filename );
	}

}
