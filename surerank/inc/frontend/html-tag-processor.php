<?php
/**
 * Source spans for content SEO's exact-tag extraction API.
 *
 * @package surerank
 * @since 1.11.0
 */

namespace SureRank\Inc\Frontend;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Exposes read-only source coordinates without reserializing HTML.
 *
 * WordPress 6.7 has no public token-offset getters. Its protected bookmark
 * collection provides spans for subclasses; keep that dependency here.
 *
 * @since 1.11.0
 */
class Html_Tag_Processor extends \WP_HTML_Tag_Processor {

	/**
	 * Get the current tag's byte span in the original, unmodified input.
	 *
	 * @return array{start: int, length: int}|null Source coordinates, if available.
	 * @since 1.11.0
	 */
	public function get_tag_span(): ?array {
		if ( ! $this->set_bookmark( 'surerank-current-tag' ) ) {
			return null;
		}

		$span = $this->bookmarks['surerank-current-tag'];
		$this->release_bookmark( 'surerank-current-tag' );

		return [
			'start'  => $span->start,
			'length' => $span->length,
		];
	}
}
