const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const extendedPrisma = prisma.$extends({
  query: {
    user: {
      async findMany({ args, query }) {
        args.where = { active: true, ...args.where };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { active: true, ...args.where };
        return query(args);
      },
      async findUnique({ args, query }) {
        args.where = { active: true, ...args.where };
        return query(args);
      },
    },
    transaction: {
      async findMany({ args, query }) {
        args.where = { isDeleted: false, ...args.where };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { isDeleted: false, ...args.where };
        return query(args);
      },
      async findUnique({ args, query }) {
        args.where = { isDeleted: false, ...args.where };
        return query(args);
      },
    },
  },
});

module.exports = extendedPrisma;