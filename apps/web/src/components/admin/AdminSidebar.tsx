import { Link, useRouterState } from '@tanstack/react-router';
import {
	BookOpen,
	FileText,
	FolderTree,
	HelpCircle,
	Home,
	Layers,
	LayoutDashboard,
	ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
	title: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
	{
		title: 'Dashboard',
		href: '/admin',
		icon: LayoutDashboard,
	},
	{
		title: 'Subjects',
		href: '/admin/subjects',
		icon: BookOpen,
	},
	{
		title: 'Chapters',
		href: '/admin/chapters',
		icon: FolderTree,
	},
	{
		title: 'Sections',
		href: '/admin/sections',
		icon: Layers,
	},
	{
		title: 'Lessons',
		href: '/admin/lessons',
		icon: FileText,
	},
	{
		title: 'Tests',
		href: '/admin/tests',
		icon: ListChecks,
	},
	{
		title: 'Questions',
		href: '/admin/questions',
		icon: HelpCircle,
	},
];

export function AdminSidebar() {
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;

	return (
		<aside className="flex h-full w-64 flex-col border-r bg-card">
			{/* Header */}
			<div className="flex h-16 items-center border-b px-6">
				<Link className="flex items-center gap-2" to="/admin">
					<Home className="h-6 w-6" />
					<span className="font-semibold text-lg">Admin CMS</span>
				</Link>
			</div>

			{/* Navigation */}
			<nav className="flex-1 space-y-1 p-4">
				{navItems.map((item) => {
					const isActive =
						currentPath === item.href ||
						(item.href !== '/admin' && currentPath.startsWith(item.href));

					return (
						<Link
							key={item.href}
							to={item.href}
							className={cn(
								'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
								isActive
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
							)}
						>
							<item.icon className="h-4 w-4" />
							{item.title}
						</Link>
					);
				})}
			</nav>

			{/* Footer */}
			<div className="border-t p-4">
				<Link
					to="/"
					className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
				>
					<Home className="h-4 w-4" />
					Back to Site
				</Link>
			</div>
		</aside>
	);
}
