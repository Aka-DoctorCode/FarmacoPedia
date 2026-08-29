import { useContext, useState } from 'react';
import { counterContext } from '../context/counterContext.js';
import styles from './Descargo.module.css';

export const Descargo = () => {
    const { descargoVisible, acceptDisclaimer, t } = useContext(counterContext);
    const [isAccepted, setIsAccepted] = useState(false);

    if (!descargoVisible) return null;

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true">
            <div className={styles.modal}>
                <h2 className={styles.title}>{t.disclaimerTitle}</h2>

                <div className={styles.emergencyBanner}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <div>
                        <strong>{t.disclaimerEmergency}</strong>
                        <p>{t.disclaimerEmergencyText}</p>
                    </div>
                </div>

                <div className={styles.termsContainer}>
                    <div>
                        <div className={styles.termSectionTitle}>{t.disclaimerProfessionalTitle}</div>
                        <p>{t.disclaimerProfessionalText}</p>
                    </div>
                    <div>
                        <div className={styles.termSectionTitle}>{t.disclaimerEvolutionTitle}</div>
                        <p>{t.disclaimerEvolutionText}</p>
                    </div>
                </div>

                <label className={styles.agreementRow}>
                    <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={isAccepted}
                        onChange={(e) => setIsAccepted(e.target.checked)}
                    />
                    <span className={styles.agreementText}>
                        {t.disclaimerConfirmCheckbox}
                    </span>
                </label>

                <button
                    className={styles.acceptButton}
                    disabled={!isAccepted}
                    onClick={acceptDisclaimer}
                >
                    {t.disclaimerAcceptButton}
                </button>
            </div>
        </div>
    );
};

export default Descargo;