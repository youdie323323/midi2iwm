'use client';
import { useEffect } from 'react';

declare const Go: any;

export default function App() {
  useEffect(() => {
    (async () => {
      const go = new Go();
      const result = await WebAssembly.instantiateStreaming(fetch('main.wasm'), go.importObject);
      go.run(result.instance);
    })();
  }, []);

  return <div>
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container">
          <a className="navbar-brand" href="/{{.session}}/">
            Nosviak4
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Attacks
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <a className="dropdown-item" href="/{{.session}}/attacks/apis">
                      APIs
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div className="container mt-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a href="/{{.session}}/">Nosviak4</a>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Dashboard
            </li>
          </ol>
        </nav>
        <h2>
          Welcome, {"{"}
          {"{"}.user.Username{"}"}
          {"}"}
        </h2>
        <p>
          This is your Nosviak4{" "}
          <span className="badge text-bg-success" style={{ fontSize: "12.5px" }}>
            admin
          </span>{" "}
          dashboard. Manage your build from here.
        </p>
        <div className="row row-cols-1 row-cols-md-2 g-4">
          <div className="col-md-6">
            <div className="card widget">
              <div className="card-body">
                <h3
                  className="card-title"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <i
                    className="material-icons text-primary-emphasis"
                    style={{
                      fontSize: 24,
                      marginRight: 10,
                      verticalAlign: "middle"
                    }}
                  >
                    group
                  </i>{" "}
                  Users
                  <span className="ms-auto" style={{ color: "#666" }} id="users">
                    {"{"}
                    {"{"}.users{"}"}
                    {"}"}
                  </span>
                </h3>
                <p className="card-text">
                  All the registered users inside the database which are verified.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card widget">
              <div className="card-body">
                <h3
                  className="card-title"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <i
                    className="material-icons text-danger-emphasis"
                    style={{
                      fontSize: 24,
                      marginRight: 10,
                      verticalAlign: "middle"
                    }}
                  >
                    rocket_launch
                  </i>{" "}
                  Attacks
                  <span className="ms-auto" style={{ color: "#666" }} id="attacks">
                    {"{"}
                    {"{"}.attacks{"}"}
                    {"}"}
                  </span>
                </h3>
                <p className="card-text">
                  All the attacks which have been sent globally.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card widget">
              <div className="card-body">
                <h3
                  className="card-title"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <i
                    className="material-icons text-warning-emphasis"
                    style={{
                      fontSize: 24,
                      marginRight: 10,
                      verticalAlign: "middle"
                    }}
                  >
                    settings
                  </i>{" "}
                  Methods
                  <span className="ms-auto" style={{ color: "#666" }} id="methods">
                    {"{"}
                    {"{"}.methods{"}"}
                    {"}"}
                  </span>
                </h3>
                <p className="card-text">All the methods registered.</p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card widget">
              <div className="card-body">
                <h3
                  className="card-title"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <i
                    className="material-icons text-info-emphasis"
                    style={{
                      fontSize: 24,
                      marginRight: 10,
                      verticalAlign: "middle"
                    }}
                  >
                    hourglass_bottom
                  </i>{" "}
                  Sessions
                  <span className="ms-auto" style={{ color: "#666" }} id="sessions">
                    {"{"}
                    {"{"}len .sessions{"}"}
                    {"}"}
                  </span>
                </h3>
                <p className="card-text">All the sessions active.</p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card widget h-100">
              <div className="card-body">
                <h3
                  className="card-title"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <i
                    className="material-icons text-danger-emphasis"
                    style={{
                      fontSize: 24,
                      marginRight: 10,
                      verticalAlign: "middle"
                    }}
                  >
                    flash_on
                  </i>{" "}
                  Ongoing Attacks
                  <span
                    className="ms-auto"
                    style={{ color: "#666" }}
                    id="ongoingAttacks"
                  >
                    {"{"}
                    {"{"}len .ongoingAttacks{"}"}
                    {"}"}
                  </span>
                </h3>
                <p className="card-text">Current number of attacks happening.</p>
                <hr />
                <h3
                  className="card-title"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <i
                    className="material-icons text-info-emphasis"
                    style={{
                      fontSize: 24,
                      marginRight: 10,
                      verticalAlign: "middle"
                    }}
                  >
                    cloud_upload
                  </i>{" "}
                  Method
                  <span
                    className="ms-auto"
                    style={{ color: "#666" }}
                    id="ongoingAttacksMostUsed"
                  >
                    {"{"}
                    {"{"}.ongoingAttacksMostUsed{"}"}
                    {"}"}
                  </span>
                </h3>
                <p className="card-text">
                  Current method with the most ongoing attacks.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card widget">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <i
                    className="material-icons text-primary-emphasis"
                    style={{ fontSize: 24, marginRight: 10 }}
                  >
                    send
                  </i>
                  <h3 className="card-title">Broadcast Message</h3>
                </div>
                <p className="card-text">Enter message to send:</p>
                <form className="d-flex flex-column" method="post">
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      name="BroadcastMessage"
                      placeholder="message to be broadcasted"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Send
                  </button>
                  <input
                    type="text"
                    style={{ display: "none" }}
                    name="FormName"
                    defaultValue="Broadcast"
                  />
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>

  </div>
}