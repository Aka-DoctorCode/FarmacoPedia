import { Helmet } from 'react-helmet-async';
import styles from './LegalPages.module.css';

const AboutUs = () => {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'MedicalWebPage',
        name: 'Sobre Nosotros - ClickSalud FarmacoPedia',
        description: 'Conocimiento farmacológico estructurado y ágil para profesionales y estudiantes de la salud desarrollado por el Dr. Francisco Molina.',
        author: {
            '@type': 'Person',
            name: 'Dr. Francisco Molina',
            jobTitle: 'Médico y Desarrollador de Software',
            alumniOf: 'Universidad de Carabobo'
        },
        publisher: {
            '@type': 'Organization',
            name: 'ClickSalud FarmacoPedia',
            url: 'https://farmacopedia.clicksalud.org'
        }
    };

    return (
        <article className={styles.legalContainer}>
            <Helmet>
                <title>Sobre Nosotros | Dr. Francisco Molina | ClickSalud FarmacoPedia</title>
                <meta name="description" content="ClickSalud FarmacoPedia: Plataforma de consulta farmacológica rápida e intuitiva, concebida y desarrollada por el Dr. Francisco Molina, médico egresado de la Universidad de Carabobo." />
                <meta property="og:title" content="Sobre Nosotros | Dr. Francisco Molina | ClickSalud FarmacoPedia" />
                <meta property="og:description" content="Conocimiento farmacológico estructurado y ágil para profesionales y estudiantes de la salud." />
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            </Helmet>

            <header className={styles.header}>
                <span className={styles.badge}>Institucional</span>
                <h1 className={styles.title}>Sobre Nosotros</h1>
                <p className={styles.subtitle}>
                    Conocimiento farmacológico estructurado y ágil para profesionales y estudiantes de la salud.
                </p>
            </header>

            <section className={styles.section}>
                <h2>Nuestra Misión</h2>
                <p>
                    ClickSalud FarmacoPedia nace con el objetivo de proporcionar una plataforma de consulta farmacológica rápida e intuitiva. Buscamos facilitar el acceso a información terapéutica sintetizada para apoyar el estudio y la consulta clínica diaria.
                </p>
            </section>

            <section className={styles.section}>
                <h2>Fuentes Oficiales y Rigor Científico</h2>
                <p>
                    La información contenida en las fichas farmacológicas se recopila y contrasta con la evidencia oficial publicada por las principales agencias reguladoras de medicamentos:
                </p>
                <ul className={styles.list}>
                    <li><strong>AEMPS / CIMA:</strong> Centro de Información Online de Medicamentos de la Agencia Española de Medicamentos y Productos Sanitarios.</li>
                    <li><strong>OMS (WHO):</strong> Lista Modelo de Medicamentos Esenciales y guías clínicas de la Organización Mundial de la Salud.</li>
                    <li><strong>FDA:</strong> Administración de Alimentos y Medicamentos de los Estados Unidos (Food and Drug Administration).</li>
                    <li><strong>EMA:</strong> Agencia Europea de Medicamentos (European Medicines Agency).</li>
                </ul>
                <p>
                    Cada ficha sintetiza indicaciones principales, posologías de referencia en adultos y pediatría, ajustes en insuficiencia renal y hepática, farmacocinética, interacciones relevantes y contraindicaciones.
                </p>
            </section>

            <section className={styles.section}>
                <h2>Autoría, Criterio Clínico y Desarrollo</h2>
                <p>
                    ClickSalud FarmacoPedia es un proyecto concebido, diseñado, desarrollado y mantenido íntegramente por el <strong>Dr. Francisco Molina (Aka-DoctorCode)</strong>, médico egresado de la <strong>Universidad de Carabobo</strong> y desarrollador de software.
                </p>
                <p>
                    En este proyecto confluyen de manera directa su formación médica y su experiencia en desarrollo tecnológico. Tanto la arquitectura técnica y el código fuente como la selección de datos, criterios posológicos, seguridad farmacológica y revisión clínica son realizados por el autor, empleando herramientas de Inteligencia Artificial como apoyo técnico bajo su supervisión profesional directa.
                </p>
            </section>
        </article>
    );
};

export default AboutUs;

