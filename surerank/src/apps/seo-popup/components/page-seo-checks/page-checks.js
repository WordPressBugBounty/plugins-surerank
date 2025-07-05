import {
	useLayoutEffect,
	useRef,
	useState,
	useEffect,
	useMemo,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Loader, Text } from '@bsf/force-ui';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/functions/utils';
import { CheckCard } from '@GlobalComponents/check-card';
import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_NAME } from '@Store/constants';
import { usePageIgnoreChecks } from './page-ignore-checks';

const PageChecks = ( { pageSeoChecks = {} } ) => {
	const {
		badChecks = [],
		fairChecks = [],
		passedChecks = [],
		suggestionChecks = [],
		isCheckingLinks = false,
		linkCheckProgress = { current: 0, total: 0 },
	} = pageSeoChecks;
	const { fetchIgnoredChecks, setPageSeoCheck, updateIgnoredChecksObjects } =
		useDispatch( STORE_NAME );

	const {
		postId,
		checkType,
		ignoredChecks = [],
		ignoredList = [],
	} = useSelect( ( select ) => {
		const state = select( STORE_NAME ).getState();
		const pageSEOChecks = state.pageSeoChecks || {};
		return {
			postId: pageSEOChecks.postId ?? state.variables?.post?.ID?.value,
			checkType: pageSEOChecks.checkType,
			ignoredChecks: pageSEOChecks.ignoredChecks || [],
			ignoredList: Array.isArray( pageSEOChecks.ignoredList )
				? pageSEOChecks.ignoredList
				: [],
		};
	}, [] );

	// Fetch ignored checks when postId and checkType are both available
	useEffect( () => {
		if ( postId && checkType ) {
			fetchIgnoredChecks( postId, checkType );
		}
	}, [ postId, checkType, fetchIgnoredChecks ] );

	// Use the custom hook for ignore/restore functionality
	const {
		deduplicateAndReorganizeChecks,
		handleIgnoreCheck,
		handleRestoreCheck,
	} = usePageIgnoreChecks( {
		badChecks,
		fairChecks,
		passedChecks,
		ignoredChecks,
		ignoredList,
		setPageSeoCheck,
		updateIgnoredChecksObjects,
		postId,
		checkType,
		fetchIgnoredChecks,
	} );

	// Deduplicate and reorganize checks
	useEffect( () => {
		deduplicateAndReorganizeChecks();
	}, [
		badChecks,
		fairChecks,
		passedChecks,
		ignoredChecks,
		ignoredList,
		deduplicateAndReorganizeChecks,
	] );

	const passedChecksContainerRef = useRef( null );
	const [ showPassedChecks, setShowPassedChecks ] = useState( false );

	const handleTogglePassedChecks = () => {
		setShowPassedChecks( ( prev ) => ! prev );
	};

	// Memoize filtered checks to prevent unnecessary recalculations
	const filteredBadChecks = useMemo(
		() =>
			badChecks.filter( ( check ) => ! ignoredList.includes( check.id ) ),
		[ badChecks, ignoredList ]
	);

	const filteredFairChecks = useMemo(
		() =>
			fairChecks.filter(
				( check ) => ! ignoredList.includes( check.id )
			),
		[ fairChecks, ignoredList ]
	);

	const filteredPassedChecks = useMemo(
		() =>
			passedChecks.filter(
				( check ) => ! ignoredList.includes( check.id )
			),
		[ passedChecks, ignoredList ]
	);

	// Show passed checks by default if no visible bad or fair checks
	useLayoutEffect( () => {
		if (
			! filteredBadChecks.length &&
			! filteredFairChecks.length &&
			! showPassedChecks
		) {
			setShowPassedChecks( true );
		}
	}, [
		filteredBadChecks.length,
		filteredFairChecks.length,
		showPassedChecks,
	] );

	const hasBadOrFairChecks = useMemo(
		() =>
			filteredBadChecks.length > 0 ||
			filteredFairChecks.length > 0 ||
			suggestionChecks.length > 0,
		[
			filteredBadChecks.length,
			filteredFairChecks.length,
			suggestionChecks.length,
		]
	);

	return (
		<motion.div
			className="space-y-6 p-2 overflow-y-auto"
			initial={ { opacity: 0 } }
			animate={ { opacity: 1 } }
			exit={ { opacity: 0 } }
			transition={ { duration: 0.3 } }
		>
			{ /* Critical and Warning Checks Container */ }
			{ hasBadOrFairChecks && (
				<div className="space-y-3">
					{ filteredBadChecks.map( ( check ) => (
						<CheckCard
							key={ check.id }
							id={ check?.id }
							variant="red"
							label={ __( 'Critical', 'surerank' ) }
							title={ check.title }
							data={ check?.data }
							showImages={ check?.showImages }
							onIgnore={ () => handleIgnoreCheck( check.id ) }
							showIgnoreButton={ true }
						/>
					) ) }
					{ filteredFairChecks.map( ( check ) => (
						<CheckCard
							key={ check.id }
							id={ check.id }
							variant="yellow"
							label={ __( 'Warning', 'surerank' ) }
							title={ check.title }
							data={ check?.data }
							showImages={ check?.showImages }
							onIgnore={ () => handleIgnoreCheck( check.id ) }
							showIgnoreButton={ true }
						/>
					) ) }
					{ suggestionChecks.map( ( check ) => (
						<CheckCard
							key={ check.id }
							id={ check.id }
							variant="blue"
							label={ __( 'Suggestion', 'surerank' ) }
							title={ check.title }
							data={ check?.data }
							showImages={ check?.showImages }
							onIgnore={ () => handleIgnoreCheck( check.id ) }
						/>
					) ) }
					{ /* Broken links check progress will render here */ }
					{ isCheckingLinks && (
						<div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border-0.5 border-solid border-border-subtle">
							<Loader size="sm" />
							<Text size={ 14 } weight={ 500 } color="tertiary">
								{ sprintf(
									/* translators: %1$d: number of links */
									__(
										'%1$d out of %2$d checks are done.',
										'surerank'
									),
									linkCheckProgress.current,
									linkCheckProgress.total
								) }
							</Text>
						</div>
					) }
				</div>
			) }
			{ /* Ignored Checks Container */ }
			{ ignoredChecks.length > 0 && (
				<div className="space-y-3 mt-4">
					{ ignoredChecks.map( ( check ) => (
						<CheckCard
							key={ check.id }
							variant="neutral"
							label={ __( 'Ignore', 'surerank' ) }
							title={ check.title }
							showFixButton={ false }
							showRestoreButton={ true }
							onRestore={ () => handleRestoreCheck( check.id ) }
						/>
					) ) }
				</div>
			) }

			{ hasBadOrFairChecks && (
				<div className="flex items-center justify-center w-full">
					<Button
						variant="outline"
						size="xs"
						className="w-fit"
						icon={
							<ChevronDownIcon
								className={ cn(
									showPassedChecks && 'rotate-180'
								) }
							/>
						}
						iconPosition="right"
						onClick={ handleTogglePassedChecks }
					>
						{ __( 'Passed Checks', 'surerank' ) }
					</Button>
				</div>
			) }

			{ /* Passed Checks Container */ }
			<AnimatePresence>
				<motion.div
					ref={ passedChecksContainerRef }
					className={ cn( hasBadOrFairChecks && 'mt-4' ) }
					initial={ { opacity: 0 } }
					animate={ { opacity: showPassedChecks ? 1 : 0 } }
					exit={ {
						opacity: 0,
						transition: { duration: 0.1 },
					} }
					transition={ {
						duration: 0.2,
					} }
					onAnimationComplete={ () => {
						if ( showPassedChecks ) {
							passedChecksContainerRef.current.scrollIntoView( {
								behavior: 'smooth',
							} );
						}
					} }
				>
					{ showPassedChecks && filteredPassedChecks.length > 0 && (
						<div className="space-y-3">
							{ filteredPassedChecks.map( ( check ) => (
								<CheckCard
									key={ check.id }
									variant="green"
									label={ __( 'Passed', 'surerank' ) }
									title={ check.title }
									showFixButton={ false }
									onIgnore={ () =>
										handleIgnoreCheck( check.id )
									}
								/>
							) ) }
						</div>
					) }
				</motion.div>
			</AnimatePresence>
		</motion.div>
	);
};

export default PageChecks;
