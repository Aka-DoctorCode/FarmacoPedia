import { useEffect, useRef } from 'react';
import styles from './AdBanner.module.css';

/**
 * AdBanner Component
 * Renders an official Google AdSense unit under the navbar.
 * In development or when ads are unavailable, displays a discreet, styled placeholder.
 */
const AdBanner = ({ slot = "1234567890", format = "horizontal" }) => {
    const adRef = useRef(null);
    const isPushed = useRef(false);

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.adsbygoogle && !isPushed.current) {
                window.adsbygoogle.push({});
                isPushed.current = true;
            }
        } catch {
            // Silently ignore if blocked by adblock or script not loaded
        }
    }, []);

    return (
        <aside className={styles.adWrapper} aria-label="Espacio Publicitario">
            <div className={styles.adContainer}>
                <span className={styles.adBadge}>PUBLICIDAD</span>
                <div className={styles.adContent}>
                    <ins
                        ref={adRef}
                        className="adsbygoogle"
                        style={{ display: 'block' }}
                        data-ad-client="ca-pub-5200148569892616"
                        data-ad-slot={slot}
                        data-ad-format={format}
                        data-full-width-responsive="true"
                    />
                    {/* Fallback visible in dev or when AdSense doesn't render an iframe */}
                    <div className={styles.adPlaceholder}>
                        <span className={styles.placeholderBrand}>ClickSalud FarmacoPedia</span>
                        <span className={styles.placeholderText}>Espacio publicitario disponible para patrocinadores médicos e institucionales</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default AdBanner;

