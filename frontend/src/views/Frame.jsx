import { useState } from 'react';
import Styles from './Frame.module.css';

import CapsulaOff from '../components/CapsulaOff';
import CapsulaOn from '../components/CapsulaOn';
import Menu from '../components/Menu';

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
			<main id={Styles.bordes}>
				<aside id={Styles.laterales}>
					<div className={Styles.bordesLaterales} id={Styles.izquierda} />
					<div className={Styles.bordesLaterales} id={Styles.derecha} />
				</aside>
				<footer id={Styles.inferior}>
					<div id={Styles.menuCapsulaOff}>
						<div id={Styles.capsulaOscuro} />
						<div id={Styles.capsulaClaro} />
					</div>
					<div id={Styles.contenedor}>
						<span>FarmacoPedia</span>
						<span href='https://github.com/Aka-DoctorCode'>
							&lt;&gt; By Doctor Francisco Molina 2023
						</span>
						<span>Copyright © 2023 Aka-DoctorCode</span>
						<div id={Styles.redesSociales}>
							<img src='' alt='GitHud' />
							<img src='' alt='Instagram' />
							<img src='' alt='Gmail' />
						</div>
					</div>
				</footer>
			</main>
		</section>
	);
};

export default Frame;
