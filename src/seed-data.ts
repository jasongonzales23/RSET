function getRandomBoolean(): boolean {
  return Math.random() >= 0.5;
}

function getRandomAttrs(): { [key: string]: boolean } {
  const userAttrs: { [key: string]: boolean } = {};
  attrs.forEach((attr) => {
    userAttrs[attr] = getRandomBoolean();
  });
  return userAttrs;
}

function getRandomHourWithinLast24Hours(): string {
  const now = new Date();
  const randomHoursAgo = Math.floor(Math.random() * 24);
  const randomTime = new Date(now.getTime() - randomHoursAgo * 60 * 60 * 1000);
  return randomTime.toISOString().slice(0, 13) + ":00:00"; // Returns timestamp in format "YYYY-MM-DDTHH:00:00"
}

function seedRandomData(N: number): {
  timeIndexedViews: TimeIndexedViews;
  timeIndexedBookDemos: TimeIndexedBookDemos;
} {
  const timeIndexedViews: TimeIndexedViews = {};
  const timeIndexedBookDemos: TimeIndexedBookDemos = {};
  const users: { [userId: number]: { [key: string]: boolean } } = {};

  // Track book demo calls per user
  const track_book_demo = (userId: number) => {
    const demoTime = getRandomHourWithinLast24Hours();
    if (!timeIndexedBookDemos[demoTime]) {
      timeIndexedBookDemos[demoTime] = [];
    }
    timeIndexedBookDemos[demoTime].push({ userId });
  };

  // Generate N random view events
  for (let i = 0; i < N; i++) {
    const userId = i + 1; // Unique user_id
    const viewTime = getRandomHourWithinLast24Hours();

    // Assign random attributes to a user if they don't already exist
    if (!users[userId]) {
      users[userId] = getRandomAttrs();
    }

    // Create a new view event
    const newViewEvent: ViewEvent = {
      userId,
      // @ts-ignore
      attrs: users[userId],
    };

    // Add the view event to the timeIndexedViews at the generated time
    if (!timeIndexedViews[viewTime]) {
      timeIndexedViews[viewTime] = [];
    }
    timeIndexedViews[viewTime].push(newViewEvent);

    // Randomly decide whether to book a demo (at most once per user)
    if (
      Math.random() < 0.1 &&
      !Object.values(timeIndexedBookDemos).some((events) =>
        events.some((e) => e.userId === userId)
      )
    ) {
      track_book_demo(userId);
    }
  }

  return { timeIndexedViews, timeIndexedBookDemos };
}
