import { cn } from '@/functions/utils';

/**
 * Icon tile for a GEO feature, in the style of the SureRank AI feature cards.
 *
 * @since x.x.x
 * @param {Object}   props       Component props.
 * @param {Function} props.icon  Lucide icon component.
 * @param {boolean}  props.muted Grey tile for features that are not out yet.
 * @return {JSX.Element} The tile.
 */
const FeatureIcon = ( { icon: Icon, muted = false } ) => (
	<span
		className={ cn(
			'flex items-center justify-center size-9 rounded-[10px] shrink-0',
			muted
				? 'bg-background-secondary text-icon-secondary'
				: 'bg-brand-background-50 text-brand-800'
		) }
		aria-hidden="true"
	>
		<Icon className="size-[18px]" strokeWidth={ 2 } />
	</span>
);

export default FeatureIcon;
