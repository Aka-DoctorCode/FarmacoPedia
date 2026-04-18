import { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { counterContext } from '../context/counterContext.js';
import Styles from './FarmacosEnFamilia.module.css';

const FarmacosEnFamilia = () => {
    // 1. Añadimos las funciones necesarias del contexto
    const { 
        listaFamilia, 
        familiaSeleccionada, 
        setFarmacoSeleccionado, // Para guardar el fármaco elegido
        listaFarmacosMostrar,   // Para mostrar la vista de detalles
        listaFamiliaOcultar     // Para ocultar la lista actual
    } = useContext(counterContext);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';
    const [drugs, setDrugs] = useState([]);

    useEffect(() => {
        const fetchDrugs = async () => {
            if (!familiaSeleccionada) return;

            try {
                // Petición al backend usando la categoría seleccionada
                const response = await axios.get(`${API_URL}/drugs/categories/${familiaSeleccionada}`);
                
                if (response.data && response.data.success) {
                    setDrugs(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching drugs by category:', error);
            }
        };

        fetchDrugs();
    }, [familiaSeleccionada, API_URL]);

    return (
        listaFamilia && (
            <section id={Styles.contenedor}>
                <Helmet>
                    <title>Fármacos en: {familiaSeleccionada} | FarmacoPedia</title>
                    <meta name="description" content={`Fármacos en la categoría ${familiaSeleccionada}`} />
                </Helmet>
                <span id={Styles.tituloVista}>Fármacos en: {familiaSeleccionada}</span>
                <div id={Styles.lista}>
                    {drugs.map((drug, index) => (
                        <button 
                            key={index} 
                            className={Styles.pildora}
                            onClick={() => {
                                // 2. Lógica de navegación al hacer clic
                                setFarmacoSeleccionado(drug.name); // Guardamos el nombre
                                listaFamiliaOcultar();            // Cerramos esta lista
                                listaFarmacosMostrar();           // Abrimos el detalle (ContenidoFarmacos)
                            }}
                        >
                            {drug.name}
                        </button>
                    ))}
                </div>
            </section>
        )
    );
};

export default FarmacosEnFamilia;