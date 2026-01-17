import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Project routes working" });
});

export default router;
