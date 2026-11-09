import { __ } from '@wordpress/i18n';
import { getPricingLink } from '@/functions/nudges';
import currentUserCan from '@/functions/role-capabilities';

/**
 * Pick the next step for the GEO screen from the site's real Pro state, so a
 * site that already owns Pro is never told to buy it.
 *
 *   - Pro not installed          -> "Get SureRank Pro"          (pricing page)
 *   - Pro installed, inactive    -> "Activate SureRank Pro"     (activates in place)
 *   - Pro too old for GEO        -> "Update SureRank Pro"       (Plugins screen)
 *   - Pro active, not licensed   -> "Activate License"          (Pro license screen)
 *   - Licensed, GEO not enabled  -> "Enable GEO Features"       (saves the opt-in)
 *   - GEO enabled                -> no call to action
 *
 * A step the current user cannot take keeps its message but has no button.
 *
 * @since x.x.x
 * @return {{step: string, label: string, href: string, external: boolean, message: string, heading: string}} The next step.
 */
const getGeoCta = () => {
	const globals = window?.surerank_globals || {};
	const isProActive = !! globals.is_pro_active;
	const isLicensed =
		true === globals.license_activated || '1' === globals.license_activated;

	if ( ! isProActive && ! globals.is_pro_installed ) {
		return {
			step: 'upgrade',
			label: __( 'Get SureRank Pro', 'surerank' ),
			href: getPricingLink( 'geo' ),
			external: true,
			heading: __( 'Upgrade to Pro:', 'surerank' ),
			message: __(
				'AI Ready features come with SureRank Pro. Upgrade to turn them on for this site.',
				'surerank'
			),
		};
	}

	if ( ! isProActive ) {
		const canActivate = !! globals.can_activate_pro;
		return {
			step: 'activate-pro',
			label: canActivate ? __( 'Activate SureRank Pro', 'surerank' ) : '',
			href: '',
			external: false,
			heading: __( 'Finish Setup:', 'surerank' ),
			message: canActivate
				? __(
						'SureRank Pro is installed but not active. Activate it to use AI Ready features.',
						'surerank'
				  )
				: __(
						'SureRank Pro is installed but not active. Ask an administrator to activate it.',
						'surerank'
				  ),
		};
	}

	// Pro sets this when it has AI Ready features. An older Pro does not.
	if ( ! globals.geo_supported ) {
		const canUpdate = !! globals.can_update_plugins;
		return {
			step: 'update-pro',
			label: canUpdate ? __( 'Update SureRank Pro', 'surerank' ) : '',
			href: canUpdate ? globals.plugins_admin_url || '' : '',
			external: false,
			heading: __( 'Finish Setup:', 'surerank' ),
			message: canUpdate
				? __(
						'AI Ready features need the latest SureRank Pro. Update it to use them.',
						'surerank'
				  )
				: __(
						'AI Ready features need the latest SureRank Pro. Ask an administrator to update it.',
						'surerank'
				  ),
		};
	}

	if ( ! isLicensed ) {
		const canManage = !! globals.can_manage_license;
		return {
			step: 'license',
			label: canManage ? __( 'Activate License', 'surerank' ) : '',
			href: canManage ? globals.license_admin_url || '' : '',
			external: false,
			heading: __( 'Finish Setup:', 'surerank' ),
			message: canManage
				? __(
						'Activate your SureRank Pro license to use AI Ready features.',
						'surerank'
				  )
				: __(
						'Ask an administrator to activate the SureRank Pro license to use AI Ready features.',
						'surerank'
				  ),
		};
	}

	if ( ! globals.geo_features_enabled ) {
		// Same capability as the switch in Tools › Manage Features.
		const canEnable = currentUserCan( 'surerank_global_setting' );
		return {
			step: 'enable',
			label: canEnable ? __( 'Enable AI Ready Features', 'surerank' ) : '',
			href: '',
			external: false,
			heading: __( 'One Step Left:', 'surerank' ),
			message: canEnable
				? __(
						'AI Ready features are experimental and stay off until you turn them on. Nothing changes on your site until you choose what to serve.',
						'surerank'
				  )
				: __(
						'AI Ready features are experimental. Ask an administrator to turn them on.',
						'surerank'
				  ),
		};
	}

	return {
		step: 'enabled',
		label: '',
		href: '',
		external: false,
		heading: __( 'AI Ready Features Are On:', 'surerank' ),
		message: __(
			'You can turn them off any time in Tools › Manage Features. Your settings are kept.',
			'surerank'
		),
	};
};

/**
 * Whether the site has Pro, a license and the GEO opt-in, so the GEO screens
 * replace the opt-in page.
 *
 * @since x.x.x
 * @return {boolean} True when AI Ready features are ready to use.
 */
export const isGeoReady = () => 'enabled' === getGeoCta().step;

export default getGeoCta;
