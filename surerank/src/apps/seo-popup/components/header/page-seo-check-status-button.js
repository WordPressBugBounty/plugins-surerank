import { usePageChecks } from '../../hooks';
import { Button, Skeleton, Text } from '@bsf/force-ui';
import { ChartNoAxesColumnIncreasingIcon } from 'lucide-react';
import { cn } from '@/functions/utils';
import { _n, sprintf, __ } from '@wordpress/i18n';
import { isElementorActive } from '../page-seo-checks/analyzer/utils/elementor';
import { SeoPopupTooltip } from '@/apps/admin-components/tooltip';
import { useDispatch } from '@wordpress/data';
import { STORE_NAME } from '@Store/constants';

const PageSeoCheckStatusButton = ( { onOpenChecks } ) => {
	const { status, initializing, counts } = usePageChecks();
	const { setPageSeoCheck } = useDispatch( STORE_NAME );
	const isElementorEditor = isElementorActive();

	const handleOpenChecks = () => {
		const isTaxonomy = window?.surerank_seo_popup?.is_taxonomy === '1';
		setPageSeoCheck( 'checkType', isTaxonomy ? 'taxonomy' : 'post' );
		if ( isTaxonomy && window?.surerank_seo_popup?.term_id ) {
			setPageSeoCheck( 'postId', window?.surerank_seo_popup?.term_id );
		}
		onOpenChecks();
	};

	if ( ! isElementorEditor && initializing ) {
		return <Skeleton className="size-[2.0625rem]" />;
	}

	return (
		<SeoPopupTooltip
			content={
				<Text size={ 12 } weight={ 600 } color="inverse">
					{ counts.errorAndWarnings > 0
						? sprintf(
								// translators: %1$s is the number of issues detected, %2$s is the word "Issue".
								__(
									'%1$s %2$s need attention. Click to see',
									'surerank'
								),
								counts.errorAndWarnings,
								_n(
									'issue',
									'issues',
									counts.errorAndWarnings,
									'surerank'
								)
						  )
						: __(
								'All SEO checks passed. Click to see',
								'surerank'
						  ) }
				</Text>
			}
			offset={ {
				crossAxis: -100,
				mainAxis: 8,
			} }
			arrow
		>
			<Button
				variant="ghost"
				size="sm"
				onClick={ handleOpenChecks }
				icon={ <ChartNoAxesColumnIncreasingIcon /> }
				className={ cn(
					'border-0.5 border-solid focus:[box-shadow:none] focus:outline-none',
					status === 'error' &&
						'bg-badge-background-red hover:bg-badge-background-red border-badge-border-red text-badge-color-red',
					status === 'warning' &&
						'bg-badge-background-yellow hover:bg-badge-background-yellow border-badge-border-yellow text-badge-color-yellow',
					status === 'success' &&
						'bg-badge-background-green hover:bg-badge-background-green border-badge-border-green text-badge-color-green'
				) }
			/>
		</SeoPopupTooltip>
	);
};

export default PageSeoCheckStatusButton;
