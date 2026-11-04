import { useState, useEffect } from 'react';
import styles from './PwaInstallPrompt.module.css';

const PwaInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [showIosGuide, setShowIosGuide] = useState(false);

    useEffect(() => {
        // Verificar si la app ya está instalada y ejecutándose en modo standalone
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;

        if (isStandalone) {
            return;
        }

        // Verificar si el usuario lo descartó recientemente
        const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
        if (dismissed) {
            return;
        }

        // Detección de iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIos(isIosDevice);

        if (isIosDevice) {
            // Mostrar prompt de iOS tras unos segundos de navegación
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 3000);
            return () => clearTimeout(timer);
        }

        // Manejador del evento estándar en Android/Chrome
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isIos) {
            setShowIosGuide(true);
            return;
        }

        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        setShowIosGuide(false);
        sessionStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <>
            <div className={styles.bannerContainer}>
                <div className={styles.bannerContent}>
                    <div className={styles.iconWrapper}>
                        <img src="./MenuCapsulaOn.svg" alt="FarmacoPedia" className={styles.appIcon} />
                    </div>
                    <div className={styles.textGroup}>
                        <span className={styles.bannerTitle}>Instalar FarmacoPedia en tu teléfono</span>
                        <span className={styles.bannerSubtitle}>Accede al vademécum al instante desde tu pantalla de inicio</span>
                    </div>
                    <div className={styles.actionGroup}>
                        <button className={styles.installBtn} onClick={handleInstallClick} type="button">
                            Instalar
                        </button>
                        <button className={styles.closeBtn} onClick={handleDismiss} type="button" aria-label="Cerrar">
                            ✕
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de ayuda para iOS Safari */}
            {showIosGuide && (
                <div className={styles.iosModalOverlay} onClick={() => setShowIosGuide(false)}>
                    <div className={styles.iosModalCard} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.iosTitle}>Instalar en iPhone / iPad</h3>
                        <p className={styles.iosDesc}>Para instalar FarmacoPedia en la pantalla de inicio de tu dispositivo Apple:</p>
                        <ol className={styles.iosSteps}>
                            <li>
                                Toca el botón <strong>Compartir</strong> en la barra inferior de Safari{' '}
                                <span className={styles.iosIcon}>⎋</span> (cuadrado con flecha hacia arriba).
                            </li>
                            <li>
                                Desplázate hacia abajo y selecciona <strong>«Añadir a la pantalla de inicio»</strong>{' '}
                                <span className={styles.iosIcon}>➕</span>.
                            </li>
                            <li>Toca <strong>«Añadir»</strong> en la esquina superior derecha.</li>
                        </ol>
                        <button className={styles.iosCloseBtn} onClick={() => setShowIosGuide(false)} type="button">
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default PwaInstallPrompt;
