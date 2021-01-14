import "./App.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";

function App() {
  const [user, setUser] = useState({});
  const [err, setError] = useState("");
  useEffect(() => {
    setError("");
    console.log(user);
    if (!Object.keys(user).length === 0) {
      setError("User still logged in");
    }
  }, []);
  const logout = (user) => {
    setUser(null);
    setError("user Logged out");
    user = null;
    Cookies.remove("access");
    Cookies.remove("refresh");
    return user;
  };
  const refresh = (refreshToken) => {
    console.log("Refreshing token");

    return new Promise((resolve, reject) => {
      axios
        .post("http://localhost:9000/renewAccessToken", { token: refreshToken })
        .then((data) => {
          if (data.data.success == false) {
            setError("Login Again");
            resolve(false);
          } else {
            const { accessToken } = data.data;
            Cookies.set("access", accessToken);
            resolve(accessToken);
          }
        });
    });
  };

  const requestLogin = (accessToken, refreshToken) => {
    console.log(accessToken, refreshToken);
    return new Promise((resolve, reject) => {
      axios
        .post(
          "http://localhost:9000/protected",
          {},
          {
            headers: {
              authorization: `Bearer ${accessToken}`,
            },
          }
        )
        .then(async (data) => {
          if (data.data.success === false) {
            if (data.data.message === "User not authenticated") {
              setError("Login Again");
            } else if (data.data.message === "Access token expired") {
              const accessToken = await refresh(refreshToken);
              return await requestLogin(accessToken, refreshToken);
            }
            resolve(false);
          } else {
            setError("Protected Route Accessed");
            resolve(true);
          }
        });
    });
  };

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    var x = document.forms["myForm"]["email"].value;
    var y = document.forms["myForm"]["password"].value;
    if (x == null || x == "" || y == null || y == "") {
      alert("Name/Password must be filled out");
      return false;
    } else {
      axios.post("http://localhost:9000/login", { user }).then((data) => {
        const { accessToken, refreshToken } = data.data;

        Cookies.set("access", accessToken);
        Cookies.set("refresh", refreshToken);
      });
    }
  };

  const hasAccess = async (accessToken, refreshToken) => {
    if (!refreshToken) return null;

    if (accessToken === undefined) {
      //generate new access token
      accessToken = await refresh(refreshToken);
      return accessToken;
    }
    return accessToken;
  };

  const protect = async (e) => {
    let accessToken = Cookies.get("access");
    let refreshToken = Cookies.get("refresh");

    accessToken = await hasAccess(accessToken, refreshToken);

    if (!accessToken) {
    } else {
      await requestLogin(accessToken, refreshToken);
    }
  };

  return (
    <div className="App">
      <form
        action=""
        name="myForm"
        onChange={handleChange}
        onSubmit={handleSubmit}
      >
        <input name="email" type="email" placeholder="Email Address" />
        <br />
        <br />
        <input name="password" type="password" placeholder="Password" />
        <br />
        <br />
        <input type="submit" value="login" />
      </form>
      {err}
      <button onClick={protect}>Access Protected Content</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default App;
