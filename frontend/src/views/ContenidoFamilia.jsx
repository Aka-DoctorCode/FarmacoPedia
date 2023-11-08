import { useContext } from 'react';
import { counterContext } from '../context/counterContext';
import Styles from './ContenidoFamilia.module.css';

// import { useState } from 'react';
const ContenidoFamilia = () => {
	const { listaFamilia } = useContext(counterContext);
	const x = [];
	for (let i = 1; i <= 99; i++) {
		x.push('n' + i);
	}
	return (
		listaFamilia && (
			<section id={Styles.contenedor}>
				<span id={Styles.tituloVista}>Lista de Farmacos por Familia</span>
				<div id={Styles.lista}>
					{x.map((index) => {
						return (
							<button key={index} className={Styles.pildora}>
								Familia
							</button>
						);
					})}
				</div>
			</section>
		)
	);
};

export default ContenidoFamilia;
