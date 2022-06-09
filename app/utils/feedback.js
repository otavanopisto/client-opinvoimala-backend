// type FeedbackType = 'like' | 'dislike' | 'unlike' | 'undislike' | 'dislike-to-like' | 'like-to-dislike'
const updateLikes = (type, currentLikes, currentDislikes) => {
  let likes = currentLikes ?? 0;
  let dislikes = currentDislikes ?? 0;

  switch (type) {
    case "like":
      likes++;
      break;
    case "dislike":
      dislikes++;
      break;
    case "unlike":
      likes--;
      break;
    case "undislike":
      dislikes--;
      break;
    case "dislike-to-like":
      dislikes--;
      likes++;
    case "like-to-dislike":
      likes--;
      dislikes++;
  }

  return {
    likes: likes >= 0 ? likes : 0,
    dislikes: dislikes >= 0 ? dislikes : 0,
  };
};

module.exports = {
  updateLikes,
};
