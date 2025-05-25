import { Router } from "express";
import betRoutes from "./bet/betRoutes";

const router = Router();

router.use("/bet", betRoutes);

export default router;
