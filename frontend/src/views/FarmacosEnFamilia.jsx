import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { counterContext } from '../context/counterContext';
import Styles from './FarmacosEnFamilia.module.css';

// import { useState } from 'react';
const FarmacosEnFamilia = () => {
	const { listaFamilia } = useContext(counterContext);
	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';
	const categoryRoute = `${API_URL}/drugs/categories/${familiaSeleccionada}`;
	const [drugs, setDrugs] = useState([]);
    useEffect(() => {
        const fetchDrugs = async () => {
            if (!familiaSeleccionada) return;

            try {
                const categoryRoute = `${apiUrl}/drugs/categories/${familiaSeleccionada}`;
                const response = await axios.get(categoryRoute);
                
                if (response.data && response.data.success) {
                    setDrugs(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching drugs by category:', error);
            }
        };

        fetchDrugs();
    }, [familiaSeleccionada, apiUrl]);
	return (
		listaFamilia && (
			<section id={Styles.contenedor}>
				<span id={Styles.tituloVista}>Lista de Farmacos por Familia</span>
				<div id={Styles.lista}>
                    {drugs.map((drug, index) => (
                        <button key={index} className={Styles.pildora}>
                            {drug.name}
                        </button>
                    ))}
                </div>
			</section>
		)
	);
};

export default FarmacosEnFamilia;
