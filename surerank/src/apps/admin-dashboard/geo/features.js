import { __ } from '@wordpress/i18n';
import { FileText, ListTree, ScanSearch, Signal } from 'lucide-react';

/**
 * Every GEO feature, in menu order. Only Markdown ships today, from Pro. The
 * rest are listed so users can see where GEO is going, and open a coming soon
 * screen until they ship. `points` and `image` fill that screen.
 *
 * @since x.x.x
 */
export const GEO_FEATURES = [
	{
		id: 'markdown',
		path: '/markdown',
		icon: FileText,
		title: __( 'Markdown', 'surerank' ),
		headline: __( 'Just Your Content, No Page Clutter', 'surerank' ),
		description: __(
			'Sends AI crawlers a clean Markdown copy of each page, without menus, scripts or layout, so they get just your content. You can also publish it at a .md address.',
			'surerank'
		),
		available: true,
	},
	{
		id: 'llms-txt',
		image: 'upgrade-llms-txt.svg',
		path: '/llms-txt',
		icon: ListTree,
		title: __( 'LLMs.txt', 'surerank' ),
		headline: __( 'A Map of Your Most Important Pages', 'surerank' ),
		description: __(
			'A guide file at /llms.txt that gives AI tools a map of your most important pages, so they know what to read first.',
			'surerank'
		),
		points: [
			__(
				'Publishes a plain list of your pages and posts at yoursite.com/llms.txt, in the format llmstxt.org describes.',
				'surerank'
			),
			__(
				'Built for you from the post types you choose, using each page’s SureRank description. Nothing to write or keep up to date.',
				'surerank'
			),
			__(
				'Follows your sitemap rules, so pages set to noindex or left out of the sitemap stay out of it too.',
				'surerank'
			),
		],
	},
	{
		id: 'site-checks',
		image: 'upgrade-geo-site-checks.svg',
		path: '/site-checks',
		icon: ScanSearch,
		title: __( 'AI Ready Checks', 'surerank' ),
		headline: __( 'Find What Stops AI Tools Reading You', 'surerank' ),
		description: __(
			'Checks across your site that find what stops AI tools from reading your pages, like blocked crawlers or content they cannot see.',
			'surerank'
		),
		points: [
			__(
				'Tests what a crawler really receives from your site, not just which settings are on.',
				'surerank'
			),
			__(
				'Reads your robots.txt to show which AI crawlers you block, and whether each one is for training or for answers.',
				'surerank'
			),
			__(
				'Checks your sitemap, structured data and how much text your home page shows without JavaScript.',
				'surerank'
			),
		],
	},
	{
		id: 'content-signals',
		image: 'upgrade-content-signals.svg',
		path: '/content-signals',
		icon: Signal,
		title: __( 'Content Signals', 'surerank' ),
		headline: __( 'You Decide How AI Uses Your Content', 'surerank' ),
		description: __(
			'Tell AI tools how they may use your content, for search, for answers or for training, all from one place.',
			'surerank'
		),
		points: [
			__(
				'Adds Content Signals to your robots.txt, an open standard for saying how your content may be used.',
				'surerank'
			),
			__(
				'Three simple choices: search results, AI answers and AI training. Allow or refuse each one.',
				'surerank'
			),
			__(
				'Set once for the whole site from this screen, with no file editing.',
				'surerank'
			),
		],
	},
];

/**
 * Features that have no screen yet.
 *
 * @since x.x.x
 */
export const GEO_COMING_SOON = GEO_FEATURES.filter(
	( feature ) => ! feature.available
);
