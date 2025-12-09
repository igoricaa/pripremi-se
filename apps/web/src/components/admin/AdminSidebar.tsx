import { getAdminRoutes } from '@pripremi-se/shared';
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
	type LucideIcon,
	Users,
} from 'lucide-react';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';

interface AdminSidebarProps {
	isAdmin: boolean;
}

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
	LayoutDashboard,
	BookOpen,
	FolderTree,
	Layers,
	FileText,
	ListChecks,
	HelpCircle,
	Users,
	Home,
};

export function AdminSidebar({ isAdmin }: AdminSidebarProps) {
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;
	const navItems = getAdminRoutes(isAdmin);

	return (
		<Sidebar>
			<SidebarHeader className="border-b">
				<Link className="flex items-center gap-2 px-2 py-3" to="/admin">
					<Home className="h-6 w-6" />
					<span className="font-semibold text-lg">Admin CMS</span>
				</Link>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => {
								const Icon = iconMap[item.icon];
								const isActive =
									currentPath === item.href ||
									(item.href !== '/admin' && currentPath.startsWith(item.href));

								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton asChild isActive={isActive}>
											<Link to={item.href}>
												{Icon && <Icon className="h-4 w-4" />}
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="border-t">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<Link to="/">
								<Home className="h-4 w-4" />
								<span>Back to Site</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
