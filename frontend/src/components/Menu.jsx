import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { counterContext } from '../context/counterContext';
import Styles from './Menu.module.css';
import StylesCapsulaOn from './MenuCapsulaOn.module.css';

const Menu = () => {
	const { menu, menuOcultar } = useContext(counterContext);
	const navigate = useNavigate();

	const handleNavigation = (path) => {
		navigate(path);
		menuOcultar();
	};

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
					<button
						onClick={() => handleNavigation('/farmacos')}
						id={Styles.boton}
					>
						Farmacos
					</button>
					<button
						onClick={() => handleNavigation('/familias')}
						id={Styles.boton}
					>
						Familias
					</button>
				</nav>
			</aside>
		)
	);
};

export default Menu;
