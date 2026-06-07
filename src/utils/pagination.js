const getPaginationParams = (query) => {
  let page = parseInt(query.page) || parseInt(process.env.DEFAULT_PAGE) || 1;
  let limit = parseInt(query.limit) || parseInt(process.env.DEFAULT_LIMIT) || 10;
  const maxLimit = parseInt(process.env.MAX_LIMIT) || 100;

  if (page < 1) page = 1;
  if (limit < 1) limit = 10;
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const paginatedResult = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

module.exports = { getPaginationParams, paginatedResult };
