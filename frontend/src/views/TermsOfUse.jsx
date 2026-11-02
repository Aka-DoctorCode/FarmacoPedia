import { Helmet } from 'react-helmet-async';
import styles from './LegalPages.module.css';

const TermsOfUse = () => {
    return (
        <article className={styles.legalContainer}>
            <Helmet>
                <title>Términos de Uso y Descargo Médico | ClickSalud FarmacoPedia</title>
                <meta name="description" content="Términos de uso, condiciones del servicio y descargo de responsabilidad médica integral de ClickSalud FarmacoPedia." />
                <meta property="og:title" content="Términos de Uso y Descargo Médico | ClickSalud FarmacoPedia" />
            </Helmet>

            <header className={styles.header}>
                <span className={styles.badge}>Condiciones y Legal</span>
                <h1 className={styles.title}>Términos de Uso y Descargo Médico</h1>
                <p className={styles.subtitle}>
                    Condiciones de acceso, uso y limitación de responsabilidad
                </p>
            </header>

            <section className={styles.section}>
                <h2>1. Aceptación de los Términos</h2>
                <p>
                    El acceso y navegación por ClickSalud FarmacoPedia implica la lectura y aceptación expresa de estos Términos de Uso. Si no está de acuerdo con alguno de ellos, debe suspender el uso de la aplicación.
                </p>
            </section>

            <section className={`${styles.section} ${styles.alertBox}`}>
                <h2>2. Descargo de Responsabilidad Médica</h2>
                <p className={styles.highlightText}>
                    EL CONTENIDO DE ESTE SITIO TIENE CARÁCTER EXCLUSIVAMENTE INFORMATIVO, EDUCATIVO Y ORIENTATIVO.
                </p>
                <ol className={styles.orderedList}>
                    <li>
                        <strong>No constituye prescripción ni criterio clínico:</strong> La información farmacológica aquí recopilada no debe utilizarse en ningún caso para auto-recetarse, automedicarse, ni para reemplazar la evaluación clínica, diagnóstico o prescripción de un profesional de la salud debidamente colegiado.
                    </li>
                    <li>
                        <strong>Emergencias Médicas:</strong> En situaciones de urgencia clínica, sobredosis o sospecha de intoxicación, contacte de inmediato a los servicios de emergencia de su localidad (ej. 911, 112) o trasládese a la unidad de urgencias hospitalaria más próxima.
                    </li>
                    <li>
                        <strong>Individualización Terapéutica:</strong> Toda dosificación, combinación de medicamentos o pauta clínica debe ser valorada de forma individual atendiendo a la función renal, hepática, edad, peso y cuadro patológico particular del paciente.
                    </li>
                </ol>
            </section>

            <section className={styles.section}>
                <h2>3. Exención de Responsabilidad</h2>
                <p>
                    Aunque todo el contenido ha sido recopilado y auditado minuciosamente con asistencia de herramientas de inteligencia artificial y cotejado con fuentes institucionales oficiales, la medicina y la farmacología son ciencias en constante actualización.
                </p>
                <p>
                    El autor no asume responsabilidad alguna por errores, omisiones, interpretaciones o consecuencias derivadas del uso práctico que el usuario haga de la información aquí expuesta.
                </p>
            </section>

            <section className={styles.section}>
                <h2>4. Propiedad y Licencia</h2>
                <p>
                    El código fuente, arquitectura y diseño de la interfaz son propiedad del <strong>Dr. Francisco Molina (Aka-DoctorCode)</strong>. Los datos farmacológicos técnicos proceden de organismos oficiales de acceso público debidamente acreditados.
                </p>
            </section>
        </article>
    );
};

export default TermsOfUse;

