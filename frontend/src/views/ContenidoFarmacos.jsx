import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { counterContext } from '../context/counterContext.js';
import Styles from './ContenidoFarmacos.module.css';

const ContenidoFarmacos = () => {
    // 1. Context extraction
    const { 
        listaFarmacos, 
        listaFarmacosOcultar, 
        setFarmacoSeleccionado,
        // Assuming these exist for navigation/details
        setDetalleFarmacoMostrar 
    } = useContext(counterContext);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';
    const drugsRoute = `${API_URL}/drugs/`;
    const [drugs, setDrugs] = useState([]);

    useEffect(() => {
        const fetchDrugs = async () => {
            try {
                const response = await axios.get(drugsRoute);
                if (response.data && response.data.success) {
                    setDrugs(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching drugs:', error);
            }
        };

        if (listaFarmacos) {
            fetchDrugs();
        }
    }, [drugsRoute, listaFarmacos]);

    return (
        listaFarmacos && (
            <section id={Styles.contenedor}>
                <span id={Styles.tituloVista}>Listado de Fármacos</span>
                
                <div id={Styles.lista}>
                    {drugs.map((drug) => (
                        <button 
                            key={drug.id || drug._id} 
                            className={Styles.pildora}
                            onClick={() => {
                                setFarmacoSeleccionado(drug);
                                // Transition logic: Hide list and show details
                                listaFarmacosOcultar();
                                if (setDetalleFarmacoMostrar) setDetalleFarmacoMostrar(true);
                            }}
                        >
                            {/* Handling name display with length limit */}
                            {drug.name.length > 30 ? `${drug.name.substring(0, 30)}...` : drug.name}
                        </button>
                    ))}
                </div>

                {drugs.length === 0 && (
                    <p className={Styles.mensajeVacio}>No se encontraron fármacos registrados.</p>
                )}
            </section>
        )
    );
};

export default ContenidoFarmacos;