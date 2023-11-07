import React, { useContext } from 'react';
import { counterContext } from '../context/counterContext';

import Styles from './Frame.module.css';
import StylesCapsulaOff from './FrameCapsulaOff.module.css';

const Frame = ({
	showMenu,
	showContenido,
	showSearchOn,
	showSearchOff,
	cargar,
}) => {
	const { menuMostrar } = useContext(counterContext);
	return (
		<>
			<section id={Styles.marco}>
				<header id={Styles.cabezera}>
					<h1 id={Styles.titulo}>FarmacoPedia</h1>
					<button
						onClick={() => {
							menuMostrar();
						}}
						id={StylesCapsulaOff.menuCapsulaOff}
					>
						<div id={StylesCapsulaOff.capsulaOscuro} />
						<div id={StylesCapsulaOff.capsulaClaro} />
					</button>
				</header>
				<main id={Styles.bordes}>
					<div className={Styles.bordesLaterales} id={Styles.izquierda} />
					<div className={Styles.bordesLaterales} id={Styles.derecha} />
				</main>
			</section>
			{cargar === true && [
				<React.Fragment key='menu'>{showMenu()}</React.Fragment>,
				<React.Fragment key='contenido'>{showContenido()}</React.Fragment>,
				<React.Fragment key='searchOn'>{showSearchOn()}</React.Fragment>,
				<React.Fragment key='searchOff'>{showSearchOff()}</React.Fragment>,
				// Otros elementos que puedas renderizar
			]}
		</>
	);
};

export default Frame;
