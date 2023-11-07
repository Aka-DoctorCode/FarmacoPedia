import { useContext } from 'react';
import { counterContext } from '../context/counterContext';
import Styles from './Menu.module.css';
import StylesCapsulaOn from './MenuCapsulaOn.module.css';
const Menu = () => {
	const { menu, menuOcultar } = useContext(counterContext);

	const x = [];
	for (let i = 1; i <= 40; i++) {
		x.push('n' + i);
	}

	return (
		menu && (
			<aside id={Styles.contenedor}>
				<button
					onClick={() => {
						menuOcultar();
					}}
					id={StylesCapsulaOn.menuCapsulaOn}
				>
					<div id={StylesCapsulaOn.bloquePartiuculas}>
						{x.map((element, index) => {
							return (
								<div
									key={index}
									className={StylesCapsulaOn.particula}
									id={StylesCapsulaOn[element]}
								/>
							);
						})}
					</div>
					<div id={StylesCapsulaOn.capsulaOscuro} />
					<div id={StylesCapsulaOn.capsulaClaro} />
				</button>
				<nav id={Styles.menuCapsulaOn}>
					{/* <button id={Styles.boton}>Inicio</button> */}
					<button id={Styles.boton}>Farmacos</button>
					<button id={Styles.boton}>Familias</button>
					{/* <button id={Styles.boton}>Aportar</button> */}
				</nav>
			</aside>
		)
	);
};

export default Menu;
