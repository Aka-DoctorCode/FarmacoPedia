import { useContext } from 'react';
import { counterContext } from '../context/counterContext';

import Styles from './SearchOff.module.css';
export const SearchOff = () => {
	const { busquedaMostrar } = useContext(counterContext);
	return (
		<button
			onClick={() => {
				busquedaMostrar();
			}}
			id={Styles.marco}
		>
			<div id={Styles.negro} />
			<div id={Styles.blanco} />
			<div id={Styles.barra} />
		</button>
	);
};

export default SearchOff;
