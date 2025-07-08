import { mountComponent } from '@Functions/utils';
import createAdminRouter, {
	createRoute,
	createChildRoute,
} from '@Functions/router';
import Dashboard from './dashboard';
import { Toaster } from '@bsf/force-ui';
import { getNavLinks } from '@Global/constants/nav-links';
import { Navigate } from '@tanstack/react-router';
import SidebarLayout from '@AdminComponents/layout/sidebar-layout';
import SearchConsole from '../admin-search-console';

// Routes
const dashboardRoutes = [
	// Default route redirects to dashboard
	createRoute( '/', () => <Navigate to="/dashboard" />, {
		navbarOnly: true,
	} ),
	// Dashboard routes
	createRoute( '/dashboard', Dashboard, { navbarOnly: true } ),
];

const generalAndAdvancedRoutes = [
	// General routes
	createRoute( '/general', {
		loader: () =>
			import(
				'@AdminGeneral/general/title-and-description/title-and-description'
			).then( ( module ) => module.LazyRoute ),
	} ),
	createRoute( '/general/homepage', null, [
		createChildRoute( '/', {
			loader: () =>
				import( '@AdminGeneral/general/home-page/home-page' ).then(
					( module ) => module.LazyRoute
				),
		} ),
		createChildRoute( '/social', {
			loader: () =>
				import( '@AdminGeneral/general/home-page/home-page' ).then(
					( module ) => module.LazyRoute
				),
		} ),
		createChildRoute( '/advanced', {
			loader: () =>
				import( '@AdminGeneral/general/home-page/home-page' ).then(
					( module ) => module.LazyRoute
				),
		} ),
	] ),
	createChildRoute( '/general/archive_pages', {
		loader: () =>
			import( '@AdminGeneral/advanced/archive-pages/archive-pages' ).then(
				( module ) => module.LazyRoute
			),
	} ),
	createRoute( '/general/social', null, [
		createChildRoute( '/', {
			loader: () =>
				import( '@AdminGeneral/social/general/general' ).then(
					( module ) => module.LazyRoute
				),
		} ),
		createChildRoute( '/facebook', {
			loader: () =>
				import( '@AdminGeneral/social/facebook/facebook' ).then(
					( module ) => module.LazyRoute
				),
		} ),
		createChildRoute( '/x', {
			loader: () =>
				import( '@AdminGeneral/social/twitter/twitter' ).then(
					( module ) => module.LazyRoute
				),
		} ),
		createChildRoute( '/accounts', {
			loader: () =>
				import( '@AdminGeneral/social/account/account' ).then(
					( module ) => module.LazyRoute
				),
		} ),
	] ),

	// Advanced routes
	createRoute( '/advanced', null, [
		createRoute( '/robot_instructions', null, [
			createChildRoute( '/indexing', {
				loader: () =>
					import(
						'@AdminGeneral/advanced/robot-instructions/robot-instructions'
					).then( ( module ) => module.LazyRoute ),
			} ),
			createChildRoute( '/following', {
				loader: () =>
					import(
						'@AdminGeneral/advanced/robot-instructions/robot-instructions'
					).then( ( module ) => module.LazyRoute ),
			} ),
			createChildRoute( '/archiving', {
				loader: () =>
					import(
						'@AdminGeneral/advanced/robot-instructions/robot-instructions'
					).then( ( module ) => module.LazyRoute ),
			} ),
		] ),
		createChildRoute( '/sitemaps', {
			loader: () =>
				import( '@AdminGeneral/advanced/sitemaps/sitemaps' ).then(
					( module ) => module.LazyRoute
				),
		} ),
		createChildRoute( '/schema', {
			loader: () =>
				import( '@AdminGeneral/schema/schema' ).then(
					( module ) => module.LazyRoute
				),
		} ),
	] ),
];

const searchConsoleRoutes = [
	createRoute( '/search-console', SearchConsole, { navbarOnly: true } ),
	createRoute(
		'/content-performance',
		{
			loader: () =>
				import(
					'@AdminDashboard/content-analysis/content-analysis'
				).then( ( module ) => module.LazyRoute ),
		},
		{
			navbarOnly: true,
		}
	),
	createRoute(
		'/site-seo-analysis',
		{
			loader: () =>
				import(
					'@AdminDashboard/site-seo-checks/site-seo-checks-main'
				).then( ( module ) => module.LazyRoute ),
		},
		{
			navbarOnly: true,
		}
	),
];

// Combine all routes
export const routes = [
	...dashboardRoutes,
	...generalAndAdvancedRoutes,
	...searchConsoleRoutes,
];

// Navigation Links
const navLinks = getNavLinks();

// Create router using the original createAdminRouter but with custom layout
const Router = createAdminRouter( {
	navLinks,
	routes,
	defaultLayout: {
		component: SidebarLayout,
		props: {},
	},
} );

const App = () => {
	return (
		<>
			<Router />
			<Toaster className="z-999999" />
		</>
	);
};

mountComponent( '#surerank-root', <App /> );
