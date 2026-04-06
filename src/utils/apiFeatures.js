class APIFeatures {
  constructor(query) {
    this.query = query;
    this.args = {
      where: {},
      orderBy: [],
      select: undefined,
      skip: undefined,
      take: undefined
    };
  }

  filter() {
    const queryObj = { ...this.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Transform Mongoose-style operators to Prisma format
    const prismaWhere = {};
    for (const [key, value] of Object.entries(queryObj)) {
      if (typeof value === 'object') {
        prismaWhere[key] = {};
        for (const [op, opValue] of Object.entries(value)) {
          // Convert to number if it's numeric, else keep string/boolean
          if (!isNaN(Number(opValue))) {
            prismaWhere[key][op] = Number(opValue);
          } else if (opValue === 'true') {
            prismaWhere[key][op] = true;
          } else if (opValue === 'false') {
            prismaWhere[key][op] = false;
          } else {
            prismaWhere[key][op] = opValue;
          }
        }
      } else {
        if (!isNaN(Number(value))) {
          prismaWhere[key] = Number(value);
        } else if (value === 'true') {
          prismaWhere[key] = true;
        } else if (value === 'false') {
          prismaWhere[key] = false;
        } else {
          prismaWhere[key] = value;
        }
      }
    }

    this.args.where = { ...this.args.where, ...prismaWhere };
    return this;
  }

  sort() {
    if (this.query.sort) {
      const sortBy = this.query.sort.split(',').map(field => {
        if (field.startsWith('-')) {
          return { [field.substring(1)]: 'desc' };
        }
        return { [field]: 'asc' };
      });
      this.args.orderBy = sortBy;
    } else {
      this.args.orderBy = [{ createdAt: 'desc' }];
    }
    return this;
  }

  limitFields() {
    if (this.query.fields) {
      const fields = this.query.fields.split(',');
      this.args.select = fields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {});
    }
    return this;
  }

  paginate() {
    const page = this.query.page * 1 || 1;
    const limit = this.query.limit * 1 || 20;
    const skip = (page - 1) * limit;

    this.args.skip = skip;
    this.args.take = limit;
    return this;
  }

  getArgs() {
    // Clean up empty objects/arrays from the final Prisma arguments
    const finalArgs = { ...this.args };
    if (!finalArgs.select) delete finalArgs.select;
    if (finalArgs.skip === undefined) delete finalArgs.skip;
    if (finalArgs.take === undefined) delete finalArgs.take;
    if (finalArgs.orderBy.length === 0) delete finalArgs.orderBy;
    if (Object.keys(finalArgs.where).length === 0) delete finalArgs.where;

    return finalArgs;
  }
}

module.exports = APIFeatures;