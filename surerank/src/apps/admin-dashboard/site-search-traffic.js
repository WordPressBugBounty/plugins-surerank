import { useSelect, useDispatch } from '@wordpress/data';
import {
	Container,
	Title,
	Button,
	Label,
	toast,
	Skeleton,
	LineChart,
	Badge,
	Text,
} from '@bsf/force-ui';
import { __ } from '@wordpress/i18n';
import { useEffect, useState, useMemo } from '@wordpress/element';
import { ArrowUp, ArrowDown, LogOut } from 'lucide-react';
import {
	cn,
	formatNumber,
	formatToISOPreserveDate,
	getLastNDays,
	formatDateRange,
} from '@/functions/utils';
import Section from './section';
import { STORE_NAME } from '@/admin-store/constants';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { handleDisconnectConfirm } from '../admin-components/user-dropdown';
const { auth_url: authURL } = surerank_admin_common;

const DEFAULT_DATE_RANGE = 90;

const ClicksAndImpressions = ( { item, isLoading } ) => {
	const renderValue =
		item.value === null && item.previous === null
			? 'N/A'
			: formatNumber( item.value );
	const renderDifference =
		item.value === null && item.previous === null
			? 'N/A'
			: formatNumber( Math.abs( item?.value - item?.previous ) );
	let renderIcon =
		item.percentageType === 'success' ? (
			<ArrowUp className="size-5" />
		) : (
			<ArrowDown className="size-5" />
		);

	let differenceClassName = '';
	switch ( item.percentageType ) {
		case 'danger':
			differenceClassName = 'text-support-error [&>*]:text-support-error';
			break;
		case 'success':
			differenceClassName =
				'text-support-success [&>*]:text-support-success';
			break;
		default:
			differenceClassName = '';
	}

	let fallbackClassName = '';
	// Render N/A and null for difference and icon when both value and previous are null.
	if ( item.value === null && item.previous === null ) {
		fallbackClassName = 'text-text-tertiary [&>*]:text-text-tertiary';
		renderIcon = null;
	}

	if ( item.value === 0 && item.previous === 0 ) {
		renderIcon = null;
	}

	return (
		<Container.Item
			key={ item.label }
			className="px-3 py-5 space-y-4 w-full h-full bg-background-primary rounded-md shadow-sm"
		>
			<Container
				align="center"
				justify="between"
				gap="sm"
				className="p-1"
			>
				<Label tag="p" size="md" className="font-medium">
					{ item.label }
				</Label>
				<span className={ cn( 'size-2 rounded-sm', item.color ) } />
			</Container>
			<Container
				align="center"
				justify="between"
				gap="sm"
				className="p-1"
			>
				{ isLoading ? (
					<Skeleton variant="rectangular" className="w-24 h-10" />
				) : (
					<Label
						tag="p"
						size="md"
						className={ cn(
							'font-semibold text-4xl',
							fallbackClassName
						) }
					>
						{ renderValue }
					</Label>
				) }
				{ isLoading ? (
					<Skeleton variant="rectangular" className="w-16 h-6" />
				) : (
					<Label
						tag="p"
						size="sm"
						className={ cn(
							'font-medium',
							differenceClassName,
							fallbackClassName
						) }
					>
						{ renderIcon }
						<span className="text-inherit">
							{ renderDifference }
						</span>
					</Label>
				) }
			</Container>
		</Container.Item>
	);
};

const EmptyState = ( {
	onClickActionBtn,
	imageSrc = `${ surerank_globals.admin_assets_url }/images/search-console.svg`,
	title,
	description,
	actionButtonText,
} ) => {
	return (
		<Container
			gap="lg"
			direction="column"
			align="center"
			justify="center"
			className="p-[3.125rem]"
		>
			<img src={ imageSrc } alt="Site Search Traffic" />
			<Container.Item className="mx-auto text-center max-w-[39.875rem] space-y-1">
				<Label
					tag="h6"
					className="text-lg font-semibold text-center block"
				>
					{ title }
				</Label>
				<Label
					tag="p"
					size="md"
					className="font-normal text-text-secondary"
				>
					{ description }
				</Label>
			</Container.Item>
			<Button
				variant="primary"
				size="md"
				className="focus:[box-shadow:none]"
				onClick={ onClickActionBtn }
			>
				{ actionButtonText }
			</Button>
		</Container>
	);
};

const SiteSearchTraffic = () => {
	const { setSearchConsole, toggleSiteSelectorModal, setConfirmationModal } =
		useDispatch( STORE_NAME );
	const searchConsole = useSelect(
		( select ) => select( STORE_NAME ).getSearchConsole(),
		[]
	);

	const [ clicksData, setClicksData ] = useState( [
		{
			label: __( 'Clicks', 'surerank' ),
			value: null,
			previous: null,
			percentage: null,
			percentageType: 'success',
			color: 'bg-sky-500',
		},
		{
			label: __( 'Impressions', 'surerank' ),
			value: null,
			previous: null,
			percentage: null,
			percentageType: 'success',
			color: 'bg-background-brand',
		},
	] );
	const [ isLoading, setIsLoading ] = useState(
		searchConsole.authenticated && searchConsole.hasSiteSelected
	);

	const fetchClicksAndImpressions = async ( from, to ) => {
		const formattedStartDate = formatToISOPreserveDate( from );
		const formattedEndDate = formatToISOPreserveDate( to );

		try {
			const response = await apiFetch( {
				path: '/surerank/v1/clicks-and-impressions',
				method: 'POST',
				data: {
					startDate: formattedStartDate,
					endDate: formattedEndDate,
				},
			} );
			if ( ! response.success ) {
				throw new Error(
					response.message ??
						__( 'Failed to fetch matched site', 'surerank' )
				);
			}
			const clicks = response?.data?.clicks;
			const impressions = response?.data?.impressions;

			const getPercentageType = ( percentage ) => {
				if ( percentage === 0 ) {
					return 'neutral';
				}
				return percentage > 0 ? 'success' : 'danger';
			};

			setClicksData( [
				{
					...clicksData[ 0 ],
					value: clicks?.current,
					previous: clicks?.previous,
					percentage: clicks?.percentage,
					percentageType: getPercentageType( clicks?.percentage ),
					color: 'bg-sky-500',
				},
				{
					...clicksData[ 1 ],
					label: __( 'Impressions', 'surerank' ),
					value: impressions?.current,
					percentage: impressions?.percentage,
					previous: impressions?.previous,
					percentageType: getPercentageType(
						impressions?.percentage
					),
				},
			] );
		} catch ( error ) {
			toast.error( error.message );
		}
	};

	const fetchSiteTraffic = async ( from, to ) => {
		const formattedStartDate = formatToISOPreserveDate( from );
		const formattedEndDate = formatToISOPreserveDate( to );

		try {
			const response = await apiFetch( {
				path: addQueryArgs( '/surerank/v1/site-traffic', {
					startDate: formattedStartDate,
					endDate: formattedEndDate,
				} ),
				method: 'GET',
			} );
			if ( ! response.success ) {
				throw new Error(
					response.message ??
						__( 'Failed to fetch site traffic', 'surerank' )
				);
			}
			setSearchConsole( {
				siteTraffic: response?.data?.length
					? response?.data?.map( ( item ) => ( {
							...item,
							readableDate: formatDateRange(
								item.date,
								from,
								to
							),
					  } ) )
					: [],
			} );
		} catch ( error ) {
			toast.error( error.message );
		}
	};

	const initiateAPICalls = async () => {
		if ( ! searchConsole.authenticated || ! searchConsole.selectedSite ) {
			return;
		}
		setIsLoading( true );
		const { from, to } = getLastNDays( DEFAULT_DATE_RANGE );
		try {
			await fetchClicksAndImpressions( from, to );
			await fetchSiteTraffic( from, to );
		} catch ( error ) {
			// do nothing
		} finally {
			setIsLoading( false );
		}
	};

	const handleChangeSite = () => {
		toggleSiteSelectorModal();
	};

	const handleDisconnect = () => {
		setConfirmationModal( {
			open: true,
			title: __( 'Disconnect Search Console Account', 'surerank' ),
			description: __(
				'Are you sure you want to disconnect your Search Console account from SureRank?',
				'surerank'
			),
			onConfirm: handleDisconnectConfirm,
			confirmButtonText: __( 'Disconnect', 'surerank' ),
		} );
	};
	useEffect( () => {
		initiateAPICalls();
	}, [ searchConsole.authenticated, searchConsole.selectedSite ] );

	const handleOpenAuthURL = () => {
		window.open( authURL, '_self', 'noopener,noreferrer' );
	};

	const emptyStateProps = useMemo(
		() =>
			! searchConsole.authenticated
				? {
						imageSrc: `${ surerank_globals.admin_assets_url }/images/search-console.svg`,
						title: __(
							"Let's Connect to Search Console!",
							'surerank'
						),
						description: __(
							'Link your website to Google Search Console to access detailed search analytics, track performance, and optimize your site for better search rankings.',
							'surerank'
						),
						actionButtonText: __(
							'Connect to Search Console Now',
							'surerank'
						),
						onClickActionBtn: handleOpenAuthURL,
				  }
				: {
						imageSrc: `${ surerank_globals.admin_assets_url }/images/search-console.svg`,
						title: __(
							'Select a Site to View Analytics',
							'surerank'
						),
						description: __(
							'Select a site to access detailed search analytics, track performance metrics, and boost your visibility in search results effectively.',
							'surerank'
						),
						actionButtonText: __( 'Select a Site', 'surerank' ),
						onClickActionBtn: toggleSiteSelectorModal,
				  },
		[ searchConsole.authenticated ]
	);

	let renderContent = null;
	if ( ! searchConsole.authenticated || ! searchConsole.hasSiteSelected ) {
		renderContent = (
			<EmptyState
				imageSrc={ emptyStateProps.imageSrc }
				title={ emptyStateProps.title }
				description={ emptyStateProps.description }
				actionButtonText={ emptyStateProps.actionButtonText }
				onClickActionBtn={ emptyStateProps.onClickActionBtn }
			/>
		);
	} else {
		renderContent = (
			<Container className="p-1 rounded-lg bg-background-secondary gap-1 flex-wrap md:flex-nowrap">
				<div className="w-full rounded-md bg-background-primary shadow-sm">
					{ isLoading ? (
						<Skeleton
							variant="rectangular"
							className="w-full h-[288px]"
						/>
					) : (
						<LineChart
							colors={ [
								{
									stroke: '#4B3BED',
								},
								{
									stroke: '#38BDF8',
								},
							] }
							yAxisFontColor={ [ '#4B3BED', '#38BDF8' ] }
							data={ searchConsole?.siteTraffic }
							dataKeys={ [ 'impressions', 'clicks' ] }
							showTooltip
							showXAxis={ true }
							showYAxis={ true }
							biaxial
							tooltipIndicator="dot"
							variant="gradient"
							xAxisDataKey="readableDate"
							yAxisTickFormatter={ ( value ) =>
								formatNumber( value )
							}
							showLegend={ false }
							chartHeight={ 288 }
							chartWidth="100%"
							lineChartWrapperProps={ {
								margin: {
									top: 25,
									right: 10,
									bottom: 25,
									left: 10,
								},
							} }
						/>
					) }
				</div>
				<Container
					className="w-full md:w-[30%] gap-1 flex-row md:flex-col"
					align="stretch"
				>
					{ clicksData.map( ( item ) => (
						<ClicksAndImpressions
							key={ item.label }
							item={ item }
							isLoading={ isLoading }
						/>
					) ) }
				</Container>
			</Container>
		);
	}

	const updateURL = ( site ) => {
		let url = site ?? '';
		if ( url.includes( 'sc-domain:' ) ) {
			url = url.replace( /sc-domain:/, '' );
		}
		if ( ! url.includes( 'https://' ) && ! url.includes( 'http://' ) ) {
			url = `https://${ url }`;
		}
		return 'Site: ' + url;
	};

	return (
		<Section>
			<Container
				gap="none"
				justify="between"
				align="center"
				className="p-1"
			>
				<div className="flex items-center gap-3">
					<Title
						title={ __( 'Site Search Traffic', 'surerank' ) }
						tag="h4"
						size="md"
					/>
					{ searchConsole?.selectedSite && (
						<Text size={ 16 } weight={ 400 } color="secondary">
							{ __( '(Last 90 days)', 'surerank' ) }
						</Text>
					) }
				</div>
				<Container
					gap="xs"
					justify="between"
					align="center"
					className="p-1"
				>
					{ searchConsole?.selectedSite && (
						<span
							role="button"
							tabIndex={ 0 }
							onClick={ handleChangeSite }
							onKeyDown={ ( event ) => {
								if (
									event.key === 'Enter' ||
									event.key === ' '
								) {
									handleChangeSite();
								}
							} }
							className="focus:outline-none"
						>
							<Badge
								size="md"
								label={ updateURL(
									searchConsole.selectedSite
								) }
								className="cursor-pointer"
							/>
						</span>
					) }

					{ searchConsole?.authenticated && (
						<span
							role="button"
							tabIndex={ 0 }
							onClick={ handleDisconnect }
							onKeyDown={ ( event ) => {
								if (
									event.key === 'Enter' ||
									event.key === ' '
								) {
									handleDisconnect();
								}
							} }
							className="focus:outline-none"
						>
							<Badge
								size="md"
								label={ __( 'Disconnect', 'surerank' ) }
								icon={ <LogOut /> }
								iconPosition="left"
								className="cursor-pointer pl-2"
							/>
						</span>
					) }
				</Container>
			</Container>
			{ renderContent }
		</Section>
	);
};

export default SiteSearchTraffic;
