import React from 'react';

import Styles from './Frame.module.css';

const Frame = ({
	showMenu,
	showContenidoFarmacos,
	showContenidoFamilia,
	showSearchOn,
	showSearchOff,
	cargar,
}) => {
	return (
		<>
			<section id={Styles.marco}>
				<header id={Styles.cabezera}>
					<h1 id={Styles.titulo}>FarmacoPedia</h1>
				</header>
				<main id={Styles.bordes}>
					<div className={Styles.bordesLaterales} id={Styles.izquierda} />
					<div className={Styles.bordesLaterales} id={Styles.derecha} />
				</main>
			</section>
			{cargar === true && [
				<React.Fragment key='menu'>{showMenu()}</React.Fragment>,
				<React.Fragment key='ContenidoFarmacos'>
					{showContenidoFarmacos()}
				</React.Fragment>,
				<React.Fragment key='ContenidoFamilia'>
					{showContenidoFamilia()}
				</React.Fragment>,
				<React.Fragment key='searchOn'>{showSearchOn()}</React.Fragment>,
				<React.Fragment key='searchOff'>{showSearchOff()}</React.Fragment>,
			]}
		</>
	);
};

export default Frame;
