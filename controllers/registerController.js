// controllers/registerController.js
import { UserModel } from "../models/userModel.js";

export const registerPage = (req, res) => {
  res.render("register", {
    title: "Register",
    name: "",
    email: "",
    errors: {},
  });
};

export const postRegister = async (req, res) => {
  const { name, email, password } = req.body;
  const errors = {};

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) errors.email = "Not a valid email address";

  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,12}$/;
  if (!passwordRegex.test(password))
    errors.password =
      "Password must be 6-12 characters long and contain at least one: letter, number and special character";

  const existingUser = await UserModel.findByEmail(email);
  if (existingUser)
    errors.email = "An account has already been created with this email address";

  if (Object.keys(errors).length > 0) {
    return res.status(400).render("register", {
      title: "Register",
      name,
      email,
      errors,
    });
  }

  try {
    await UserModel.create({
      name,
      email,
      password,
      role: "user",
    });

    res.redirect("/login?registered=1");
  } catch (err) {
    res.status(500).render("register", {
      title: "Register",
      name,
      email,
      errors: { general: "Something went wrong! Please try again" },
    });
  }
};
