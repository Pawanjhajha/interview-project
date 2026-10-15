const MAX_COMMENT_LENGTH = 1000;

// Rating is a JSON integer 1 to 5; the comment is optional.
const reviewSchema = ({ rating, comment } = {}) => {
  const errors = {};

  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = 'Rating must be a whole number from 1 to 5';
  }
  if (comment !== undefined && typeof comment !== 'string') errors.comment = 'Comment must be text';
  else if (comment && comment.trim().length > MAX_COMMENT_LENGTH) {
    errors.comment = `Comment must be at most ${MAX_COMMENT_LENGTH} characters`;
  }
  return errors;
};

module.exports = { reviewSchema };
