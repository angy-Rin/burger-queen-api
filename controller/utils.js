module.exports.calculateTotalPages = (totalItems, itemsPerPage) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  return totalPages;
};
