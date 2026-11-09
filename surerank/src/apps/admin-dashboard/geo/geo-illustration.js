import { __ } from '@wordpress/i18n';
import { Bot, ChevronRight, Code, FileText, Sparkles } from 'lucide-react';

/**
 * A line of placeholder text.
 *
 * @param {Object} props           Component props.
 * @param {string} props.className Width and colour.
 * @return {JSX.Element} The line.
 */
const Line = ( { className } ) => (
	<span className={ `block h-1.5 rounded-full ${ className }` } />
);

/**
 * Dashed connector with a chevron, between the three stages.
 *
 * @return {JSX.Element} The connector.
 */
const Connector = () => (
	<span className="hidden sm:flex items-center flex-1 min-w-4 max-w-12 text-brand-border-300">
		<span className="flex-1 border-0 border-t-2 border-dashed border-brand-border-300" />
		<ChevronRight className="size-4 -ml-1.5 text-brand-800" />
	</span>
);

/**
 * A caption under one stage.
 *
 * @param {Object} props          Component props.
 * @param {string} props.children Caption text.
 * @return {JSX.Element} The caption.
 */
const Caption = ( { children } ) => (
	<span className="text-center text-[12px] font-medium text-text-tertiary">
		{ children }
	</span>
);

/**
 * Hero picture for the GEO screen: a busy HTML page on the left, GEO in the
 * middle, and the clean copy AI crawlers read on the right. Drawn with layout
 * blocks so it follows the admin colours. Decorative only.
 *
 * @since x.x.x
 * @return {JSX.Element} The illustration.
 */
const GeoIllustration = () => (
	<div
		className="relative flex items-center justify-center gap-2 sm:gap-3 px-5 py-7 sm:px-7 rounded-xl border border-solid border-border-subtle bg-gradient-to-br from-brand-background-50 to-background-secondary overflow-hidden bg-[radial-gradient(circle,_rgba(99,102,241,0.12)_1px,_transparent_1px)] [background-size:16px_16px]"
		aria-hidden="true"
	>
		{ /* The page as a browser renders it. */ }
		<div className="flex flex-col gap-2.5 w-[40%] max-w-[250px]">
			<div className="relative">
				<div className="flex flex-col bg-background-primary rounded-lg shadow-sm border border-solid border-border-subtle overflow-hidden">
					<div className="flex items-center gap-1 px-2.5 py-2 border-0 border-b border-solid border-border-subtle">
						<span className="size-1.5 rounded-full bg-red-300" />
						<span className="size-1.5 rounded-full bg-amber-300" />
						<span className="size-1.5 rounded-full bg-green-300" />
						<span className="ml-2 h-2 flex-1 rounded-full bg-background-secondary" />
					</div>
					<div className="flex gap-1.5 px-2.5 pt-2.5">
						<span className="h-2 w-8 rounded bg-background-secondary" />
						<span className="h-2 w-6 rounded bg-background-secondary" />
						<span className="h-2 w-7 rounded bg-background-secondary" />
						<span className="h-2 w-5 rounded bg-background-secondary" />
					</div>
					<div className="flex gap-2 p-2.5">
						<div className="flex flex-col gap-1.5 flex-1">
							<span className="h-9 rounded bg-background-secondary" />
							<Line className="w-1/2 h-2 bg-text-tertiary" />
							<Line className="w-full bg-border-subtle" />
							<Line className="w-4/5 bg-border-subtle" />
							<span className="h-5 rounded bg-amber-100" />
							<Line className="w-3/4 bg-border-subtle" />
						</div>
						<div className="flex flex-col gap-1.5 w-1/3">
							<span className="h-8 rounded bg-background-secondary" />
							<span className="h-10 rounded bg-amber-100" />
							<span className="h-5 rounded bg-background-secondary" />
						</div>
					</div>
					<div className="h-3 bg-background-secondary" />
				</div>
				<span className="absolute -top-2.5 -right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-background-primary border border-solid border-border-subtle shadow-sm text-[10px] font-medium text-text-tertiary">
					<Code className="size-3" />
					{ __( 'HTML', 'surerank' ) }
				</span>
			</div>
			<Caption>{ __( 'Your page', 'surerank' ) }</Caption>
		</div>

		<Connector />

		{ /* AI Ready in the middle. */ }
		<div className="flex flex-col items-center gap-1.5 shrink-0">
			<span className="relative flex items-center justify-center size-12 rounded-full bg-brand-800 text-white shadow-lg ring-8 ring-brand-background-50">
				<Sparkles className="size-5" />
			</span>
			<span className="text-[11px] font-semibold text-brand-800">
				{ __( 'AI Ready', 'surerank' ) }
			</span>
		</div>

		<Connector />

		{ /* What AI crawlers read. */ }
		<div className="flex flex-col gap-2.5 w-[40%] max-w-[250px]">
			<div className="flex flex-col bg-background-primary rounded-lg shadow-lg border border-solid border-brand-border-300 overflow-hidden">
				<div className="flex items-center gap-1.5 px-2.5 py-2 border-0 border-b border-solid border-border-subtle">
					<FileText className="size-3.5 text-brand-800" />
					<span className="text-[11px] font-medium text-text-secondary">
						about-us.md
					</span>
					<span className="ml-auto px-1.5 rounded bg-green-50 text-[9px] font-semibold text-green-700">
						MD
					</span>
				</div>
				<div className="flex flex-col gap-1.5 p-3">
					<span className="flex items-center gap-1.5">
						<span className="text-[11px] font-bold leading-none text-brand-800">
							#
						</span>
						<Line className="w-1/2 h-2 bg-text-primary" />
					</span>
					<Line className="w-full bg-border-subtle" />
					<Line className="w-11/12 bg-border-subtle" />
					<Line className="w-4/5 bg-border-subtle" />
					<span className="flex items-center gap-1.5 mt-1">
						<span className="text-[11px] font-bold leading-none text-brand-800">
							##
						</span>
						<Line className="w-1/3 h-2 bg-text-secondary" />
					</span>
					<Line className="w-full bg-border-subtle" />
					<Line className="w-2/3 bg-border-subtle" />
				</div>
			</div>
			<div className="flex flex-wrap items-center justify-center gap-1">
				{ [ 'GPTBot', 'ClaudeBot', 'PerplexityBot' ].map( ( agent ) => (
					<span
						key={ agent }
						className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-background-primary border border-solid border-border-subtle shadow-sm text-[10px] font-medium text-text-secondary"
					>
						<Bot className="size-3 text-brand-800" />
						{ agent }
					</span>
				) ) }
			</div>
		</div>
	</div>
);

export default GeoIllustration;
