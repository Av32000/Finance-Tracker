import Loader from '../components/Loader';

const NoBackend = () => {
	return (
		<div className="bg-bg h-screen overflow-hidden flex justify-center items-center flex-col">
			<img src="logo.svg" width={80} height={80} />
			<h1 className="text-active-text-color text-center text-2xl p-8">
				Unable to connect to server
				<br /> Server not responding
			</h1>
			<Loader />
		</div>
	);
};

export default NoBackend;
