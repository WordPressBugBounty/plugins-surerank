import apiFetch from '@wordpress/api-fetch';

const controls = {
	FETCH_FROM_API( action ) {
		return apiFetch( { path: action.payload } );
	},
};

export default controls;
