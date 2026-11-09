import { __ } from '@wordpress/i18n';
import UpgradeFeatureCard from '@/global/components/nudges/upgrade-feature-card';

/**
 * Screen for a GEO feature that has not shipped yet, on the same card the
 * other upcoming and Pro features use.
 *
 * @since x.x.x
 * @param {Object} feature One entry of GEO_FEATURES.
 * @return {Function} The route component.
 */
const createComingSoonScreen = ( feature ) => {
	const ComingSoon = () => (
		<div className="mx-8 py-8">
			<UpgradeFeatureCard
				title={ feature.title }
				subtitle={ feature.description }
				description={ feature.points }
				imageName={ feature.image }
				badgeLabel={ __( 'Coming Soon', 'surerank' ) }
				badgeVariant="neutral"
				showButton={ false }
			/>
		</div>
	);

	return ComingSoon;
};

export default createComingSoonScreen;
