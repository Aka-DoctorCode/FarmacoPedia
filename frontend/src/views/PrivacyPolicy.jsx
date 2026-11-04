import { Helmet } from 'react-helmet-async';
import styles from './LegalPages.module.css';

const PrivacyPolicy = () => {
    return (
        <article className={styles.legalContainer}>
            <Helmet>
                <title>Política de Privacidad y Cookies | ClickSalud FarmacoPedia</title>
                <meta name="description" content="Política de privacidad, uso de almacenamiento local (localStorage) y cookies de Google AdSense en ClickSalud FarmacoPedia." />
                <meta property="og:title" content="Política de Privacidad y Cookies | ClickSalud FarmacoPedia" />
            </Helmet>

            <header className={styles.header}>
                <span className={styles.badge}>Legal y Privacidad</span>
                <h1 className={styles.title}>Política de Privacidad y Cookies</h1>
                <p className={styles.subtitle}>
                    Última actualización: Noviembre 2026
                </p>
            </header>

            <section className={styles.section}>
                <h2>1. Responsable del Sitio</h2>
                <p>
                    El responsable de este portal es el <strong>Dr. Francisco Molina (ClickSalud / Aka-DoctorCode)</strong>, con correo de contacto directo para consultas técnicas y de privacidad: <a href="mailto:contacto@clicksalud.com" className={styles.inlineLink}>contacto@clicksalud.com</a>.
                </p>
            </section>

            <section className={styles.section}>
                <h2>2. Almacenamiento Local (Local Storage)</h2>
                <p>
                    ClickSalud FarmacoPedia <strong>no recopila, no comercializa ni almacena información personal sensible ni registros de salud del usuario</strong>. El sitio web utiliza el almacenamiento local de su navegador (<code>localStorage</code>) exclusivamente para:
                </p>
                <ul className={styles.list}>
                    <li>Recordar su preferencia de interfaz visual (tema oscuro o modo claro).</li>
                    <li>Recordar la aceptación del descargo de responsabilidad médica y el consentimiento de cookies para evitar desplegar el diálogo inicial de forma reiterada.</li>
                </ul>
                <p>
                    Estos datos se almacenan única y exclusivamente en su dispositivo local y nunca se transfieren a servidores externos o bases de datos de seguimiento.
                </p>
            </section>

            <section className={styles.section}>
                <h2>3. Publicidad y Cookies de Terceros (Google AdSense)</h2>
                <p>
                    Este sitio web muestra publicidad servida por redes de terceros como <strong>Google AdSense</strong> para financiar los costos operativos y de mantenimiento de la infraestructura técnica.
                </p>
                <p>
                    Proveedores terceros, incluido Google, utilizan cookies (como la cookie de DoubleClick) para publicar anuncios basados en las visitas anteriores del usuario a este o a otros sitios web en Internet.
                </p>
                <p>
                    El uso de cookies publicitarias permite a Google y a sus socios mostrar anuncios basados en las páginas que usted visita. Los usuarios pueden inhabilitar la publicidad personalizada en cualquier momento visitando la <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer noopener" className={styles.inlineLink}>Configuración de anuncios de Google</a> o a través de <a href="https://www.aboutads.info" target="_blank" rel="noreferrer noopener" className={styles.inlineLink}>aboutads.info</a>.
                </p>
            </section>

            <section className={styles.section}>
                <h2>4. Modificaciones y Contacto</h2>
                <p>
                    Nos reservamos el derecho de actualizar esta política para reflejar novedades legales o adaptaciones técnicas. Ante cualquier duda relativa al tratamiento de la privacidad, puede comunicarse vía correo electrónico a <a href="mailto:contacto@clicksalud.com" className={styles.inlineLink}>contacto@clicksalud.com</a>.
                </p>
            </section>
        </article>
    );
};

export default PrivacyPolicy;

