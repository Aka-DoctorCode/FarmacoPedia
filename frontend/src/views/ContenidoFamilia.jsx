import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { counterContext } from '../context/counterContext';
import Styles from './ContenidoFamilia.module.css';

// import { useState } from 'react';
const ContenidoFamilia = () => {
	const { listaFamilia } = useContext(counterContext);
	const x = [];
	for (let i = 1; i <= 99; i++) {
		x.push('n' + i);
	}
	const rutaBD = 'http://localhost:8001/farmacos/familias';
	const [data, setData] = useState({ familias: [] });

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await axios.get(rutaBD); // Realiza una solicitud GET a la ruta del backend
				setData(response.data); // Almacena los datos en el estado local
			} catch (error) {
				console.error('Error al obtener datos del backend:', error);
			}
		};

		fetchData(); // Llama a la función para obtener los datos cuando el componente se monta
	}, []);
	return (
		listaFamilia && (
			<section id={Styles.contenedor}>
				<span id={Styles.tituloVista}>Lista de Farmacos por Familia</span>
				<div id={Styles.lista}>
					{data.familias.map((familia, index) => (
						<button key={index} className={Styles.pildora}>
							{/* {familia.length > 20 ? `${familia.substring(0, 20)}...` : familia} */}
							{familia}
						</button>
					))}
				</div>
			</section>
		)
	);
};

export default ContenidoFamilia;
