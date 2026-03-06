import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { counterContext } from '../context/counterContext.js';
import Styles from './ContenidoFarmacos.module.css';

const ContenidoFarmacos = () => {
    // 1. Added farmacoSeleccionado here
    const { listaFarmacos, farmacoSeleccionado } = useContext(counterContext);
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';
    const [drugData, setDrugData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDrugDetails = async () => {
            // Check if farmacoSeleccionado exists before fetching
            if (!farmacoSeleccionado) return;

            setLoading(true);
            try {
                // 2. Fixed API_URL casing and template literal
                const drugRoute = `${API_URL}/drugs/${farmacoSeleccionado}`;
                const response = await axios.get(drugRoute);
                
                if (response.data && response.data.success) {
                    setDrugData(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching drug details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDrugDetails();
    }, [farmacoSeleccionado, API_URL]); // 3. Updated dependency casing

    // Optional: Add a loading state or a "Select a drug" message
    if (loading) return <p>Loading...</p>;
    if (!farmacoSeleccionado) return <p>Please select a drug to see details.</p>;

    return (
        listaFarmacos && drugData && (
            <section id={Styles.contenedor}>
                <header className={Styles.header}>
                    <h2 className={Styles.tituloDrug}>{drugData.name?.toUpperCase()}</h2>
                    <p className={Styles.mechanism}><strong>Mecanismo de Acción:</strong> {drugData.actionMechanism}</p>
                </header>

                <div className={Styles.infoGrid}>
                    <article className={Styles.card}>
                        <h3>Dosificación Adultos</h3>
                        {drugData.dosageGuidance?.adult && Object.entries(drugData.dosageGuidance.adult).map(([via, info]) => (
                            <div key={via} className={Styles.viaRow}>
                                <strong>Vía {via}:</strong>
                                <ul>
                                    <li>Pautas: {info.guidelines?.join(', ')}</li>
                                    <li>Máx: {info.maxDose?.join(', ')}</li>
                                </ul>
                            </div>
                        ))}
                    </article>

                    <article className={Styles.card}>
                        <h3>Riesgos y Seguridad</h3>
                        <p><strong>Embarazo:</strong> {drugData.risk?.pregnancy}</p>
                        <p><strong>Lactancia:</strong> {drugData.risk?.lactation}</p>
                        <p><strong>Ajuste Renal:</strong> {drugData.risk?.renal?.level} - {drugData.risk?.renal?.adjustment}</p>
                    </article>
                </div>
            </section>
        )
    );
};

export default ContenidoFarmacos;