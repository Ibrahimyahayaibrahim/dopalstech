import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Event routes working" });
});

export default router;
