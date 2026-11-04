import { useContext } from 'react';
import { counterContext } from '../context/counterContext.js';
import styles from './LoginGate.module.css';

const LoginGate = ({ drugName }) => {
    const { setAuthModalOpen } = useContext(counterContext);

    return (
        <section className={styles.gateContainer} aria-label="Acceso restringido a posología">
            <div className={styles.gateCard}>
                <div className={styles.iconCircle}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>

                <div className={styles.badgePro}>Acceso Profesional Gratuito</div>

                <h2 className={styles.title}>
                    Inicia sesión para ver la posología y dosis de {drugName || 'este fármaco'}
                </h2>

                <p className={styles.description}>
                    Para proteger la información médica y evitar el uso indebido por agentes automatizados, la posología detallada, calculadora de dosis pediátricas y ajustes clínicos requieren inicio de sesión.
                </p>

                <div className={styles.perksList}>
                    <div className={styles.perkItem}>
                        <span className={styles.checkIcon}>✓</span>
                        <span>Dosificación en adultos, ancianos y pediatría</span>
                    </div>
                    <div className={styles.perkItem}>
                        <span className={styles.checkIcon}>✓</span>
                        <span>Ajustes exactos por aclaramiento de creatinina (ClCr)</span>
                    </div>
                    <div className={styles.perkItem}>
                        <span className={styles.checkIcon}>✓</span>
                        <span>Calculadora pediátrica por peso e indicaciones clínicas</span>
                    </div>
                </div>

                <button
                    type="button"
                    className={styles.loginBtn}
                    onClick={() => setAuthModalOpen(true)}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    <span>Iniciar Sesión para Desbloquear Contenido</span>
                </button>

                <span className={styles.footnote}>
                    Acceso 100% gratuito para profesionales y personal de la salud
                </span>
            </div>
        </section>
    );
};

export default LoginGate;
