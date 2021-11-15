const _ = require("lodash");

module.exports = {
  sortTests(a, b) {
    const getPrioritySort = () => {
      if (_.isNil(a.priority) && _.isNil(b.priority)) return 0;
      else if (_.isNil(a.priority)) return 1;
      else if (_.isNil(b.priority)) return -1;
      else return Number(a.priority) - Number(b.priority);
    };

    const priority = getPrioritySort();
    const published = b.published_at.localeCompare(a.published_at);
    return priority || published;
  },

  // Get outcome type either from template or from test if overriden
  getOutcomeType(test, template) {
    return !test.outcome_type || test.outcome_type === "from_template"
      ? template.outcome_type
      : test.outcome_type;
  },

  // Maximum points avalable from test
  getTestMaximumPoints(questions) {
    return questions.reduce((points, question) => {
      const allPoints = question.options?.map(({ points }) => points) ?? [];
      const maxPoints = allPoints.length ? Math.max(...allPoints) : 0;
      return points + maxPoints;
    }, 0);
  },

  // User's total points
  getTestTotalPoints(answers, questions) {
    return answers?.reduce((points, { answerId, questionId }) => {
      const question = questions.find(({ id }) => id === questionId);
      const answer = question?.options.find(({ id }) => id === answerId);
      if (!answer?.points) return points;
      return points + answer.points;
    }, 0);
  },

  // Get most common outcome value(s) (e.g. ["A", "C"]) when tupe is "suitability_of_answers"
  getOutcomeValues(answers, questions) {
    const outcomeValues = answers?.map(({ answerId, questionId }) => {
      const question = questions.find(({ id }) => id === questionId);
      const answer = question?.options.find(({ id }) => id === answerId);
      return answer?.outcome_value;
    });

    // Find how many times each value exists in user's answers
    const valueCounts = {};
    outcomeValues?.forEach((value) => {
      valueCounts[value] = (valueCounts[value] ?? 0) + 1;
    });

    // Transform values to array and sort by their count.
    const valuesWithCount = Object.keys(valueCounts)
      .map((value) => ({ value, count: valueCounts[value] }))
      .sort((a, b) => b.count - a.count);

    if (valuesWithCount.length) {
      // First value had the largest count number (mode)
      const mode = [valuesWithCount[0].value];

      // In case multiple values had the same count, push them to the array as well
      valuesWithCount.slice(1).forEach(({ value, count }) => {
        if (valueCounts[mode[0]] === count) {
          mode.push(value);
        }
      });

      return mode;
    }

    return [];
  },

  // Get all trigger values that user triggered
  getTriggerValues(answers, questions) {
    return answers
      ?.map(({ answerId, questionId }) => {
        const question = questions.find(({ id }) => id === questionId);
        const answer = question?.options.find(({ id }) => id === answerId);
        return answer?.trigger_value;
      })
      .filter((trigger_value) => !!trigger_value);
  },

  // Get outcomes that match to user's answers
  // (either by test type or points or outcome values)
  getMatchingOutcomes({
    outcomes,
    test_type,
    points,
    outcome_values,
    trigger_values,
  }) {
    if (test_type === "exercise") {
      return outcomes;
    }

    let matchingOutcomes;

    if (!_.isNil(points)) {
      matchingOutcomes = outcomes?.filter((outcome) => {
        const isAboveMin = points >= outcome.point_scale_min;
        const isBelowMax = points <= outcome.point_scale_max;
        return isAboveMin && isBelowMax;
      });
    } else if (!_.isNil(outcome_values)) {
      matchingOutcomes = outcomes?.filter((outcome) =>
        outcome_values.includes(outcome.outcome_value)
      );
    } else if (!_.isNil(trigger_values)) {
      matchingOutcomes = outcomes?.filter((outcome) =>
        trigger_values.includes(outcome.trigger_value)
      );
    }

    return matchingOutcomes ?? [];
  },

  getAverageStars(outcomes) {
    const stars = outcomes
      .map(({ stars }) => stars)
      .filter((star) => !_.isNil(star));
    return _.sum(stars) / stars.length;
  },

  sanitizeTestOutcomes(outcomes, show_stars) {
    return outcomes?.map((outcome) => ({
      id: outcome.id,
      title: outcome.title,
      content: outcome.content,
      image: outcome.image,
      stars: show_stars ? outcome.stars : null,
    }));
  },
};
