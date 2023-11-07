import { useState } from 'react';
import Styles from './Frame.module.css';

import Menu from '../components/Menu';
import CapsulaOn from '../components/CapsulaOn';
import CapsulaOff from '../components/CapsulaOff';
import Contenido from '../views/Contenido';
// import SearchOn from '../components/SearchOn';
// import SearchOff from '../components/SearchOff';
import Footer from '../components/Footer';

const Frame = () => {
	const [menuVisible, setMenuVisible] = useState(false);
	const [capsulaOnVisible, setCapsulaOnVisible] = useState(false);

	const menuMostrar = () => {
		setMenuVisible(true);
		setCapsulaOnVisible(true);
	};

	const menuOcultar = () => {
		setMenuVisible(false);
		setCapsulaOnVisible(false);
	};
	return (
		<section id={Styles.marco}>
			{menuVisible && <Menu />}
			{capsulaOnVisible && <CapsulaOn ocultar={menuOcultar} />}
			<header id={Styles.cabezera}>
				<h1 id={Styles.titulo}>FarmacoPedia</h1>
				<CapsulaOff menu={menuMostrar} />
			</header>
			<Contenido />
			<main id={Styles.bordes}>
				<div className={Styles.bordesLaterales} id={Styles.izquierda} />
				<div className={Styles.bordesLaterales} id={Styles.derecha} />
			</main>
			<Footer />
		</section>
	);
};

export default Frame;
