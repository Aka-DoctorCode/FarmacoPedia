import Styles from './Footer.module.css';
const Footer = () => {
	return (
		<footer id={Styles.inferior}>
			<div id={Styles.menuCapsulaOff}>
				<div id={Styles.capsulaOscuro} />
				<div id={Styles.capsulaClaro} />
			</div>
			<div id={Styles.contenedor}>
				<span id={Styles.tituloFooter}>FarmacoPedia</span>
				<span className={Styles.espaciado}>
					<span className={Styles.resaltar}>&lt;Code by&gt;</span>
					Doctor Francisco Molina
				</span>
				<span className={Styles.espaciado}>
					<span className={Styles.resaltar}>Copyright © 2023</span>
					Aka-DoctorCode
				</span>
				<div id={Styles.redesSociales}>
					<a href='https://github.com/Aka-DoctorCode'>
						<img id={Styles.logos} src='/assets/github.png' alt='GitHud' />
					</a>
					<a href='https://www.instagram.com/dr.molcas/'>
						<img id={Styles.logos} src='/assets/insta.png' alt='Instagra' />
					</a>
					<a href='mailto:franciscomolina92@gmail.com'>
						<img id={Styles.logos} src='/assets/gmail.png' alt='Gmail' />
					</a>
					<a href='https://wa.me/+584122211266'>
						<img id={Styles.logos} src='/assets/whats.png' alt='Whatsapp' />
					</a>
					<a href='https://t.me/+584143936561'>
						<img id={Styles.logos} src='/assets/tele.png' alt='Telegram' />
					</a>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
