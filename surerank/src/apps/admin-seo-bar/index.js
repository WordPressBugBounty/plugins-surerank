import { createRoot } from 'react-dom/client';
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import {
	Badge,
	Skeleton,
	Drawer,
	Container,
	Button,
	Text,
} from '@bsf/force-ui';
import { BarChart, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import './style.scss';
import { SureRankFullLogo } from '@GlobalComponents/icons';
import PageChecks from '@SeoPopup/components/page-seo-checks/page-checks';
import { formatSeoChecks } from '@/functions/utils';
import '../../store/store';
import { useDispatch } from '@wordpress/data';
import { STORE_NAME } from '@Store/constants';

const SeoChecksDrawer = ( { open, setOpen, seoScore, pageTitle, postId } ) => {
	const { setPageSeoCheck } = useDispatch( STORE_NAME );

	useEffect( () => {
		if ( open && postId ) {
			// Set the post ID in the store using setPageSeoCheck
			setPageSeoCheck( 'postId', parseInt( postId, 10 ) );
			// Set the check type based on the page type
			const isTaxonomy = window?.surerank_seo_bar?.type === 'taxonomy';
			setPageSeoCheck( 'checkType', isTaxonomy ? 'taxonomy' : 'post' );
		}
	}, [ open, postId ] );

	const handleCloseClick = ( e ) => {
		e.preventDefault();
		e.stopPropagation();
		setOpen( false );
	};

	const pageSeoChecks = formatSeoChecks( seoScore );
	return (
		<Drawer
			exitOnEsc
			position="right"
			scrollLock
			setOpen={ setOpen }
			open={ open }
			className="z-999999"
		>
			<Drawer.Panel>
				<Drawer.Header className="px-5 pt-5 pb-0">
					<Container align="center" justify="between">
						<SureRankFullLogo className="w-32 h-5" />
						<Button
							variant="ghost"
							size="sm"
							icon={ <X /> }
							onClick={ handleCloseClick }
							className="text-text-secondary hover:text-text-primary"
							aria-label={ __( 'Close drawer', 'surerank' ) }
						/>
					</Container>
					<Container align="center" justify="between">
						<Text
							as="span"
							color="primary"
							className="py-2"
							size={ 14 }
							weight={ 500 }
						>
							{ pageTitle +
								' - ' +
								__( 'Page SEO Checks', 'surerank' ) }
						</Text>
					</Container>
				</Drawer.Header>
				<Drawer.Body className="overflow-x-hidden space-y-3 px-3">
					<AnimatePresence>
						{ ! seoScore ? (
							<motion.div
								className="space-y-2 p-2"
								initial={ { opacity: 0 } }
								animate={ { opacity: 1 } }
								exit={ { opacity: 0 } }
								transition={ { duration: 0.3 } }
							>
								<p className="m-0 text-text-secondary">
									{ __(
										'No SEO data available.',
										'surerank'
									) }
								</p>
							</motion.div>
						) : (
							<PageChecks pageSeoChecks={ pageSeoChecks } />
						) }
					</AnimatePresence>
				</Drawer.Body>
			</Drawer.Panel>
			<Drawer.Backdrop />
		</Drawer>
	);
};

const CustomBadge = ( { id, spanElement, forceRefresh = false } ) => {
	const [ isLoading, setIsLoading ] = useState( true );
	const [ seoScore, setSeoScore ] = useState( null );
	const [ drawerOpen, setDrawerOpen ] = useState( false );
	const [ pageTitle, setPageTitle ] = useState( '' );
	const [ error, setError ] = useState( null );

	useEffect( () => {
		if ( forceRefresh ) {
			setIsLoading( true );
			setSeoScore( null );
			setError( null );
		}
	}, [ forceRefresh ] );

	useEffect( () => {
		if ( ! id ) {
			setIsLoading( false );
			setError( __( 'No ID provided', 'surerank' ) );
			return;
		}

		const fetchSeoScore = async () => {
			try {
				setIsLoading( true );
				setError( null );

				// Get page title from data-title attribute
				const title =
					spanElement?.getAttribute( 'data-title' ) ||
					__( 'Untitled', 'surerank' );
				setPageTitle( title );

				// Fetch SEO score with timeout
				const isTaxonomy =
					window?.surerank_seo_bar?.type === 'taxonomy';
				const apiPath = isTaxonomy
					? `/surerank/v1/taxonomy-seo-checks?term_id=${ id }`
					: `/surerank/v1/page-seo-checks?post_id=${ id }`;

				// Add cache busting parameter for fresh data after quick edit
				const cacheBuster = forceRefresh ? `&_t=${ Date.now() }` : '';

				const controller = new AbortController();
				const timeoutId = setTimeout( () => controller.abort(), 10000 ); // 10 second timeout

				try {
					const seoData = await apiFetch( {
						path: apiPath + cacheBuster,
						method: 'GET',
						signal: controller.signal,
					} );

					clearTimeout( timeoutId );

					if ( seoData && seoData.checks ) {
						setSeoScore( seoData.checks );
					} else {
						setSeoScore( null );
						setError( __( 'No SEO data found', 'surerank' ) );
					}
				} catch ( fetchError ) {
					clearTimeout( timeoutId );
					throw fetchError;
				}
			} catch ( err ) {
				setSeoScore( null );
				setPageTitle( __( 'Untitled', 'surerank' ) );

				if ( err.name === 'AbortError' ) {
					setError( __( 'Request timeout', 'surerank' ) );
				} else {
					setError(
						err.message ||
							__( 'Failed to fetch SEO data', 'surerank' )
					);
				}
			} finally {
				setIsLoading( false );
			}
		};

		fetchSeoScore();
	}, [ id, spanElement, forceRefresh ] );

	const handleBadgeClick = () => {
		setDrawerOpen( true );
	};

	if ( isLoading ) {
		return (
			<Skeleton
				variant="rectangular"
				className="w-full rounded-full h-6 max-w-32"
			/>
		);
	}

	const checks = seoScore ? Object.values( seoScore ) : [];
	let badgeProps = {
		icon: <BarChart />,
		variant: 'green',
		label: __( 'Optimized', 'surerank' ),
		className: 'w-fit',
	};

	if ( error || ! seoScore ) {
		badgeProps = {
			...badgeProps,
			variant: 'red',
			label: error
				? __( 'Error', 'surerank' )
				: __( 'No Data', 'surerank' ),
		};
	} else if ( checks.some( ( check ) => check.status === 'error' ) ) {
		badgeProps = {
			...badgeProps,
			variant: 'red',
			label: __( 'Issues Detected', 'surerank' ),
		};
	} else if ( checks.some( ( check ) => check.status === 'warning' ) ) {
		badgeProps = {
			...badgeProps,
			variant: 'yellow',
			label: __( 'Needs Improvement', 'surerank' ),
		};
	}

	return (
		<>
			<div
				onClick={ handleBadgeClick }
				role="button"
				tabIndex={ 0 }
				className="inline-block cursor-pointer w-full"
				onKeyDown={ ( e ) => {
					if ( e.key === 'Enter' || e.key === ' ' ) {
						handleBadgeClick( e );
					}
				} }
			>
				<Badge { ...badgeProps } />
			</div>
			<SeoChecksDrawer
				open={ drawerOpen }
				setOpen={ setDrawerOpen }
				seoScore={ seoScore }
				pageTitle={ pageTitle }
				postId={ id }
			/>
		</>
	);
};

// Store root instances to properly cleanup
const rootInstances = new Map();

const renderBadge = ( span, forceRefresh = false ) => {
	const id = span.getAttribute( 'data-id' );
	if ( ! id ) {
		return;
	}

	// Skip if already rendered and not forcing refresh
	if ( ! forceRefresh && span.dataset.rendered === 'true' ) {
		return;
	}

	// Cleanup existing root if it exists
	const existingRoot = rootInstances.get( span );
	if ( existingRoot ) {
		try {
			existingRoot.unmount();
		} catch ( e ) {}
		rootInstances.delete( span );
	}

	// Create new root and render
	try {
		const root = createRoot( span );
		rootInstances.set( span, root );
		root.render(
			<CustomBadge
				id={ id }
				spanElement={ span }
				forceRefresh={ forceRefresh }
			/>
		);
		span.dataset.rendered = 'true'; // Mark as rendered
	} catch ( e ) {}
};

const renderBadges = () => {
	const spans = document.querySelectorAll(
		'span.surerank-page-score[data-id]'
	);
	spans.forEach( ( span ) => {
		renderBadge( span, false );
	} );
};

// Debounce function to prevent multiple rapid calls
const debounce = ( func, wait ) => {
	let timeout;
	return function executedFunction( ...args ) {
		const later = () => {
			clearTimeout( timeout );
			func( ...args );
		};
		clearTimeout( timeout );
		timeout = setTimeout( later, wait );
	};
};

/* global MutationObserver, inlineEditTax, Node */

// Initialize badges on page load
document.addEventListener( 'DOMContentLoaded', () => {
	if (
		window.location.pathname.includes( 'edit.php' ) ||
		window.location.pathname.includes( 'edit-tags.php' )
	) {
		renderBadges();
	}

	// Set up MutationObserver to watch for new span elements
	const table = document.querySelector( '#the-list' );
	if ( table ) {
		const observer = new MutationObserver( ( mutations ) => {
			mutations.forEach( ( mutation ) => {
				if ( mutation.addedNodes.length ) {
					mutation.addedNodes.forEach( ( node ) => {
						if ( node.nodeType === Node.ELEMENT_NODE ) {
							const spans = node.querySelectorAll(
								'span.surerank-page-score[data-id]'
							);
							spans.forEach( ( span ) => {
								if ( ! span.dataset.rendered ) {
									renderBadge( span, true ); // Force refresh for new terms
								}
							} );
						}
					} );
				}
			} );
		} );

		observer.observe( table, {
			childList: true,
			subtree: true,
		} );
	}
} );

// Handle inline edit for existing terms
document.addEventListener( 'DOMContentLoaded', () => {
	if (
		typeof inlineEditTax !== 'undefined' &&
		typeof inlineEditTax.save === 'function'
	) {
		const originalTaxSave = inlineEditTax.save;
		inlineEditTax.save = function ( id ) {
			let termId = id;
			if ( id && typeof id === 'object' && id.nodeType ) {
				try {
					const row = id.closest( 'tr[id^="tag-"], tr[id^="edit-"]' );
					const idStr = row ? row.id : null;
					if ( idStr ) {
						const parts = idStr.split( '-' );
						termId = parts[ parts.length - 1 ];
					} else {
						return;
					}
				} catch ( e ) {
					return;
				}
			} else if ( typeof id === 'string' && id.startsWith( 'tag-' ) ) {
				termId = id.replace( 'tag-', '' );
			}

			const result = originalTaxSave.call( this, termId );

			const debouncedRerender = debounce( () => {
				const span = document.querySelector(
					`span.surerank-page-score[data-id="${ termId }"]`
				);
				if ( span ) {
					renderBadge( span, true );
				}
			}, 3000 );

			debouncedRerender();

			return result;
		};
	}
} );

export default CustomBadge;
