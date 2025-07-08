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
import { STORE_NAME as storeName } from './constants';
import setInitialState from './setInitialState';
import controls from '@Store/controls';
import * as resolvers from '@Store/resolvers';

/**
 * Store definition for the viewport namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
export const store = createReduxStore( storeName, {
	reducer,
	actions,
	selectors,
	controls,
	resolvers,
} );

register( store );
setInitialState();
