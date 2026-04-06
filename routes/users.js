import { Router } from "express";
import { userListPage, deleteUser } from "../controllers/usersController.js";

const router = Router();

const requireOrganiser = (req, res, next) => {
  if (!req.user) return res.redirect("/login");
  if (req.user.role !== "organiser") {
    return res.status(403).render("error", {
      title: "Forbidden",
      message: "You do not have permission to access this page.",
      isLoggedIn: Boolean(req.user),
      isOrganiser: false,
    });
  }
  next();
};

router.get("/organiser/users", requireOrganiser, userListPage);
router.post("/organiser/users/:userId/delete", requireOrganiser, deleteUser);

export default router;
