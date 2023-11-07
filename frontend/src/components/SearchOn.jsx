import { useContext } from 'react';
import { counterContext } from '../context/counterContext';

import Styles from './SearchOn.module.css';
export const SearchOn = () => {
	const { busquda, busquedaOcultar } = useContext(counterContext);
	return (
		busquda && (
			<section id={Styles.contenedor}>
				<button
					onClick={() => {
						busquedaOcultar();
					}}
					id={Styles.boton}
				>
					<div id={Styles.circulo}>
						<div id={Styles.barra1}></div>
						<div id={Styles.barra2}></div>
					</div>
				</button>
				<div id={Styles.marco}>
					<button
						onClick={() => {
							busquedaOcultar();
						}}
						id={Styles.lupa}
					>
						<div id={Styles.negro} />
						<div id={Styles.blanco} />
						<div id={Styles.barra} />
					</button>
					<form action=''>
						<input placeholder='Buscar...' id={Styles.input} type='text' />
					</form>
				</div>
			</section>
		)
	);
};

export default SearchOn;
