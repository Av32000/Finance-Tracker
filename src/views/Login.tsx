import { useState } from 'react';
import { useBearStore } from '../GlobalState';
import { FetchServerType } from '../account';
import FTButton from '../components/FTButton';
import Loader from '../components/Loader';
import {
	startRegistration,
	startAuthentication,
} from '@simplewebauthn/browser';

const Login = ({ refresh }: { refresh: () => void }) => {
	const register = async (fetchServer: FetchServerType) => {
		return new Promise<void>(async (resolve, reject) => {
			const resp = await fetchServer('/generate-registration-options');
			let attResp;
			try {
				attResp = await startRegistration(await resp.json());
			} catch (error) {
				reject(error);
				throw error;
			}

			const verificationResp = await fetchServer('/verify-registration', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(attResp),
			});

			const verificationJSON = await verificationResp.json();

			if (verificationJSON) {
				resolve();
			} else {
				reject(verificationJSON);
			}
		});
	};

	const login = async (
		fetchServer: FetchServerType,
		setAuthToken: (token: string) => void,
	) => {
		return new Promise<void>(async (resolve, reject) => {
			let hasPasskey = await (await fetchServer('/has-passkey')).text();
			console.log(hasPasskey);
			if (hasPasskey == 'false') {
				await register(fetchServer).catch(reject);
			}
			const resp = await fetchServer('/generate-authentication-options');

			let asseResp;
			try {
				asseResp = await startAuthentication(await resp.json());
			} catch (error) {
				reject(error);
			}
			const verificationResp = await fetchServer('/verify-authentication', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(asseResp),
			});

			const verificationJSON = await verificationResp.json();

			if (
				verificationJSON.authenticationInfo &&
				verificationJSON.authenticationInfo.userVerified
			) {
				let token = verificationJSON.authenticationInfo.token;
				console.log(token);
				setAuthToken(token);
				refresh();
				resolve();
			} else {
				reject(verificationJSON);
			}
		});
	};

	const { fetchServer, setAuthToken } = useBearStore();
	const [isLoading, setIsLoading] = useState(false);

	return (
		<div className="bg-bg h-screen overflow-hidden flex justify-center items-center flex-col">
			<img src="logo.svg" width={80} height={80} />
			<h1 className="text-active-text-color text-center text-2xl p-8 flex flex-col items-center">
				<span className="mb-8">
					Please log in with your access key to continue
				</span>
				{isLoading ? (
					<Loader />
				) : (
					<FTButton
						className="px-2 py-1"
						onClick={async () => {
							setIsLoading(true);
							await login(fetchServer, setAuthToken).catch(() =>
								setIsLoading(false),
							);
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
