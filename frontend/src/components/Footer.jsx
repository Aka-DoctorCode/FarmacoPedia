import { useContext } from 'react';
import { counterContext } from '../context/counterContext.js';
import styles from './Footer.module.css';

const Footer = () => {
    const { t } = useContext(counterContext);

    return (
        <footer className={styles.footerContainer}>
            <div className={styles.footerContent}>
                <span className={styles.brandName}>{t.appName}</span>
                <p className={styles.noticeText}>{t.footerNotice}</p>

                <div className={styles.linksRow}>
                    <a
                        className={styles.socialLink}
                        href="https://github.com/Aka-DoctorCode"
                        target="_blank"
                        rel="noreferrer noopener"
                        title="GitHub"
                        aria-label="GitHub"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                            <path d="M9 18c-4.51 2-5-2-7-2" />
                        </svg>
                    </a>
                    <a
                        className={styles.socialLink}
                        href="mailto:franciscomolina92@gmail.com"
                        title="Email"
                        aria-label="Email"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                    </a>
                    <a
                        className={styles.socialLink}
                        href="https://wa.me/+584122211266"
                        target="_blank"
                        rel="noreferrer noopener"
                        title="WhatsApp"
                        aria-label="WhatsApp"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                    </a>
                </div>

                <div className={styles.copyrightRow}>
                    <span>© {new Date().getFullYear()} FarmacoPedia.</span>
                    <span className={styles.authorHighlight}>Dr. Francisco Molina (Aka-DoctorCode).</span>
                    <span>{t.footerAllRights}</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
