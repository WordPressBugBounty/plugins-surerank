import { pick } from 'lodash';
import { select } from '@wordpress/data';
import { STORE_NAME } from './constants';
import * as actionTypes from './action-types';
import apiFetch from '@wordpress/api-fetch';
/**
 * Returns an action object used in signalling that viewport queries have been
 * updated. Values are specified as an object of breakpoint query keys where
 * value represents whether query matches.
 * Ignored from documentation as it is for internal use only.
 *
 * @param {string} value Value to update.
 */
export function updatePostSeoMeta( value ) {
	return {
		type: 'UPDATE_POST_SEO_META',
		value,
	};
}

export function updateMetaboxState( value ) {
	return {
		type: 'UPDATE_METABOX_STATE',
		value,
	};
}

export function updateModalState( value ) {
	return {
		type: 'UPDATE_MODAL_STATE',
		value,
	};
}

// To create content dynamically.
export function updatePostDynamicData( value ) {
	return {
		type: 'UPDATE_DYNAMIC_DATA',
		value,
	};
}

export function* updatePostMetaData( value ) {
	yield setUnsavedMetaSettings( value );

	return {
		type: actionTypes.UPDATE_META_DATA,
		value,
	};
}

export function updateInitialState( value ) {
	return {
		type: 'UPDATE_INITIAL_STATE',
		value,
	};
}

export const updateGlobalDefaults = ( payload ) => ( {
	type: actionTypes.UPDATE_GLOBAL_DEFAULTS,
	payload,
} );

export function* initMetaDataAndDefaults( { postSeoMeta, globalDefaults } ) {
	let postSeoMetaObj = postSeoMeta;
	if ( postSeoMetaObj && ! Object.keys( postSeoMetaObj ).length ) {
		postSeoMetaObj = select( STORE_NAME ).getPostSeoMeta();
		postSeoMetaObj = pick( globalDefaults, Object.keys( postSeoMetaObj ) );
		yield updatePostMetaData( postSeoMetaObj );
	} else {
		yield updatePostSeoMeta( postSeoMetaObj );
	}
	return updateGlobalDefaults( globalDefaults );
}

export function updateAppSettings( value ) {
	return {
		type: actionTypes.UPDATE_APP_SETTINGS,
		value,
	};
}

export const setPageSeoCheck = ( key, value ) => {
	let payload = { [ key ]: value };
	if ( key === 'checks' ) {
		const filteredChecks = value.filter( Boolean );
		// Filter critical, warning and passed checks.
		const badChecks = filteredChecks.filter(
			( check ) => check.status === 'error'
		);
		const fairChecks = filteredChecks.filter(
			( check ) => check.status === 'warning'
		);
		const passedChecks = filteredChecks.filter(
			( check ) => check.status === 'success'
		);
		const suggestionChecks = filteredChecks.filter(
			( check ) => check.status === 'suggestion'
		);
		payload = { badChecks, fairChecks, suggestionChecks, passedChecks };
	}
	return {
		type: actionTypes.SET_PAGE_SEO_CHECK,
		payload,
	};
};

export const setUnsavedMetaSettings = ( payload ) => {
	return {
		type: actionTypes.SET_UNSAVED_META_SETTINGS,
		payload,
	};
};

export const resetUnsavedMetaSettings = () => {
	return {
		type: actionTypes.RESET_UNSAVED_META_SETTINGS,
	};
};

export const setRefreshCalled = ( value ) => ( {
	type: actionTypes.SET_REFRESH_CALLED,
	value,
} );

export const updateIgnoredList = ( payload ) => ( {
	type: actionTypes.UPDATE_IGNORED_LIST,
	payload,
} );

export const updateIgnoredChecksObjects = ( payload ) => ( {
	type: actionTypes.UPDATE_IGNORED_CHECKS,
	payload,
} );

export const fetchIgnoredChecks =
	( postId, checkType ) =>
	async ( { dispatch } ) => {
		try {
			const data = await apiFetch( {
				path: `surerank/v1/ignore-post-checks?post_id=${ postId }&check_type=${ checkType }`,
				method: 'GET',
			} );
			dispatch( updateIgnoredList( data?.checks ) );
		} catch ( error ) {
			dispatch( updateIgnoredList( [] ) );
		}
	};

export const ignoreCheck =
	( postId, checkId, checkType ) =>
	async ( { dispatch } ) => {
		try {
			const data = await apiFetch( {
				path: 'surerank/v1/ignore-post-checks',
				method: 'POST',
				data: { post_id: postId, id: checkId, check_type: checkType },
			} );

			// Update ignoredList with the array of IDs
			dispatch( updateIgnoredList( data?.checks ) );
		} catch ( error ) {}
	};

export const restoreCheck =
	( postId, checkId, checkType ) =>
	async ( { dispatch } ) => {
		try {
			const data = await apiFetch( {
				path: 'surerank/v1/ignore-post-checks',
				method: 'DELETE',
				data: { post_id: postId, id: checkId, check_type: checkType },
			} );

			// Update ignoredList with the array of IDs
			dispatch( updateIgnoredList( data?.checks ) );
		} catch ( error ) {}
	};
