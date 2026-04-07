import { Router } from "express";
import {
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
  postAddOrganiser
} from "../controllers/organiserController.js";

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

// Add course
router.get("/organiser/add-course", requireOrganiser, addCoursePage);
router.post("/organiser/add-course", requireOrganiser, postAddCourse);

// Add sessions
router.get("/organiser/add-course/:courseId/sessions", requireOrganiser, addSessionsPage);
router.post("/organiser/add-course/:courseId/sessions", requireOrganiser, postAddSessions);

// Update course
router.get("/organiser/update-course/:courseId", requireOrganiser, updateCoursePage);
router.post("/organiser/update-course/:courseId", requireOrganiser, postUpdateCourse);

// Update sessions
router.get("/organiser/update-course/:courseId/sessions", requireOrganiser, updateSessionsPage);
router.post("/organiser/update-course/:courseId/sessions", requireOrganiser, postUpdateSessions);

// Participants
router.get("/organiser/sessions/:sessionId/participants", requireOrganiser, viewSessionParticipants);

// Add organiser
router.get("/organiser/add-organiser", requireOrganiser, addOrganiserPage);
router.post("/organiser/add-organiser", requireOrganiser, postAddOrganiser);

export default router;
