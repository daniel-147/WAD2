// controllers/authController.js
export const loginPage = (req, res) => {
  const success =
    req.query.registered === "1"
      ? "Your account has been created successfully. Please log in."
      : null;

  res.render("login", {
    title: "Login",
    isLoggedIn: Boolean(req.user),
    email: "",
    error: null,
    success,
    redirectTo: null,
  });
};

export const handleLogin = (req, res) => {
  res.render("login", {
    title: "Login",
    isLoggedIn: true,
    email: req.user?.email || "",
    error: null,
    success: "Logged in successfully! Returning to homepage",
    redirectTo: "/",
  });
};

export const logout = (req, res) => {
  res.clearCookie("jwt").redirect("/");
};
