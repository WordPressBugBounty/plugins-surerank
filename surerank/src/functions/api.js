import apiFetch from '@wordpress/api-fetch';
import { TERM_SEO_DATA_URL, POST_SEO_DATA_URL } from '@Global/constants/api';
import { isCurrentPage } from '@/functions/utils';

export const fetchMetaSettings = async () => {
	const queryParams = new URLSearchParams();
	if ( isCurrentPage( 'term.php' ) ) {
		queryParams.append( 'term_id', surerank_seo_popup?.term_id );
	} else {
		queryParams.append( 'post_id', surerank_seo_popup?.post_id );
	}
	queryParams.append( 'post_type', surerank_seo_popup?.post_type );
	queryParams.append( 'is_taxonomy', surerank_seo_popup?.is_taxonomy );

	try {
		const response = await apiFetch( {
			path: `${
				isCurrentPage( 'term.php' )
					? TERM_SEO_DATA_URL
					: POST_SEO_DATA_URL
			}?${ queryParams.toString() }`,
			method: 'GET',
		} );
		if ( ! response.success ) {
			throw new Error( response.message );
		}
		return response;
	} catch ( error ) {
		throw new Error( error.message );
	}
};
