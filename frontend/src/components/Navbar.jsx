import { useContext } from 'react';
import { counterContext } from '../context/counterContext.js';
import styles from './Navbar.module.css';

const Navbar = () => {
    const {
        theme,
        toggleTheme,
        language,
        toggleLanguage,
        t,
        activeView,
        navigateToDrugs,
        navigateToFamilies,
        setSearchModalOpen,
        isOffline
    } = useContext(counterContext);

    return (
        <header className={styles.navHeader}>
            <div className={styles.navContainer}>
                <button
                    className={styles.brandGroup}
                    onClick={navigateToDrugs}
                    title="FarmacoPedia"
                >
                    <div className={styles.brandIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                            <path d="m8.5 8.5 7 7" />
                        </svg>
                    </div>
                    <div className={styles.brandText}>
                        <span className={styles.brandTitle}>{t.appName}</span>
                        <span className={styles.brandSubtitle}>{t.appTagline}</span>
                    </div>
                </button>

                <nav className={styles.navigationNav}>
                    <button
                        className={`${styles.navButton} ${activeView === 'drugs' ? styles.navButtonActive : ''}`}
                        onClick={navigateToDrugs}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M3 9h18" />
                            <path d="M9 21V9" />
                        </svg>
                        {t.navDrugs}
                    </button>
                    <button
                        className={`${styles.navButton} ${activeView === 'families' ? styles.navButtonActive : ''}`}
                        onClick={() => navigateToFamilies(null)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                        </svg>
                        {t.navFamilies}
                    </button>
                </nav>

                <div className={styles.rightControls}>
                    {isOffline && (
                        <div className={styles.offlineBadge} title={t.backendOfflineNotice}>
                            <span>●</span> Offline Mode
                        </div>
                    )}

                    <button
                        className={styles.searchTrigger}
                        onClick={() => setSearchModalOpen(true)}
                        title={t.searchTooltip}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                        <span>{t.navSearch}</span>
                        <kbd className={styles.searchKbd}>/</kbd>
                    </button>

                    <button
                        className={styles.iconButton}
                        onClick={toggleLanguage}
                        title={`Cambiar a ${language === 'es' ? 'English' : 'Español'}`}
                    >
                        {language.toUpperCase()}
                    </button>

                    <button
                        className={styles.iconButton}
                        onClick={toggleTheme}
                        title={theme === 'dark' ? t.themeLight : t.themeDark}
                    >
                        {theme === 'dark' ? (
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
