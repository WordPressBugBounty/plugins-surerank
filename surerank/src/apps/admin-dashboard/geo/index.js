import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Badge, Button, Container, Text, Title, toast } from '@bsf/force-ui';
import { ExternalLink, Sparkles } from 'lucide-react';
import {
	ACTIVATE_PRO_URL,
	ADMIN_SETTINGS_URL,
	GEO_STATUS_URL,
} from '@Global/constants/api';
import getGeoCta, { isGeoReady } from './get-geo-cta';
import { GEO_FEATURES } from './features';
import FeatureIcon from './feature-icon';
import GeoIllustration from './geo-illustration';

const MARKDOWN_PATH = '/geo/markdown';

/**
 * Turn the GEO opt-in on, then reload on the Markdown screen. The nav and
 * routes are built once on load, so the new screen only exists after a reload.
 *
 * @since x.x.x
 * @return {Promise<void>}
 */
const enableGeoFeatures = async () => {
	const response = await apiFetch( {
		path: ADMIN_SETTINGS_URL,
		method: 'POST',
		data: { data: { enable_geo_features: true } },
	} );

	if ( ! response?.success ) {
		throw new Error(
			response?.message ||
				__( 'Could not turn on AI Ready features.', 'surerank' )
		);
	}

	window.location.hash = `#${ MARKDOWN_PATH }`;
	window.location.reload();
};

/**
 * Activate the installed SureRank Pro in place, without leaving this screen.
 * The server decides which plugin to activate; the request names none.
 *
 * Pro only loads on the next request, so its state (GEO support, license)
 * is read from a second request once it is active.
 *
 * @since x.x.x
 * @return {Promise<Object>} The GEO state with Pro active.
 */
const activatePro = async () => {
	const response = await apiFetch( {
		path: ACTIVATE_PRO_URL,
		method: 'POST',
	} );

	if ( ! response?.success ) {
		throw new Error(
			response?.message ||
				__( 'Could not activate SureRank Pro.', 'surerank' )
		);
	}

	const { success, message, ...status } = await apiFetch( {
		path: GEO_STATUS_URL,
	} );

	if ( ! success ) {
		throw new Error(
			message ||
				__( 'Could not read the SureRank Pro status.', 'surerank' )
		);
	}

	return status;
};

/**
 * Open a screen that only exists once Pro's scripts are loaded. Pro's routes
 * are registered on page load, so a hash change alone would not find it.
 *
 * @since x.x.x
 * @param {string} url Admin URL with the screen in its hash.
 * @return {void}
 */
const openProScreen = ( url ) => {
	window.location.hash = new window.URL( url, window.location.href ).hash;
	window.location.reload();
};

/**
 * The step's button. An action for steps that happen on this screen, a link
 * for the pricing page. Renders nothing when the user cannot take the step.
 *
 * @since x.x.x
 * @param {Object}   props            Component props.
 * @param {Object}   props.cta        Step from getGeoCta().
 * @param {string}   props.variant    Button variant.
 * @param {string}   props.size       Button size.
 * @param {Function} props.onStepDone Called after a step that changes the state.
 * @return {JSX.Element|null} The button.
 */
const CtaButton = ( { cta, variant, size, onStepDone } ) => {
	const [ isBusy, setIsBusy ] = useState( false );

	if ( ! cta.label ) {
		return null;
	}

	const actions = {
		'activate-pro': async () => {
			Object.assign( window.surerank_globals, await activatePro() );

			// GEO was already on: its screens are only routed on page load.
			if ( isGeoReady() ) {
				window.location.hash = `#${ MARKDOWN_PATH }`;
				window.location.reload();
				return;
			}

			toast.success( __( 'SureRank Pro is active.', 'surerank' ) );
			setIsBusy( false );
			onStepDone();
		},
		license: async () => openProScreen( cta.href ),
		enable: enableGeoFeatures,
	};

	if ( actions[ cta.step ] ) {
		const onClick = async () => {
			setIsBusy( true );
			try {
				await actions[ cta.step ]();
			} catch ( error ) {
				toast.error( error.message );
				setIsBusy( false );
			}
		};

		return (
			<Button
				variant={ variant }
				size={ size }
				onClick={ onClick }
				loading={ isBusy }
				disabled={ isBusy }
				className="shrink-0"
			>
				{ cta.label }
			</Button>
		);
	}

	return (
		<Button
			tag="a"
			href={ cta.href }
			target={ cta.external ? '_blank' : undefined }
			rel={ cta.external ? 'noopener noreferrer' : undefined }
			variant={ variant }
			size={ size }
			className="no-underline shrink-0"
			icon={
				cta.external ? (
					<ExternalLink className="size-3" aria-hidden="true" />
				) : undefined
			}
			iconPosition="right"
		>
			{ cta.label }
		</Button>
	);
};

/**
 * GEO opt-in screen at `/geo`, shown full screen until the site has Pro, a
 * license and the GEO opt-in. After that the GEO menu opens the feature
 * screens instead.
 *
 * @since x.x.x
 * @return {JSX.Element} The screen.
 */
const GeoOverview = () => {
	// Bumped after a step finishes on this screen, so the next step is read
	// from the updated globals without a reload.
	const [ , setStepVersion ] = useState( 0 );
	const onStepDone = () => setStepVersion( ( version ) => version + 1 );
	const cta = getGeoCta();

	return (
		<Container direction="column" gap="lg" className="p-5">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-7 bg-background-primary border border-solid border-border-subtle rounded-xl shadow-sm">
				<div className="flex flex-col gap-3 max-w-xl">
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-1.5 text-brand-800">
							<Sparkles className="size-4" aria-hidden="true" />
							<Text
								size={ 14 }
								weight={ 600 }
								className="text-brand-800"
							>
								{ __(
									'Available in SureRank Pro',
									'surerank'
								) }
							</Text>
						</div>
						<Badge
							size="sm"
							variant="yellow"
							label={ __( 'Experimental', 'surerank' ) }
						/>
					</div>
					<Title
						tag="h2"
						size="lg"
						title={ __(
							'Make Your Site Easy for AI to Read',
							'surerank'
						) }
					/>
					<Text
						as="p"
						size={ 14 }
						color="secondary"
						className="leading-relaxed"
					>
						{ __(
							'AI assistants read your pages to answer questions. AI Ready hands them a clean copy of your content, without the menus and scripts.',
							'surerank'
						) }
					</Text>
					<div className="flex items-center gap-4 pt-2">
						<CtaButton
							cta={ cta }
							variant="primary"
							size="md"
							onStepDone={ onStepDone }
						/>
					</div>
				</div>
				<GeoIllustration />
			</div>

			<div className="flex flex-wrap items-center gap-3 p-4 bg-background-primary border border-solid border-border-subtle rounded-xl shadow-sm">
				<Text size={ 14 } weight={ 600 } color="primary">
					{ cta.heading }
				</Text>
				<Text
					as="p"
					size={ 14 }
					color="secondary"
					className="m-0 basis-full lg:basis-auto lg:flex-1"
				>
					{ cta.message }
				</Text>
				<CtaButton
					cta={ cta }
					variant="outline"
					size="sm"
					onStepDone={ onStepDone }
				/>
			</div>

			<div className="flex flex-col gap-5 p-7 bg-background-primary border border-solid border-border-subtle rounded-xl shadow-sm">
				<Title
					tag="h3"
					size="md"
					title={ __(
						'How AI Ready Works',
						'surerank'
					) }
				/>
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
					{ GEO_FEATURES.map( ( feature ) => (
						<div
							key={ feature.id }
							className="flex flex-col gap-2.5 p-4 bg-background-secondary border border-solid border-border-subtle rounded-lg"
						>
							<div className="flex items-center justify-between gap-2">
								<div className="flex items-center gap-2">
									<FeatureIcon
										icon={ feature.icon }
										muted={ ! feature.available }
									/>
									<Text
										size={ 12 }
										weight={ 500 }
										color="tertiary"
									>
										{ feature.title }
									</Text>
								</div>
								<Badge
									size="xs"
									variant={
										feature.available ? 'green' : 'neutral'
									}
									label={
										feature.available
											? __( 'Available', 'surerank' )
											: __( 'Coming Soon', 'surerank' )
									}
								/>
							</div>
							<h4 className="m-0 text-[14.5px] font-semibold leading-tight text-text-primary">
								{ feature.headline }
							</h4>
							<p className="m-0 text-[12.5px] leading-[1.5] text-text-secondary">
								{ feature.description }
							</p>
						</div>
					) ) }
				</div>
			</div>
		</Container>
	);
};

export default GeoOverview;
