import dotenv from "dotenv";
import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/articles", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword;
    const sortOrder = req.query.orderBy || "createAt"; // 정렬할 필드 (기본값은 createAt)
    const sortBy = req.query.order === "desc" ? "desc" : "asc"; // 정렬 방향 (기본값은 asc)

    const conditions = keyword
      ? {
          title: {
            contains: keyword,
            mode: "insensitive", // 대소문자 구분 없이 검색
          },
        }
      : {};

    const articles = await prisma.article.findMany({
      where: conditions,
      orderBy: {
        [sortOrder]: sortBy, // 동적으로 필드와 방향을 설정
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        name: true,
        id: true,
        like: true,
        title: true,
        content: true,
        createAt: true,
      },
    });

    const totalArticles = await prisma.article.count({ where: conditions });

    res.json({
      data: articles,
      total: totalArticles,
      page,
      pageSize,
      totalPages: Math.ceil(totalArticles / pageSize),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const article = await prisma.article.findUnique({
      where: {
        id,
      },
    });
    res.json(article);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal server error" });
  }
});

app.post("/articles", async (req, res) => {
  try {
    const { title, content, name } = req.body;
    const article = await prisma.article.create({
      data: {
        name: name || undefined,
        title,
        content,
      },
    });
    res.json(article);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal server error" });
  }
});

app.patch("/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, name } = req.body;
    const article = await prisma.article.update({
      where: {
        id,
      },
      data: {
        name,
        title,
        content,
      },
    });
    res.json(article);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal server error" });
  }
});

app.delete("/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const article = await prisma.article.delete({
      where: {
        id,
      },
    });
    res.json(article);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal server error" });
  }
});

app.post("/articles/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { content, name } = req.body;

  try {
    const article = await prisma.article.findUnique({
      where: {
        id: id,
      },
    });
    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    const comment = await prisma.articleComment.create({
      data: {
        name,
        content,
        articleId: id,
      },
    });
    res.status(201).json(comment);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal server error" });
  }
});

app.patch("/articles/:id/comments/:commentsId", async (req, res) => {
  const { id, commentId } = req.params;
  const { content, name } = req.body;
  try {
    const article = await prisma.article.findUnique({
      where: {
        id: id,
      },
    });
    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    const comment = await prisma.articleComment.update({
      where: {
        id: commentId,
      },
      data: {
        content,
        name,
      },
    });
    res.status(200).json(comment);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal server error" });
  }
});

app.delete("/articles/:id/comments/:commentsId", async (req, res) => {
  const { id, commentId } = req.params;
  try {
    const article = await prisma.article.findUnique({
      where: {
        id: id,
      },
    });
    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    const comment = await prisma.articleComment.delete({
      where: {
        id: commentId,
      },
    });
    res.status(200).json(comment);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal server error" });
  }
});

app.get("/articles/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { cursor, limit = 10 } = req.query;
  const comments = await prisma.articleComment.findMany({
    where: {
      articleId: id,
    },
    take: parseInt(limit),
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: {
      createAt: "asc",
    },
    select: {
      id: true,
      name: true,
      content: true,
      createAt: true,
    },
  });

  const nextCursor =
    comments.length > 0 ? comments[comments.length - 1].id : null;
  res.status(200).json({ data: comments, nextCursor });
});

app.listen(3001, () => {
  console.log("Server started on port 3000");
});
