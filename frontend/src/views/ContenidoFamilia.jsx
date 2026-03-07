import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { counterContext } from '../context/counterContext.js';
import Styles from './ContenidoFamilia.module.css';

const ContenidoFamilia = () => {
    // 1. Extraemos todo lo necesario del contexto
    const { 
        listaFamilia, 
        listaFamiliaOcultar, 
        listaFarmacosMostrar, 
        setFamiliaSeleccionada 
    } = useContext(counterContext);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';
    const familiesRoute = `${API_URL}/drugs/families`;
    const [families, setFamilies] = useState([]);

    useEffect(() => {
        const fetchFamilies = async () => {
            try {
                const response = await axios.get(familiesRoute);
                if (response.data && response.data.success) {
                    setFamilies(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching drug families:', error);
            }
        };
        fetchFamilies();
    }, [familiesRoute]);

    return (
        listaFamilia && (
            <section id={Styles.contenedor}>
                <span id={Styles.tituloVista}>Selecciona una Familia</span>
                <div id={Styles.lista}>
                    {/* Filter to ensure we only map through valid strings */}
                    {families
                        .filter((family) => family !== null && family !== undefined)
                        .map((family, index) => {
                            // Since backend returns an array of strings, family is the text itself
                            const displayName = String(family);

                            return (
                                <button 
                                    key={index} 
                                    className={Styles.pildora}
                                    onClick={() => {
                                        setFamiliaSeleccionada(family);
                                        listaFamiliaOcultar();
                                        listaFarmacosMostrar();
                                    }}
                                >
                                    {displayName.length > 25 
                                        ? `${displayName.substring(0, 25)}...` 
                                        : displayName}
                                </button>
                            );
                        })}
                </div>
            </section>
        )
    );
};

export default ContenidoFamilia;