import { Router } from "express";
import {
  postBookCourse,
  postBookSession,
  bookingConfirmationPage
} from "../controllers/coursesController.js";

const router = Router();

router.post("/courses-page/:id/book", postBookCourse);
router.post("/sessions/:id/book", postBookSession);

export default router;
