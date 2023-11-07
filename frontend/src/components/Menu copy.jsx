import Styles from './Menu.module.css';
const Menu = (props) => {
	return (
		<aside id={Styles.contenedor}>
			<nav id={Styles.menuCapsulaOn}>
				<button id={Styles.boton}>Inicio</button>
				<button id={Styles.boton}>Farmacos</button>
				<button id={Styles.boton}>Familias</button>
				<button id={Styles.boton}>Aportar</button>
			</nav>
		</aside>
	);
};

export default Menu;
