import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '@/store/constants';
import PageChecks from './page-checks';

/**
 * Higher-Order Component that fetches SEO check data from the store
 * and passes it to the PageChecks component.
 *
 * @return {JSX.Element} The PageChecks component with data.
 */
const WithPageSeoChecks = () => {
	const { pageSeoChecks } = useSelect( ( sel ) => {
		const selectors = sel( STORE_NAME );
		return {
			pageSeoChecks: selectors?.getPageSeoChecks() || {},
		};
	}, [] );

	return <PageChecks pageSeoChecks={ pageSeoChecks } />;
};

export default WithPageSeoChecks;
