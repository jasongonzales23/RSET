# Really Simple Event Tracker

## Get Started

- Download the codez
- Install deps w/ `pnpm i` (if you're not using pnpm I accept your apology)

## Use the API

There's a postman collection in the repo, but a short description of the API follows.

Endpoints and post bodies (as applicable):

http://localhost:4300/track-view

```
{
        "user_id": 99,
        "attrs": {
          "on_mobile_device": false,
          "is_located_in_usa": true,
          "is_first_time_visitor": true,
          "is_returning_user": true,
          "email_verified": false,
          "has_enterprise_business_domain": true,
          "did_click_on_cta": true,
          "did_click_on_ad": false,
          "is_subscribed_to_newsletter": true,
          "has_completed_profile": true,
          "is_active_in_last_30_days": false,
          "is_using_incognito_mode": false,
          "is_logged_in": true,
          "is_using_ad_blocker": true,
          "has_multiple_devices": true,
          "is_from_referral_source": false,
          "has_downloaded_resource": false,
          "has_filled_out_contact_form": false,
          "is_preferred_language_english": false,
          "is_on_slow_network": true
    }
}
```

http://localhost:4300/track-book-demo

```
{"user_id": 9}
```

http://localhost:4300/get-views-last-24-hours

http://localhost:4300/get-demos-last-24-hours

http://localhost:4300/moving-average-views/:lookbackDuration
example: http://localhost:4300/moving-average-views/3

http://localhost:4300/moving-average-views/:lookbackDuration?attr=boolean
example: http://localhost:4300/moving-average-views/3?is_logged_in=false

http://localhost:4300/best-predictor
