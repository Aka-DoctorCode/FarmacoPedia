import Styles from './SearchOn.module.css';
export const SearchOn = () => {
	return (
		<section id={Styles.contenedor}>
			<buttton id={Styles.boton}>
				<div id={Styles.circulo}>
					<div id={Styles.barra1}></div>
					<div id={Styles.barra2}></div>
				</div>
			</buttton>
			<div id={Styles.marco}>
				<button id={Styles.lupa}>
					<div id={Styles.negro} />
					<div id={Styles.blanco} />
					<div id={Styles.barra} />
				</button>
				<form action=''>
					<input placeholder='Buscar...' id={Styles.input} type='text' />
				</form>
			</div>
		</section>
	);
};

export default SearchOn;
