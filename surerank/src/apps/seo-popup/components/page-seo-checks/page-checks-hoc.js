import { useSuspenseSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '@/store/constants';
import PageChecks from './page-checks';
import { Suspense } from '@wordpress/element';
import PageChecksListSkeleton from './page-checks-list-skeleton';

const PageSeoChecksWrapper = () => {
	const { pageSeoChecks } = useSuspenseSelect( ( sel ) => {
		const selectors = sel( STORE_NAME );
		return {
			pageSeoChecks: selectors?.getPageSeoChecks() || {},
		};
	}, [] );
	const { ignorePageSeoCheck, restorePageSeoCheck } =
		useDispatch( STORE_NAME );

	const handleIgnoreCheck = ( checkId ) => {
		ignorePageSeoCheck( checkId );
	};
	const handleRestoreCheck = ( checkId ) => {
		restorePageSeoCheck( checkId );
	};

	return (
		<PageChecks
			pageSeoChecks={ {
				...pageSeoChecks,
				...pageSeoChecks.categorizedChecks,
			} }
			onIgnore={ handleIgnoreCheck }
			onRestore={ handleRestoreCheck }
		/>
	);
};

/**
 * Higher-Order Component that fetches SEO check data from the store
 * and passes it to the PageChecks component.
 *
 * @return {JSX.Element} The PageChecks component with data.
 */
const WithPageSeoChecks = () => {
	return (
		<Suspense fallback={ <PageChecksListSkeleton /> }>
			<PageSeoChecksWrapper />
		</Suspense>
	);
};

export default WithPageSeoChecks;
