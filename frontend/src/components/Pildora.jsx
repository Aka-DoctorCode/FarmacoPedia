import Styles from './Pildora.module.css';
const Pildora = () => {
	const x = [];
	for (let i = 1; i <= 40; i++) {
		x.push('n' + i);
	}
	return (
		<section id={Styles.contenedor}>
			<div id={Styles.lista}>
				{x.map((index) => {
					return <button key={index} className={Styles.pildora}></button>;
				})}
				<button className={Styles.pildora}></button>
			</div>
		</section>
	);
};

export default Pildora;
