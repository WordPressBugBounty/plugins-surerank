import KeywordInput from '@SeoPopup/components/keyword-input';
import MetaSettingsScreen from './meta-settings';
import { ENABLE_PAGE_LEVEL_SEO } from '@Global/constants';
import PageSeoCheckStatusButton from '@SeoPopup/components/header/page-seo-check-status-button';
import { applyFilters } from '@wordpress/hooks';
import { isBricksBuilder } from '../page-seo-checks/analyzer/utils/page-builder';

const MetaSettings = () => {
	//we will show settings here
	const SeoTabsComponent = applyFilters( 'surerank-pro.seo-popup' );

	return (
		<>
			{ SeoTabsComponent && (
				<div className="flex items-center gap-2">
					<KeywordInput />
					{ ENABLE_PAGE_LEVEL_SEO && ! isBricksBuilder() && (
						<PageSeoCheckStatusButton />
					) }
				</div>
			) }
			<MetaSettingsScreen />
		</>
	);
};

export default MetaSettings;
