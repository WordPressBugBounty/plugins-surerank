import { useState } from '@wordpress/element';
import { Button, toast } from '@bsf/force-ui';
import { LoaderCircle, Check } from 'lucide-react'; // Import icons
import { __ } from '@wordpress/i18n';
import { ADMIN_SETTINGS_URL } from '@/global/constants/api';
import { STORE_NAME } from '@/admin-store/constants';
import { useSelect, useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { DotIcon } from '@/global/components/icons';

const GlobalSaveButton = ( {
	onClick,
	buttonTextInitial = __( 'Save', 'surerank' ),
	icon,
	disabled,
	...props
} ) => {
	const [ buttonText, setButtonText ] = useState( buttonTextInitial );
	const [ saving, setSaving ] = useState( false );

	const handleSaveClick = async () => {
		if ( saving ) {
			return;
		}
		setSaving( true );
		setButtonText( __( 'Saving..', 'surerank' ) );

		try {
			const response = await onClick();
			if ( ! response.success ) {
				throw new Error( response.message );
			}
			// Show success message
			toast.success( response.message );

			//set button text to saved
			setButtonText( __( 'Saved', 'surerank' ) );

			// Reset button text after 1 second
			setTimeout( () => {
				setButtonText( buttonTextInitial );
			}, 1000 );
		} catch ( error ) {
			toast.error( error.message );
			setButtonText( buttonTextInitial );
		} finally {
			setSaving( false );
		}
	};

	const getIcon = () => {
		if ( saving ) {
			return <LoaderCircle className="animate-spin" />;
		}
		if ( buttonText === __( 'Saved', 'surerank' ) ) {
			return <Check />;
		}
		if ( icon ) {
			return icon;
		}
		return null;
	};

	return (
		<Button
			onClick={ handleSaveClick }
			loading={ saving }
			icon={ getIcon() }
			disabled={ disabled }
			{ ...props }
		>
			{ buttonText }
		</Button>
	);
};

export const SaveSettingsButton = () => {
	const { unsavedSettings } = useSelect( ( select ) => {
		const { getUnsavedSettings } = select( STORE_NAME );
		return {
			unsavedSettings: getUnsavedSettings() || {},
		};
	}, [] );
	const { resetUnsavedSettings } = useDispatch( STORE_NAME );

	const handleSave = async () => {
		const queryParams = { data: unsavedSettings };

		const response = await apiFetch( {
			path: ADMIN_SETTINGS_URL,
			method: 'POST',
			data: queryParams,
		} );

		if ( response.success ) {
			// Reset unsaved settings after successful save
			setTimeout( () => {
				resetUnsavedSettings();
			}, 1000 );
		}

		return response;
	};

	const hasUnsavedSettings = Object.keys( unsavedSettings || {} ).length > 0;

	return (
		<GlobalSaveButton
			onClick={ handleSave }
			className={
				! hasUnsavedSettings
					? 'opacity-60 bg-background-brand cursor-not-allowed pointer-events-none'
					: ''
			}
			icon={ hasUnsavedSettings ? <DotIcon /> : null }
		>
			{ __( 'Save', 'surerank' ) }
		</GlobalSaveButton>
	);
};

export default GlobalSaveButton;
