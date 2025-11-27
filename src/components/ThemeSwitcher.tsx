'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';

export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const toggleTheme = () => {
		setTheme(theme === 'dark' ? 'light' : 'dark');
	};

	if (!mounted) {
		return (
			<Button className="h-8 w-8" size="icon" variant="outline">
				<Sun className="h-4 w-4" />
				<span className="sr-only">Toggle theme</span>
			</Button>
		);
	}

	const isDark = theme === 'dark';

	return (
		<Button
			className="h-8 w-8"
			onClick={toggleTheme}
			size="icon"
			variant="outline"
		>
			{isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
