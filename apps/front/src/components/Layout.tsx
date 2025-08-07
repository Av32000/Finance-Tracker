import { ReactNode } from "react";
import { ModalProvider } from "./ModalProvider";
import NavBar from "./NavBar";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <ModalProvider>
      <div className="overflow-hidden flex">
        <NavBar />
        {children}
      </div>
    </ModalProvider>
  );
};

export default Layout;
