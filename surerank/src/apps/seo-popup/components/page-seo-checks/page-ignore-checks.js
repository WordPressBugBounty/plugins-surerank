import { useDispatch } from '@wordpress/data';
import { STORE_NAME } from '@Store/constants';
import { useCallback, useMemo } from '@wordpress/element';

export const usePageIgnoreChecks = ( {
	badChecks,
	fairChecks,
	passedChecks,
	ignoredChecks,
	ignoredList,
	updateIgnoredChecksObjects,
	postId,
	checkType,
	fetchIgnoredChecks,
} ) => {
	const { restoreCheck, ignoreCheck } = useDispatch( STORE_NAME );

	const arraysDiffer = useMemo(
		() => ( arr1, arr2 ) =>
			arr1.length !== arr2.length ||
			arr1.some( ( item, index ) => item.id !== arr2[ index ]?.id ),
		[]
	);

	const deduplicateAndReorganizeChecks = useCallback( () => {
		// Combine all checks
		const allChecks = [
			...badChecks,
			...fairChecks,
			...passedChecks,
			...ignoredChecks,
		];

		// Deduplicate checks by id
		const checkMap = new Map(
			allChecks.map( ( check ) => [ check.id, check ] )
		);

		// Separate ignored checks, excluding those in passedChecks
		const newIgnoredChecks = Array.from( checkMap.values() ).filter(
			( check ) =>
				ignoredList.includes( check.id ) &&
				! passedChecks.some(
					( passedCheck ) => passedCheck.id === check.id
				)
		);

		// Only update ignoredChecks if they differ
		// Don't modify the main check arrays - let them remain as they are
		if ( arraysDiffer( newIgnoredChecks, ignoredChecks ) ) {
			updateIgnoredChecksObjects( newIgnoredChecks );
		}
	}, [
		badChecks,
		fairChecks,
		passedChecks,
		ignoredChecks,
		ignoredList,
		arraysDiffer,
		updateIgnoredChecksObjects,
	] );

	const handleIgnoreCheck = useCallback(
		async ( checkId ) => {
			const getCheck = () =>
				fairChecks.find( ( check ) => check.id === checkId ) ||
				badChecks.find( ( check ) => check.id === checkId ) ||
				passedChecks.find( ( check ) => check.id === checkId ) ||
				null;

			const checkObject = getCheck();
			if ( ! checkObject ) {
				return;
			}

			// Don't remove check from main arrays - let them remain as they are
			// The filtering will happen in the PageChecks component for display purposes

			// Add to ignoredChecks if not already present and not a passed check
			if (
				! ignoredChecks.some( ( check ) => check.id === checkId ) &&
				checkObject.status !== 'success'
			) {
				updateIgnoredChecksObjects( [ ...ignoredChecks, checkObject ] );
			}

			// Update backend only - let useEffect handle the refresh
			if ( postId && checkType ) {
				await ignoreCheck( postId, checkId, checkType );
			}
		},
		[
			badChecks,
			fairChecks,
			passedChecks,
			ignoredChecks,
			postId,
			checkType,
			ignoreCheck,
			updateIgnoredChecksObjects,
		]
	);

	const handleRestoreCheck = useCallback(
		async ( checkId ) => {
			const checkObject = ignoredChecks.find(
				( check ) => check.id === checkId
			);
			if ( ! checkObject ) {
				return;
			}

			// Remove from ignoredChecks only
			// The check should already be in the appropriate main array
			const updatedIgnoredChecks = ignoredChecks.filter(
				( check ) => check.id !== checkId
			);
			updateIgnoredChecksObjects( updatedIgnoredChecks );

			// Update backend only - let useEffect handle the refresh
			if ( postId && checkType ) {
				await restoreCheck( postId, checkId, checkType );
			}
		},
		[
			ignoredChecks,
			postId,
			checkType,
			restoreCheck,
			updateIgnoredChecksObjects,
			fetchIgnoredChecks,
		]
	);

	return {
		deduplicateAndReorganizeChecks,
		handleIgnoreCheck,
		handleRestoreCheck,
	};
};
