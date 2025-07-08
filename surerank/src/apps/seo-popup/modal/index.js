import { compose } from '@wordpress/compose';
import {
	useEffect,
	useCallback,
	useRef,
	Fragment,
	useMemo,
	memo,
} from '@wordpress/element';
import {
	withSelect,
	withDispatch,
	useSelect,
	dispatch as staticDispatch,
	select as staticSelect,
} from '@wordpress/data';
import { STORE_NAME } from '@Store/constants';
import { cn } from '@Functions/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Text, Toaster, toast } from '@bsf/force-ui';
import { GutenbergData, ClassicEditorData } from './dynamic-data-provider';
import {
	Header,
	Footer,
	PageChecksHoc,
	MetaSettings,
} from '@SeoPopup/components';
import { __ } from '@wordpress/i18n';
import { ArrowLeftIcon } from 'lucide-react';
import { fetchMetaSettings } from '@/functions/api';
import ElementorPageChecksHoc from '../components/page-seo-checks/elementor-page-checks-hoc';
import { isElementorActive } from '../components/page-seo-checks/analyzer/utils/elementor';

const animateVariants = {
	open: {
		x: 0,
	},
	closed: {
		x: '100%',
	},
};

const SCREENS = {
	checks: {
		title: __( 'Page SEO Checks', 'surerank' ),
		component: PageChecksHoc,
		elementorComponent: ElementorPageChecksHoc,
	},
	settings: {
		title: __( 'Settings', 'surerank' ),
		component: MetaSettings,
	},
};

export const getEditorData = () => {
	const editor = staticSelect( 'core/editor' );
	const selectors = staticSelect( STORE_NAME );
	const isBlockEditor =
		editor && typeof editor.getEditedPostContent === 'function';

	if ( isBlockEditor ) {
		return {
			postContent: editor.getEditedPostContent() || '',
			permalink: editor.getPermalink() || surerank_seo_popup?.link,
			title: editor.getEditedPostAttribute( 'title' ) || '',
			description: selectors.getPostSeoMeta()?.page_description || '',
		};
	}

	// Fallback for Classic Editor
	if (
		typeof window.tinymce !== 'undefined' &&
		window.tinymce.get( 'content' )
	) {
		const titleInput = document.getElementById( 'title' );
		return {
			postContent: window.tinymce.get( 'content' ).getContent() || '',
			permalink: surerank_seo_popup?.link,
			title: titleInput ? titleInput.value || '' : '',
			description: selectors.getPostSeoMeta()?.page_description || '',
		};
	}

	// Fallback for Classic Editor without TinyMCE (plain textarea)
	const textarea = document.getElementById( 'content' );
	const titleInput = document.getElementById( 'title' );
	return {
		postContent: textarea ? textarea.value || '' : '',
		permalink: surerank_seo_popup?.link,
		title: titleInput ? titleInput.value || '' : '',
		description: selectors.getPostSeoMeta()?.page_description || '',
	};
};

const SeoModal = ( props ) => {
	const {
		setMetaDataAndDefaults,
		initialized,
		setInitialized,
		updateModalState,
		updateAppSettings,
		appSettings,
	} = props;

	const modalState = useSelect(
		( select ) => select( STORE_NAME ).getModalState(),
		[]
	);
	const calledOnceRef = useRef( false );

	const getSEOData = useCallback( async () => {
		if ( initialized ) {
			return;
		}

		try {
			const response = await fetchMetaSettings();
			toast.success( response.message );
			setMetaDataAndDefaults( {
				postSeoMeta: response.data,
				globalDefaults: response.global_default,
			} );

			//set post content
			staticDispatch( STORE_NAME ).updatePostDynamicData( {
				content: response.data.auto_description,
			} );
		} catch ( error ) {
			toast.error( error.message );
		} finally {
			setInitialized( true );
		}
	}, [ initialized ] );

	useEffect( () => {
		if ( ! calledOnceRef.current ) {
			getSEOData();
			calledOnceRef.current = true;
		}
	}, [ getSEOData ] );

	const closeModal = useCallback( () => {
		setTimeout( () => {
			updateModalState( false );
			staticDispatch( 'core/edit-post' )?.closeGeneralSidebar(
				'surerank-menu-icon'
			);
		}, 100 );
	}, [ updateModalState ] );

	const openChecks = useCallback( () => {
		const { currentScreen = '' } = appSettings;

		if ( currentScreen === 'checks' ) {
			return;
		}

		updateAppSettings( {
			currentScreen: 'checks',
			previousScreen: currentScreen,
		} );
	}, [ updateAppSettings, appSettings ] );

	const isElementor = isElementorActive();

	const RenderScreen = useMemo( () => {
		const screen = SCREENS[ appSettings?.currentScreen ?? 'settings' ];
		return isElementor
			? screen?.elementorComponent || screen?.component
			: screen?.component;
	}, [ appSettings?.currentScreen, isElementor ] );

	return (
		<Fragment>
			<Toaster className="z-[100000]" />
			<AnimatePresence>
				{ modalState && (
					<motion.div
						tabIndex="0"
						id="surerank-seo-popup-modal-container"
						className={ cn(
							'fixed inset-y-0 right-0 lg:w-slide-over-container md:w-slide-over-container w-full z-[99999] bg-background-primary shadow-2xl p-3 flex flex-col gap-2'
						) }
						initial="closed"
						animate="open"
						exit="closed"
						variants={ animateVariants }
						transition={ { duration: 0.3 } }
					>
						<Header
							onClose={ closeModal }
							onOpenChecks={ openChecks }
						/>
						{ appSettings?.previousScreen && (
							<div className="space-y-2">
								<div className="flex items-center justify-between gap-2 pr-3">
									<div className="py-1 px-1.5">
										<Button
											onClick={ () =>
												updateAppSettings( {
													currentScreen:
														appSettings.previousScreen,
													previousScreen: '',
												} )
											}
											variant="ghost"
											size="sm"
											icon={ <ArrowLeftIcon /> }
										>
											<Text size={ 14 } weight={ 600 }>
												{
													SCREENS[
														appSettings
															?.currentScreen
													]?.title
												}
											</Text>
										</Button>
									</div>
									{ appSettings.currentScreen === 'checks' &&
										isElementor && (
											<div className="refresh-button-container" />
										) }
								</div>
							</div>
						) }

						{ /* Modal Body */ }
						<div className="flex-1 flex flex-col overflow-y-auto">
							<RenderScreen />
						</div>
						{ appSettings?.currentScreen === 'settings' && (
							<Footer onClose={ closeModal } />
						) }
					</motion.div>
				) }
			</AnimatePresence>
		</Fragment>
	);
};

let hocComponent = ( Component ) => Component;
if ( 'block' === surerank_seo_popup?.editor_type ) {
	hocComponent = GutenbergData;
} else if ( 'classic' === surerank_seo_popup?.editor_type ) {
	hocComponent = ClassicEditorData;
}

export default compose(
	withSelect( ( select ) => {
		const selectStore = select( STORE_NAME );
		return {
			initialized: selectStore.getMetaboxState(),
			appSettings: selectStore.getAppSettings(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const dispatchStore = dispatch( STORE_NAME );
		return {
			setMetaDataAndDefaults: ( value ) =>
				dispatchStore.initMetaDataAndDefaults( value ),
			setInitialized: ( value ) =>
				dispatchStore.updateMetaboxState( value ),
			updateModalState: ( value ) =>
				dispatchStore.updateModalState( value ),
			updateAppSettings: ( value ) =>
				dispatchStore.updateAppSettings( value ),
		};
	} ),
	hocComponent,
	memo,
)( SeoModal );
