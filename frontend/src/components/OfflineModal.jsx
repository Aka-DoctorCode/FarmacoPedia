import { useState, useEffect } from 'react';
import { drugService } from '../services/drugService.js';
import styles from './OfflineModal.module.css';

const OfflineModal = ({ isOpen, onClose }) => {
    const [offlineStatus, setOfflineStatus] = useState({ isAvailable: false, totalDrugs: 0, lastUpdated: null });
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState({ percent: 0, message: '' });
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

    useEffect(() => {
        const updateOnlineStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    useEffect(() => {
        if (isOpen) {
            checkStatus();
        }
    }, [isOpen]);

    const checkStatus = async () => {
        const status = await drugService.getOfflineStatus();
        setOfflineStatus(status);
    };

    const handleDownload = async () => {
        if (!isOnline) {
            alert('Necesitas conexión a internet para descargar la base de datos por primera vez.');
            return;
        }

        setIsDownloading(true);
        setProgress({ percent: 5, message: 'Conectando con el catálogo de fármacos...' });

        const result = await drugService.downloadFullOfflineDatabase((p) => {
            setProgress({ percent: p.percent, message: p.message });
        });

        if (result.success) {
            await checkStatus();
        }

        setIsDownloading(false);
    };

    const handleClear = async () => {
        if (window.confirm('¿Deseas eliminar la base de datos descargada y liberar espacio local?')) {
            await drugService.clearOfflineData();
            await checkStatus();
            setProgress({ percent: 0, message: '' });
        }
    };

    if (!isOpen) return null;

    const formattedDate = offlineStatus.lastUpdated
        ? new Date(offlineStatus.lastUpdated).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
          })
        : null;

    return (
        <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                <header className={styles.modalHeader}>
                    <div className={styles.titleGroup}>
                        <div className={styles.iconCircle}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </div>
                        <div>
                            <h2 className={styles.modalTitle}>Vademécum Offline</h2>
                            <p className={styles.modalSubtitle}>Consulta farmacológica sin conexión</p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar modal">
                        ✕
                    </button>
                </header>

                <div className={styles.statusBanner}>
                    <div className={styles.statusIndicator}>
                        <span className={`${styles.statusDot} ${isOnline ? styles.dotOnline : styles.dotOffline}`} />
                        <span className={styles.statusText}>
                            {isOnline ? 'Conexión a internet activa' : 'Sin conexión (Modo Offline activo)'}
                        </span>
                    </div>
                    <div className={styles.storageBadge}>
                        {offlineStatus.isAvailable ? (
                            <span className={styles.badgeSuccess}>✓ Base de datos local disponible</span>
                        ) : (
                            <span className={styles.badgeWarning}>⚠ No descargada localmente</span>
                        )}
                    </div>
                </div>

                <div className={styles.modalBody}>
                    <p className={styles.description}>
                        Guarda el catálogo médico completo en tu dispositivo (teléfono o computadora). Ideal para hospitales, guardias médicas o zonas sin cobertura donde necesitas consultar dosis y contraindicaciones al instante.
                    </p>

                    {offlineStatus.isAvailable && (
                        <div className={styles.databaseStats}>
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>Fármacos descargados:</span>
                                <span className={styles.statValue}><strong>{offlineStatus.totalDrugs}</strong> medicamentos</span>
                            </div>
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>Última actualización:</span>
                                <span className={styles.statValue}>{formattedDate || 'Reciente'}</span>
                            </div>
                        </div>
                    )}

                    {isDownloading && (
                        <div className={styles.progressContainer}>
                            <div className={styles.progressBarWrapper}>
                                <div className={styles.progressBarFill} style={{ width: `${progress.percent}%` }} />
                            </div>
                            <div className={styles.progressMeta}>
                                <span className={styles.progressMessage}>{progress.message}</span>
                                <span className={styles.progressPercent}>{progress.percent}%</span>
                            </div>
                        </div>
                    )}
                </div>

                <footer className={styles.modalFooter}>
                    {offlineStatus.isAvailable && !isDownloading && (
                        <button className={styles.clearBtn} onClick={handleClear} type="button">
                            Liberar espacio
                        </button>
                    )}
                    <button
                        className={styles.downloadBtn}
                        onClick={handleDownload}
                        disabled={isDownloading || (!isOnline && !offlineStatus.isAvailable)}
                        type="button"
                    >
                        {isDownloading
                            ? 'Descargando vademécum...'
                            : offlineStatus.isAvailable
                            ? 'Actualizar Base de Datos'
                            : 'Descargar para Uso Offline'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default OfflineModal;
