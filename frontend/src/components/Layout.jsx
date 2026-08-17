import { Link, useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const location = useLocation();
  const navItems = [
    { path: "/", label: "Predict" },
    { path: "/batch", label: "Batch Predict" },
    { path: "/monitoring", label: "Monitoring" },
    { path: "/model-info", label: "Model Info" },
  ];

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-brand">Churn Dashboard</div>
        <ul className="nav-links">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? "active" : ""}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}