import { Navigate } from '@tanstack/react-router';

/**
 * Sends a GEO screen that is not available yet back to the GEO opt-in page.
 *
 * @since x.x.x
 * @return {JSX.Element} The redirect.
 */
const RedirectToGeo = () => <Navigate to="/geo" replace />;

export default RedirectToGeo;
