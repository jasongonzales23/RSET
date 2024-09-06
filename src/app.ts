import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

interface ViewEvent {
  userId: number;
  attrs: {
    on_mobile_device: boolean;
    is_located_in_usa: boolean;
    is_first_time_visitor: boolean;
    is_returning_user: boolean;
    email_verified: boolean;
    has_enterprise_business_domain: boolean;
    did_click_on_cta: boolean;
    did_click_on_ad: boolean;
    is_subscribed_to_newsletter: boolean;
    has_completed_profile: boolean;
    is_active_in_last_30_days: boolean;
    is_using_incognito_mode: boolean;
    is_logged_in: boolean;
    is_using_ad_blocker: boolean;
    has_multiple_devices: boolean;
    is_from_referral_source: boolean;
    has_downloaded_resource: boolean;
    has_filled_out_contact_form: boolean;
    is_preferred_language_english: boolean;
    is_on_slow_network: boolean;
  };
}

interface BookDemoEvent {
  userId: number;
}

interface TimeIndexedViews {
  [timestamp: string]: ViewEvent[];
}

/*
example:
  on_mobile_device: {
    true: { '2024-09-06T21:00:00': [Array] },
    false: { '2024-09-06T21:00:00': [Array] }
  },
*/
interface AttributeIndexedViews {
  [attribute: string]: {
    [value: string]: TimeIndexedViews;
  };
}

interface TimeIndexedBookDemos {
  [timestamp: string]: BookDemoEvent[];
}

const timeIndexedViews: TimeIndexedViews = {};
const attributeIndexedViews: AttributeIndexedViews = {};
const timeIndexedBookDemos: TimeIndexedBookDemos = {};

function addViewEvent(
  event: ViewEvent,
  timeIndexed: TimeIndexedViews,
  attributeIndexed: AttributeIndexedViews
) {
  const timestamp = new Date().toISOString().slice(0, 13) + ":00:00";
  if (!timeIndexed[timestamp]) {
    timeIndexed[timestamp] = [];
  }
  timeIndexed[timestamp].push(event);

  for (const [key, value] of Object.entries(event.attrs)) {
    const attrValue = value.toString();
    if (!attributeIndexed[key]) {
      attributeIndexed[key] = {};
    }
    if (!attributeIndexed[key][attrValue]) {
      attributeIndexed[key][attrValue] = {};
    }
    if (!attributeIndexed[key][attrValue][timestamp]) {
      attributeIndexed[key][attrValue][timestamp] = [];
    }
    attributeIndexed[key][attrValue][timestamp].push(event);
  }
}

function addDemoEvent(event: BookDemoEvent, timeIndexed: TimeIndexedBookDemos) {
  const timestamp = new Date().toISOString().slice(0, 13) + ":00:00";
  if (!timeIndexed[timestamp]) {
    timeIndexed[timestamp] = [];
  }
  timeIndexed[timestamp].push(event);
}

/// not used not finished
app.get("/seed-data/:num", async (req, res) => {
  const num = parseInt(req.params.num);
  console.log("Seeding data with", num, "records");
  //   seedRandomData(num);
  //   console.log("timeIndexedViews", timeIndexedViews);
  //   const result = timeIndexedViews;
  res.status(201);
});

app.post("/track-view", async (req, res) => {
  const { user_id, attrs } = req.body;
  const viewEvent: ViewEvent = {
    userId: user_id,
    attrs,
  };
  addViewEvent(viewEvent, timeIndexedViews, attributeIndexedViews);

  console.log("timeIndexedViews", timeIndexedViews);
  console.log("attributeIndexedViews", attributeIndexedViews);
  res.status(201).send();
});

app.post("/track-book-demo", async (req, res) => {
  const { user_id } = req.body;
  const bookDemoEvent: BookDemoEvent = {
    userId: user_id,
  };
  addDemoEvent(bookDemoEvent, timeIndexedBookDemos);
  console.log("timeIndexedBookDemos", timeIndexedBookDemos);
  res.status(201).send();
});

function countViewsLast24Hours(timeIndexed: TimeIndexedViews): number {
  const now = new Date();
  let totalViews = 0;

  for (let i = 0; i < 24; i++) {
    const hourAgo = new Date(now.getTime() - i * 60 * 60 * 1000);
    const timestamp = hourAgo.toISOString().slice(0, 13) + ":00:00";

    if (timeIndexed[timestamp]) {
      totalViews += timeIndexed[timestamp].length;
    }
  }

  return totalViews;
}

app.get("/get-views-last-24-hours", async (req, res) => {
  let count = countViewsLast24Hours(timeIndexedViews);
  res.status(200).send({ count });
});

function countDemosLast24Hours(timeIndexed: TimeIndexedBookDemos): number {
  const now = new Date();
  let totalDemos = 0;

  for (let i = 0; i < 24; i++) {
    const hourAgo = new Date(now.getTime() - i * 60 * 60 * 1000);
    const timestamp = hourAgo.toISOString().slice(0, 13) + ":00:00";

    if (timeIndexed[timestamp]) {
      totalDemos += timeIndexed[timestamp].length;
    }
  }

  return totalDemos;
}

app.get("/get-demos-last-24-hours", async (req, res) => {
  let count = countDemosLast24Hours(timeIndexedBookDemos);
  res.status(200).send({ count });
});

interface TimeValuePair {
  time: string;
  value: number;
}

function getMovingAverages(
  timeIndexed: TimeIndexedViews,
  duration: number
): TimeValuePair[] {
  const result: TimeValuePair[] = [];
  const currentTime = new Date();
  const movingWindowHours = 6;

  for (let i = duration - 1; i >= 0; i--) {
    const currentHourTime = new Date(
      currentTime.getTime() - i * 60 * 60 * 1000
    );
    const currentHourTimestamp =
      currentHourTime.toISOString().slice(0, 13) + ":00:00";

    let windowSum = 0;
    let countHoursWithData = 0;

    for (let j = movingWindowHours; j > 0; j--) {
      const pastHourTime = new Date(
        currentHourTime.getTime() - (j - 1) * 60 * 60 * 1000
      );
      const pastHourTimestamp =
        pastHourTime.toISOString().slice(0, 13) + ":00:00";
      const hourViewsCount = timeIndexed[pastHourTimestamp]?.length || 0;

      if (hourViewsCount > 0) {
        windowSum += hourViewsCount;
        countHoursWithData++;
      }
    }

    const movingAverage =
      countHoursWithData > 0 ? windowSum / movingWindowHours : 0;
    result.push({
      time: currentHourTimestamp,
      value: movingAverage,
    });
  }

  return result;
}

function getFilteredMovingAverages(
  timeIndexed: AttributeIndexedViews,
  attribute: string,
  value: boolean | string,
  duration: number
): TimeValuePair[] {
  const result: TimeValuePair[] = [];
  const currentTime = new Date();
  const movingWindowHours = 6;
  const stringValue = value.toString();

  for (let i = duration - 1; i >= 0; i--) {
    const currentHourTime = new Date(
      currentTime.getTime() - i * 60 * 60 * 1000
    );
    const currentHourTimestamp =
      currentHourTime.toISOString().slice(0, 13) + ":00:00";

    let windowSum = 0;
    let countHoursWithData = 0;

    for (let j = movingWindowHours; j > 0; j--) {
      const pastHourTime = new Date(
        currentHourTime.getTime() - (j - 1) * 60 * 60 * 1000
      );
      const pastHourTimestamp =
        pastHourTime.toISOString().slice(0, 13) + ":00:00";
      const hourViews =
        timeIndexed[attribute]?.[stringValue]?.[pastHourTimestamp];
      const hourViewsCount = hourViews?.length || 0;

      if (hourViewsCount > 0) {
        windowSum += hourViewsCount;
        countHoursWithData++;
      }
    }

    const movingAverage =
      countHoursWithData > 0 ? windowSum / movingWindowHours : 0;
    result.push({
      time: currentHourTimestamp,
      value: movingAverage,
    });
  }

  return result;
}

app.get("/moving-average-views/:duration", async (req, res) => {
  const hours = parseInt(req.params.duration);
  const attribute = req.query;
  const attributeKey = Object.keys(attribute)[0];
  const attributeValue = String(Object.values(attribute)[0]);
  console.log(attribute);
  let response: TimeValuePair[] = [];
  if (!Object.keys(attribute).length) {
    response = getMovingAverages(timeIndexedViews, hours);
  } else {
    response = getFilteredMovingAverages(
      attributeIndexedViews,
      attributeKey,
      attributeValue,
      hours
    );
  }
  res.status(200).send(response);
});

function findBestPredictor(
  attributeIndexedViews: AttributeIndexedViews,
  timeIndexedBookDemos: TimeIndexedBookDemos
): [string, boolean, number] {
  const usersWhoBookedDemo: Set<number> = new Set();

  // Collect all user IDs who have booked a demo
  Object.values(timeIndexedBookDemos).forEach((demos) => {
    demos.forEach((demo) => {
      usersWhoBookedDemo.add(demo.userId);
    });
  });

  const attributeEffectiveness: {
    [key: string]: { [value: string]: { booked: number; total: number } };
  } = {};

  // Calculate the effectiveness of each attribute
  Object.entries(attributeIndexedViews).forEach(([attribute, values]) => {
    attributeEffectiveness[attribute] = {};

    Object.entries(values).forEach(([valueKey, viewEvents]) => {
      let bookedCount = 0;
      let totalCount = 0;

      // get the count of users who booked a demo
      // by pulling it out of the viewEvents per attr value (attr: true/false)
      Object.values(viewEvents).forEach((viewEvent) => {
        viewEvent.forEach((view) => {
          const userBooked = usersWhoBookedDemo.has(view.userId) ? 1 : 0;
          bookedCount += userBooked;
          totalCount += 1;
        });
      });

      attributeEffectiveness[attribute][valueKey] = {
        booked: bookedCount,
        total: totalCount,
      };
    });
  });

  let bestAttribute = "";
  let bestValue = true;
  let highestProbability = 0;

  Object.entries(attributeEffectiveness).forEach(([attribute, valueStats]) => {
    Object.entries(valueStats).forEach(([valueKey, stats]) => {
      const probability = stats.total > 0 ? stats.booked / stats.total : 0;
      if (probability > highestProbability) {
        highestProbability = probability;
        bestAttribute = attribute;
        bestValue = valueKey === "true";
      }
    });
  });

  return [bestAttribute, bestValue, highestProbability];
}

app.get("/best-predictor", async (req, res) => {
  const response = findBestPredictor(
    attributeIndexedViews,
    timeIndexedBookDemos
  );
  res.status(200).send(response);
});

app.listen(4300, () => {
  console.log("Server is doing your bidding on http://localhost:4300");
});
