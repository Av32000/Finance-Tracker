import React, { useState } from "react";

const FTPinInput = ({ callback }: { callback: (token: number) => void }) => {
  const [pin, setPin] = useState(Array(6).fill(""));

  const handleChange = (value: string, index: number) => {
    if (/^\d?$/.test(value)) {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);

      if (index < 5 && value) {
        const nextInput = document.getElementById(`pin-${index + 1}`);
        if (nextInput) nextInput.focus();
      }

      if (newPin.every((digit) => digit !== "")) {
        callback(parseInt(newPin.join("")));
        setPin(Array(6).fill(""));
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace") {
      if (pin[index] === "" && index > 0) {
        const newPin = [...pin];
        newPin[index - 1] = "";
        setPin(newPin);
        const prevInput = document.getElementById(`pin-${index - 1}`);
        if (prevInput) prevInput.focus();
      } else {
        const newPin = [...pin];
        newPin[index] = "";
        setPin(newPin);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text");
    if (/^\d{1,6}$/.test(paste)) {
      const newPin = Array(6).fill("");
      for (let i = 0; i < Math.min(6, paste.length); i++) {
        newPin[i] = paste[i];
      }
      setPin(newPin);
      const nextInput = document.getElementById(
        `pin-${Math.min(5, paste.length - 1)}`,
      );
      if (nextInput) nextInput.focus();
    }
  };

  return (
    <div className="flex space-x-2">
      {pin.map((digit, index) => (
        <input
          key={index}
          id={`pin-${index}`}
          type="text"
          value={digit}
          maxLength={1}
          className="w-11 h-11 text-center text-xl border-[1px] border-text-color text-active-text-color rounded-xl bg-transparent focus:outline-none focus:border-blue-500"
          onChange={(e) => handleChange(e.target.value, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
};

export default FTPinInput;
