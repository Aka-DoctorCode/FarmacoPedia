import Styles from './Contenido.module.css';

// import { useState } from 'react';
const Contenido = (showContenido) => {
	const x = [];
	for (let i = 1; i <= 99; i++) {
		x.push('n' + i);
	}

	return (
		<>
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
		</>
	);
};

export default Contenido;
