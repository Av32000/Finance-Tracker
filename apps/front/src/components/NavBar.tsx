import { useLocation, useNavigate } from "react-router-dom";
import AccountManagerCard from "./AccountManagerCard";

const menu = [
  {
    name: "Home",
    path: "/",
  },
  {
    name: "Transactions",
    path: "/transactions",
  },
  {
    name: "Statistics",
    path: "/stats",
  },
  {
    name: "Settings",
    path: "/settings",
  },
];

const NavBar = () => {
  const location = useLocation();

  const navigate = useNavigate();

  return (
    <div className="w-[280px] h-screen bg-bg-dark z-30 mobile:fixed mobile:bottom-0 mobile:h-16 mobile:w-full mobile:flex mobile:flex-row">
      <img
        src="logo.svg"
        width={50}
        height={50}
        className="m-4 mobile:hidden"
      />
      <div className="p-6 mobile:flex mobile:flex-row mobile:p-1 mobile:justify-around mobile:w-full">
        {menu.map((m) => (
          <div
            className={`flex items-center px-3 py-1 rounded bg-[#ffffff] cursor-pointer my-2 h-10 ${
              location.pathname == m.path ? "bg-opacity-10" : "bg-opacity-0"
            }`}
            onClick={() => navigate(m.path)}
            key={m.name}
          >
            <img
              src={`pages/${m.name.toLowerCase().split(" ").join("_")}.svg`}
              width={30}
              height={30}
            />
            <p
              className={`pl-2 mobile:hidden ${
                location.pathname == m.path
                  ? "text-active-text-color"
                  : "text-text-color"
              }`}
            >
              {m.name}
            </p>
          </div>
        ))}
      </div>
      <span className="mobile:hidden">
        <AccountManagerCard />
      </span>
    </div>
  );
};

export default NavBar;
