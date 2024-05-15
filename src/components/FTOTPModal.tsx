import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { useBearStore } from '../GlobalState';
import { FetchServerType } from '../account';
import FTPinInput from './FTPinInput';
import Loader from './Loader';

const FTOTPModal = ({
	isOpen,
	setIsOpen,
}: {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
}) => {
	const { fetchServer } = useBearStore();
	const [otpURL, setOtpURL] = useState('');
	const [otpError, setOtpError] = useState('');

	const retriveOTPURL = () => {
		fetchServer('/get-otp')
			.then(res => res.text())
			.then(text => QRCode.toDataURL(text))
			.then(dataURL => setOtpURL(dataURL));
	};

	const checkOTP = async (token: number, fetchServer: FetchServerType) => {
		return new Promise<void>(async (resolve, reject) => {
			let isValid = await fetchServer('/verify-otp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ token }),
			});

			if (isValid.ok) {
				resolve();
			} else {
				const text = await isValid.text();
				if (text == 'Timeout') {
					setOtpError('Timeout please wait');
					reject();
				} else if (text == 'Invalid OTP') {
					setOtpError('Invalid OTP');
					reject();
				} else {
					setOtpError('Unknow Error');
					reject();
				}
			}
		});
	};

	useEffect(() => {
		retriveOTPURL();
	}, [otpURL]);

	return (
		<div
			className={`${
				isOpen ? 'flex' : 'hidden'
			} absolute items-center justify-center h-screen w-full bg-[black] bg-opacity-60`}
			onClick={e => {
				if (e.target === e.currentTarget) {
					setIsOpen(false);
				}
			}}
		>
			{otpURL ? (
				<div className="p-10 bg-bg-light rounded-xl flex flex-col items-center justify-center gap-3 mobile:w-5/6">
					<p className="p-3 text-active-text-color mobile:text-center">
						Add OTP App
					</p>
					<img src={otpURL} />
					<p className="text-active-text-color text-sm">
						Scan the QRCode and type the OTP provided by the auth app
					</p>
					<FTPinInput
						callback={token => {
							checkOTP(token, fetchServer).then(() => setIsOpen(false));
						}}
					/>
					{otpError && <p className="text-red text-xs">{otpError}</p>}
				</div>
			) : (
				<Loader />
			)}
		</div>
	);
};

export default FTOTPModal;
