import { useEffect } from 'react';
import { useTheme } from '@/components/theme-provider';

export const useFavicon = () => {
    const { theme } = useTheme();

    useEffect(() => {
        const favicon = document.getElementById('favicon') as HTMLLinkElement;
        if (!favicon) return;

        // Determine which favicon to use
        const getResolvedTheme = () => {
            if (theme === 'system') {
                // Check system preference
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            return theme;
        };

        const resolvedTheme = getResolvedTheme();
        const faviconPath = resolvedTheme === 'dark' ? '/darkfav.ico' : '/lightfav.ico';

        // Update the default favicon
        favicon.href = faviconPath;
    }, [theme]);
};
