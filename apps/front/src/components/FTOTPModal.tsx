import { FetchServerType } from "@finance-tracker/types";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useBearStore } from "../GlobalState";
import FTPinInput from "./FTPinInput";
import Loader from "./Loader";
import { useModal } from "./ModalProvider";

const FTOTPModal = ({ hideModal }: { hideModal: () => void }) => {
  const { fetchServer, setAuthToken } = useBearStore();
  const { showModal } = useModal();
  const [otpURL, setOtpURL] = useState("");
  const [otpError, setOtpError] = useState("");

  const retriveOTPURL = () => {
    fetchServer("/get-otp")
      .then((res) => res.text())
      .then((text) => QRCode.toDataURL(text))
      .then((dataURL) => setOtpURL(dataURL));
  };

  const checkOTP = async (token: number, fetchServer: FetchServerType) => {
    return new Promise<void>(async (resolve, reject) => {
      const isValid = await fetchServer("/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (isValid.ok) {
        setAuthToken((await isValid.json()).token);
        await fetchServer("/activate-otp");
        resolve();
      } else {
        const text = await isValid.text();
        if (text == "Timeout") {
          setOtpError("Timeout please wait");
          reject();
        } else if (text == "Invalid OTP") {
          setOtpError("Invalid OTP");
          reject();
        } else {
          setOtpError("Unknow Error");
          reject();
        }
      }
    });
  };

  useEffect(() => {
    retriveOTPURL();
  });

  return (
    <div
      className="absolute flex items-center justify-center h-screen w-full bg-[black] bg-opacity-60"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          hideModal();
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
            callback={(token) => {
              checkOTP(token, fetchServer).then(() => {
                hideModal();
                showModal({ type: "Info", title: "OTP successfully set up !" });
              });
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
