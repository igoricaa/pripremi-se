import { ScriptOnce } from '@tanstack/react-router';
import { createContext, use, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'ui-theme';

// SSR-safe localStorage access
function getStoredTheme(): Theme {
	if (typeof window === 'undefined') {
		return 'light';
	}
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored === 'dark' ? 'dark' : 'light';
	} catch {
		return 'light';
	}
}

function setStoredTheme(theme: Theme): void {
	if (typeof window === 'undefined') {
		return;
	}
	try {
		localStorage.setItem(STORAGE_KEY, theme);
	} catch {
		// Silently fail if localStorage is unavailable
	}
}

function applyTheme(theme: Theme) {
	const root = document.documentElement;
	root.classList.remove('light', 'dark');
	root.classList.add(theme);
}

// Inline script runs before React hydration - prevents FOUC
const themeScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');document.documentElement.classList.add(t==='dark'?'dark':'light')}catch(e){document.documentElement.classList.add('light')}})()`;

type ThemeContextProps = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>('light');

	// Read from localStorage on mount
	useEffect(() => {
		setThemeState(getStoredTheme());
	}, []);

	// Apply theme to DOM when it changes
	useEffect(() => {
		applyTheme(theme);
	}, [theme]);

	const setTheme = (newTheme: Theme) => {
		setStoredTheme(newTheme);
		setThemeState(newTheme);
	};

	return (
		<ThemeContext value={{ theme, setTheme }}>
			<ScriptOnce>{themeScript}</ScriptOnce>
			{children}
		</ThemeContext>
	);
}

export function useTheme() {
	const context = use(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}
