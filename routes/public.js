import { Router } from "express";
import { homePage, courseDetailPage } from "../controllers/publicController.js";
import { coursesListPage } from "../controllers/coursesListController.js";

const router = Router();

router.get("/", homePage);
router.get("/courses-page", coursesListPage);
router.get("/courses-page/:id", courseDetailPage);

export default router;
