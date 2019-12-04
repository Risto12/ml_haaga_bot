const cards = {
  duration:
    {
      "type": "message",
      "text": "",
      "attachments": [
        {
          "contentType": "application/vnd.microsoft.card.adaptive",
          "content": {
            "type": "AdaptiveCard",
            "version": "1.0",
            "body": [
              {
                "type": "TextBlock",
                "text": "Thank you. Now let us do some estimations. Do you project your trip will be more than 1.5 months long?",
                "wrap":true
              }
            ],
            "actions": [
              {
                "type": "Action.Submit",
                "title": "Yes",
                "data": true
              },
              {
                "type": "Action.Submit",
                "title": "No",
                "data": false
              }
            ]
          }
        }
      ]
    },
  medical:
  {
    "type": "message",
    "text": "",
    "attachments": [
      {
        "contentType": "application/vnd.microsoft.card.adaptive",
        "content": {
          "type": "AdaptiveCard",
          "version": "1.0",
          "body": [
            {
              "type": "TextBlock",
              "text": "Alright. We will be done in just a few moments. Here at Pasila Life Partners we are happy to reimburse you for your cancelled, interrupted, or delayed trip. We also will cover medical expenses incurred during the trip without a limit. The next question is a little bit trickier and we just want to let you have the option to choose for the sake of piece of mind. If something very unfortunate were to happen, like a permanent injury or even death, we can guarantee up to 85 000 euros. Please, click a number value you would like to secure.",
              "wrap":true
            }
          ],
          "actions": [
            {
              "type": "Action.Submit",
              "title": "0",
              "data": "0"
            },
            {
              "type": "Action.Submit",
              "title": "10 000",
              "data": "10000"
            },
            {
              "type": "Action.Submit",
              "title": "20 000",
              "data": "20000"
            },
            {
              "type": "Action.Submit",
              "title": "30 000",
              "data": "30000"
            },
            {
              "type": "Action.Submit",
              "title": "40 000",
              "data": "40000"
            },
            {
              "type": "Action.Submit",
              "title": "50 000",
              "data": "50000"
            },
            {
              "type": "Action.Submit",
              "title": "85 000",
              "data": "85000"
            }
          ]
        }
      }
    ]
  },
    kela:
    {
      "type": "message",
      "text": "",
      "attachments": [
        {
          "contentType": "application/vnd.microsoft.card.adaptive",
          "content": {
            "type": "AdaptiveCard",
            "version": "1.0",
            "body": [
              {
                "type": "TextBlock",
                "text": "Very well! We are almost done. You can read more about our insurance policy here www.notreal.com/insurancepolicy. Just to make sure, that you are a resident of Finland and you have KELA card",
                "wrap":true
              }
            ],
            "actions": [
              {
                "type": "Action.Submit",
                "title": "Yes",
                "data": true
              },
              {
                "type": "Action.Submit",
                "title": "No",
                "data": false
              }
            ]
          }
        }
      ]
    },

}
  module.exports = cards
