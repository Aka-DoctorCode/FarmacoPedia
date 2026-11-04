import { useContext, useState, useEffect, useRef } from 'react';
import { counterContext } from '../context/counterContext.js';
import { drugService } from '../services/drugService.js';
import OfflineModal from './OfflineModal.jsx';
import styles from './Navbar.module.css';

const Navbar = () => {
    const {
        theme,
        toggleTheme,
        t,
        activeView,
        navigateToDrugs,
        navigateToFamilies,
        setSearchModalOpen,
        user,
        isLoggedIn,
        setAuthModalOpen,
        setProfileDrawerOpen,
        logout
    } = useContext(counterContext);

    const [offlineModalOpen, setOfflineModalOpen] = useState(false);
    const [hasOfflineData, setHasOfflineData] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        if (!userMenuOpen) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [userMenuOpen]);

    useEffect(() => {
        const checkOffline = async () => {
            const status = await drugService.getOfflineStatus();
            setHasOfflineData(status.isAvailable);
        };
        checkOffline();
    }, [offlineModalOpen]);

    return (
        <>
            <header className={styles.navHeader}>
                <div className={styles.navContainer}>
                    <button
                        type="button"
                        className={styles.brandGroup}
                        onClick={navigateToDrugs}
                        title={t.appName}
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

                    {/* Desktop Global Search Shortcut Pill */}
                    <button
                        type="button"
                        className={styles.desktopSearchTrigger}
                        onClick={() => setSearchModalOpen(true)}
                        title="Búsqueda rápida en FarmacoPedia"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                        <span className={styles.desktopSearchPlaceholder}>{t.searchPlaceholder || 'Buscar fármaco o código ATC...'}</span>
                        <kbd className={styles.kbdShortcut}>⌘K</kbd>
                    </button>

                    <nav className={styles.navigationNav}>
                        <button
                            type="button"
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
                            type="button"
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
                        {/* Botón Vademécum Offline */}
                        <button
                            type="button"
                            className={styles.iconButton}
                            onClick={() => setOfflineModalOpen(true)}
                            title={hasOfflineData ? "Vademécum Offline: Guardado localmente" : "Descargar Vademécum para uso sin conexión"}
                            aria-label="Vademécum Offline"
                            style={{ position: 'relative' }}
                        >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {hasOfflineData && (
                                <span
                                    style={{
                                        position: 'absolute',
                                        top: '6px',
                                        right: '6px',
                                        width: '7px',
                                        height: '7px',
                                        borderRadius: '50%',
                                        backgroundColor: '#10b981',
                                        boxShadow: '0 0 6px #10b981'
                                    }}
                                />
                            )}
                        </button>

                        {/* Mobile Search Button */}
                        <button
                            type="button"
                            className={styles.mobileSearchBtn}
                            onClick={() => setSearchModalOpen(true)}
                            title={t.navSearch}
                            aria-label={t.navSearch}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                            </svg>
                        </button>

                        {/* Botón de Autenticación / Perfil */}
                        {isLoggedIn ? (
                            <div className={styles.userMenuContainer} ref={menuRef}>
                                <button
                                    type="button"
                                    className={`${styles.userProfileBtn} ${userMenuOpen ? styles.userProfileBtnActive : ''}`}
                                    onClick={() => setUserMenuOpen((prev) => !prev)}
                                    aria-expanded={userMenuOpen}
                                    aria-haspopup="true"
                                    title={`Cuenta de ${user.firstName || user.name || 'Médico'}`}
                                >
                                    <span className={styles.userAvatarInitial}>{(user.firstName || user.name || 'M').charAt(0).toUpperCase()}</span>
                                    <span className={styles.userNamePill}>{user.firstName || (user.name ? user.name.split(' ')[0] : 'Médico')}</span>
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className={`${styles.chevronIcon} ${userMenuOpen ? styles.chevronOpen : ''}`}
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>

                                {userMenuOpen && (
                                    <div className={styles.profileDropdownMenu} role="menu">
                                        <button
                                            type="button"
                                            className={styles.dropdownMenuItem}
                                            onClick={() => {
                                                setUserMenuOpen(false);
                                                setProfileDrawerOpen(true);
                                            }}
                                            role="menuitem"
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                            <span>Perfil</span>
                                        </button>
                                        <div className={styles.dropdownMenuDivider} />
                                        <button
                                            type="button"
                                            className={`${styles.dropdownMenuItem} ${styles.dropdownMenuItemLogout}`}
                                            onClick={() => {
                                                setUserMenuOpen(false);
                                                logout();
                                            }}
                                            role="menuitem"
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                <polyline points="16 17 21 12 16 7" />
                                                <line x1="21" y1="12" x2="9" y2="12" />
                                            </svg>
                                            <span>Cerrar sesión</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                className={styles.loginNavBtn}
                                onClick={() => setAuthModalOpen(true)}
                                title="Iniciar sesión en FarmacoPedia"
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                    <polyline points="10 17 15 12 10 7" />
                                    <line x1="15" y1="12" x2="3" y2="12" />
                                </svg>
                                <span>Entrar</span>
                            </button>
                        )}

                        <button
                            type="button"
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

            <OfflineModal
                isOpen={offlineModalOpen}
                onClose={() => setOfflineModalOpen(false)}
            />
        </>
    );
};

export default Navbar;
