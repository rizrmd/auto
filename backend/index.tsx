import { serve } from "bun";
import index from "../frontend/index.html";
import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient();

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },

    // Users API endpoints
    "/api/users": {
      async GET() {
        try {
          const users = await prisma.user.findMany({
            include: {
              posts: true,
            },
          });
          return Response.json(users);
        } catch (error) {
          return Response.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
          );
        }
      },
      async POST(req) {
        try {
          const { email, name } = await req.json();
          const user = await prisma.user.create({
            data: { email, name },
          });
          return Response.json(user, { status: 201 });
        } catch (error) {
          return Response.json(
            { error: 'Failed to create user' },
            { status: 500 }
          );
        }
      },
    },

    // Posts API endpoints
    "/api/posts": {
      async GET() {
        try {
          const posts = await prisma.post.findMany({
            include: {
              author: true,
            },
          });
          return Response.json(posts);
        } catch (error) {
          return Response.json(
            { error: 'Failed to fetch posts' },
            { status: 500 }
          );
        }
      },
      async POST(req) {
        try {
          const { title, content, authorId } = await req.json();
          const post = await prisma.post.create({
            data: { title, content, authorId },
          });
          return Response.json(post, { status: 201 });
        } catch (error) {
          return Response.json(
            { error: 'Failed to create post' },
            { status: 500 }
          );
        }
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
