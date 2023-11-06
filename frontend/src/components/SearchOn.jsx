import Styles from './SearchOn.module.css';
export const SearchOn = () => {
	return (
		<section id={Styles.marco}>
			<button id={Styles.lupa}>
				<div id={Styles.negro} />
				<div id={Styles.blanco} />
				<div id={Styles.barra} />
			</button>
			<form action=''>
				<input placeholder='Buscar...' id={Styles.input} type='text' />
			</form>
		</section>
	);
};

export default SearchOn;
