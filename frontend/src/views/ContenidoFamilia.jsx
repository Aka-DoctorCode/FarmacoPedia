import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { counterContext } from '../context/counterContext';
import Styles from './ContenidoFamilia.module.css';

// import { useState } from 'react';
const ContenidoFamilia = () => {
	const { listaFamilia } = useContext(counterContext);
	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';
    const familiesRoute = `${API_URL}/api/drugs/families`;
    const [families, setFamilies] = useState([]);

	useEffect(() => {
        const fetchFamilies = async () => {
            try {
                const response = await axios.get(familiesRoute);
                // The new API structure returns { success: true, data: [...] }
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
                    {families.map((family, index) => (
                        <button key={index} className={Styles.pildora}>
                            {family.length > 20 ? `${family.substring(0, 20)}...` : family}
                        </button>
                    ))}
                </div>
			</section>
		)
	);
};

export default ContenidoFamilia;
