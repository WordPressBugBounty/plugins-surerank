import { SureRankFullLogo } from '@/global/components/icons';
import { Button } from '@bsf/force-ui';
import { X } from 'lucide-react';
import PageSeoCheckStatusButton from './page-seo-check-status-button';

const Header = ( { onClose, onOpenChecks } ) => {
	return (
		<div className="flex items-center justify-between gap-10 p-2">
			<span className="inline-flex">
				<SureRankFullLogo className="w-32 h-5" />
			</span>
			<div className="inline-flex items-center justify-end gap-2">
				<PageSeoCheckStatusButton onOpenChecks={ onOpenChecks } />
				<Button
					variant="ghost"
					size="sm"
					onClick={ onClose }
					className="p-1 text-icon-secondary hover:text-icon-primary hover:bg-transparent bg-transparent focus:outline-none"
					icon={ <X /> }
				/>
			</div>
		</div>
	);
};

export default Header;
