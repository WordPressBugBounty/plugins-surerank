/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';
import controls from './controls';
import resolvers from './resolvers';
import { STORE_NAME as storeName } from './constants';

/**
 * Store definition for the viewport namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
const store = createReduxStore( storeName, {
	reducer,
	actions,
	selectors,
	controls,
	resolvers,
} );

register( store );
