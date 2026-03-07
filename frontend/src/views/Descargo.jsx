import { useContext, useEffect, useState, useRef } from 'react';
import { counterContext } from '../context/counterContext';
import Styles from './Descargo.module.css';

export const Descargo = () => {
    const { descargoVisible, descargoOcultar } = useContext(counterContext);
    const [isAccepted, setIsAccepted] = useState(false);
    const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
    const scrollRef = useRef(null);

    // --------------------------------------------------------------
    // Lógica de LocalStorage con Expiración (1 hora)
    // --------------------------------------------------------------
    useEffect(() => {
        const checkAcceptance = () => {
            const storedData = localStorage.getItem('farmacopedia_disclaimer_accepted');
            if (storedData) {
                const { timestamp } = JSON.parse(storedData);
                const oneHour = 60 * 60 * 1000;
                const now = new Date().getTime();

                // Si no ha pasado una hora, ocultamos el descargo automáticamente
                if (now - timestamp < oneHour) {
                    descargoOcultar();
                } else {
                    localStorage.removeItem('farmacopedia_disclaimer_accepted');
                }
            }
        };

        if (descargoVisible) {
            checkAcceptance();
        }
    }, [descargoVisible, descargoOcultar]);

    // --------------------------------------------------------------
    // Manejo de Scroll para asegurar lectura
    // --------------------------------------------------------------
    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            // Tolerancia de 5px para dispositivos móviles
            if (scrollTop + clientHeight >= scrollHeight - 5) {
                setHasScrolledToEnd(true);
            }
        }
    };

    const handleAccept = () => {
        const acceptanceData = {
            accepted: true,
            timestamp: new Date().getTime()
        };
        localStorage.setItem('farmacopedia_disclaimer_accepted', JSON.stringify(acceptanceData));
        descargoOcultar();
    };

    return (
        descargoVisible && (
            <section id={Styles.contenedor}>
                <main id={Styles.descargo}>
                    <header id={Styles.contenedorTitulo}>
                        <h1 id={Styles.titulo}>Terminos y Condiciones</h1>
                    </header>

                    <div 
                        id={Styles.principal} 
                        ref={scrollRef} 
                        onScroll={handleScroll}
                    >
                        <div className={Styles.alertaEmergencia}>
                            <strong>⚠️ ADVERTENCIA DE EMERGENCIA:</strong>
                            <p>
                                Esta aplicación NO es un sistema de respuesta ante emergencias. 
                                Ante una situación crítica, contacte de inmediato con los servicios 
                                de urgencia médicos de su localidad.
                            </p>
                        </div>

                        <div className={Styles.barra}></div>

                        <p>
                            <strong>1. Ámbito Profesional:</strong> FarmacoPedia es una herramienta 
                            exclusivamente informativa y educativa diseñada para profesionales de 
                            la salud. Su uso no establece ni sustituye una relación médico-paciente.
                        </p>

                        <p>
                            <strong>2. Evolución Científica:</strong> La farmacología es una ciencia 
                            en cambio constante. Aunque nos esforzamos por la precisión, no garantizamos 
                            que el contenido esté libre de errores tipográficos o sea el reflejo exacto 
                            de la última actualización de guías clínicas internacionales.
                        </p>

                        <p>
                            <strong>3. Responsabilidad Clínica:</strong> Es deber ineludible del facultativo 
                            verificar dosis, contraindicaciones e interacciones con el etiquetado oficial 
                            del fabricante (Prospecto/Ficha Técnica) antes de cualquier prescripción.
                        </p>

                        <p>
                            <strong>4. Limitación de Daños:</strong> El autor y colaboradores no se hacen 
                            responsables de daños directos, indirectos o incidentales derivados de 
                            interpretaciones erróneas de los datos aquí expuestos.
                        </p>

                        <div className={Styles.barra}></div>
                        
                        {!hasScrolledToEnd && (
                            <p className={Styles.hint}>
                                * Por favor, lea todo el contenido para continuar.
                            </p>
                        )}
                    </div>

                    <footer id={Styles.footerDescargo}>
                        <div className={Styles.toggleContainer}>
                            <label className={Styles.switch}>
                                <input 
                                    type="checkbox" 
                                    disabled={!hasScrolledToEnd}
                                    checked={isAccepted}
                                    onChange={(e) => setIsAccepted(e.target.checked)}
                                />
                                <span className={Styles.slider}></span>
                            </label>
                            <span className={Styles.toggleLabel}>
                                Confirmo que soy profesional de la salud y asumo la 
                                responsabilidad clínica del uso de esta información.
                            </span>
                        </div>

                        <button
                            onClick={handleAccept}
                            id={Styles.boton}
                            disabled={!isAccepted || !hasScrolledToEnd}
                            className={(!isAccepted || !hasScrolledToEnd) ? Styles.botonDisabled : ''}
                        >
                            Ingresar a la Plataforma
                        </button>
                    </footer>
                </main>
            </section>
        )
    );
};

export default Descargo;