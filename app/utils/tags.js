const filterContentByTags = (content, tagIds) => {
  return content.filter(({ tags }) => {
    let tagFound = false;
    tags.forEach(({ id }) => {
      if (tagIds.includes(id)) tagFound = true;
    });
    return tagFound;
  });
};

module.exports = {
  filterContentByTags,
};
