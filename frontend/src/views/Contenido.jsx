// import Pildora from '../components/Pildora';
import Styles from './Contenido.module.css';
// import { useState } from 'react';
const Contenido = (props) => {
	const x = [];
	for (let i = 1; i <= 39; i++) {
		x.push('n' + i);
	}
	return (
		<section id={Styles.contenedor}>
			<span id={Styles.tituloVista}>Lista de Farmacos por Nombre</span>
			{/* <Pildora /> */}
			<div id={Styles.lista}>
				{x.map((index) => {
					return <button key={index} className={Styles.pildora}></button>;
				})}
				<button className={Styles.pildora}></button>
			</div>
		</section>
	);
};

export default Contenido;
