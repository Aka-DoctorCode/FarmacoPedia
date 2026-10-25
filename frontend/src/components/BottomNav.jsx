import { useContext } from 'react';
import { counterContext } from '../context/counterContext.js';
import styles from './BottomNav.module.css';

const BottomNav = () => {
    const {
        activeView,
        navigateToDrugs,
        navigateToFamilies,
        selectedFamily,
        searchModalOpen,
        setSearchModalOpen,
        language,
        toggleLanguage,
        theme,
        toggleTheme,
        t
    } = useContext(counterContext);

    const isFamiliesActive = activeView === 'families' || (activeView === 'drugDetail' && Boolean(selectedFamily));
    const isDrugsActive = activeView === 'drugs' || (activeView === 'drugDetail' && !selectedFamily);
    const isSearchActive = searchModalOpen;

    const themeLabel = t.navTheme || (language === 'es' ? 'Tema' : 'Theme');

    const handleDrugsClick = () => {
        if (activeView === 'drugs') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            navigateToDrugs();
        }
    };

    const handleFamiliesClick = () => {
        if (activeView === 'families' && !selectedFamily) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            navigateToFamilies(null);
        }
    };

    return (
        <nav className={styles.bottomNav} aria-label="Navegación principal móvil">
            <button
                type="button"
                className={`${styles.navItem} ${isDrugsActive ? styles.navItemActive : ''}`}
                onClick={handleDrugsClick}
                aria-current={isDrugsActive ? 'page' : undefined}
                title={t.navDrugs}
            >
                <div className={styles.iconWrapper}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M3 9h18" />
                        <path d="M9 21V9" />
                    </svg>
                </div>
                <span className={styles.label}>{t.navDrugs}</span>
            </button>

            <button
                type="button"
                className={`${styles.navItem} ${isFamiliesActive ? styles.navItemActive : ''}`}
                onClick={handleFamiliesClick}
                aria-current={isFamiliesActive ? 'page' : undefined}
                title={t.navFamilies}
            >
                <div className={styles.iconWrapper}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                    </svg>
                </div>
                <span className={styles.label}>{t.navFamilies}</span>
            </button>

            <button
                type="button"
                className={`${styles.navItem} ${isSearchActive ? styles.navItemActive : ''}`}
                onClick={() => setSearchModalOpen((prev) => !prev)}
                aria-haspopup="dialog"
                aria-expanded={isSearchActive}
                title={t.navSearch}
            >
                <div className={styles.iconWrapper}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                </div>
                <span className={styles.label}>{t.navSearch}</span>
            </button>

            <button
                type="button"
                className={styles.navItem}
                onClick={toggleLanguage}
                title={language === 'es' ? 'Cambiar a English' : 'Switch to Spanish'}
                aria-label={language === 'es' ? 'Cambiar idioma a inglés' : 'Switch language to Spanish'}
            >
                <div className={styles.iconWrapper}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                        <path d="M2 12h20" />
                    </svg>
                </div>
                <span className={styles.label}>{language.toUpperCase()}</span>
            </button>

            <button
                type="button"
                className={styles.navItem}
                onClick={toggleTheme}
                title={theme === 'dark' ? t.themeLight : t.themeDark}
                aria-label={theme === 'dark' ? t.themeLight : t.themeDark}
            >
                <div className={styles.iconWrapper}>
                    {theme === 'dark' ? (
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2v2" />
                            <path d="M12 20v2" />
                            <path d="m4.93 4.93 1.41 1.41" />
                            <path d="m17.66 17.66 1.41 1.41" />
                            <path d="M2 12h2" />
                            <path d="M20 12h2" />
                            <path d="m6.34 17.66-1.41 1.41" />
                            <path d="m19.07 4.93-1.41 1.41" />
                        </svg>
                    ) : (
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                        </svg>
                    )}
                </div>
                <span className={styles.label}>{themeLabel}</span>
            </button>
        </nav>
    );
};

export default BottomNav;
