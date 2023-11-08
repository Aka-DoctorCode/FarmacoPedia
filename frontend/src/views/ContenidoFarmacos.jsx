import { useContext } from 'react';
import { counterContext } from '../context/counterContext';
import Styles from './ContenidoFarmacos.module.css';

// import { useState } from 'react';
const ContenidoFarmacos = () => {
	const { listaFarmacos } = useContext(counterContext);
	const x = [];
	for (let i = 1; i <= 99; i++) {
		x.push('n' + i);
	}

	return (
		listaFarmacos && (
			<section id={Styles.contenedor}>
				<span id={Styles.tituloVista}>Lista de Farmacos por Nombre</span>
				<div id={Styles.lista}>
					{x.map((index) => {
						return (
							<button key={index} className={Styles.pildora}>
								Farmaco
							</button>
						);
					})}
				</div>
			</section>
		)
	);
};

export default ContenidoFarmacos;
