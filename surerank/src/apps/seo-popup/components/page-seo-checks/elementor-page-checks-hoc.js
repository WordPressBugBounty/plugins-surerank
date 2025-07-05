import {
	useSelect,
	useDispatch,
	select as staticSelect,
} from '@wordpress/data';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { Alert } from '@bsf/force-ui';
import { __ } from '@wordpress/i18n';
import { PageChecks } from '..';
import {
	refreshPageChecks,
	isElementorActive,
} from './analyzer/utils/elementor';
import RefreshButtonPortal from '../refresh-button-portal';
import { STORE_NAME } from '@/store/constants';

const ElementorPageChecksHoc = () => {
	const pageSeoChecks = useSelect(
		( select ) => select( STORE_NAME ).getPageSeoChecks(),
		[]
	);
	const modalState = useSelect(
		( select ) => select( STORE_NAME ).getModalState(),
		[]
	);
	const refreshCalled = useSelect(
		( select ) => select( STORE_NAME ).getRefreshCalled(),
		[]
	);
	const { setPageSeoCheck, setRefreshCalled } = useDispatch( STORE_NAME );

	const [ brokenLinkState, setBrokenLinkState ] = useState( {
		isChecking: false,
		checkedLinks: new Set(),
		brokenLinks: new Set(),
		allLinks: [],
	} );

	const [ isRefreshing, setIsRefreshing ] = useState( false );
	const isElementorEditor = isElementorActive();

	const handleRefreshWithBrokenLinks = useCallback( async () => {
		setRefreshCalled( true ); // // Ensure subsequent opens don't auto-refresh
		await refreshPageChecks(
			setIsRefreshing,
			setBrokenLinkState,
			setPageSeoCheck,
			staticSelect,
			pageSeoChecks,
			brokenLinkState
		);
	}, [
		setIsRefreshing,
		setBrokenLinkState,
		setPageSeoCheck,
		pageSeoChecks,
		brokenLinkState,
		setRefreshCalled,
	] );

	useEffect( () => {
		if ( isElementorEditor && modalState && ! refreshCalled ) {
			refreshPageChecks(
				setIsRefreshing,
				setBrokenLinkState,
				setPageSeoCheck,
				staticSelect,
				pageSeoChecks,
				brokenLinkState
			);
			setRefreshCalled( true ); // Dispatch action to set refreshCalled
		}
	}, [
		isElementorEditor,
		modalState,
		refreshCalled, // Use state instead of ref
		setPageSeoCheck,
		pageSeoChecks,
		brokenLinkState,
		setRefreshCalled,
	] );

	return (
		<div className="p-1 space-y-2 flex-1 flex flex-col">
			{ isElementorEditor && (
				<>
					<RefreshButtonPortal
						isRefreshing={ isRefreshing }
						isChecking={ brokenLinkState.isChecking }
						onClick={ handleRefreshWithBrokenLinks }
					/>
					<div className="p-2">
						<Alert
							variant="info"
							content={ __(
								'Please save changes in the editor before refreshing the checks.',
								'surerank'
							) }
							className="shadow-none"
						/>
					</div>
				</>
			) }
			<div className="flex-1 overflow-y-auto">
				<PageChecks
					pageSeoChecks={ {
						...pageSeoChecks,
						isCheckingLinks: brokenLinkState.isChecking,
						linkCheckProgress: {
							current: brokenLinkState.checkedLinks.size,
							total: brokenLinkState.allLinks.length,
						},
					} }
				/>
			</div>
		</div>
	);
};

export default ElementorPageChecksHoc;
