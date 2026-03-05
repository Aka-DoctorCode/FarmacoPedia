import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { counterContext } from '../context/counterContext';
import Styles from './ContenidoFarmacos.module.css';
const ContenidoFarmacos = () => {
	const { listaFarmacos } = useContext(counterContext);
	const rutaBD = `${import.meta.env.DB_URI}/farmacos`;
	const [datos, setDatos] = useState([]);
	useEffect(() => {
		async function traerDatos() {
			try {
				const response = await axios.get(rutaBD);
				setDatos(response.data.nombres);
			} catch (error) {
				console.error('Error al obtener los datos:', error);
			}
		}
		traerDatos();
	}, []);
	return (
		listaFarmacos && (
			<section id={Styles.contenedor}>
				<span id={Styles.tituloVista}>Selecciona un Farmaco</span>
				<div id={Styles.lista}>
					{datos.map((nombre, index) => {
						return (
							<button key={index} className={Styles.pildora}>
								{nombre.length > 20 ? `${nombre.substring(0, 20)}...` : nombre}
							</button>
						);
					})}
				</div>
			</section>
		)
	);
};

export default ContenidoFarmacos;
