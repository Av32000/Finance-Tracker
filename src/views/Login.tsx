import { useState } from 'react';
import { useBearStore } from '../GlobalState';
import { FetchServerType } from '../account';
import FTButton from '../components/FTButton';
import Loader from '../components/Loader';

const Login = ({ refresh }: { refresh: () => void }) => {
	const login = async (
		fetchServer: FetchServerType,
		setAuthToken: (token: string) => void,
	) => {
		let response = await fetchServer('/login');
		let token = (await response.json()).token;
		console.log(token);
		setAuthToken(token);
		refresh();
	};

	const { fetchServer, setAuthToken } = useBearStore();
	const [isLoading, setIsLoading] = useState(false);

	return (
		<div className="bg-bg h-screen overflow-hidden flex justify-center items-center flex-col">
			<img src="logo.svg" width={80} height={80} />
			<h1 className="text-active-text-color text-center text-2xl p-8 flex flex-col items-center">
				Please log in with your access key to continue
				{isLoading ? (
					<Loader />
				) : (
					<FTButton
						className="px-2 py-1 m-8"
						onClick={async () => {
							setIsLoading(true);
							await login(fetchServer, setAuthToken);
							setIsLoading(false);
						}}
					>
						Continue with Passkey
					</FTButton>
				)}
			</h1>
		</div>
	);
};

export default Login;
