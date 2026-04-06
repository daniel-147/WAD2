// routes/views.js
import { Router } from "express";
import {
  homePage,
  courseDetailPage,
  postBookCourse,
  postBookSession,
  bookingConfirmationPage,
  loginPage,
  handleLogin,
  logout,
  registerPage,
  postRegister,
  addCoursePage,
  postAddCourse,
  addSessionsPage,
  postAddSessions,
  updateCoursePage,
  postUpdateCourse,
  updateSessionsPage,
  postUpdateSessions,
  viewSessionParticipants,
  
addOrganiserPage,
  postAddOrganiser,
  userListPage,
  deleteUser

} from "../controllers/viewsController.js";
import { coursesListPage } from "../controllers/coursesListController.js";
import { login as authLogin } from "../auth/auth.js";
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

  return next();
};
router.get("/", homePage);
router.get("/courses-page", coursesListPage);

router.get("/courses-page/:id", courseDetailPage);


router.post("/courses-page/:id/book", postBookCourse);
router.post("/sessions/:id/book", postBookSession);
router.get("/bookings/:bookingId", bookingConfirmationPage);

router.get("/login", loginPage);
router.post("/login", authLogin, handleLogin);

router.get("/logout", logout);
router.get("/register", registerPage);
router.post("/register", postRegister);

router.get("/organiser/add-course", requireOrganiser, addCoursePage);
router.post("/organiser/add-course", requireOrganiser, postAddCourse);

router.post(
  "/organiser/add-course/:courseId/sessions",
  requireOrganiser,
  postAddSessions,
);

router.get(
  "/organiser/add-course/:courseId/sessions",
  requireOrganiser,
  addSessionsPage,
);

router.get(
  "/organiser/update-course/:courseId",
  requireOrganiser,
  updateCoursePage,
);
router.post(
  "/organiser/update-course/:courseId",
  requireOrganiser,
  postUpdateCourse,
);

router.get(
  "/organiser/update-course/:courseId/sessions",
  requireOrganiser,
  updateSessionsPage,
);
router.post(
  "/organiser/update-course/:courseId/sessions",
  requireOrganiser,
  postUpdateSessions,
);

router.get(
  "/organiser/sessions/:sessionId/participants",
  requireOrganiser,
  viewSessionParticipants
);

router.get(
  "/organiser/add-organiser",
  requireOrganiser,
  addOrganiserPage
);

router.post(
  "/organiser/add-organiser",
  requireOrganiser,
  postAddOrganiser
);

router.get(
  "/organiser/users",
  requireOrganiser,
  userListPage
);

router.post(
  "/organiser/users/:userId/delete",
  requireOrganiser,
  deleteUser
);


export default router;
