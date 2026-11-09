<?php
/**
 * Trait Tag_Attribute_Helpers
 *
 * @package surerank
 * @since 1.7.4
 */

namespace SureRank\Inc\Traits;

use SureRank\Inc\Frontend\Html_Tag_Processor;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Shared HTML-aware helpers for Image_Seo and Link_Seo.
 *
 * @since 1.7.4
 */
trait Tag_Attribute_Helpers {

	/**
	 * Extract complete opening tags in their original HTML context.
	 *
	 * @param string $content  Original HTML.
	 * @param string $tag_name Tag name to find.
	 * @return array<string> Original opening tags.
	 * @since 1.11.0
	 */
	private function extract_html_tags( string $content, string $tag_name ): array {
		$processor = new Html_Tag_Processor( $content );
		$tags      = [];
		while ( $processor->next_tag( [ 'tag_name' => $tag_name ] ) ) {
			$span = $processor->get_tag_span();
			if ( null !== $span ) {
				$tags[] = substr( $content, $span['start'], $span['length'] );
			}
		}
		return $tags;
	}

	/**
	 * Parse real attributes, excluding attribute-looking text inside values.
	 *
	 * @param string $tag Original opening tag.
	 * @return array<string, string> Decoded values for the existing filter contract.
	 * @since 1.11.0
	 */
	private function parse_tag_attributes( string $tag ): array {
		$processor  = new \WP_HTML_Tag_Processor( $tag );
		$attributes = [];
		if ( ! $processor->next_tag() ) {
			return $attributes;
		}
		foreach ( $processor->get_attribute_names_with_prefix( '' ) ?? [] as $name ) {
			$value               = $processor->get_attribute( $name );
			$attributes[ $name ] = is_string( $value ) ? $value : '';
		}
		return $attributes;
	}

	/**
	 * Replace only real tag occurrences, never matching text inside other tokens.
	 *
	 * @param string                $content      Original HTML.
	 * @param string                $tag_name     Tag name to find.
	 * @param array<string, string> $replacements Original tags mapped to replacements.
	 * @return string Enhanced HTML.
	 * @since 1.11.0
	 */
	private function replace_html_tags( string $content, string $tag_name, array $replacements ): string {
		$processor = new Html_Tag_Processor( $content );
		$updates   = [];
		while ( $processor->next_tag( [ 'tag_name' => $tag_name ] ) ) {
			$span = $processor->get_tag_span();
			if ( null === $span ) {
				continue;
			}
			$tag = substr( $content, $span['start'], $span['length'] );
			if ( isset( $replacements[ $tag ] ) && $replacements[ $tag ] !== $tag ) {
				$updates[] = [
					'start'  => $span['start'],
					'length' => $span['length'],
					'html'   => $replacements[ $tag ],
				];
			}
		}
		foreach ( array_reverse( $updates ) as $update ) {
			$content = substr_replace( $content, $update['html'], $update['start'], $update['length'] );
		}
		return $content;
	}

	/**
	 * Replace an existing real attribute without touching quoted data.
	 *
	 * @param string $tag   Original tag.
	 * @param string $attr  Attribute name.
	 * @param string $value New, unescaped value.
	 * @return string Enhanced tag.
	 * @since 1.7.4
	 */
	private function replace_attribute_value( string $tag, string $attr, string $value ): string {
		$processor = new \WP_HTML_Tag_Processor( $tag );
		if ( ! $processor->next_tag() || null === $processor->get_attribute( $attr ) ) {
			return $tag;
		}
		$processor->set_attribute( $attr, $value );
		return $processor->get_updated_html();
	}

	/**
	 * Set a new attribute using core's quoting and encoding rules.
	 *
	 * @param string $tag   Original tag.
	 * @param string $attr  Attribute name.
	 * @param string $value New, unescaped value.
	 * @return string Enhanced tag.
	 * @since 1.7.4
	 */
	private function inject_attribute( string $tag, string $attr, string $value ): string {
		$processor = new \WP_HTML_Tag_Processor( $tag );
		if ( ! $processor->next_tag() ) {
			return $tag;
		}
		$processor->set_attribute( $attr, $value );
		return $processor->get_updated_html();
	}
}
