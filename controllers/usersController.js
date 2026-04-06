import { UserModel } from "../models/userModel.js";

export const userListPage = async (req, res) => {
  const users = await UserModel.listAll();

  res.render("user-list", {
    title: "Edit Users",
    isLoggedIn: true,
    isOrganiser: true,
    users,
  });
};

export const deleteUser = async (req, res) => {
  await UserModel.deleteById(req.params.userId);
  res.redirect("/organiser/users");
};
