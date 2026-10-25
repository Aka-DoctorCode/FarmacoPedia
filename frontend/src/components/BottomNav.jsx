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
        t
    } = useContext(counterContext);

    const isFamiliesActive = activeView === 'families' || (activeView === 'drugDetail' && Boolean(selectedFamily));
    const isDrugsActive = activeView === 'drugs' || (activeView === 'drugDetail' && !selectedFamily);
    const isSearchActive = searchModalOpen;

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
                className={`${styles.navItem} ${isDrugsActive && !isSearchActive ? styles.navItemActive : ''}`}
                onClick={handleDrugsClick}
                aria-current={isDrugsActive && !isSearchActive ? 'page' : undefined}
                title={t.navDrugs}
            >
                <div className={styles.iconWrapper}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M3 9h18" />
                        <path d="M9 21V9" />
                    </svg>
                </div>
                <span className={styles.label}>{t.navDrugs}</span>
            </button>

            <button
                type="button"
                className={`${styles.navItem} ${isFamiliesActive && !isSearchActive ? styles.navItemActive : ''}`}
                onClick={handleFamiliesClick}
                aria-current={isFamiliesActive && !isSearchActive ? 'page' : undefined}
                title={t.navFamilies}
            >
                <div className={styles.iconWrapper}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                </div>
                <span className={styles.label}>{t.navSearch}</span>
            </button>
        </nav>
    );
};

export default BottomNav;
