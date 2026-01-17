import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Pitch-IT routes working" });
});

export default router;
