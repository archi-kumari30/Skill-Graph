const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

const formatPaginatedResponse = (items, total, page = 1, limit = 10) => {
  const numPage = Math.max(1, Number(page) || 1);
  const numLimit = Math.max(1, Number(limit) || 10);
  const totalPages = Math.ceil(total / numLimit) || 1;
  return {
    items,
    pagination: {
      total,
      page: numPage,
      limit: numLimit,
      totalPages,
      hasNextPage: numPage < totalPages,
      hasPrevPage: numPage > 1
    }
  };
};

module.exports = {
  catchAsync,
  formatPaginatedResponse
};
