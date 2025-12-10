import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { counterContext } from '../context/counterContext';
import Menu from '../components/Menu';
import Footer from '../components/Footer';
import SearchOn from '../components/SearchOn';
import SearchOff from '../components/SearchOff';
import BotonPill from '../components/BontonPill';
import Styles from './Frame.module.css';

const Frame = () => {
	const { theme, toggleTheme } = useContext(counterContext);

	return (
		<section id={Styles.marco}>
			<header id={Styles.cabezera}>
				<h1 id={Styles.titulo}>FarmacoPedia</h1>
				<div className={Styles.headerControls}>
					<button onClick={toggleTheme} className={Styles.themeToggle} aria-label="Toggle Theme">
						<div className={theme === 'dark' ? Styles.sunIcon : Styles.moonIcon}></div>
					</button>
					<SearchOff />
					<BotonPill />
				</div>
			</header>

			<SearchOn />

			<main id={Styles.mainContent}>
				<Outlet />
				<Footer />
			</main>

			<div id={Styles.bordes} />

			<Menu />
		</section>
	);
};

export default Frame;
