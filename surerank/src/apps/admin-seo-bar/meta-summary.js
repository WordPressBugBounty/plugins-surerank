import { __ } from '@wordpress/i18n';

const MetaSummary = ( { meta } ) => {
	if ( ! meta ) {
		return null;
	}

	const fields = [
		[ 'page_title', __( 'Meta Title', 'surerank' ) ],
		[ 'page_description', __( 'Meta Description', 'surerank' ) ],
	];

	return (
		<div className="surerank-meta-summary">
			{ fields.map( ( [ key, label ] ) => {
				const { value = '', source = 'missing' } = meta[ key ] || {};
				return (
					<details key={ key }>
						<summary>
							<span className="surerank-meta-label">
								{ label }
								{ source === 'template' && (
									<span className="surerank-meta-source">
										{ __( 'Template', 'surerank' ) }
									</span>
								) }
							</span>
							<span className="surerank-meta-value">
								{ value || __( 'Missing', 'surerank' ) }
							</span>
						</summary>
					</details>
				);
			} ) }
		</div>
	);
};

export default MetaSummary;
