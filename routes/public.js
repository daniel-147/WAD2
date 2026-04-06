import { Router } from "express";
import { homePage, courseDetailPage, bookingConfirmationPage } from "../controllers/viewsController.js";
import { coursesListPage } from "../controllers/coursesListController.js";

const router = Router();

router.get("/", homePage);
router.get("/courses-page", coursesListPage);
router.get("/courses-page/:id", courseDetailPage);
router.get("/bookings/:bookingId", bookingConfirmationPage);

export default router;
